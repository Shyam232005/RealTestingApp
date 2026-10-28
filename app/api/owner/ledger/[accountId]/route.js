import { NextResponse } from "next/server";
import { getAuthenticatedOwner } from "@/lib/ownerAuth";
import connectDB from "@/lib/mongodb";
import { getAccountLedger } from "@/lib/ledgerEngine";

export async function GET(request, { params }) {
  try {
    const auth = await getAuthenticatedOwner();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { organization } = auth;
    await connectDB();

    const { accountId } = await params;
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branchId") || "all";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const ledgerData = await getAccountLedger(organization._id, accountId, {
      branchId,
      startDate,
      endDate,
    });

    return NextResponse.json({
      success: true,
      ...ledgerData,
    });
  } catch (err) {
    console.error("GET /api/owner/ledger/[accountId] error:", err);
    return NextResponse.json({ error: err.message }, { status: 404 });
  }
}
