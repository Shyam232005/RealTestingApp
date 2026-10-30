"use client";
/**
 * lib/socketClient.js
 * Universal Client-Side Socket.io Client for Crown Ecosystems
 * Seamlessly connects to the Next.js hybrid socket server at /api/socket
 * enabling sub-45ms real-time events across Owner, Employee, CA, and CAStaff.
 */

import { io } from "socket.io-client";

let socketInstance = null;
let initPromise = null;

/**
 * Initializes and retrieves the singleton Socket.io client instance
 */
export async function getSocketClient() {
  if (typeof window === "undefined") return null;

  if (socketInstance && socketInstance.connected) {
    return socketInstance;
  }

  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      // 1. Handshake with Next.js Pages API to initialize res.socket.server.io
      await fetch("/api/socket");

      // 2. Establish WebSocket connection
      socketInstance = io({
        path: "/api/socket",
        transports: ["websocket", "polling"],
        reconnectionAttempts: 8,
        reconnectionDelay: 1000,
      });

      socketInstance.on("connect", () => {
        console.log("[Socket.io] Connected to Next.js server:", socketInstance.id);
      });

      socketInstance.on("connect_error", (err) => {
        console.warn("[Socket.io] Connection issue:", err.message);
      });

      return socketInstance;
    } catch (err) {
      console.warn("[Socket.io] Initialization fallback:", err);
      return null;
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
}

/**
 * Join tenant room for company-isolated events
 */
export async function joinTenantRoom(companyId, userId, role) {
  const socket = await getSocketClient();
  if (socket && (companyId || userId)) {
    socket.emit("join-company", { companyId, userId, role });
  }
}

/**
 * Join CA practice room for auditor-isolated events
 */
export async function joinCaPracticeRoom(caFirmId, userId, role) {
  const socket = await getSocketClient();
  if (socket && (caFirmId || userId)) {
    socket.emit("join-ca-practice", { caFirmId, userId, role });
  }
}

/**
 * Broadcast CA Data Access Request to Owner
 */
export async function emitCaDataRequest(payload) {
  const socket = await getSocketClient();
  if (socket) {
    socket.emit("ca-request-data", payload);
  }
}

/**
 * Broadcast Owner Approves CA Data Access
 */
export async function emitOwnerApproveData(payload) {
  const socket = await getSocketClient();
  if (socket) {
    socket.emit("owner-approve-data", payload);
  }
}

/**
 * Broadcast Owner Rejects CA Data Access
 */
export async function emitOwnerRejectData(payload) {
  const socket = await getSocketClient();
  if (socket) {
    socket.emit("owner-reject-data", payload);
  }
}

/**
 * Broadcast Staff Submits Audit to CA Partner
 */
export async function emitStaffSubmitAudit(payload) {
  const socket = await getSocketClient();
  if (socket) {
    socket.emit("staff-submit-audit", payload);
  }
}

/**
 * Broadcast CA Partner Stamps Audit with UDIN
 */
export async function emitPartnerStampAudit(payload) {
  const socket = await getSocketClient();
  if (socket) {
    socket.emit("partner-stamp-audit", payload);
  }
}

/**
 * Broadcast Employee Live Attendance Punch
 */
export async function emitEmployeePunch(payload) {
  const socket = await getSocketClient();
  if (socket) {
    socket.emit("new-submission", payload);
  }
}

/**
 * Broadcast Employee Department Transfer
 */
export async function emitDepartmentTransfer(payload) {
  const socket = await getSocketClient();
  if (socket) {
    socket.emit("employee-department-transfer", payload);
  }
}

/**
 * Broadcast CA and Owner Linked Event
 */
export async function emitCaLinkOwner(payload) {
  const socket = await getSocketClient();
  if (socket) {
    socket.emit("ca-link-owner", payload);
  }
}

/**
 * Stream Real-Time Client Data Delta across Pipeline (Sub-45ms)
 */
export async function emitStreamDataDelta(payload) {
  const socket = await getSocketClient();
  if (socket) {
    socket.emit("stream-client-data-delta", {
      ...payload,
      pipelinedAt: Date.now(),
    });
  }
}

/**
 * Broadcast Client Assignment to Staff Member Desk
 */
export async function emitPartnerAssignClient(payload) {
  const socket = await getSocketClient();
  if (socket) {
    socket.emit("partner-assign-client", payload);
  }
}

/**
 * Subscribe to any socket event with automatic cleanup return
 */
export async function subscribeToEvent(eventName, callback) {
  const socket = await getSocketClient();
  if (socket) {
    socket.on(eventName, callback);
    return () => {
      socket.off(eventName, callback);
    };
  }
  return () => {};
}

/**
 * Broadcast CRDT delta mutation
 */
export async function broadcastCrdtDelta(payload) {
  const socket = await getSocketClient();
  if (socket) {
    socket.emit("crdt-delta-sync", payload);
  }
}

/**
 * Subscribe to incoming remote CRDT delta mutations
 */
export async function subscribeToCrdtDeltas(callback) {
  return subscribeToEvent("crdt-remote-delta", callback);
}
