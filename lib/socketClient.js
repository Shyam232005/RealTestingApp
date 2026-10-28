"use client";
/**
 * lib/socketClient.js
 * Universal Client-Side Socket.io Client for Crownops
 * Seamlessly connects to the Next.js hybrid socket server at /api/socket.
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
        reconnectionAttempts: 5,
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
  if (socket && companyId) {
    socket.emit("join-company", { companyId, userId, role });
  }
}

/**
 * Broadcast CRDT delta mutation to other company clients
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
  const socket = await getSocketClient();
  if (socket) {
    socket.on("crdt-remote-delta", callback);
    return () => {
      socket.off("crdt-remote-delta", callback);
    };
  }
  return () => {};
}
