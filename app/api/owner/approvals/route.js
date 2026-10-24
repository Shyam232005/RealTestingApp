import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";
import Owner from "@/models/Owner";
import Organization from "@/models/Organization";
import ApprovalRequest from "@/models/ApprovalRequest";

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
  } catch (err) {
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

// GET /api/owner/approvals - Fetch all approval requests, CA data accesses, and report history
export async function GET() {
  try {
    const auth = await getAuthenticatedOwner();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { owner, organization } = auth;

    // Fetch real approval requests for this organization (starts in pure zero state)
    const allRequests = await ApprovalRequest.find({ organizationId: organization._id })
      .sort({ requestedAt: -1 })
      .lean();

    const pending = allRequests.filter((r) => r.status === "PENDING");
    const history = allRequests.filter((r) => r.status !== "PENDING");
    const caRequests = allRequests.filter((r) => r.type === "CA_DATA_ACCESS");
    const caReports = allRequests.filter((r) => r.hasReport && r.reportStatus === "SUBMITTED");

    return NextResponse.json(
      {
        success: true,
        all: allRequests,
        pending,
        history,
        caRequests,
        caReports,
        stats: {
          pendingCount: pending.length,
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
    const { requestId, action, decisionNotes } = body;

    if (!requestId) {
      return NextResponse.json({ error: "Request ID is required." }, { status: 400 });
    }

    if (!["APPROVE", "REJECT", "REVOKE"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be APPROVE, REJECT, or REVOKE." },
        { status: 400 }
      );
    }

    const targetRequest = await ApprovalRequest.findOne({
      _id: requestId,
      organizationId: organization._id,
    });

    if (!targetRequest) {
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

    const { owner, organization } = auth;
    const body = await request.json();

    const {
      type, // "CA_DATA_ACCESS" or "EMPLOYEE_PO"
      caName,
      caFirm,
      icaiNumber,
      caEmail,
      requestedAccounts,
      requestReason,
      employeeName,
      employeeRole,
      employeeDepartment,
      poNumber,
      amount,
      vendorName,
      poDescription,
    } = body;

    const newDoc = await ApprovalRequest.create({
      ownerId: owner._id,
      organizationId: organization._id,
      type: type || "EMPLOYEE_PO",
      status: "PENDING",
      caName,
      caFirm,
      icaiNumber,
      caEmail,
      requestedAccounts: requestedAccounts || ["General Ledger & Bank Statements"],
      requestReason,
      employeeName,
      employeeRole,
      employeeDepartment,
      poNumber: poNumber || `PO-${Date.now().toString().slice(-4)}`,
      amount: Number(amount || 0),
      vendorName,
      poDescription,
      requestedAt: new Date(),
    });

    return NextResponse.json(
      {
        success: true,
        message: "Approval request created successfully.",
        request: newDoc,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/owner/approvals error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create approval request." },
      { status: 500 }
    );
  }
}
