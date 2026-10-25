import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";
import Owner from "@/models/Owner";
import Organization from "@/models/Organization";
import Employee from "@/models/Employee";

export async function GET() {
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

    const organization = await Organization.findOne({ ownerId: owner._id });
    const branchList = Array.isArray(organization?.branchList) ? organization.branchList : [];

    // Find all employees under this owner pending approval
    const pendingEmployees = await Employee.find({
      companyId: owner._id,
      approvalStatus: "PENDING_APPROVAL",
    })
      .sort({ updatedAt: -1 })
      .lean();

    // Map with branch metadata & current headcount
    const pendingWithDetails = await Promise.all(
      pendingEmployees.map(async (emp) => {
        const branch = branchList.find((b) => b.branchId === emp.branchId) || {
          name: emp.branchName || "Branch 1 (Main HQ)",
          staffCount: organization?.employeeCount || 0,
        };

        const activeStaffInBranch = await Employee.countDocuments({
          companyId: owner._id,
          branchId: emp.branchId,
          approvalStatus: "APPROVED",
        });

        const branchCapacity = Number(branch.staffCount) || 0;

        return {
          id: emp._id,
          name: emp.name,
          email: emp.email,
          phoneNumber: emp.phoneNumber,
          department: emp.department,
          postLevel: emp.postLevel,
          postTitle: emp.postTitle,
          workDescription: emp.workDescription,
          branchId: emp.branchId,
          branchName: branch.name,
          branchCapacity,
          activeStaffInBranch,
          isBranchFull: branchCapacity > 0 && activeStaffInBranch >= branchCapacity,
          createdAt: emp.createdAt,
        };
      })
    );

    return NextResponse.json({
      success: true,
      pending: pendingWithDetails,
    });
  } catch (error) {
    console.error("Pending Employees GET Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load pending employees" },
      { status: 500 }
    );
  }
}
