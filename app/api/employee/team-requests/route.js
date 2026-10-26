import { NextResponse } from "next/server";
import { getAuthenticatedEmployee } from "@/lib/employeeAuth";
import Leave from "@/models/Leave";
import Submission from "@/models/Submission";
import TaskAssignment from "@/models/TaskAssignment";
import { createEmployeeNotification } from "@/lib/notifications";

// GET /api/employee/team-requests
// Returns:
// 1. Requests from lower staff assigned to this supervisor (Leaves, Daily Work Submissions, Task Reviews)
// 2. Works assigned to this employee from their upper management
export async function GET() {
  try {
    const auth = await getAuthenticatedEmployee({ requireApproved: true });
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { employee } = auth;

    const [subordinateLeaves, subordinateSubmissions, subordinateTasks, myAssignedTasks] =
      await Promise.all([
        Leave.find({
          approverId: employee._id,
        })
          .sort({ createdAt: -1 })
          .limit(50)
          .lean(),

        Submission.find({
          reviewerId: employee._id,
        })
          .sort({ createdAt: -1 })
          .limit(50)
          .lean(),

        TaskAssignment.find({
          assignedBy: employee._id,
        })
          .sort({ updatedAt: -1 })
          .limit(50)
          .lean(),

        TaskAssignment.find({
          assignedTo: employee._id,
        })
          .sort({ createdAt: -1 })
          .limit(50)
          .lean(),
      ]);

    return NextResponse.json({
      success: true,
      subordinateLeaves,
      subordinateSubmissions,
      subordinateTasks,
      myAssignedTasks,
    });
  } catch (error) {
    console.error("GET /api/employee/team-requests error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load team requests" },
      { status: 500 }
    );
  }
}

// PATCH /api/employee/team-requests
// Handles supervisor actions:
// - Approving/Rejecting subordinate leaves
// - Acknowledging & giving feedback on subordinate daily submissions
export async function PATCH(request) {
  try {
    const auth = await getAuthenticatedEmployee({ requireApproved: true });
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { employee, owner } = auth;
    const body = await request.json();
    const { itemType, itemId, action, reviewNotes, feedback } = body;

    if (!itemType || !itemId) {
      return NextResponse.json(
        { error: "Item type and ID are required." },
        { status: 400 }
      );
    }

    // 1. Subordinate Leave Decision
    if (itemType === "LEAVE") {
      const leave = await Leave.findById(itemId);
      if (!leave) {
        return NextResponse.json({ error: "Leave request not found." }, { status: 404 });
      }

      if (leave.approverId && leave.approverId.toString() !== employee._id.toString()) {
        return NextResponse.json(
          { error: "You are not the designated reviewer for this leave application." },
          { status: 403 }
        );
      }

      if (!["APPROVE", "REJECT"].includes(action)) {
        return NextResponse.json(
          { error: "Invalid action. Must be APPROVE or REJECT." },
          { status: 400 }
        );
      }

      leave.status = action === "APPROVE" ? "APPROVED" : "REJECTED";
      leave.reviewedBy = employee._id;
      leave.reviewedByType = "EMPLOYEE_SUPERVISOR";
      leave.reviewedByName = employee.name;
      leave.reviewedAt = new Date();
      leave.reviewNotes = (reviewNotes || "").trim();
      await leave.save();

      // Notify the subordinate
      const actionPast = action === "APPROVE" ? "Approved" : "Rejected";
      await createEmployeeNotification({
        recipientId: leave.employeeId,
        companyId: owner._id,
        senderId: employee._id,
        senderName: employee.name,
        type: "LEAVE_DECIDED",
        title: `Leave ${actionPast}: ${leave.leaveType}`,
        message: `Your ${leave.leaveType.toLowerCase()} leave request (${leave.startDate} to ${leave.endDate}) was ${actionPast.toLowerCase()} by ${employee.name}.${
          leave.reviewNotes ? ` Note: "${leave.reviewNotes}"` : ""
        }`,
        linkTab: "leaves",
        metadata: {
          leaveId: leave._id,
          status: leave.status,
          reviewedByName: employee.name,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Leave application successfully ${actionPast.toLowerCase()}!`,
        leave,
      });
    }

    // 2. Subordinate Daily Submission Acknowledgement / Feedback
    if (itemType === "SUBMISSION") {
      const submission = await Submission.findById(itemId);
      if (!submission) {
        return NextResponse.json({ error: "Daily submission not found." }, { status: 404 });
      }

      if (submission.reviewerId && submission.reviewerId.toString() !== employee._id.toString()) {
        return NextResponse.json(
          { error: "You are not the designated supervisor for this report." },
          { status: 403 }
        );
      }

      submission.status = "ACKNOWLEDGED";
      submission.acknowledgedBy = employee._id;
      submission.acknowledgedByName = employee.name;
      submission.acknowledgedAt = new Date();
      submission.feedback = (feedback || "").trim();
      await submission.save();

      // Notify subordinate
      await createEmployeeNotification({
        recipientId: submission.employeeId,
        companyId: owner._id,
        senderId: employee._id,
        senderName: employee.name,
        type: "WORK_FEEDBACK",
        title: `Daily Work Acknowledged: ${submission.title}`,
        message: `${employee.name} reviewed your daily submission "${submission.title}".${
          submission.feedback ? ` Feedback: "${submission.feedback}"` : ""
        }`,
        linkTab: "submissions",
        metadata: {
          submissionId: submission._id,
          acknowledgedByName: employee.name,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Work submission reviewed and feedback sent to employee!",
        submission,
      });
    }

    return NextResponse.json({ error: "Unknown item type." }, { status: 400 });
  } catch (error) {
    console.error("PATCH /api/employee/team-requests error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process team request" },
      { status: 500 }
    );
  }
}
