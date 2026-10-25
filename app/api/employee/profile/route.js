import { NextResponse } from "next/server";
import { getAuthenticatedEmployee } from "@/lib/employeeAuth";

export async function GET() {
  try {
    const auth = await getAuthenticatedEmployee({ requireApproved: true });
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { employee, owner, organization } = auth;

    // Find assigned branch metadata
    const branchList = Array.isArray(organization?.branchList) ? organization.branchList : [];
    const assignedBranch = branchList.find((b) => b.branchId === employee.branchId) || {
      name: employee.branchName || "Main HQ",
      location: organization?.city ? `${organization.city}, ${organization.state || ""}` : "Default Premises",
      staffCount: organization?.employeeCount || 0,
    };

    return NextResponse.json({
      success: true,
      profile: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        phoneNumber: employee.phoneNumber,
        department: employee.department,
        postLevel: employee.postLevel,
        postTitle: employee.postTitle,
        workDescription: employee.workDescription,
        branchId: employee.branchId,
        branchName: assignedBranch.name || employee.branchName || "Main HQ",
        branchLocation: assignedBranch.location || "Default Premises",
        branchCapacity: assignedBranch.staffCount || 0,
        approvalStatus: employee.approvalStatus,
        isApproved: employee.isApproved,
        joinedDate: employee.createdAt,
      },
      organization: {
        name: organization?.companyName || owner?.name || "Crown Ecosystems Partner",
        code: owner?.inviteCode || "BIZ-CROWN1",
        ownerName: owner?.name,
        ownerEmail: owner?.email,
        ownerPhone: owner?.phoneNumber,
        gstin: organization?.gstin || "Unregistered / Composition",
      },
    });
  } catch (error) {
    console.error("Employee Profile GET Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const auth = await getAuthenticatedEmployee({ requireApproved: true });
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { employee } = auth;
    const body = await request.json();
    const { phoneNumber, workDescription, postTitle } = body;

    if (phoneNumber) {
      employee.phoneNumber = phoneNumber.trim();
    }
    if (workDescription) {
      employee.workDescription = workDescription.trim();
    }
    if (postTitle) {
      employee.postTitle = postTitle.trim();
    }

    await employee.save();

    return NextResponse.json({
      success: true,
      message: "Profile details updated successfully.",
      profile: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        phoneNumber: employee.phoneNumber,
        postTitle: employee.postTitle,
        workDescription: employee.workDescription,
      },
    });
  } catch (error) {
    console.error("Employee Profile PUT Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update profile" },
      { status: 500 }
    );
  }
}
