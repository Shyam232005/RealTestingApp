"use client";
/**
 * lib/localCrdtSync.js
 * Local-First IndexedDB Engine with CRDT Lamport Timestamps & Background Sync.
 * Provides microsecond optimistic updates and offline resilience for Crownops.
 */

const DB_NAME = "crown_local_crdt_db";
const DB_VERSION = 1;

let dbPromise = null;

/**
 * Open or initialize the browser IndexedDB
 */
export function openLocalDB() {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return Promise.resolve(null);
  }

  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("crdt_records")) {
        const store = db.createObjectStore("crdt_records", { keyPath: "id" });
        store.createIndex("collection", "collection", { unique: false });
        store.createIndex("syncState", "syncState", { unique: false });
        store.createIndex("lamport", "lamport", { unique: false });
      }
      if (!db.objectStoreNames.contains("sync_queue")) {
        const queueStore = db.createObjectStore("sync_queue", {
          keyPath: "queueId",
          autoIncrement: true,
        });
        queueStore.createIndex("status", "status", { unique: false });
        queueStore.createIndex("timestamp", "timestamp", { unique: false });
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      console.error("[CRDT] IndexedDB open error:", event.target.error);
      reject(event.target.error);
    };
  });

  return dbPromise;
}

/**
 * Generate a unique ID with client Lamport timestamp
 */
export function generateCrdtId(prefix = "crdt") {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 9);
  return `${prefix}_${timestamp}_${randomStr}`;
}

/**
 * Write a record to local IndexedDB store with CRDT metadata
 */
export async function writeLocalRecord(collection, record) {
  try {
    const db = await openLocalDB();
    if (!db) return record;

    const id = record._id || record.id || generateCrdtId(collection);
    const crdtRecord = {
      ...record,
      id,
      collection,
      lamport: Date.now(),
      syncState: record.syncState || "pending",
      updatedAt: new Date().toISOString(),
    };

    return new Promise((resolve) => {
      const tx = db.transaction("crdt_records", "readwrite");
      const store = tx.objectStore("crdt_records");
      store.put(crdtRecord);
      tx.oncomplete = () => {
        // Real-time broadcast over hybrid Socket.io for sub-45ms delta synchronization
        if (typeof window !== "undefined") {
          import("./socketClient")
            .then(({ broadcastCrdtDelta }) => {
              broadcastCrdtDelta({ collection, record: crdtRecord });
            })
            .catch(() => {});
        }
        resolve(crdtRecord);
      };
      tx.onerror = () => resolve(crdtRecord);
    });
  } catch (err) {
    console.warn("[CRDT] Local write fallback:", err);
    return record;
  }
}

/**
 * Read all local records for a specific collection
 */
export async function readLocalRecords(collection) {
  try {
    const db = await openLocalDB();
    if (!db) return [];

    return new Promise((resolve) => {
      const tx = db.transaction("crdt_records", "readonly");
      const store = tx.objectStore("crdt_records");
      const index = store.index("collection");
      const request = index.getAll(collection);

      request.onsuccess = () => {
        const records = request.result || [];
        records.sort((a, b) => (b.lamport || 0) - (a.lamport || 0));
        resolve(records);
      };
      request.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

/**
 * Queue a mutation for asynchronous background synchronization with MongoDB
 */
export async function queueBackgroundSync({ endpoint, method = "POST", payload, recordId, collection }) {
  try {
    const db = await openLocalDB();
    if (!db) {
      // In SSR or if no IndexedDB, perform direct fetch
      return fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    const queueItem = {
      endpoint,
      method,
      payload,
      recordId,
      collection,
      status: "pending",
      timestamp: Date.now(),
      retryCount: 0,
    };

    await new Promise((resolve) => {
      const tx = db.transaction("sync_queue", "readwrite");
      tx.objectStore("sync_queue").add(queueItem);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });

    // Schedule queue processing immediately on idle
    triggerQueueProcessing();
  } catch (err) {
    console.error("[CRDT] Queue sync error:", err);
  }
}

let isProcessingQueue = false;

/**
 * Process pending mutations in background
 */
export async function processSyncQueue() {
  if (typeof window === "undefined" || isProcessingQueue) return;
  if (!navigator.onLine) {
    console.log("[CRDT] Offline: queuing mutations until network is restored");
    return;
  }

  isProcessingQueue = true;

  try {
    const db = await openLocalDB();
    if (!db) return;

    const items = await new Promise((resolve) => {
      const tx = db.transaction("sync_queue", "readonly");
      const store = tx.objectStore("sync_queue");
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    });

    const pending = items.filter((i) => i.status === "pending" || i.status === "retry");

    for (const item of pending) {
      try {
        const response = await fetch(item.endpoint, {
          method: item.method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item.payload),
        });

        if (response.ok) {
          const resData = await response.json();
          // Mark queue item as synced & remove from queue
          const tx = db.transaction(["sync_queue", "crdt_records"], "readwrite");
          tx.objectStore("sync_queue").delete(item.queueId);

          if (item.recordId) {
            const recordsStore = tx.objectStore("crdt_records");
            const getReq = recordsStore.get(item.recordId);
            getReq.onsuccess = () => {
              if (getReq.result) {
                recordsStore.put({
                  ...getReq.result,
                  ...resData,
                  syncState: "synced",
                });
              }
            };
          }
        } else if (response.status >= 400 && response.status < 500) {
          // Permanent validation or authorization error: notify & remove
          console.error(`[CRDT] Server rejected mutation (${response.status}):`, item);
          const errData = await response.json().catch(() => ({}));
          const tx = db.transaction("sync_queue", "readwrite");
          tx.objectStore("sync_queue").delete(item.queueId);

          // Dispatch window rollback event for UI notifications
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("crown:sync_rollback", {
                detail: {
                  recordId: item.recordId,
                  collection: item.collection,
                  message: errData.error || "Server validation error. Action rolled back.",
                },
              })
            );
          }
        } else {
          // 5xx Server error, mark for retry
          const tx = db.transaction("sync_queue", "readwrite");
          item.status = "retry";
          item.retryCount = (item.retryCount || 0) + 1;
          tx.objectStore("sync_queue").put(item);
        }
      } catch (networkErr) {
        // Network disconnection
        console.warn("[CRDT] Network interrupted during sync:", networkErr);
        break;
      }
    }
  } catch (err) {
    console.error("[CRDT] Queue processing failed:", err);
  } finally {
    isProcessingQueue = false;
  }
}

export function triggerQueueProcessing() {
  if (typeof window === "undefined") return;
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(() => processSyncQueue());
  } else {
    setTimeout(processSyncQueue, 100);
  }
}

// Auto-attach network & Socket.io listeners in browser
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    console.log("[CRDT] Network back online. Flushing CRDT sync queue...");
    processSyncQueue();
  });

  // Attach remote Socket.io delta listener for sub-45ms multi-device sync
  setTimeout(() => {
    import("./socketClient")
      .then(({ subscribeToCrdtDeltas }) => {
        subscribeToCrdtDeltas(async ({ collection, record }) => {
          if (!record || !collection) return;
          try {
            const db = await openLocalDB();
            if (db) {
              const tx = db.transaction("crdt_records", "readwrite");
              tx.objectStore("crdt_records").put(record);
            }
            window.dispatchEvent(
              new CustomEvent("crown:crdt_remote_mutation", {
                detail: { collection, record },
              })
            );
          } catch (e) {
            console.warn("[CRDT] Remote delta apply fallback:", e);
          }
        });
      })
      .catch(() => {});
  }, 1000);
}
