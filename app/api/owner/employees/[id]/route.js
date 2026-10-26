import { NextResponse } from "next/server";
import { getAuthenticatedOwner } from "@/lib/ownerAuth";
import Employee, { DEPARTMENT_LIST, POST_HIERARCHY_LEVELS } from "@/models/Employee";
import Attendance from "@/models/Attendance";
import Leave from "@/models/Leave";
import TaskAssignment from "@/models/TaskAssignment";
import Submission from "@/models/Submission";

// PATCH /api/owner/employees/[id] - Transfer / Reassign employee to another department or role
export async function PATCH(request, { params }) {
  try {
    const auth = await getAuthenticatedOwner();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { owner } = auth;
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Employee ID is required." }, { status: 400 });
    }

    const employee = await Employee.findOne({ _id: id, companyId: owner._id });
    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found or unauthorized to manage this employee." },
        { status: 404 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { department, postLevel, postTitle, branchId, branchName } = body;

    const previousDept = employee.department;
    const previousPost = employee.postTitle;

    // Validate and update Department if provided
    if (department) {
      const upperDept = department.toUpperCase();
      if (!DEPARTMENT_LIST.includes(upperDept)) {
        return NextResponse.json(
          { error: `Invalid department. Allowed: ${DEPARTMENT_LIST.join(", ")}` },
          { status: 400 }
        );
      }
      employee.department = upperDept;
    }

    // Validate and update Post Level if provided
    if (postLevel) {
      if (!POST_HIERARCHY_LEVELS.includes(postLevel)) {
        return NextResponse.json(
          { error: `Invalid hierarchy level. Allowed: ${POST_HIERARCHY_LEVELS.join(", ")}` },
          { status: 400 }
        );
      }
      employee.postLevel = postLevel;
    }

    // Update Post Title if provided
    if (postTitle && postTitle.trim()) {
      employee.postTitle = postTitle.trim();
    }

    // Update Branch if provided
    if (branchId) {
      employee.branchId = branchId;
    }
    if (branchName) {
      employee.branchName = branchName;
    }

    await employee.save();

    return NextResponse.json({
      success: true,
      message: `Transferred ${employee.name} from ${previousDept} (${previousPost}) to ${employee.department} (${employee.postTitle || employee.postLevel})`,
      employee: {
        _id: employee._id,
        name: employee.name,
        email: employee.email,
        phoneNumber: employee.phoneNumber,
        department: employee.department,
        postLevel: employee.postLevel,
        postTitle: employee.postTitle,
        branchId: employee.branchId,
        branchName: employee.branchName,
        approvalStatus: employee.approvalStatus,
      },
    });
  } catch (error) {
    console.error("Employee PATCH Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to transfer employee" },
      { status: 500 }
    );
  }
}

// DELETE /api/owner/employees/[id] - Permanently delete employee from the database
export async function DELETE(request, { params }) {
  try {
    const auth = await getAuthenticatedOwner();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { owner } = auth;
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Employee ID is required." }, { status: 400 });
    }

    const employee = await Employee.findOne({ _id: id, companyId: owner._id });
    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found or unauthorized to delete." },
        { status: 404 }
      );
    }

    const employeeName = employee.name;
    const employeeDept = employee.department;

    // Permanently remove employee document from database
    await Employee.findByIdAndDelete(id);

    // Optionally cleanup active unfinalized attendance & tasks for this employee
    await Attendance.deleteMany({ employeeId: id, punchOut: null });
    await TaskAssignment.deleteMany({ assignedTo: id, status: "PENDING" });

    return NextResponse.json({
      success: true,
      message: `Employee ${employeeName} has been permanently removed from ${employeeDept} and deleted from the database.`,
      deletedId: id,
    });
  } catch (error) {
    console.error("Employee DELETE Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to remove employee from database" },
      { status: 500 }
    );
  }
}
