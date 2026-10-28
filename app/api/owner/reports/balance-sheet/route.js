import { NextResponse } from "next/server";
import { getAuthenticatedOwner } from "@/lib/ownerAuth";
import connectDB from "@/lib/mongodb";
import {
  ensureChartOfAccounts,
  ensureOpeningBalanceJournal,
  generateBalanceSheet,
} from "@/lib/ledgerEngine";

export async function GET(request) {
  try {
    const auth = await getAuthenticatedOwner();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { organization } = auth;
    await connectDB();

    await ensureChartOfAccounts(organization._id, organization);
    await ensureOpeningBalanceJournal(organization._id, organization);

    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branchId") || "all";
    const asOfDate = searchParams.get("asOfDate");

    const report = await generateBalanceSheet(organization._id, {
      branchId,
      asOfDate,
    });

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (err) {
    console.error("GET /api/owner/reports/balance-sheet error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
