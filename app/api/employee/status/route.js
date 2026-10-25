import { NextResponse } from "next/server";
import { getAuthenticatedEmployee } from "@/lib/employeeAuth";
import Attendance from "@/models/Attendance";

export async function GET() {
  try {
    const auth = await getAuthenticatedEmployee({ requireApproved: false });
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { employee, owner, organization } = auth;

    // Retrieve active branches from organization for onboarding/switching context
    const branchCount = Math.max(1, Number(organization?.branches || 1));
    const branchList = Array.isArray(organization?.branchList) ? organization.branchList : [];
    
    // Check headcount for each branch
    const EmployeeModel = employee.constructor;
    const branchesWithCapacity = await Promise.all(
      branchList.map(async (b) => {
        const staffCapacity = Number(b.staffCount) || 0;
        const currentStaff = await EmployeeModel.countDocuments({
          companyId: owner._id,
          branchId: b.branchId,
          approvalStatus: "APPROVED",
        });
        return {
          branchId: b.branchId,
          branchNumber: b.branchNumber,
          name: b.name || `Branch #${b.branchNumber}`,
          location: b.location || "Default Premises",
          status: b.status || (b.branchNumber === 1 ? "active" : "inactive"),
          staffCapacity,
          currentStaff,
          isFull: staffCapacity > 0 && currentStaff >= staffCapacity,
        };
      })
    );

    // Today's attendance status
    const todayStr = new Date().toISOString().split("T")[0];
    const todayAttendance = await Attendance.findOne({
      employeeId: employee._id,
      date: todayStr,
    });

    return NextResponse.json({
      success: true,
      employee: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        phoneNumber: employee.phoneNumber,
        department: employee.department,
        postLevel: employee.postLevel,
        postTitle: employee.postTitle,
        workDescription: employee.workDescription,
        branchId: employee.branchId,
        branchName: employee.branchName,
        approvalStatus: employee.approvalStatus,
        isApproved: employee.isApproved,
      },
      company: {
        name: organization?.companyName || owner?.name || "Crown Ecosystems Partner",
        ownerName: owner?.name,
        code: owner?.inviteCode,
      },
      availableBranches: branchesWithCapacity.filter((b) => b.status === "active"),
      todayAttendance: todayAttendance
        ? {
            id: todayAttendance._id,
            date: todayAttendance.date,
            punchIn: todayAttendance.punchIn,
            punchOut: todayAttendance.punchOut,
            durationMinutes: todayAttendance.durationMinutes,
            status: todayAttendance.status,
            isPunchedIn: !!todayAttendance.punchIn && !todayAttendance.punchOut,
            isCompleted: !!todayAttendance.punchOut,
          }
        : null,
      isPunchedInToday: !!todayAttendance?.punchIn && !todayAttendance?.punchOut,
    });
  } catch (error) {
    console.error("Employee Status API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch employee status" },
      { status: 500 }
    );
  }
}
