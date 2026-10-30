import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import CA from "@/models/CA";

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, role, clientFirmId, reportType = "Statutory Balance Sheet & Tax Audit" } = body;

    // RBAC Security Check
    if (action === "apply_stamp") {
      if (role !== "CA_PARTNER") {
        return NextResponse.json(
          {
            success: false,
            error: "RBAC Access Denied: Only CA_PARTNER role is authorized to apply digital audit stamps and certify statutory reports.",
            code: "FORBIDDEN_STAFF_ROLE",
          },
          { status: 403 }
        );
      }

      await connectDB();
      const caDoc = await CA.findOne().sort({ updatedAt: -1 });

      // Generate statutory UDIN (Unique Document Identification Number) conforming to ICAI rules
      // Format: [YY][Membership No 6-digits][Certificate Identifier 6-chars][Audit Seq 4-digits]
      const yearPrefix = new Date().getFullYear().toString().slice(-2);
      const mNo = (caDoc?.icaiNumber || "048912").replace(/\D/g, "").padStart(6, "0").slice(-6);
      const randHex = Math.random().toString(36).substring(2, 8).toUpperCase();
      const randSeq = Math.floor(1000 + Math.random() * 9000);
      const udin = `${yearPrefix}${mNo}${randHex}${randSeq}`;

      return NextResponse.json({
        success: true,
        status: "AUDIT_CERTIFIED_AND_STAMPED",
        message: "Digital audit stamp applied and statutory report certified.",
        auditRecord: {
          udin,
          stampedAt: new Date().toISOString(),
          certifiedBy: caDoc?.partnerName || "CA Rajesh K. Singhal (FCA)",
          firmName: caDoc?.firmName || "Singhal & Associates, Chartered Accountants",
          icaiNumber: caDoc?.icaiNumber || "FCA-048912",
          stampSvg: caDoc?.digitalStampUrl || "",
          reportType,
        },
      });
    }

    if (action === "submit_to_partner") {
      // Allowed for CA_STAFF
      return NextResponse.json({
        success: true,
        status: "SUBMITTED_TO_PARTNER",
        message: "Ledger report submitted to CA Partner queue for final review and statutory stamping.",
        submittedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({ error: "Invalid action specified." }, { status: 400 });
  } catch (err) {
    console.error("POST /api/ca/sign-off error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
