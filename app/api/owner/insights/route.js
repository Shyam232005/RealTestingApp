import { NextResponse } from "next/server";
import { getAuthenticatedOwner } from "@/lib/ownerAuth";
import connectDB from "@/lib/mongodb";
import {
  ensureChartOfAccounts,
  ensureOpeningBalanceJournal,
  generateBusinessInsights,
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

    const insights = await generateBusinessInsights(organization._id, organization);

    return NextResponse.json({
      success: true,
      insights,
    });
  } catch (err) {
    console.error("GET /api/owner/insights error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
