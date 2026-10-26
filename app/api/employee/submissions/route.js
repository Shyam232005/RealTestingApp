import { NextResponse } from "next/server";
import { getAuthenticatedEmployee } from "@/lib/employeeAuth";
import Submission from "@/models/Submission";
import { createOwnerNotification, createEmployeeNotification } from "@/lib/notifications";
import { resolveReportingSupervisor } from "@/lib/hierarchy";

export async function GET() {
  try {
    const auth = await getAuthenticatedEmployee({ requireApproved: true });
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { employee } = auth;
    const submissions = await Submission.find({ employeeId: employee._id })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      submissions,
    });
  } catch (error) {
    console.error("Submissions GET Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load submissions" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const auth = await getAuthenticatedEmployee({ requireApproved: true });
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { employee, owner } = auth;
    const body = await request.json();
    const { title, tasksCompleted, blockers, summary } = body;

    if (!title || title.trim().length < 3) {
      return NextResponse.json(
        { error: "Please enter a report title or summary heading (min 3 chars)." },
        { status: 400 }
      );
    }

    const tasksList = Array.isArray(tasksCompleted)
      ? tasksCompleted.map((t) => String(t).trim()).filter(Boolean)
      : typeof tasksCompleted === "string"
      ? tasksCompleted
          .split("\n")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    const todayStr = new Date().toISOString().split("T")[0];

    // Resolve hierarchy supervisor
    const reporting = await resolveReportingSupervisor(employee);
    const isReportingToSupervisor =
      reporting.type === "EMPLOYEE_SUPERVISOR" && reporting.supervisor;

    const reviewerType = isReportingToSupervisor ? "EMPLOYEE_SUPERVISOR" : "OWNER";
    const reviewerId = isReportingToSupervisor
      ? reporting.supervisor._id
      : owner._id;
    const reviewerName = isReportingToSupervisor
      ? reporting.supervisor.name
      : (owner.name || "Business Owner");
    const reviewerRole = isReportingToSupervisor
      ? (reporting.supervisor.postTitle || reporting.supervisor.postLevel?.replace(/_/g, " "))
      : "Business Owner";

    const newSubmission = new Submission({
      employeeId: employee._id,
      employeeName: employee.name,
      ownerId: owner._id,
      companyId: owner._id,
      branchId: employee.branchId || "branch-1",
      branchName: employee.branchName || "Main HQ",
      department: employee.department || "OPERATIONS",
      postLevel: employee.postLevel || "ASSISTANT",
      date: todayStr,
      title: title.trim(),
      tasksCompleted: tasksList,
      blockers: (blockers || "").trim(),
      summary: (summary || "").trim(),
      reviewerType,
      reviewerId,
      reviewerName,
      reviewerRole,
      status: "SUBMITTED",
    });

    await newSubmission.save();

    if (isReportingToSupervisor) {
      // Notify supervisor in real-time
      await createEmployeeNotification({
        recipientId: reporting.supervisor._id,
        companyId: owner._id,
        senderId: employee._id,
        senderName: employee.name,
        type: "WORK_FEEDBACK",
        title: `Daily Work Report: ${employee.name}`,
        message: `${employee.name} submitted daily report "${title.trim()}" (${tasksList.length} task${tasksList.length === 1 ? "" : "s"}). Please review.`,
        linkTab: "desk",
        metadata: {
          submissionId: newSubmission._id,
          tasksCount: tasksList.length,
          hasBlockers: !!blockers?.trim(),
          branchId: newSubmission.branchId,
          department: employee.department,
        },
      });
    } else {
      // Escalated to business owner for top departmental officers
      await createOwnerNotification({
        ownerId: owner._id,
        companyId: owner._id,
        employeeId: employee._id,
        employeeName: employee.name,
        type: "DAILY_SUBMISSION",
        title: `Daily Work Report: ${employee.name}`,
        message: `${employee.name} submitted daily report "${title.trim()}" (${tasksList.length} task${tasksList.length === 1 ? "" : "s"} logged).`,
        linkTab: "team",
        metadata: {
          submissionId: newSubmission._id,
          tasksCount: tasksList.length,
          hasBlockers: !!blockers?.trim(),
          branchId: newSubmission.branchId,
          department: employee.department,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: isReportingToSupervisor
        ? `Daily report submitted to your supervisor ${reviewerName} for review.`
        : "Daily report submitted successfully to business owner.",
      submission: newSubmission,
    });
  } catch (error) {
    console.error("Submissions POST Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit daily report" },
      { status: 500 }
    );
  }
}
