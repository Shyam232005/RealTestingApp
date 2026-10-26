import { NextResponse } from "next/server";
import { getAuthenticatedEmployee } from "@/lib/employeeAuth";
import Attendance from "@/models/Attendance";
import Leave from "@/models/Leave";
import Submission from "@/models/Submission";
import TaskAssignment from "@/models/TaskAssignment";
import Notification from "@/models/Notification";
import {
  getHierarchyRank,
  isUpperRole,
  resolveReportingSupervisor,
  getSubordinates,
} from "@/lib/hierarchy";

// GET /api/employee/workspace-data
// High-performance consolidated endpoint: replaces 9 separate HTTP calls with a single lean query roundtrip
export async function GET() {
  try {
    const auth = await getAuthenticatedEmployee({ requireApproved: false });
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { employee, owner, organization } = auth;

    // Strict Tenant Boundary Definition
    const companyId = owner._id;
    const branchId = employee.branchId || "branch-1";
    const department = employee.department || "OPERATIONS";
    const employeeId = employee._id;
    const isApproved = employee.approvalStatus === "APPROVED";

    const companyData = {
      id: owner._id.toString(),
      name: organization?.companyName || owner.name || "Crown Organization",
      ownerName: owner.name || "Business Owner",
      code: organization?.code || "CROWN",
    };

    const sanitizedEmployee = {
      id: employeeId.toString(),
      name: employee.name,
      email: employee.email,
      phoneNumber: employee.phoneNumber || "",
      department,
      postLevel: employee.postLevel || "ASSISTANT",
      postTitle: employee.postTitle || employee.postLevel?.replace(/_/g, " "),
      workDescription: employee.workDescription || "",
      branchId,
      branchName: employee.branchName || "Main HQ",
      approvalStatus: employee.approvalStatus,
      isApproved,
    };

    // If employee is not yet approved, return early with zero database load
    if (!isApproved) {
      return NextResponse.json({
        success: true,
        isApproved: false,
        employee: sanitizedEmployee,
        company: companyData,
      });
    }

    // Today's date string YYYY-MM-DD
    const todayStr = new Date().toISOString().split("T")[0];
    const myRank = getHierarchyRank(employee.postLevel);
    const isUpper = isUpperRole(employee.postLevel);

    // Single-Roundtrip Concurrent Pipeline (all lean, multi-tenant scoped)
    const [
      todayAttDoc,
      attendanceHistory,
      leavesList,
      submissionsList,
      reportingResult,
      subordinatesList,
      subordinateLeaves,
      subordinateSubmissions,
      subordinateTasks,
      myAssignedTasks,
      assignedByMeTasks,
      notificationsList,
      unreadNotificationsCount,
    ] = await Promise.all([
      // 1. Today's attendance session
      Attendance.findOne({
        employeeId,
        date: todayStr,
      }).lean(),

      // 2. Attendance history (last 30 records)
      Attendance.find({
        employeeId,
      })
        .sort({ date: -1, createdAt: -1 })
        .limit(30)
        .lean(),

      // 3. Employee's own leaves
      Leave.find({
        employeeId,
      })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),

      // 4. Employee's own daily work submissions
      Submission.find({
        employeeId,
      })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),

      // 5. Reporting supervisor
      resolveReportingSupervisor(employee),

      // 6. Subordinates (only lower rank in same branch & department)
      isUpper ? getSubordinates(employee) : Promise.resolve([]),

      // 7. Subordinate leaves (where current employee is the designated approver)
      isUpper
        ? Leave.find({
            companyId,
            branchId,
            approverId: employeeId,
          })
            .sort({ createdAt: -1 })
            .limit(40)
            .lean()
        : Promise.resolve([]),

      // 8. Subordinate daily submissions (where current employee is designated reviewer)
      isUpper
        ? Submission.find({
            companyId,
            branchId,
            reviewerId: employeeId,
          })
            .sort({ createdAt: -1 })
            .limit(40)
            .lean()
        : Promise.resolve([]),

      // 9. Subordinate tasks (tasks created by this supervisor)
      isUpper
        ? TaskAssignment.find({
            companyId,
            branchId,
            assignedBy: employeeId,
          })
            .sort({ updatedAt: -1 })
            .limit(50)
            .lean()
        : Promise.resolve([]),

      // 10. Works assigned to this employee by upper supervisor
      TaskAssignment.find({
        companyId,
        assignedTo: employeeId,
      })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),

      // 11. Tasks assigned by this supervisor
      isUpper
        ? TaskAssignment.find({
            companyId,
            assignedBy: employeeId,
          })
            .sort({ createdAt: -1 })
            .limit(50)
            .lean()
        : Promise.resolve([]),

      // 12. Employee notifications
      Notification.find({
        recipientType: "EMPLOYEE",
        recipientId: employeeId,
      })
        .sort({ createdAt: -1 })
        .limit(30)
        .lean(),

      // 13. Unread count
      Notification.countDocuments({
        recipientType: "EMPLOYEE",
        recipientId: employeeId,
        isRead: false,
      }),
    ]);

    // Format today's attendance status
    const todayAttendance = todayAttDoc
      ? {
          ...todayAttDoc,
          isPunchedIn: Boolean(todayAttDoc.isPunchedIn),
          isCompleted: Boolean(todayAttDoc.isCompleted),
        }
      : null;

    // Format reporting supervisor
    const reportingTo =
      reportingResult?.type === "EMPLOYEE_SUPERVISOR" && reportingResult.supervisor
        ? {
            type: "EMPLOYEE_SUPERVISOR",
            id: reportingResult.supervisor._id.toString(),
            name: reportingResult.supervisor.name,
            postTitle:
              reportingResult.supervisor.postTitle ||
              reportingResult.supervisor.postLevel?.replace(/_/g, " "),
            postLevel: reportingResult.supervisor.postLevel,
            department: reportingResult.supervisor.department,
          }
        : {
            type: "OWNER",
            id: owner._id.toString(),
            name: owner.name || "Business Owner",
            postTitle: "Business Owner / Enterprise Head",
            postLevel: "OWNER",
            department,
          };

    return NextResponse.json({
      success: true,
      isApproved: true,
      employee: sanitizedEmployee,
      company: companyData,
      todayAttendance,
      attendanceHistory: attendanceHistory || [],
      leavesList: leavesList || [],
      submissionsList: submissionsList || [],
      profileData: {
        name: employee.name,
        email: employee.email,
        phoneNumber: employee.phoneNumber || "",
        department,
        postLevel: employee.postLevel,
        postTitle: sanitizedEmployee.postTitle,
        branchName: sanitizedEmployee.branchName,
        workDescription: employee.workDescription || "",
        approvalStatus: employee.approvalStatus,
      },
      hierarchy: {
        myRank,
        isUpperRole: isUpper,
        reportingTo,
        subordinates: subordinatesList || [],
      },
      teamRequests: {
        subordinateLeaves: subordinateLeaves || [],
        subordinateSubmissions: subordinateSubmissions || [],
        subordinateTasks: subordinateTasks || [],
        myAssignedTasks: myAssignedTasks || [],
      },
      assignedByMeTasks: assignedByMeTasks || [],
      notifications: notificationsList || [],
      unreadNotificationsCount: unreadNotificationsCount || 0,
    });
  } catch (error) {
    console.error("GET /api/employee/workspace-data error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load workspace data" },
      { status: 500 }
    );
  }
}
