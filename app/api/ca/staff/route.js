import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import CA from "@/models/CA";
import CAStaff from "@/models/CAStaff";
import CATask from "@/models/CATask";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function GET(request) {
  try {
    await connectDB();
    const cookieStore = await cookies();
    const token = cookieStore.get("crown_session")?.value;

    if (!token) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return NextResponse.json({ error: "Invalid session." }, { status: 401 });
    }

    const isSuperAdmin = decoded.isSuperAdmin || decoded.role === "SUPERADMIN";

    let caDoc = await CA.findById(decoded.userId);
    if (!caDoc && isSuperAdmin) {
      caDoc = await CA.findOne();
    }

    if (!caDoc) {
      return NextResponse.json({ error: "CA Practice not found." }, { status: 404 });
    }

    // Fetch all staff members linked to this CA firm
    const staffMembers = await CAStaff.find({
      $or: [{ caFirmId: caDoc._id }, { caId: caDoc._id }],
    })
      .populate("assignedCompanies", "name email phoneNumber inviteCode")
      .populate("assignedClients", "name email phoneNumber inviteCode")
      .lean();

    // Enrich each staff member with their active tasks & live work status
    const enrichedStaff = await Promise.all(
      staffMembers.map(async (member) => {
        const tasks = await CATask.find({ staffId: member._id })
          .sort({ updatedAt: -1 })
          .lean();

        const activeTask = tasks.find(
          (t) => t.status === "IN_PROGRESS" || t.status === "ASSIGNED"
        );

        const assignedClientsList =
          member.assignedCompanies || member.assignedClients || [];

        return {
          id: member._id.toString(),
          _id: member._id.toString(),
          name: member.name,
          email: member.email,
          phoneNumber: member.phoneNumber,
          roleInFirm: member.roleInFirm || "Article Assistant",
          assignedClients: assignedClientsList.map((c) => ({
            id: c._id?.toString(),
            name: c.name,
            email: c.email,
            phoneNumber: c.phoneNumber,
            inviteCode: c.inviteCode,
          })),
          assignedClientsCount: assignedClientsList.length,
          totalTasks: tasks.length,
          completedTasks: tasks.filter((t) => t.status === "WORK_COMPLETED" || t.status === "REVIEWED_APPROVED").length,
          pendingTasks: tasks.filter((t) => t.status === "ASSIGNED" || t.status === "IN_PROGRESS").length,
          currentWork: activeTask
            ? {
                title: activeTask.title,
                clientName: activeTask.clientName,
                status: activeTask.status,
                priority: activeTask.priority,
                vouchersChecked: activeTask.vouchersChecked || 0,
                updatedAt: activeTask.updatedAt,
              }
            : null,
          allTasks: tasks,
        };
      })
    );

    return NextResponse.json({
      success: true,
      staff: enrichedStaff,
      practiceInviteCode: caDoc.staffInviteCode || caDoc.inviteCode,
    });
  } catch (error) {
    console.error("GET /api/ca/staff error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch staff." }, { status: 500 });
  }
}
