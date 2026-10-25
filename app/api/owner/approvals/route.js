import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";
import Owner from "@/models/Owner";
import Organization from "@/models/Organization";
import ApprovalRequest from "@/models/ApprovalRequest";
import Employee from "@/models/Employee";

// Helper: Extract & verify authenticated Owner session
async function getAuthenticatedOwner() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("crown_session")?.value;

  if (!sessionToken) {
    return { error: "Not authenticated. Please log in.", status: 401 };
  }

  let decoded;
  try {
    decoded = jwt.verify(sessionToken, process.env.JWT_SECRET);
  } catch {
    return { error: "Invalid or expired session. Please log in again.", status: 401 };
  }

  if (decoded.normalizedRole !== "OWNER" && decoded.role !== "Owner" && decoded.role !== "OWNER") {
    return { error: "Access denied. Only business owners can perform this action.", status: 403 };
  }

  await connectDB();
  const owner = await Owner.findById(decoded.userId);
  if (!owner) {
    return { error: "Owner account not found.", status: 404 };
  }

  let organization = null;
  if (owner.organizationId) {
    organization = await Organization.findById(owner.organizationId);
  }
  if (!organization) {
    organization = await Organization.findOne({ ownerId: owner._id });
  }

  if (!organization) {
    return { error: "Organization setup not found.", status: 404 };
  }

  return { owner, organization, decoded };
}

