import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";
import Owner from "@/models/Owner";
import Organization from "@/models/Organization";
import Transaction from "@/models/Transaction";

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

  return { owner, decoded };
}

// POST /api/owner/branches/[branchId]/funds - Owner allots operational cash/bank budget to branch
export async function POST(request, { params }) {
  try {
    const auth = await getAuthenticatedOwner();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { branchId } = await params;
    const body = await request.json();
    const { amount, source = "Bank", notes } = body;

    const allotmentAmount = Number(amount);
    if (isNaN(allotmentAmount) || allotmentAmount <= 0) {
      return NextResponse.json(
        { error: "Please enter a valid fund allotment amount." },
        { status: 400 }
      );
    }

    const organization = await Organization.findOne({ ownerId: auth.owner._id });
    if (!organization) {
      return NextResponse.json({ error: "Organization not found." }, { status: 404 });
    }

    const branchIndex = (organization.branchList || []).findIndex(
      (b) => b.branchId === branchId
    );

    if (branchIndex === -1) {
      return NextResponse.json({ error: "Branch not found." }, { status: 404 });
    }

    // Update allocatedFunds
    const currentFunds = Number(organization.branchList[branchIndex].allocatedFunds || 0);
    organization.branchList[branchIndex].allocatedFunds = currentFunds + allotmentAmount;
    await organization.save();

    // Permanent ledger entry
    try {
      await Transaction.create({
        ownerId: auth.owner._id,
        organizationId: organization._id,
        description: `Operational Fund Allotment to ${organization.branchList[branchIndex].name}${notes ? ` - ${notes}` : ""}`,
        amount: allotmentAmount,
        type: "CREDIT",
        accountType: source === "Cash" ? "Cash" : "Commercial Bank",
        category: "Operational Fund Transfer",
        referenceNumber: `FND-${Date.now().toString().slice(-6)}`,
        status: "COMPLETED",
        branchId: branchId,
        date: new Date(),
      });
    } catch (e) {
      console.warn("Could not write transaction log:", e);
    }

    return NextResponse.json(
      {
        message: `₹${allotmentAmount.toLocaleString("en-IN")} allocated to ${organization.branchList[branchIndex].name} successfully!`,
        allocatedFunds: organization.branchList[branchIndex].allocatedFunds,
        branch: organization.branchList[branchIndex],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/owner/branches/[branchId]/funds error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
