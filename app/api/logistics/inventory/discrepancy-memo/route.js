import { NextResponse } from "next/server";
import { withRouteMiddleware, parseRequestBody, parseRequestQuery } from "@/lib/routeMiddleware";
import DiscrepancyMemo from "@/models/DiscrepancyMemo";
import QuarantineLog from "@/models/QuarantineLog";
import { getHierarchyRank } from "@/lib/hierarchy";

export const dynamic = "force-dynamic";

/**
 * POST /api/logistics/inventory/discrepancy-memo
 * Adjudicates flagged damaged stock and generates official vendor debit note Discrepancy Memos.
 * Formally locks damaged cartons in the high-security system quarantine cage.
 * Strict RBAC: Requires Tier 4 (Supervisor) clearance or above.
 */
async function postDiscrepancyMemoHandler(request) {
  try {
    const employee = request.employee;
    const rank = getHierarchyRank(employee?.postLevel);

    if (rank < 4) {
      return NextResponse.json(
        {
          success: false,
          error: `Forbidden: Quarantine Adjudication and Discrepancy Memo generation requires Tier 4 (Supervisor) clearance. Current post: ${employee?.postLevel}`,
        },
        { status: 403 }
      );
    }

    const body = await parseRequestBody(request);
    const {
      quarantineLogId,
      cartonId,
      skuCode = "SKU-DEFECT",
      itemDescription,
      batchLotNumber = "BATCH-DOCK",
      quantity = 1,
      uom = "Units",
      vendorName = "Vendor / Supplier",
      vendorGstin = "",
      referencePoNumber = "",
      referenceLrNumber = "",
      discrepancyType = "CRUSHED_CARTON",
      severity = "HIGH",
      quarantineCageLocation = "Quarantine Cage Q-Locked-01 (High Security)",
      vendorDebitNoteRequested = true,
      estimatedLossAmount = 0,
      damageAssessmentNotes = "",
    } = body;

    if (!cartonId || !itemDescription) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation Failure: Carton ID and Item Description are mandatory for Discrepancy Memos.",
        },
        { status: 400 }
      );
    }

    const companyId = employee?.companyId || employee?.ownerId;
    const organizationId = request.organization?._id;
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const memoNumber = `MEMO-DISC-${new Date().getFullYear()}-${randSuffix}`;

    // Create the Discrepancy Memo
    const memo = await DiscrepancyMemo.create({
      memoNumber,
      quarantineLogId: quarantineLogId || null,
      cartonId: String(cartonId).toUpperCase(),
      skuCode,
      itemDescription,
      batchLotNumber,
      quantity: Number(quantity) || 1,
      uom,
      vendorName,
      vendorGstin,
      referencePoNumber,
      referenceLrNumber,
      discrepancyType,
      severity,
      quarantineCageLocation,
      vendorDebitNoteRequested: !!vendorDebitNoteRequested,
      estimatedLossAmount: Number(estimatedLossAmount) || 0,
      damageAssessmentNotes,
      authorizedBy: employee?._id,
      authorizedByName: employee?.name || "Logistics Supervisor",
      status: "LOCKED_IN_QUARANTINE",
      companyId,
      organizationId,
      branchId: employee?.branchId || "branch-1",
    });

    // Update QuarantineLog if referenced
    if (cartonId) {
      await QuarantineLog.updateMany(
        { cartonId: String(cartonId).toUpperCase(), companyId },
        {
          status: "SCRAPPED",
          notes: `Adjudicated under Memo #${memoNumber}. Locked in ${quarantineCageLocation}. Debit note requested.`,
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Discrepancy Memo #${memoNumber} generated successfully. Stock officially locked in ${quarantineCageLocation} for vendor debit note processing.`,
      memo,
    });
  } catch (error) {
    console.error("[API Discrepancy Memo Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate Discrepancy Memo." },
      { status: 500 }
    );
  }
}

/**
 * GET /api/logistics/inventory/discrepancy-memo
 * Fetches discrepancy memos for the supervisor quarantine desk.
 */
async function getDiscrepancyMemosHandler(request) {
  try {
    const employee = request.employee;
    const companyId = employee?.companyId || employee?.ownerId;
    const query = parseRequestQuery(request);

    const filter = { companyId };
    if (query.status) {
      filter.status = query.status.toUpperCase();
    }

    const memos = await DiscrepancyMemo.find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({
      success: true,
      count: memos.length,
      memos: memos.map((m) => ({
        id: m._id,
        memoNumber: m.memoNumber,
        cartonId: m.cartonId,
        skuCode: m.skuCode,
        itemDescription: m.itemDescription,
        batchLotNumber: m.batchLotNumber,
        quantity: m.quantity,
        uom: m.uom,
        vendorName: m.vendorName,
        vendorGstin: m.vendorGstin,
        referencePoNumber: m.referencePoNumber,
        discrepancyType: m.discrepancyType,
        severity: m.severity,
        quarantineCageLocation: m.quarantineCageLocation,
        vendorDebitNoteRequested: m.vendorDebitNoteRequested,
        estimatedLossAmount: m.estimatedLossAmount,
        damageAssessmentNotes: m.damageAssessmentNotes,
        authorizedByName: m.authorizedByName,
        status: m.status,
        createdAt: m.createdAt,
      })),
    });
  } catch (error) {
    console.error("[API Get Discrepancy Memos Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch Discrepancy Memos." },
      { status: 500 }
    );
  }
}

export const POST = withRouteMiddleware(postDiscrepancyMemoHandler, {
  roles: ["EMPLOYEE"],
  allowedDepartments: ["LOGISTICS"],
  requireApproved: true,
});

export const GET = withRouteMiddleware(getDiscrepancyMemosHandler, {
  roles: ["EMPLOYEE"],
  allowedDepartments: ["LOGISTICS"],
  requireApproved: true,
});
