import { NextResponse } from "next/server";
import { getAuthenticatedEmployee } from "@/lib/employeeAuth";
import TaskAssignment from "@/models/TaskAssignment";
import Employee from "@/models/Employee";
import { getHierarchyRank, isUpperRole } from "@/lib/hierarchy";
import { createEmployeeNotification } from "@/lib/notifications";

// GET /api/employee/tasks - List assigned tasks
export async function GET(request) {
  try {
    const auth = await getAuthenticatedEmployee({ requireApproved: true });
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { employee } = auth;
    const { searchParams } = new URL(request.url);
    const view = searchParams.get("view"); // "assigned-to-me" | "assigned-by-me"

    if (view === "assigned-to-me") {
      const tasks = await TaskAssignment.find({ assignedTo: employee._id })
        .sort({ createdAt: -1 })
        .lean();
      return NextResponse.json({ success: true, tasks });
    }

    if (view === "assigned-by-me") {
      const tasks = await TaskAssignment.find({ assignedBy: employee._id })
        .sort({ createdAt: -1 })
        .lean();
      return NextResponse.json({ success: true, tasks });
    }

    const [assignedToMe, assignedByMe] = await Promise.all([
      TaskAssignment.find({ assignedTo: employee._id })
        .sort({ createdAt: -1 })
        .lean(),
      TaskAssignment.find({ assignedBy: employee._id })
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    return NextResponse.json({
      success: true,
      assignedToMe,
      assignedByMe,
    });
  } catch (error) {
    console.error("GET /api/employee/tasks error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

// POST /api/employee/tasks - Upper employee assigns work to lower employee
export async function POST(request) {
  try {
    const auth = await getAuthenticatedEmployee({ requireApproved: true });
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { employee, owner } = auth;

    // Check if employee has upper authority to assign work
    const myRank = getHierarchyRank(employee.postLevel);
    if (!isUpperRole(employee.postLevel)) {
      return NextResponse.json(
        { error: "Access denied. Lowest-tier employees only receive and execute tasks, and cannot assign work." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { assignedToId, title, description, priority, dueDate } = body;

    if (!assignedToId) {
      return NextResponse.json({ error: "Please select a lower staff member to assign work to." }, { status: 400 });
    }

    if (!title || title.trim().length < 3) {
      return NextResponse.json({ error: "Please enter a valid task title (min 3 characters)." }, { status: 400 });
    }

    // Verify recipient subordinate
    const subordinate = await Employee.findOne({
      _id: assignedToId,
      companyId: owner._id,
      department: employee.department,
      approvalStatus: "APPROVED",
    });

    if (!subordinate) {
      return NextResponse.json(
        { error: "Subordinate employee not found in your department." },
        { status: 404 }
      );
    }

    const subRank = getHierarchyRank(subordinate.postLevel);
    if (subRank >= myRank) {
      return NextResponse.json(
        { error: `Cannot assign work: ${subordinate.name} has equal or higher rank (${subordinate.postLevel}) than yours.` },
        { status: 400 }
      );
    }

    const newTask = new TaskAssignment({
      companyId: owner._id,
      branchId: employee.branchId || "branch-1",
      branchName: employee.branchName || "Main HQ",
      department: employee.department,
      assignedBy: employee._id,
      assignedByName: employee.name,
      assignedByPost: employee.postTitle || employee.postLevel.replace(/_/g, " "),
      assignedTo: subordinate._id,
      assignedToName: subordinate.name,
      assignedToPost: subordinate.postTitle || subordinate.postLevel.replace(/_/g, " "),
      title: title.trim(),
      description: (description || "").trim(),
      priority: priority || "MEDIUM",
      dueDate: dueDate || "",
      status: "ASSIGNED",
    });

    await newTask.save();

    // Send real-time notification to lower staff
    await createEmployeeNotification({
      recipientId: subordinate._id,
      companyId: owner._id,
      senderId: employee._id,
      senderName: employee.name,
      type: "TASK_ASSIGNED",
      title: `New Task Assigned: ${title.trim()}`,
      message: `${employee.name} (${newTask.assignedByPost}) assigned you work: "${title.trim()}". Priority: ${newTask.priority}.`,
      linkTab: "desk",
      metadata: {
        taskId: newTask._id,
        priority: newTask.priority,
        dueDate: newTask.dueDate,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Task successfully assigned to ${subordinate.name}!`,
      task: newTask,
    });
  } catch (error) {
    console.error("POST /api/employee/tasks error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to assign task" },
      { status: 500 }
    );
  }
}
