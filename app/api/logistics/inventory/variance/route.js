import { NextResponse } from "next/server";
import { withRouteMiddleware, parseRequestBody, parseRequestQuery } from "@/lib/routeMiddleware";
import CycleCountVariance from "@/models/CycleCountVariance";
import WarehouseBin from "@/models/WarehouseBin";
import { getHierarchyRank } from "@/lib/hierarchy";

export const dynamic = "force-dynamic";

/**
 * GET /api/logistics/inventory/variance
 * Fetches cycle count variance records for supervisor audit reconciliation.
 * Strict RBAC: Requires Tier 4 (Supervisor) clearance or above.
 */
async function getInventoryVarianceHandler(request) {
  try {
    const employee = request.employee;
    const rank = getHierarchyRank(employee?.postLevel);

    if (rank < 4) {
      return NextResponse.json(
        {
          success: false,
          error: `Forbidden: Inventory Cycle Count Variance and Stock Audits require Tier 4 (Supervisor) clearance. Current post: ${employee?.postLevel}`,
        },
        { status: 403 }
      );
    }

    const companyId = employee?.companyId || employee?.ownerId;
    const query = parseRequestQuery(request);

    const filter = { companyId };
    if (query.status) {
      filter.reconciliationStatus = query.status.toUpperCase();
    }
    if (query.bin) {
      filter.binLocation = query.bin.trim().toUpperCase();
    }

    const records = await CycleCountVariance.find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({
      success: true,
      count: records.length,
      variances: records.map((v) => ({
        id: v._id,
        auditCode: v.auditCode,
        binLocation: v.binLocation,
        skuCode: v.skuCode,
        itemDescription: v.itemDescription,
        systemRecordedQty: v.systemRecordedQty,
        physicalCountedQty: v.physicalCountedQty,
        varianceQty: v.varianceQty,
        variancePercentage: v.variancePercentage,
        uom: v.uom,
        unitCost: v.unitCost,
        varianceValue: v.varianceValue,
        discrepancyReason: v.discrepancyReason,
        reconciliationStatus: v.reconciliationStatus,
        supervisorNotes: v.supervisorNotes,
        auditedByName: v.auditedByName,
        createdAt: v.createdAt,
      })),
    });
  } catch (error) {
    console.error("[API Get Inventory Variance Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch cycle count variances." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/logistics/inventory/variance
 * Logs a new cycle count audit or submits a stock adjustment request.
 */
async function postInventoryVarianceHandler(request) {
  try {
    const employee = request.employee;
    const rank = getHierarchyRank(employee?.postLevel);

    if (rank < 4) {
      return NextResponse.json(
        {
          success: false,
          error: `Forbidden: Cycle Count Audit submission requires Tier 4 (Supervisor) clearance.`,
        },
        { status: 403 }
      );
    }

    const body = await parseRequestBody(request);
    const {
      binLocation = "Bin A-01",
      skuCode = "SKU-HDPE-01",
      itemDescription = "HDPE Polymer Granules",
      systemRecordedQty = 100,
      physicalCountedQty = 92,
      uom = "KG",
      unitCost = 85,
      discrepancyReason = "MISPLACED_BIN",
      reconciliationStatus = "ADJUSTMENT_REQUESTED",
      supervisorNotes = "Cycle count audit discrepancy noted. Adjustment requested to reconcile book inventory with floor tare.",
    } = body;

    const companyId = employee?.companyId || employee?.ownerId;
    const organizationId = request.organization?._id;

    const sysQty = Number(systemRecordedQty) || 0;
    const physQty = Number(physicalCountedQty) || 0;
    const diff = physQty - sysQty;
    const cost = Number(unitCost) || 0;
    const varianceVal = Number((diff * cost).toFixed(2));
    const variancePct = sysQty > 0 ? Number(((diff / sysQty) * 100).toFixed(2)) : 0;

    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const auditCode = `CC-${new Date().getFullYear()}-${randSuffix}`;

    const record = await CycleCountVariance.create({
      auditCode,
      binLocation: String(binLocation).trim().toUpperCase(),
      skuCode: String(skuCode).trim(),
      itemDescription: String(itemDescription).trim(),
      systemRecordedQty: sysQty,
      physicalCountedQty: physQty,
      varianceQty: diff,
      variancePercentage: variancePct,
      uom,
      unitCost: cost,
      varianceValue: varianceVal,
      discrepancyReason,
      reconciliationStatus,
      supervisorNotes,
      auditedBy: employee?._id,
      auditedByName: employee?.name || "Logistics Supervisor",
      companyId,
      organizationId,
      branchId: employee?.branchId || "branch-1",
    });

    // If reconciled/adjusted, sync with WarehouseBin
    if (reconciliationStatus === "ADJUSTMENT_APPROVED" || reconciliationStatus === "RECONCILED") {
      await WarehouseBin.findOneAndUpdate(
        { bin: String(binLocation).trim().toUpperCase(), companyId },
        {
          qty: physQty,
          status: physQty > 0 ? "AVAILABLE" : "HOLD",
          supervisorNotes: `Cycle count reconciled to ${physQty} ${uom} under Audit #${auditCode}`,
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Cycle Count Audit #${auditCode} logged for ${binLocation}. Variance of ${diff} ${uom} (₹${varianceVal}) submitted for reconciliation.`,
      variance: record,
    });
  } catch (error) {
    console.error("[API Post Inventory Variance Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to record cycle count audit." },
      { status: 500 }
    );
  }
}

export const GET = withRouteMiddleware(getInventoryVarianceHandler, {
  roles: ["EMPLOYEE"],
  allowedDepartments: ["LOGISTICS"],
  requireApproved: true,
});

export const POST = withRouteMiddleware(postInventoryVarianceHandler, {
  roles: ["EMPLOYEE"],
  allowedDepartments: ["LOGISTICS"],
  requireApproved: true,
});
