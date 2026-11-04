import { NextResponse } from "next/server";
import { withRouteMiddleware, parseRequestBody, parseRequestQuery } from "@/lib/routeMiddleware";
import QuarantineLog from "@/models/QuarantineLog";

/**
 * PUT /api/logistics/inventory/quarantine
 * Flags specific carton IDs as defective / crushed and moves them to quarantine hold.
 */
async function putQuarantineHandler(request) {
  try {
    const body = await parseRequestBody(request);
    const {
      cartonId,
      skuCode,
      itemDescription,
      batchLotNumber,
      quantity = 1,
      discrepancyType = "CRUSHED_CARTON",
      severity = "HIGH",
      quarantineBay = "Quarantine Bay Q-1 (Dock Hold)",
      notes = "",
    } = body;

    if (!cartonId || !itemDescription) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation Failure: Both cartonId and itemDescription are required to flag quarantine.",
        },
        { status: 400 }
      );
    }

    const employee = request.employee;
    const companyId = employee?.companyId || employee?.ownerId;
    const organizationId = request.organization?._id;
    const branchId = employee?.branchId || "branch-1";

    const cleanCartonId = String(cartonId).trim().toUpperCase();

    // Upsert or create new quarantine entry
    const record = await QuarantineLog.findOneAndUpdate(
      { cartonId: cleanCartonId, companyId },
      {
        cartonId: cleanCartonId,
        skuCode: skuCode || "SKU-DEFECT",
        itemDescription,
        batchLotNumber: batchLotNumber || "BATCH-QUARANTINE",
        quantity: Math.max(1, Number(quantity) || 1),
        discrepancyType,
        severity,
        quarantineBay,
        notes,
        status: "QUARANTINED",
        reportedBy: employee?._id,
        reportedByName: employee?.name || "Logistics Assistant",
        companyId,
        organizationId,
        branchId,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({
      success: true,
      message: `Carton #${cleanCartonId} successfully quarantined in ${quarantineBay}. Logged to discrepancy sheet.`,
      quarantineRecord: record,
    });
  } catch (error) {
    console.error("[API Quarantine Put Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update quarantine status." },
      { status: 500 }
    );
  }
}

/**
 * GET /api/logistics/inventory/quarantine
 * Retrieves active quarantine discrepancy records for this organization.
 */
async function getQuarantineHandler(request) {
  try {
    const employee = request.employee;
    const companyId = employee?.companyId || employee?.ownerId;
    const query = parseRequestQuery(request);

    const filter = { companyId };
    if (query.status) {
      filter.status = query.status.toUpperCase();
    }

    const records = await QuarantineLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({
      success: true,
      count: records.length,
      quarantinedItems: records.map((r) => ({
        id: r.cartonId,
        _id: r._id,
        cartonId: r.cartonId,
        skuCode: r.skuCode,
        itemDescription: r.itemDescription,
        batchLotNumber: r.batchLotNumber,
        quantity: r.quantity,
        discrepancyType: r.discrepancyType,
        severity: r.severity,
        quarantineBay: r.quarantineBay,
        notes: r.notes,
        status: r.status,
        reportedByName: r.reportedByName,
        createdAt: r.createdAt,
      })),
    });
  } catch (error) {
    console.error("[API Quarantine Get Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch quarantine discrepancy records." },
      { status: 500 }
    );
  }
}

export const PUT = withRouteMiddleware(putQuarantineHandler, {
  roles: ["EMPLOYEE"],
  allowedDepartments: ["LOGISTICS"],
  requireApproved: true,
});

export const GET = withRouteMiddleware(getQuarantineHandler, {
  roles: ["EMPLOYEE"],
  allowedDepartments: ["LOGISTICS"],
  requireApproved: true,
});