// GET /api/owner/approvals - Fetch all approval requests (Staff registrations, POs, CA data access)
export async function GET() {
  try {
    const auth = await getAuthenticatedOwner();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { owner, organization } = auth;

    // 1. Fetch real approval requests for this organization (PO & CA access)
    const allRequests = await ApprovalRequest.find({ organizationId: organization._id })
      .sort({ requestedAt: -1 })
      .lean();

    const pending = allRequests.filter((r) => r.status === "PENDING");
    const history = allRequests.filter((r) => r.status !== "PENDING");
    const caRequests = allRequests.filter((r) => r.type === "CA_DATA_ACCESS");
    const caReports = allRequests.filter((r) => r.hasReport && r.reportStatus === "SUBMITTED");

    // 2. Fetch pending staff department registrations
    const branchList = Array.isArray(organization.branchList) ? organization.branchList : [];
    const pendingEmployees = await Employee.find({
      companyId: owner._id,
      approvalStatus: "PENDING_APPROVAL",
    })
      .sort({ updatedAt: -1 })
      .lean();

    const pendingStaff = await Promise.all(
      pendingEmployees.map(async (emp) => {
        const branch = branchList.find((b) => b.branchId === emp.branchId) || {
          name: emp.branchName || "Main HQ",
          staffCount: organization.employeeCount || 0,
        };
        const activeStaffInBranch = await Employee.countDocuments({
          companyId: owner._id,
          branchId: emp.branchId,
          approvalStatus: "APPROVED",
        });
        const branchCapacity = Number(branch.staffCount) || 0;

        return {
          id: emp._id.toString(),
          _id: emp._id.toString(),
          type: "STAFF_REGISTRATION",
          name: emp.name,
          email: emp.email,
          phoneNumber: emp.phoneNumber,
          department: emp.department,
          postLevel: emp.postLevel,
          postTitle: emp.postTitle || emp.postLevel?.replace(/_/g, " "),
          workDescription: emp.workDescription,
          branchId: emp.branchId,
          branchName: branch.name,
          branchCapacity,
          activeStaffInBranch,
          isBranchFull: branchCapacity > 0 && activeStaffInBranch >= branchCapacity,
          requestedAt: emp.updatedAt || emp.createdAt,
          status: "PENDING",
        };
      })
    );

    return NextResponse.json(
      {
        success: true,
        all: allRequests,
        pending,
        pendingStaff,
        history,
        caRequests,
        caReports,
        stats: {
          pendingCount: pending.length + pendingStaff.length,
          pendingStaffCount: pendingStaff.length,
          approvedCount: allRequests.filter((r) => r.status === "APPROVED").length,
          rejectedCount: allRequests.filter((r) => r.status === "REJECTED").length,
          reportsCount: caReports.length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/owner/approvals error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch approvals" },
      { status: 500 }
    );
  }
}

// PATCH /api/owner/approvals - Owner approves, rejects, or revokes a request
export async function PATCH(request) {
  try {
    const auth = await getAuthenticatedOwner();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { owner, organization } = auth;
    const body = await request.json();
    const { requestId, action, decisionNotes, type } = body;

    if (!requestId) {
      return NextResponse.json({ error: "Request ID is required." }, { status: 400 });
    }

    if (!["APPROVE", "REJECT", "REVOKE"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be APPROVE, REJECT, or REVOKE." },
        { status: 400 }
      );
    }

    // 1. Handle Staff Department Registration Approval / Rejection
    if (type === "STAFF_REGISTRATION") {
      const emp = await Employee.findOne({ _id: requestId, companyId: owner._id });
      if (!emp) {
        return NextResponse.json({ error: "Staff request not found." }, { status: 404 });
      }

      if (action === "APPROVE") {
        const branchId = emp.branchId || "branch-1";
        const branch = (organization.branchList || []).find((b) => b.branchId === branchId);
        const branchCapacity = Number(branch?.staffCount || 0);

        if (branchCapacity > 0) {
          const activeStaff = await Employee.countDocuments({
            companyId: owner._id,
            branchId: branchId,
            approvalStatus: "APPROVED",
          });
          if (activeStaff >= branchCapacity) {
            return NextResponse.json(
              { error: `Cannot approve: Branch capacity of ${branchCapacity} positions reached.` },
              { status: 400 }
            );
          }
        }

        emp.approvalStatus = "APPROVED";
        emp.isApproved = true;
        emp.approvedAt = new Date();
        emp.approvedBy = owner._id;
        await emp.save();

        if (!owner.employees.includes(emp._id)) {
          owner.employees.push(emp._id);
          await owner.save();
        }

        return NextResponse.json({
          success: true,
          message: `${emp.name} has been approved for ${emp.department} department (${emp.postTitle || emp.postLevel})!`,
        });
      } else if (action === "REJECT") {
        const empName = emp.name;
        // User's strict rule: "if not then remove employee from databased they have to register"
        await Employee.findByIdAndDelete(requestId);
        owner.employees = (owner.employees || []).filter(
          (id) => id.toString() !== requestId.toString()
        );
        await owner.save();

        return NextResponse.json({
          success: true,
          message: `Staff registration for ${empName} was rejected and removed from database.`,
        });
      }
    }

    // 2. Handle PO / CA Access Requests
    const targetRequest = await ApprovalRequest.findOne({
      _id: requestId,
      organizationId: organization._id,
    });

    // If not found in ApprovalRequest, check if it's an employee
    if (!targetRequest) {
      const fallbackEmp = await Employee.findOne({ _id: requestId, companyId: owner._id });
      if (fallbackEmp) {
        if (action === "APPROVE") {
          fallbackEmp.approvalStatus = "APPROVED";
          fallbackEmp.isApproved = true;
          fallbackEmp.approvedAt = new Date();
          fallbackEmp.approvedBy = owner._id;
          await fallbackEmp.save();

          if (!owner.employees.includes(fallbackEmp._id)) {
            owner.employees.push(fallbackEmp._id);
            await owner.save();
          }

          return NextResponse.json({
            success: true,
            message: `${fallbackEmp.name} approved for ${fallbackEmp.department}!`,
          });
        } else if (action === "REJECT") {
          await Employee.findByIdAndDelete(requestId);
          owner.employees = (owner.employees || []).filter(
            (id) => id.toString() !== requestId.toString()
          );
          await owner.save();

          return NextResponse.json({
            success: true,
            message: `Staff registration for ${fallbackEmp.name} rejected and removed.`,
          });
        }
      }

      return NextResponse.json({ error: "Approval request not found." }, { status: 404 });
    }

    const newStatus =
      action === "APPROVE" ? "APPROVED" : action === "REJECT" ? "REJECTED" : "REVOKED";

    targetRequest.status = newStatus;
    targetRequest.decidedAt = new Date();
    targetRequest.decidedBy = owner.name || "Business Owner";
    if (decisionNotes) targetRequest.decisionNotes = decisionNotes.trim();

    await targetRequest.save();

    // If CA access was approved, update owner data sharing status
    if (targetRequest.type === "CA_DATA_ACCESS") {
      if (action === "APPROVE") {
        owner.dataSharingStatus = "CONNECTED";
        await owner.save();
      } else if (action === "REVOKE") {
        owner.dataSharingStatus = "REVOKED";
        await owner.save();
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: `Request successfully ${newStatus.toLowerCase()}!`,
        updatedRequest: targetRequest,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PATCH /api/owner/approvals error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update approval." },
      { status: 500 }
    );
  }
}

// POST /api/owner/approvals - Submit a new request (employee PO or CA access)
export async function POST(request) {
  try {
    const auth = await getAuthenticatedOwner();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { organization } = auth;
    const body = await request.json();
    const { type, poNumber, amount, vendorName, poDescription, requestedAccounts, requestReason } = body;

    const newReq = new ApprovalRequest({
      ownerId: organization.ownerId,
      organizationId: organization._id,
      type: type || "EMPLOYEE_PO",
      status: "PENDING",
      poNumber: poNumber?.trim(),
      amount: Number(amount) || 0,
      vendorName: vendorName?.trim(),
      poDescription: poDescription?.trim(),
      requestedAccounts: requestedAccounts || [],
      requestReason: requestReason?.trim(),
    });

    await newReq.save();

    return NextResponse.json(
      {
        success: true,
        message: "Approval request created successfully.",
        request: newReq,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/owner/approvals error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create approval request" },
      { status: 500 }
    );
  }
}
