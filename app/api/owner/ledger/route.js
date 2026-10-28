import { NextResponse } from "next/server";
import { getAuthenticatedOwner } from "@/lib/ownerAuth";
import connectDB from "@/lib/mongodb";
import JournalEntry from "@/models/JournalEntry";
import LedgerAccount from "@/models/LedgerAccount";
import {
  ensureChartOfAccounts,
  ensureOpeningBalanceJournal,
} from "@/lib/ledgerEngine";

/**
 * GET /api/owner/ledger
 * Returns chart of accounts and all posted journal entries
 */
export async function GET(request) {
  try {
    const auth = await getAuthenticatedOwner();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { organization } = auth;
    await connectDB();

    // Ensure chart of accounts and starting opening balance journal exist
    const accounts = await ensureChartOfAccounts(organization._id, organization);
    await ensureOpeningBalanceJournal(organization._id, organization);

    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branchId") || "all";
    const entryType = searchParams.get("entryType");

    const query = {
      organizationId: organization._id,
      status: "POSTED",
    };

    if (branchId !== "all") {
      query.branchId = branchId;
    }

    if (entryType) {
      query.entryType = entryType;
    }

    const entries = await JournalEntry.find(query)
      .sort({ date: -1, createdAt: -1 })
      .limit(100);

    // Calculate aggregated balances for accounts
    const accountBalances = await JournalEntry.aggregate([
      { $match: { organizationId: organization._id, status: "POSTED" } },
      { $unwind: "$lines" },
      {
        $group: {
          _id: "$lines.accountId",
          code: { $first: "$lines.accountCode" },
          totalDebit: { $sum: "$lines.debit" },
          totalCredit: { $sum: "$lines.credit" },
        },
      },
    ]);

    const balanceMap = {};
    accountBalances.forEach((b) => {
      balanceMap[b._id.toString()] = {
        totalDebit: b.totalDebit,
        totalCredit: b.totalCredit,
      };
    });

    const accountsWithBalances = accounts.map((acc) => {
      const b = balanceMap[acc._id.toString()] || { totalDebit: 0, totalCredit: 0 };
      let net = 0;
      if (acc.normalBalance === "DEBIT") {
        net = b.totalDebit - b.totalCredit;
      } else {
        net = b.totalCredit - b.totalDebit;
      }

      return {
        _id: acc._id,
        code: acc.code,
        name: acc.name,
        type: acc.type,
        subCategory: acc.subCategory,
        normalBalance: acc.normalBalance,
        totalDebit: b.totalDebit,
        totalCredit: b.totalCredit,
        currentBalance: Math.round(net * 100) / 100,
      };
    });

    return NextResponse.json({
      success: true,
      accounts: accountsWithBalances,
      entries,
    });
  } catch (err) {
    console.error("GET /api/owner/ledger error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/owner/ledger
 * Creates a new double-entry journal entry with strict pre-save validation
 */
export async function POST(request) {
  try {
    const auth = await getAuthenticatedOwner();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { organization, owner } = auth;
    await connectDB();

    const body = await request.json();
    const {
      date,
      narration,
      entryType = "MANUAL",
      reference = "",
      branchId = "all",
      lines = [],
    } = body;

    if (!narration || !narration.trim()) {
      return NextResponse.json(
        { error: "Voucher narration / memo is required." },
        { status: 400 }
      );
    }

    if (!Array.isArray(lines) || lines.length < 2) {
      return NextResponse.json(
        { error: "A double-entry voucher must have at least 2 lines (Debit & Credit)." },
        { status: 400 }
      );
    }

    // Generate unique sequential entry number
    const count = await JournalEntry.countDocuments({ organizationId: organization._id });
    const entryNumber = `JE-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    // Verify account details for each line
    const accounts = await LedgerAccount.find({ organizationId: organization._id });
    const accMap = new Map();
    accounts.forEach((a) => {
      accMap.set(a._id.toString(), a);
      accMap.set(a.code, a);
    });

    const validatedLines = lines.map((l) => {
      const acc = accMap.get(l.accountId) || accMap.get(l.accountCode);
      if (!acc) {
        throw new Error(`Invalid account specified: ${l.accountId || l.accountCode}`);
      }

      return {
        accountId: acc._id,
        accountCode: acc.code,
        accountName: acc.name,
        accountType: acc.type,
        subCategory: acc.subCategory,
        debit: Math.max(0, Number(l.debit) || 0),
        credit: Math.max(0, Number(l.credit) || 0),
        description: l.description || "",
      };
    });

    const newEntry = new JournalEntry({
      organizationId: organization._id,
      entryNumber,
      date: date ? new Date(date) : new Date(),
      branchId,
      entryType,
      reference,
      narration: narration.trim(),
      lines: validatedLines,
      status: "POSTED",
      createdBy: owner?.name || "Business Owner",
    });

    await newEntry.save();

    return NextResponse.json({
      success: true,
      message: "Journal voucher posted successfully to ledger.",
      entry: newEntry,
    });
  } catch (err) {
    console.error("POST /api/owner/ledger error:", err);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
