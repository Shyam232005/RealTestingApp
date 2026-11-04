import { NextResponse } from "next/server";
import { withRouteMiddleware, parseRequestBody, parseRequestQuery } from "@/lib/routeMiddleware";
import FreightAuditLog from "@/models/FreightAuditLog";
import { getHierarchyRank } from "@/lib/hierarchy";

/**
 * GET /api/logistics/freight/audit
 * Fetches carrier freight bills vs. actual volumetric weights for billing pre-audit.
 * Maximum 5% variance tolerance allowed for Coordinator approval.
 * Strict RBAC: Requires Tier 2 (Coordinator) clearance or above.
 */
async function getFreightAuditHandler(request) {
  try {
    const employee = request.employee;
    const rank = getHierarchyRank(employee?.postLevel);

    if (rank < 2) {
      return NextResponse.json(
        {
          success: false,
          error: `Forbidden: Freight Billing Pre-Audit requires Tier 2 (Coordinator) clearance. Current level: ${employee?.postLevel}`,
        },
        { status: 403 }
      );
    }

    const companyId = employee?.companyId || employee?.ownerId;
    const query = parseRequestQuery(request);

    const filter = { companyId };
    if (query.auditStatus) {
      filter.auditStatus = query.auditStatus;
    }

    const audits = await FreightAuditLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({
      success: true,
      count: audits.length,
      audits: audits.map((a) => ({
        id: a._id,
        invoiceNumber: a.invoiceNumber,
        awbNumber: a.awbNumber,
        orderReference: a.orderReference,
        carrier: a.carrier,
        destinationZone: a.destinationZone,
        actualWeightKg: a.actualWeightKg,
        billedWeightKg: a.billedWeightKg,
        variancePercent: a.variancePercent,
        billedAmount: a.billedAmount,
        expectedAmount: a.expectedAmount,
        differenceAmount: a.differenceAmount,
        auditStatus: a.auditStatus,
        disputeReason: a.disputeReason,
        auditedByName: a.auditedByName,
        createdAt: a.createdAt,
      })),
    });
  } catch (error) {
    console.error("[API Get Freight Audit Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch freight audit records." },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/logistics/freight/audit
 * Approves freight invoice within 5% tolerance or logs formal dispute if variance exceeds 5%.
 */
async function putFreightAuditHandler(request) {
  try {
    const employee = request.employee;
    const rank = getHierarchyRank(employee?.postLevel);

    if (rank < 2) {
      return NextResponse.json(
        {
          success: false,
          error: `Forbidden: Freight Audit sign-off requires Tier 2 (Coordinator) clearance. Current level: ${employee?.postLevel}`,
        },
        { status: 403 }
      );
    }

    const body = await parseRequestBody(request);
    const {
      invoiceNumber,
      awbNumber,
      orderReference = "",
      carrier = "BlueDart Express",
      destinationZone = "Zone North",
      actualWeightKg = 20,
      billedWeightKg = 21,
      ratePerKg = 60,
      disputeReason = "",
    } = body;

    if (!invoiceNumber || !awbNumber) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation Failure: Both invoiceNumber and awbNumber are required.",
        },
        { status: 400 }
      );
    }

    const companyId = employee?.companyId || employee?.ownerId;
    const organizationId = request.organization?._id;

    const actual = Math.max(0.1, Number(actualWeightKg));
    const billed = Math.max(0.1, Number(billedWeightKg));
    const rate = Math.max(1, Number(ratePerKg));

    const variancePercent = Number((((billed - actual) / actual) * 100).toFixed(2));
    const expectedAmount = Number((actual * rate).toFixed(2));
    const billedAmount = Number((billed * rate).toFixed(2));
    const differenceAmount = Number((billedAmount - expectedAmount).toFixed(2));

    // Strict 5% Variance Boundary Rule
    let auditStatus = "PENDING_AUDIT";
    let statusMessage = "";

    if (variancePercent <= 5.0 && variancePercent >= -5.0) {
      auditStatus = "APPROVED_WITHIN_TOLERANCE";
      statusMessage = `Pre-audit passed: Variance of ${variancePercent}% is within allowable 5.0% threshold. Freight bill approved.`;
    } else {
      auditStatus = "DISPUTED_OVER_5_PERCENT";
      statusMessage = `Pre-audit flagged: Variance of ${variancePercent}% exceeds 5.0% maximum allowable threshold. Dispute logged against ${carrier}.`;
    }

    const record = await FreightAuditLog.findOneAndUpdate(
      { invoiceNumber, awbNumber, companyId },
      {
        invoiceNumber,
        awbNumber,
        orderReference,
        carrier,
        destinationZone,
        actualWeightKg: actual,
        billedWeightKg: billed,
        variancePercent,
        billedAmount,
        expectedAmount,
        differenceAmount,
        auditStatus,
        disputeReason: disputeReason || (auditStatus === "DISPUTED_OVER_5_PERCENT" ? `Weight variance ${variancePercent}% exceeds 5% threshold.` : ""),
        auditedBy: employee?._id,
        auditedByName: employee?.name || "Logistics Coordinator",
        companyId,
        organizationId,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({
      success: true,
      message: statusMessage,
      auditRecord: record,
    });
  } catch (error) {
    console.error("[API Put Freight Audit Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update freight audit." },
      { status: 500 }
    );
  }
}

export const GET = withRouteMiddleware(getFreightAuditHandler, {
  roles: ["EMPLOYEE"],
  allowedDepartments: ["LOGISTICS"],
  requireApproved: true,
});

export const PUT = withRouteMiddleware(putFreightAuditHandler, {
  roles: ["EMPLOYEE"],
  allowedDepartments: ["LOGISTICS"],
  requireApproved: true,
});
