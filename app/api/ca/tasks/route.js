import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import CA from "@/models/CA";
import CAStaff from "@/models/CAStaff";
import Owner from "@/models/Owner";
import CATask from "@/models/CATask";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

// Helper: Verify session and extract user
async function getAuthSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("crown_session")?.value;
  if (!token) {
    return { error: "Authentication required.", status: 401 };
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return { error: "Invalid session.", status: 401 };
  }

  await connectDB();
  const rawRole = (decoded.role || decoded.normalizedRole || "").toUpperCase();
  const isStaff = rawRole === "CA_STAFF" || rawRole === "CA-EMPLOYEE" || rawRole === "CASTAFF";
  const isSuperAdmin = decoded.isSuperAdmin || rawRole === "SUPERADMIN";

  return { decoded, isStaff, isSuperAdmin, userId: decoded.userId };
}

// GET /api/ca/tasks - Fetch tasks for CA Partner (all firm tasks) or Staff (my assigned tasks)
export async function GET(request) {
  try {
    const auth = await getAuthSession();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { isStaff, userId, isSuperAdmin } = auth;

    let tasks = [];
    if (isStaff) {
      // Staff member queries their own assigned tasks
      tasks = await CATask.find({ staffId: userId })
        .sort({ createdAt: -1 })
        .lean();
    } else {
      // CA Partner queries all tasks under their firm
      let caDoc = await CA.findById(userId);
      if (!caDoc && isSuperAdmin) {
        caDoc = await CA.findOne();
      }

      if (caDoc) {
        tasks = await CATask.find({ caFirmId: caDoc._id })
          .sort({ createdAt: -1 })
          .lean();
      }
    }

    return NextResponse.json({
      success: true,
      tasks,
      stats: {
        total: tasks.length,
        assigned: tasks.filter((t) => t.status === "ASSIGNED").length,
        inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
        completed: tasks.filter((t) => t.status === "WORK_COMPLETED").length,
        approved: tasks.filter((t) => t.status === "REVIEWED_APPROVED").length,
      },
    });
  } catch (error) {
    console.error("GET /api/ca/tasks error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch tasks." }, { status: 500 });
  }
}

// POST /api/ca/tasks - CA Partner assigns work to a staff member
export async function POST(request) {
  try {
    const auth = await getAuthSession();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { isStaff, userId, isSuperAdmin } = auth;
    if (isStaff && !isSuperAdmin) {
      return NextResponse.json({ error: "Only CA Partner can assign work to staff." }, { status: 403 });
    }

    let caDoc = await CA.findById(userId);
    if (!caDoc && isSuperAdmin) {
      caDoc = await CA.findOne();
    }

    if (!caDoc) {
      return NextResponse.json({ error: "CA Practice not found." }, { status: 404 });
    }

    const body = await request.json();
    const {
      staffId,
      clientId,
      clientName,
      title,
      description,
      category = "VOUCHER_AUDIT",
      priority = "MEDIUM",
      dueDate = "",
    } = body;

    if (!staffId || !title?.trim()) {
      return NextResponse.json({ error: "Staff member and Task Title are required." }, { status: 400 });
    }

    const staffMember = await CAStaff.findById(staffId);
    if (!staffMember) {
      return NextResponse.json({ error: "Selected staff member not found." }, { status: 404 });
    }

    // Resolve client name
    let resolvedClientName = clientName?.trim();
    if (!resolvedClientName && clientId) {
      const clientOwner = await Owner.findById(clientId);
      if (clientOwner) {
        resolvedClientName = clientOwner.name;
      }
    }
    if (!resolvedClientName) {
      resolvedClientName = "Apex Industrial Enterprises Pvt Ltd";
    }

    // Create CATask
    const newTask = new CATask({
      caFirmId: caDoc._id,
      staffId: staffMember._id,
      staffName: staffMember.name,
      clientId: clientId || null,
      clientName: resolvedClientName,
      title: title.trim(),
      description: description?.trim() || "",
      category,
      priority,
      dueDate,
      status: "ASSIGNED",
    });

    await newTask.save();

    // Auto-link client to staff member if clientId provided
    if (clientId) {
      if (!staffMember.assignedCompanies) staffMember.assignedCompanies = [];
      if (!staffMember.assignedCompanies.some((id) => id.toString() === clientId.toString())) {
        staffMember.assignedCompanies.push(clientId);
      }
      if (!staffMember.assignedClients) staffMember.assignedClients = [];
      if (!staffMember.assignedClients.some((id) => id.toString() === clientId.toString())) {
        staffMember.assignedClients.push(clientId);
      }
      await staffMember.save();
    }

    return NextResponse.json({
      success: true,
      message: `Work "${newTask.title}" successfully assigned to ${staffMember.name}!`,
      task: newTask,
    });
  } catch (error) {
    console.error("POST /api/ca/tasks error:", error);
    return NextResponse.json({ error: error.message || "Failed to assign work." }, { status: 500 });
  }
}

// PATCH /api/ca/tasks - Update work progress (by staff or partner)
export async function PATCH(request) {
  try {
    const auth = await getAuthSession();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { taskId, status, vouchersChecked, discrepanciesCount, staffNotes, partnerNotes } = body;

    if (!taskId) {
      return NextResponse.json({ error: "Task ID is required." }, { status: 400 });
    }

    const task = await CATask.findById(taskId);
    if (!task) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    if (status) {
      task.status = status;
      if (status === "WORK_COMPLETED") {
        task.completedAt = new Date();
      }
    }

    if (typeof vouchersChecked === "number") {
      task.vouchersChecked = vouchersChecked;
    }
    if (typeof discrepanciesCount === "number") {
      task.discrepanciesCount = discrepanciesCount;
    }
    if (typeof staffNotes === "string") {
      task.staffNotes = staffNotes.trim();
    }
    if (typeof partnerNotes === "string") {
      task.partnerNotes = partnerNotes.trim();
    }

    await task.save();

    return NextResponse.json({
      success: true,
      message: `Task "${task.title}" updated to ${task.status}!`,
      task,
    });
  } catch (error) {
    console.error("PATCH /api/ca/tasks error:", error);
    return NextResponse.json({ error: error.message || "Failed to update task." }, { status: 500 });
  }
}
