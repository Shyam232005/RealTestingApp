import { NextResponse } from "next/server";
import { getAuthenticatedEmployee } from "@/lib/employeeAuth";
import TaskAssignment from "@/models/TaskAssignment";
import { createEmployeeNotification } from "@/lib/notifications";

// PATCH /api/employee/tasks/[id] - Update task status / submit / approve
export async function PATCH(request, { params }) {
  try {
    const auth = await getAuthenticatedEmployee({ requireApproved: true });
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { employee, owner } = auth;
    const resolvedParams = await params;
    const taskId = resolvedParams.id;

    if (!taskId) {
      return NextResponse.json({ error: "Task ID is required." }, { status: 400 });
    }

    const task = await TaskAssignment.findById(taskId);
    if (!task) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const { action, submissionNotes, reviewFeedback } = body;

    const isAssignee = task.assignedTo.toString() === employee._id.toString();
    const isAssigner = task.assignedBy.toString() === employee._id.toString();

    if (!isAssignee && !isAssigner) {
      return NextResponse.json(
        { error: "Access denied. You are neither the assigner nor the assignee of this task." },
        { status: 403 }
      );
    }

    // 1. Assignee Actions (Start work, Submit work)
    if (isAssignee) {
      if (action === "START") {
        task.status = "IN_PROGRESS";
        await task.save();

        return NextResponse.json({
          success: true,
          message: "Task marked as In Progress.",
          task,
        });
      }

      if (action === "SUBMIT") {
        task.status = "SUBMITTED";
        task.submissionNotes = (submissionNotes || "").trim();
        task.submittedAt = new Date();
        await task.save();

        // Notify upper manager
        await createEmployeeNotification({
          recipientId: task.assignedBy,
          companyId: owner._id,
          senderId: employee._id,
          senderName: employee.name,
          type: "TASK_SUBMITTED",
          title: `Task Submitted: ${task.title}`,
          message: `${employee.name} submitted work for "${task.title}". Please review and sign off.`,
          linkTab: "desk",
          metadata: { taskId: task._id },
        });

        return NextResponse.json({
          success: true,
          message: "Work submitted for upper manager review!",
          task,
        });
      }
    }

    // 2. Assigner Actions (Approve work, Request revision)
    if (isAssigner) {
      if (action === "APPROVE") {
        task.status = "APPROVED";
        task.reviewFeedback = (reviewFeedback || "").trim();
        task.reviewedAt = new Date();
        task.reviewedBy = employee._id;
        await task.save();

        // Notify subordinate
        await createEmployeeNotification({
          recipientId: task.assignedTo,
          companyId: owner._id,
          senderId: employee._id,
          senderName: employee.name,
          type: "TASK_APPROVED",
          title: `Task Approved: ${task.title}`,
          message: `${employee.name} approved your work on "${task.title}"!`,
          linkTab: "desk",
          metadata: { taskId: task._id },
        });

        return NextResponse.json({
          success: true,
          message: "Task successfully signed off and approved!",
          task,
        });
      }

      if (action === "REQUEST_REVISION") {
        task.status = "REVISION_REQUESTED";
        task.reviewFeedback = (reviewFeedback || "").trim();
        task.reviewedAt = new Date();
        task.reviewedBy = employee._id;
        await task.save();

        // Notify subordinate
        await createEmployeeNotification({
          recipientId: task.assignedTo,
          companyId: owner._id,
          senderId: employee._id,
          senderName: employee.name,
          type: "TASK_REVISION",
          title: `Revision Requested: ${task.title}`,
          message: `${employee.name} requested revision on "${task.title}": "${task.reviewFeedback}".`,
          linkTab: "desk",
          metadata: { taskId: task._id },
        });

        return NextResponse.json({
          success: true,
          message: "Revision requested from subordinate.",
          task,
        });
      }
    }

    return NextResponse.json({ error: "Invalid action specified." }, { status: 400 });
  } catch (error) {
    console.error("PATCH /api/employee/tasks/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update task" },
      { status: 500 }
    );
  }
}
