import { NextResponse } from "next/server";
import { getAuthenticatedEmployee } from "@/lib/employeeAuth";
import Leave from "@/models/Leave";
import { createOwnerNotification, createEmployeeNotification } from "@/lib/notifications";
import { resolveReportingSupervisor } from "@/lib/hierarchy";

export async function GET() {
  try {
    const auth = await getAuthenticatedEmployee({ requireApproved: true });
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { employee } = auth;
    const leaves = await Leave.find({ employeeId: employee._id })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      leaves,
    });
  } catch (error) {
    console.error("Leaves GET Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load leave history" },
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
    const { leaveType, startDate, endDate, totalDays, reason, handoverNote } = body;

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Start date and End date are required." },
        { status: 400 }
      );
    }

    if (!reason || reason.trim().length < 5) {
      return NextResponse.json(
        { error: "Please provide a valid reason for your leave (min 5 characters)." },
        { status: 400 }
      );
    }

    const parsedDays = parseFloat(totalDays);
    const calculatedDays = isNaN(parsedDays) || parsedDays < 0.5 ? 0.5 : parsedDays;

    // Resolve hierarchy supervisor: lower staff route to their upper colleague, top posts route to owner
    const reporting = await resolveReportingSupervisor(employee);
    const isReportingToSupervisor =
      reporting.type === "EMPLOYEE_SUPERVISOR" && reporting.supervisor;

    const approverType = isReportingToSupervisor ? "EMPLOYEE_SUPERVISOR" : "OWNER";
    const approverId = isReportingToSupervisor
      ? reporting.supervisor._id
      : owner._id;
    const approverName = isReportingToSupervisor
      ? reporting.supervisor.name
      : (owner.name || "Business Owner");
    const approverRole = isReportingToSupervisor
      ? (reporting.supervisor.postTitle || reporting.supervisor.postLevel?.replace(/_/g, " "))
      : "Business Owner";

    const newLeave = new Leave({
      employeeId: employee._id,
      employeeName: employee.name,
      ownerId: owner._id,
      companyId: owner._id,
      branchId: employee.branchId || "branch-1",
      branchName: employee.branchName || "Main HQ",
      department: employee.department || "OPERATIONS",
      leaveType: leaveType || "CASUAL",
      startDate: startDate.trim(),
      endDate: endDate.trim(),
      totalDays: calculatedDays,
      reason: reason.trim(),
      handoverNote: (handoverNote || "").trim(),
      approverType,
      approverId,
      approverName,
      approverRole,
      status: "PENDING",
    });

    await newLeave.save();

    const typeLabel = (leaveType || "Casual").toLowerCase();
    const durationLabel = calculatedDays === 0.5 ? "half day" : `${calculatedDays} day(s)`;

    if (isReportingToSupervisor) {
      // Notify the immediate upper supervisor in real-time
      await createEmployeeNotification({
        recipientId: reporting.supervisor._id,
        companyId: owner._id,
        senderId: employee._id,
        senderName: employee.name,
        type: "LEAVE_REQUEST",
        title: `Leave Request: ${employee.name}`,
        message: `${employee.name} requested ${durationLabel} ${typeLabel} leave (${startDate} to ${endDate}): "${reason.trim()}". Please review and approve/reject.`,
        linkTab: "desk",
        metadata: {
          leaveId: newLeave._id,
          leaveType: newLeave.leaveType,
          totalDays: newLeave.totalDays,
          startDate: newLeave.startDate,
          endDate: newLeave.endDate,
          branchId: newLeave.branchId,
          department: employee.department,
        },
      });
    } else {
      // Escalated to business owner (for top departmental posts without upper staff)
      await createOwnerNotification({
        ownerId: owner._id,
        companyId: owner._id,
        employeeId: employee._id,
        employeeName: employee.name,
        type: "LEAVE_REQUEST",
        title: `New Leave Request: ${employee.name}`,
        message: `${employee.name} requested ${durationLabel} ${typeLabel} leave (${startDate} to ${endDate}): "${reason.trim()}".`,
        linkTab: "team",
        metadata: {
          leaveId: newLeave._id,
          leaveType: newLeave.leaveType,
          totalDays: newLeave.totalDays,
          startDate: newLeave.startDate,
          endDate: newLeave.endDate,
          branchId: newLeave.branchId,
          department: employee.department,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: isReportingToSupervisor
        ? `Leave application routed to supervisor ${approverName} for review.`
        : "Leave application submitted to business owner for review.",
      leave: newLeave,
    });
  } catch (error) {
    console.error("Leaves POST Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit leave request" },
      { status: 500 }
    );
  }
}
