import { Server } from "socket.io";

/**
 * pages/api/socket.js
 * Next.js Hybrid Socket.io Endpoint
 *
 * Attaches directly to the internal Next.js Node.js HTTP Server instance (res.socket.server.io),
 * completely deprecating the standalone external Express server while preserving sub-45ms
 * synchronization across Owner, Employee, CA, and CAStaff.
 */

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function SocketHandler(req, res) {
  if (res.socket.server.io) {
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
        socket.join(`company_${companyId}`);
      }
      if (userId) {
        socket.join(`user_${userId}`);
      }
      socket.data = { ...(socket.data || {}), companyId, userId, role };
    });

    // 2. Join CA Practice Room
    socket.on("join-ca-practice", ({ caFirmId, userId, role }) => {
      if (caFirmId) {
        socket.join(`ca_${caFirmId}`);
      }
      if (userId) {
        socket.join(`user_${userId}`);
      }
      socket.data = { ...(socket.data || {}), caFirmId, userId, role };
    });

    // 3. CRDT Sub-45ms Real-Time Delta Synchronization
    socket.on("crdt-delta-sync", (payload) => {
      const companyId = payload?.companyId || socket.data?.companyId;
      if (companyId) {
        socket.to(`company_${companyId}`).emit("crdt-remote-delta", {
          ...payload,
          broadcastAt: Date.now(),
        });
      }
      socket.broadcast.emit("crdt-remote-delta", payload);
    });

    // 4. CA Requests Data Access from Owner
    socket.on("ca-request-data", (data) => {
      const companyId = data?.companyId;
      const orgId = data?.organizationId;
      const ownerId = data?.ownerId;

      if (companyId) {
        io.to(`company_${companyId}`).emit("owner-receive-request", data);
      }
      if (orgId && orgId !== companyId) {
        io.to(`company_${orgId}`).emit("owner-receive-request", data);
      }
      if (ownerId) {
        io.to(`user_${ownerId}`).emit("owner-receive-request", data);
      }
      socket.broadcast.emit("owner-receive-request", data);
    });

    // 5. Owner Approves Data Access (Unlocks Ledger & Invoices for CA)
    socket.on("owner-approve-data", (data) => {
      const caFirmId = data?.caFirmId || data?.caId;
      if (caFirmId) {
        io.to(`ca_${caFirmId}`).emit("ca-data-unlocked", data);
        io.to(`user_${caFirmId}`).emit("ca-data-unlocked", data);
      }
      socket.broadcast.emit("ca-data-unlocked", data);
    });

    // 6. Owner Rejects Data Access
    socket.on("owner-reject-data", (data) => {
      const caFirmId = data?.caFirmId || data?.caId;
      if (caFirmId) {
        io.to(`ca_${caFirmId}`).emit("ca-data-rejected", data);
        io.to(`user_${caFirmId}`).emit("ca-data-rejected", data);
      }
      socket.broadcast.emit("ca-data-rejected", data);
    });

    // 7. CA Staff Submits Audit for Partner Review
    socket.on("staff-submit-audit", (data) => {
      const caFirmId = data?.caFirmId || socket.data?.caFirmId;
      if (caFirmId) {
        io.to(`ca_${caFirmId}`).emit("partner-receive-staff-submission", data);
      }
      socket.broadcast.emit("partner-receive-staff-submission", data);
    });

    // 8. CA Partner Stamps Audit with UDIN (Notifies Owner & Staff)
    socket.on("partner-stamp-audit", (data) => {
      const companyId = data?.companyId;
      const caFirmId = data?.caFirmId || socket.data?.caFirmId;
      if (companyId) {
        io.to(`company_${companyId}`).emit("audit-stamped-notice", data);
      }
      if (caFirmId) {
        io.to(`ca_${caFirmId}`).emit("audit-stamped-notice", data);
      }
      socket.broadcast.emit("audit-stamped-notice", data);
    });

    // 9. Employee Live Attendance & Shift Punching
    socket.on("new-submission", (data) => {
      const companyId = data?.companyId || socket.data?.companyId;
      if (companyId) {
        io.to(`company_${companyId}`).emit("live-attendance-update", data);
      }
      socket.broadcast.emit("live-attendance-update", data);
    });

    // 10. Live Department Transfers & Staff Role Updates
    socket.on("employee-department-transfer", (data) => {
      const companyId = data?.companyId || socket.data?.companyId;
      if (companyId) {
        io.to(`company_${companyId}`).emit("employee-transferred", data);
      }
      socket.broadcast.emit("employee-transferred", data);
    });

    // 11. CA <-> Owner Linking Notice
    socket.on("ca-link-owner", (data) => {
      socket.broadcast.emit("ca-owner-linked", data);
    });

    // 12. Ultra-Fast Client Data Transfer Stream
    socket.on("stream-client-data-delta", (data) => {
      const companyId = data?.companyId || data?.clientId;
      const caFirmId = data?.caFirmId;
      if (companyId) {
        io.to(`company_${companyId}`).emit("client-data-updated", data);
      }
      if (caFirmId) {
        io.to(`ca_${caFirmId}`).emit("client-data-updated", data);
      }
      socket.broadcast.emit("client-data-updated", data);
    });

    // 13. CA Partner Allocates Client to Staff Member
    socket.on("partner-assign-client", (data) => {
      const staffId = data?.staffId;
      const caFirmId = data?.caFirmId;
      if (staffId) {
        io.to(`user_${staffId}`).emit("client-assigned-to-desk", data);
      }
      if (caFirmId) {
        io.to(`ca_${caFirmId}`).emit("client-assigned-to-desk", data);
      }
      socket.broadcast.emit("client-assigned-to-desk", data);
    });

    // 14. General Disconnect
    socket.on("disconnect", () => {
      // Clean disconnect
    });
  });

  res.socket.server.io = io;
  res.end();
}
