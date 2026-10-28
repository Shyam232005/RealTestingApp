import { NextResponse } from "next/server";
import { getAuthenticatedOwner } from "@/lib/ownerAuth";
import connectDB from "@/lib/mongodb";
import { generateInventoryReport } from "@/lib/ledgerEngine";

export async function GET(request) {
  try {
    const auth = await getAuthenticatedOwner();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { organization } = auth;
    await connectDB();

    const report = await generateInventoryReport(organization._id, organization);

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (err) {
    console.error("GET /api/owner/reports/inventory error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
