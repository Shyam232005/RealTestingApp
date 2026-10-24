import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";
import Owner from "@/models/Owner";
import Organization from "@/models/Organization";
import Transaction from "@/models/Transaction";

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

// GET /api/owner/banking/transactions
// Fetch live & historical permanent transactions, ensuring baseline opening records exist
export async function GET(request) {
  try {
    const auth = await getAuthenticatedOwner();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { owner, organization } = auth;
    const { searchParams } = new URL(request.url);
    const branchFilter = searchParams.get("branch") || "all";

    // Build query filter
    const query = { organizationId: organization._id };
    if (branchFilter && branchFilter !== "all") {
      query.$or = [{ branchId: branchFilter }, { branchId: "all" }];
    }

    // Fetch permanent transactions sorted newest first (starts at empty zero state)
    const transactions = await Transaction.find(query).sort({ date: -1 }).lean();

    // Compute live balances starting from setup baseline + real-time movements
    const allOrgTransactions = await Transaction.find({ organizationId: organization._id }).lean();

    let bankBalance = Number(organization.openingBalance || 0);
    let cashBalance = Number(organization.openingCash || 0);

    for (const txn of allOrgTransactions) {
      const amt = Number(txn.amount || 0);
      if (txn.accountType === "BANK") {
        if (txn.type === "CREDIT") bankBalance += amt;
        else if (txn.type === "DEBIT") bankBalance -= amt;
      } else if (txn.accountType === "CASH") {
        if (txn.type === "CREDIT") cashBalance += amt;
        else if (txn.type === "DEBIT") cashBalance -= amt;
      }
    }

    return NextResponse.json(
      {
        success: true,
        transactions,
        bankBalance: Math.max(0, bankBalance),
        cashBalance: Math.max(0, cashBalance),
        totalLiquidBalance: Math.max(0, bankBalance + cashBalance),
        organization: {
          BankName: organization.BankName,
          AccNo: organization.AccNo,
          IFSC: organization.IFSC,
          RegisterName: organization.RegisterName,
          GST: organization.GST,
          location: organization.location,
          minCashReserveAlert: organization.minCashReserveAlert,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/owner/banking/transactions error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}

// POST /api/owner/banking/transactions
// Create and permanently record a live transaction in the ledger
export async function POST(request) {
  try {
    const auth = await getAuthenticatedOwner();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { owner, organization } = auth;
    const body = await request.json();

    const {
      accountType, // "BANK" or "CASH"
      type, // "CREDIT" or "DEBIT"
      amount,
      title,
      category,
      paymentMethod,
      reference,
      notes,
      branchId,
    } = body;

    const numAmount = Number(amount);
    if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json(
        { error: "Please enter a valid transaction amount greater than ₹0." },
        { status: 400 }
      );
    }

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: "Transaction description / title is required." },
        { status: 400 }
      );
    }

    if (!["BANK", "CASH"].includes(accountType)) {
      return NextResponse.json(
        { error: "Account type must be either 'BANK' or 'CASH'." },
        { status: 400 }
      );
    }

    if (!["CREDIT", "DEBIT"].includes(type)) {
      return NextResponse.json(
        { error: "Transaction type must be 'CREDIT' (Inflow) or 'DEBIT' (Outflow)." },
        { status: 400 }
      );
    }

    // Compute current running balance for this account starting from setup baseline
    const pastTxns = await Transaction.find({
      organizationId: organization._id,
      accountType: accountType,
    }).lean();

    let currentBalance =
      accountType === "BANK"
        ? Number(organization.openingBalance || 0)
        : Number(organization.openingCash || 0);

    for (const t of pastTxns) {
      if (t.type === "CREDIT") currentBalance += Number(t.amount || 0);
      else if (t.type === "DEBIT") currentBalance -= Number(t.amount || 0);
    }

    const newRunningBalance =
      type === "CREDIT"
        ? currentBalance + numAmount
        : currentBalance - numAmount;

    // Generate unique reference if missing
    const refCode =
      reference && reference.trim()
        ? reference.trim().toUpperCase()
        : `TXN-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    const newTransaction = await Transaction.create({
      ownerId: owner._id,
      organizationId: organization._id,
      accountType,
      type,
      amount: numAmount,
      title: title.trim(),
      category: category ? category.trim() : "Operational",
      reference: refCode,
      paymentMethod: paymentMethod || (accountType === "CASH" ? "CASH" : "IMPS"),
      status: "COMPLETED",
      runningBalance: Math.max(0, newRunningBalance),
      notes: notes ? notes.trim() : "",
      branchId: branchId || "all",
      date: new Date(),
    });

    // Re-calculate updated balances starting from setup baseline
    const allTxns = await Transaction.find({ organizationId: organization._id }).lean();
    let bankBal = Number(organization.openingBalance || 0);
    let cashBal = Number(organization.openingCash || 0);
    for (const t of allTxns) {
      const a = Number(t.amount || 0);
      if (t.accountType === "BANK") {
        if (t.type === "CREDIT") bankBal += a;
        else if (t.type === "DEBIT") bankBal -= a;
      } else if (t.accountType === "CASH") {
        if (t.type === "CREDIT") cashBal += a;
        else if (t.type === "DEBIT") cashBal -= a;
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Transaction permanently recorded in banking ledger.",
        transaction: newTransaction,
        bankBalance: Math.max(0, bankBal),
        cashBalance: Math.max(0, cashBal),
        totalLiquidBalance: Math.max(0, bankBal + cashBal),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/owner/banking/transactions error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to record transaction." },
      { status: 500 }
    );
  }
}
