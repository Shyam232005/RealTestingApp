import { NextResponse } from "next/server";
import { getAuthenticatedOwner } from "@/lib/ownerAuth";
import TaskAssignment from "@/models/TaskAssignment";
import Employee from "@/models/Employee";
import { getHierarchyRank } from "@/lib/hierarchy";
import { createEmployeeNotification } from "@/lib/notifications";

const DEPARTMENTS = ["OPERATIONS", "SALES", "LOGISTICS", "FINANCIAL"];

// GET /api/owner/tasks - Fetch owner-assigned tasks and top-tier department leaders
export async function GET(request) {
  try {
    const auth = await getAuthenticatedOwner();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { owner } = auth;
    const { searchParams } = new URL(request.url);
    const departmentFilter = searchParams.get("department");

    const taskQuery = {
      companyId: owner._id,
      isAssignedByOwner: true,
    };
    if (departmentFilter && departmentFilter !== "ALL") {
      taskQuery.department = departmentFilter.toUpperCase();
    }

    const [tasks, approvedEmployees] = await Promise.all([
      TaskAssignment.find(taskQuery).sort({ createdAt: -1 }).lean(),
      Employee.find({
        companyId: owner._id,
        approvalStatus: "APPROVED",
      }).lean(),
    ]);

    // Compute top-most position employee for each department
    const topDepartmentHeads = DEPARTMENTS.map((dept) => {
      const deptStaff = approvedEmployees.filter((e) => (e.department || "").toUpperCase() === dept);
      if (!deptStaff.length) {
        return {
          department: dept,
          hasLeader: false,
          employee: null,
        };
      }

      // Sort by rank: rank 1 (CHIEF_OFFICER) is highest
      deptStaff.sort((a, b) => {
        const rankA = getHierarchyRank(a.postLevel);
        const rankB = getHierarchyRank(b.postLevel);
        return rankA - rankB;
      });

      const topEmp = deptStaff[0];
      return {
        department: dept,
        hasLeader: true,
        employee: {
          _id: topEmp._id,
          name: topEmp.name,
          email: topEmp.email,
          phoneNumber: topEmp.phoneNumber,
          postLevel: topEmp.postLevel,
          postTitle: topEmp.postTitle || topEmp.postLevel?.replace(/_/g, " "),
          branchName: topEmp.branchName || "Main HQ",
          branchId: topEmp.branchId,
          rank: getHierarchyRank(topEmp.postLevel),
        },
      };
    });

    return NextResponse.json({
      success: true,
      tasks,
      topDepartmentHeads,
      approvedEmployees: approvedEmployees.map((e) => ({
        _id: e._id,
        name: e.name,
        email: e.email,
        department: e.department,
        postLevel: e.postLevel,
        postTitle: e.postTitle || e.postLevel?.replace(/_/g, " "),
        branchName: e.branchName || "Main HQ",
        rank: getHierarchyRank(e.postLevel),
      })),
    });
  } catch (error) {
    console.error("GET /api/owner/tasks error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch owner tasks" },
      { status: 500 }
    );
  }
}

// POST /api/owner/tasks - Owner assigns task directly to top department employee
export async function POST(request) {
  try {
    const auth = await getAuthenticatedOwner();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { owner } = auth;
    const body = await request.json();
    const { assignedToId, title, description, priority, dueDate } = body;

    if (!assignedToId) {
      return NextResponse.json(
        { error: "Please select a department head or employee to assign work." },
        { status: 400 }
      );
    }

    if (!title || title.trim().length < 3) {
      return NextResponse.json(
        { error: "Please provide a valid task title (minimum 3 characters)." },
        { status: 400 }
      );
    }

    // Verify recipient employee
    const targetEmployee = await Employee.findOne({
      _id: assignedToId,
      companyId: owner._id,
      approvalStatus: "APPROVED",
    });

    if (!targetEmployee) {
      return NextResponse.json(
        { error: "Selected employee not found under your organization." },
        { status: 404 }
      );
    }

    const newTask = new TaskAssignment({
      companyId: owner._id,
      branchId: targetEmployee.branchId || "branch-1",
      branchName: targetEmployee.branchName || "Main HQ",
      department: targetEmployee.department || "OPERATIONS",
      assignedBy: owner._id,
      assignedByName: owner.name || "Business Owner",
      assignedByPost: "Business Owner / Enterprise Head",
      isAssignedByOwner: true,
      assignedTo: targetEmployee._id,
      assignedToName: targetEmployee.name,
      assignedToPost: targetEmployee.postTitle || targetEmployee.postLevel?.replace(/_/g, " "),
      title: title.trim(),
      description: (description || "").trim(),
      priority: priority || "MEDIUM",
      dueDate: dueDate || "",
      status: "ASSIGNED",
    });

    await newTask.save();

    // Send real-time notification to the department head
    try {
      await createEmployeeNotification({
        recipientId: targetEmployee._id,
        companyId: owner._id,
        senderId: owner._id,
        senderName: owner.name || "Business Owner",
        type: "WORK_FEEDBACK",
        title: "👑 Priority Task from Business Owner",
        message: `Business Owner assigned you task "${title.trim()}". Priority: ${priority || "MEDIUM"}.`,
        linkTab: "desk",
        metadata: {
          taskId: newTask._id,
          assignedByOwner: true,
          department: targetEmployee.department,
        },
      });
    } catch (notifErr) {
      console.warn("Could not dispatch task notification:", notifErr);
    }

    return NextResponse.json({
      success: true,
      message: `Task successfully assigned to ${targetEmployee.name} (${targetEmployee.department}).`,
      task: newTask,
    });
  } catch (error) {
    console.error("POST /api/owner/tasks error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to assign task" },
      { status: 500 }
    );
  }
}
