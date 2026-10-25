import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";
import Owner from "@/models/Owner";
import Organization from "@/models/Organization";
import Employee from "@/models/Employee";

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("crown_session")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    let decoded;
    try {
      decoded = jwt.verify(sessionToken, process.env.JWT_SECRET);
    } catch {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    if (decoded.normalizedRole !== "OWNER" && decoded.role !== "Owner" && decoded.role !== "OWNER") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    await connectDB();
    const owner = await Owner.findById(decoded.userId);
    if (!owner) {
      return NextResponse.json({ error: "Owner not found" }, { status: 404 });
    }

    const body = await request.json();
    const { employeeId, action, rejectionReason } = body;

    if (!employeeId || !action) {
      return NextResponse.json(
        { error: "Employee ID and action (APPROVE or REJECT) are required." },
        { status: 400 }
      );
    }

    const employee = await Employee.findOne({
      _id: employeeId,
      companyId: owner._id,
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employee request not found or does not belong to your company." },
        { status: 404 }
      );
    }

    const organization = await Organization.findOne({ ownerId: owner._id });
    const branchList = Array.isArray(organization?.branchList) ? organization.branchList : [];

    if (action.toUpperCase() === "APPROVE") {
      // Validate branch capacity constraint
      const branchId = employee.branchId || "branch-1";
      const branch = branchList.find((b) => b.branchId === branchId);
      const branchCapacity = Number(branch?.staffCount || 0);

      if (branchCapacity > 0) {
        const activeStaffInBranch = await Employee.countDocuments({
          companyId: owner._id,
          branchId: branchId,
          approvalStatus: "APPROVED",
        });

        if (activeStaffInBranch >= branchCapacity) {
          return NextResponse.json(
            {
              error: `Cannot approve: Branch capacity of ${branchCapacity} positions has already been reached. Adjust branch capacity in settings first or reassign.`,
            },
            { status: 400 }
          );
        }
      }

      employee.approvalStatus = "APPROVED";
      employee.isApproved = true;
      employee.approvedAt = new Date();
      employee.approvedBy = owner._id;
      await employee.save();

      // Ensure employee ID is in owner's employees array
      if (!owner.employees.includes(employee._id)) {
        owner.employees.push(employee._id);
        await owner.save();
      }

      return NextResponse.json({
        success: true,
        message: `${employee.name} has been approved for ${employee.department} department (${employee.postTitle || employee.postLevel})!`,
        employee: {
          id: employee._id,
          name: employee.name,
          department: employee.department,
          postLevel: employee.postLevel,
          approvalStatus: employee.approvalStatus,
        },
      });
    } else if (action.toUpperCase() === "REJECT") {
      // User's explicit rule: "if not then remove employee from databased they have to register"
      const empName = employee.name;
      await Employee.findByIdAndDelete(employeeId);

      // Remove from owner's employees array
      owner.employees = (owner.employees || []).filter(
        (id) => id.toString() !== employeeId.toString()
      );
      await owner.save();

      return NextResponse.json({
        success: true,
        message: `Employee request for ${empName} was rejected and removed from database.`,
      });
    } else {
      return NextResponse.json({ error: "Invalid action specified." }, { status: 400 });
    }
  } catch (error) {
    console.error("Employee Review API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process review" },
      { status: 500 }
    );
  }
}
