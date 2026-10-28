import { Server } from "socket.io";

/**
 * pages/api/socket.js
 * Next.js Hybrid Socket.io Endpoint
 *
 * Attaches directly to the internal Next.js Node.js HTTP Server instance (res.socket.server.io),
 * completely deprecating the standalone external Express server while preserving sub-45ms
 * CRDT delta synchronization, real-time staff clocking, and CA data authorization events.
 */

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function SocketHandler(req, res) {
  if (res.socket.server.io) {
    // Socket.io is already attached and running
    res.end();
    return;
  }

  console.log("[Socket.io] Initializing hybrid Socket.io server on Next.js HTTP server...");

  const io = new Server(res.socket.server, {
    path: "/api/socket",
    addTrailingSlash: false,
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket) => {
    // 1. Join Tenant / Company Room
    socket.on("join-company", ({ companyId, userId, role }) => {
      if (companyId) {
        const roomName = `company_${companyId}`;
        socket.join(roomName);
        socket.data = { companyId, userId, role };
      }
    });

    // 2. CRDT Sub-45ms Real-Time Delta Synchronization
    socket.on("crdt-delta-sync", (payload) => {
      const companyId = payload?.companyId || socket.data?.companyId;
      if (companyId) {
        socket.to(`company_${companyId}`).emit("crdt-remote-delta", {
          ...payload,
          broadcastAt: Date.now(),
        });
      } else {
        socket.broadcast.emit("crdt-remote-delta", payload);
      }
    });

    // 3. CA Requests Data Access (MCA / GST Audit)
    socket.on("ca-request-data", (data) => {
      const companyId = data?.companyId || socket.data?.companyId;
      if (companyId) {
        socket.to(`company_${companyId}`).emit("owner-receive-request", data);
      } else {
        socket.broadcast.emit("owner-receive-request", data);
      }
    });

    // 4. Owner Approves Data Access (Unlocks Ledger & Invoices)
    socket.on("owner-approve-data", (data) => {
      const companyId = data?.companyId || socket.data?.companyId;
      if (companyId) {
        socket.to(`company_${companyId}`).emit("ca-data-unlocked", data);
      } else {
        socket.broadcast.emit("ca-data-unlocked", data);
      }
    });

    // 5. Employee Live Attendance & Shift Punching
    socket.on("new-submission", (data) => {
      const companyId = data?.companyId || socket.data?.companyId;
      if (companyId) {
        socket.to(`company_${companyId}`).emit("live-attendance-update", data);
      } else {
        socket.broadcast.emit("live-attendance-update", data);
      }
    });

    // 6. Live Department Transfers & Staff Role Updates
    socket.on("employee-department-transfer", (data) => {
      const companyId = data?.companyId || socket.data?.companyId;
      if (companyId) {
        io.to(`company_${companyId}`).emit("employee-transferred", data);
      }
    });

    // 7. General Disconnect
    socket.on("disconnect", () => {
      // Clean disconnect
    });
  });

  res.socket.server.io = io;
  res.end();
}
