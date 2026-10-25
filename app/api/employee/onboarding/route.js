import { NextResponse } from "next/server";
import { getAuthenticatedEmployee } from "@/lib/employeeAuth";
import Employee, { DEPARTMENT_LIST, POST_HIERARCHY_LEVELS } from "@/models/Employee";
import { createOwnerNotification } from "@/lib/notifications";

export async function POST(request) {
  try {
    const auth = await getAuthenticatedEmployee({ requireApproved: false });
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { employee, owner, organization } = auth;
    const body = await request.json();
    const { branchId, department, postLevel, postTitle, workDescription } = body;

    // Validation
    if (!branchId) {
      return NextResponse.json({ error: "Please select your assigned branch." }, { status: 400 });
    }

    const normDept = (department || "").trim().toUpperCase();
    if (!DEPARTMENT_LIST.includes(normDept)) {
      return NextResponse.json(
        { error: "Invalid department. Choose Operations, Sales, Logistics, or Financial." },
        { status: 400 }
      );
    }

    const normPost = (postLevel || "").trim().toUpperCase();
    if (!POST_HIERARCHY_LEVELS.includes(normPost)) {
      return NextResponse.json(
        { error: "Invalid post level selected." },
        { status: 400 }
      );
    }

    if (!workDescription || workDescription.trim().length < 10) {
      return NextResponse.json(
        { error: "Please provide a clear work description (at least 10 characters)." },
        { status: 400 }
      );
    }

    // Validate Branch in Organization & enforce capacity constraint
    const branchList = Array.isArray(organization?.branchList) ? organization.branchList : [];
    const targetBranch = branchList.find((b) => b.branchId === branchId);

    if (!targetBranch) {
      return NextResponse.json({ error: "Selected branch does not exist." }, { status: 400 });
    }

    if (targetBranch.status !== "active") {
      return NextResponse.json(
        { error: "Selected branch is currently inactive. Please choose an active branch." },
        { status: 400 }
      );
    }

    // Headcount check: Branch staff can be fewer than limit, but CANNOT exceed capacity
    const branchCapacity = Number(targetBranch.staffCount) || 0;
    if (branchCapacity > 0) {
      const currentBranchStaff = await Employee.countDocuments({
        companyId: owner._id,
        branchId: branchId,
        approvalStatus: "APPROVED",
        _id: { $ne: employee._id },
      });

      if (currentBranchStaff >= branchCapacity) {
        return NextResponse.json(
          {
            error: `This branch has reached its allowed capacity (${currentBranchStaff} of ${branchCapacity} positions filled). Please consult your owner.`,
          },
          { status: 400 }
        );
      }
    }

    // Update Employee record
    employee.branchId = targetBranch.branchId;
    employee.branchName = targetBranch.name || `Branch #${targetBranch.branchNumber}`;
    employee.department = normDept;
    employee.postLevel = normPost;
    employee.postTitle = (postTitle || normPost.replace(/_/g, " ")).trim();
    employee.workDescription = workDescription.trim();
    employee.approvalStatus = "PENDING_APPROVAL";
    employee.isApproved = false;

    await employee.save();

    // Notify business owner in real-time
    await createOwnerNotification({
      ownerId: owner._id,
      companyId: owner._id,
      employeeId: employee._id,
      employeeName: employee.name,
      type: "STAFF_REGISTRATION",
      title: `New Staff Request: ${employee.name}`,
      message: `${employee.name} requested to join ${normDept} as ${employee.postTitle || normPost} at ${targetBranch.name || `Branch #${targetBranch.branchNumber}`}.`,
      linkTab: "approval",
      metadata: {
        employeeId: employee._id,
        department: normDept,
        postLevel: normPost,
        branchId: targetBranch.branchId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Information submitted. Awaiting owner approval.",
      redirectUrl: "/department/pending-approval",
    });
  } catch (error) {
    console.error("Employee Onboarding API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit employee onboarding" },
      { status: 500 }
    );
  }
}
