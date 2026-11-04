import { NextResponse } from "next/server";
import { withRouteMiddleware, parseRequestBody, parseRequestQuery } from "@/lib/routeMiddleware";
import PurchaseOrder from "@/models/PurchaseOrder";
import { getHierarchyRank } from "@/lib/hierarchy";

export const dynamic = "force-dynamic";

/**
 * POST /api/logistics/procurement/purchase-orders
 * Generates and approves Vendor Purchase Orders (PO) and Advanced Shipping Notices (ASN).
 * Manages dock appointment slots to prevent demurrage charges.
 * Strict RBAC: Requires Tier 2 (Coordinator) clearance or above.
 */
async function postPurchaseOrderHandler(request) {
  try {
    const employee = request.employee;
    const rank = getHierarchyRank(employee?.postLevel);

    // Strict Tier 2 Clearance Enforcement
    if (rank < 2) {
      return NextResponse.json(
        {
          success: false,
          error: `Forbidden: Purchase Order Generation and Dock Appointment approval requires Tier 2 (Coordinator) clearance. Current level: ${employee?.postLevel}`,
        },
        { status: 403 }
      );
    }

    const body = await parseRequestBody(request);
    const {
      vendorName,
      vendorGstin = "27AABCV1234Q1Z2",
      vendorAddress = "Industrial Supplier Hub",
      materialDescription,
      items = [],
      quantity = 1,
      unitPrice = 0,
      totalCost = 0,
      expectedDeliveryDate,
      dockAppointmentSlot = "Bay 1 (Morning 09:00 - 12:00)",
      isMultiYearContract = false,
      contractTenureYears = 1,
    } = body;

    if (!vendorName || (!materialDescription && items.length === 0)) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation Failure: Vendor Name and Material Description/Line items are required.",
        },
        { status: 400 }
      );
    }

    const companyId = employee?.companyId || employee?.ownerId;
    const organizationId = request.organization?._id;
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const poNumber = `PO-CRW-${new Date().getFullYear()}-${randSuffix}`;
    const asnNumber = `ASN-${new Date().getFullYear()}-${randSuffix + 100}`;

    // Normalize Line Items
    const lineItems = items.length > 0
      ? items.map((it) => ({
          skuCode: it.skuCode || `SKU-MAT-${randSuffix}`,
          description: it.description || it.name || materialDescription,
          quantity: Number(it.quantity) || 1,
          uom: it.uom || "KG",
          unitPrice: Number(it.unitPrice) || 0,
          lineTotal: Number(it.lineTotal) || (Number(it.quantity) || 1) * (Number(it.unitPrice) || 0),
        }))
      : [
          {
            skuCode: `SKU-MAT-${randSuffix}`,
            description: materialDescription,
            quantity: Number(quantity) || 1,
            uom: "KG",
            unitPrice: Number(unitPrice) || 0,
            lineTotal: Number(totalCost) || (Number(quantity) || 1) * (Number(unitPrice) || 0),
          },
        ];

    const finalTotalCost = Number(totalCost) || lineItems.reduce((sum, it) => sum + it.lineTotal, 0);

    const newPo = await PurchaseOrder.create({
      poNumber,
      asnNumber,
      vendorName: String(vendorName).trim(),
      vendorGstin: String(vendorGstin).trim(),
      vendorAddress: String(vendorAddress).trim(),
      items: lineItems,
      totalCost: finalTotalCost,
      expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : new Date(Date.now() + 7 * 86400000),
      dockAppointmentSlot,
      dockStatus: "SCHEDULED",
      status: "APPROVED_BY_COORDINATOR",
      isMultiYearContract: Boolean(isMultiYearContract),
      contractTenureYears: Number(contractTenureYears) || 1,
      createdBy: employee?._id,
      createdByName: employee?.name || "Logistics Coordinator",
      companyId,
      organizationId,
      branchId: employee?.branchId || "branch-1",
    });

    return NextResponse.json({
      success: true,
      message: `Purchase Order ${poNumber} generated and approved with Advanced Shipping Notice ${asnNumber}. Dock slot locked at ${dockAppointmentSlot}.`,
      purchaseOrder: newPo,
    });
  } catch (error) {
    console.error("[API Create Purchase Order Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create Purchase Order." },
      { status: 500 }
    );
  }
}

/**
 * GET /api/logistics/procurement/purchase-orders
 * Fetches vendor POs, ASNs, dock schedule timeline, and Director sign-off metadata.
 */
async function getPurchaseOrdersHandler(request) {
  try {
    const employee = request.employee;
    const companyId = employee?.companyId || employee?.ownerId;
    const query = parseRequestQuery(request);

    const filter = { companyId };
    if (query.status) {
      filter.status = query.status.toUpperCase();
    }

    const pos = await PurchaseOrder.find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({
      success: true,
      count: pos.length,
      purchaseOrders: pos.map((p) => ({
        id: p._id,
        poNumber: p.poNumber,
        asnNumber: p.asnNumber,
        vendorName: p.vendorName,
        vendorGstin: p.vendorGstin,
        itemsCount: p.items?.length || 0,
        itemsSummary: p.items?.map((i) => `${i.description} (${i.quantity} ${i.uom})`).join(", ") || "",
        totalCost: p.totalCost,
        expectedDeliveryDate: p.expectedDeliveryDate ? p.expectedDeliveryDate.toISOString().split("T")[0] : "",
        dockAppointmentSlot: p.dockAppointmentSlot,
        dockStatus: p.dockStatus,
        status: p.status,
        directorSignOff: Boolean(p.directorSignOff),
        directorSignOffByName: p.directorSignOffByName || "",
        directorSignOffAt: p.directorSignOffAt,
        directorNotes: p.directorNotes || "",
        isMultiYearContract: Boolean(p.isMultiYearContract),
        contractTenureYears: p.contractTenureYears || 1,
        createdByName: p.createdByName,
        createdAt: p.createdAt,
      })),
    });
  } catch (error) {
    console.error("[API Get Purchase Orders Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch Purchase Orders." },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/logistics/procurement/purchase-orders
 * Supreme executive sign-off for high-value Purchase Orders (> ₹500,000) and multi-year vendor contracts.
 * Strict RBAC: Requires Tier 5 (Manager) or Tier 6 (Director) clearance.
 */
async function putPurchaseOrderHandler(request) {
  try {
    const employee = request.employee;
    const rank = getHierarchyRank(employee?.postLevel);

    if (rank < 5 && request.role !== "OWNER") {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden: Executive PO sign-off requires Tier 5 (Manager) or Tier 6 (Director) clearance.",
        },
        { status: 403 }
      );
    }

    const body = await parseRequestBody(request);
    const {
      poId,
      action = "DIRECTOR_SIGN_OFF", // "DIRECTOR_SIGN_OFF" | "APPROVE_MULTI_YEAR" | "REJECT"
      directorNotes = "Supreme executive sign-off granted by Director of Logistics.",
      isMultiYearContract = false,
      contractTenureYears = 2,
    } = body;

    if (!poId) {
      return NextResponse.json(
        { success: false, error: "Validation Failure: Purchase Order ID is required." },
        { status: 400 }
      );
    }

    const companyId = employee?.companyId || employee?.ownerId;
    const po = await PurchaseOrder.findOne({ _id: poId, companyId });
    if (!po) {
      return NextResponse.json(
        { success: false, error: "Purchase Order not found." },
        { status: 404 }
      );
    }

    // High-value POs exceeding ₹500,000 require Tier 6 (Director) clearance
    if (po.totalCost >= 500000 && rank < 6 && request.role !== "OWNER") {
      return NextResponse.json(
        {
          success: false,
          error: `Clearance Denied: Purchase Order value (₹${po.totalCost.toLocaleString("en-IN")}) exceeds Manager limit and strictly requires supreme sign-off from Director of Logistics (Tier 6).`,
        },
        { status: 403 }
      );
    }

    const targetStatus = action === "REJECT" ? "CANCELLED" : "DIRECTOR_APPROVED";

    const updatedPo = await PurchaseOrder.findOneAndUpdate(
      { _id: poId, companyId },
      {
        $set: {
          status: targetStatus,
          directorSignOff: action !== "REJECT",
          directorSignOffByName: employee?.name || "Director of Logistics",
          directorSignOffAt: new Date(),
          directorNotes: `${directorNotes} [Signed by ${employee?.name || "Executive"}]`,
          ...(isMultiYearContract ? { isMultiYearContract: true, contractTenureYears: Number(contractTenureYears) } : {}),
        },
      },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      message: `Purchase Order ${updatedPo.poNumber} status updated to ${targetStatus}.`,
      action,
      purchaseOrder: updatedPo,
    });
  } catch (error) {
    console.error("[API Put Purchase Order Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update Purchase Order." },
      { status: 500 }
    );
  }
}

export const POST = withRouteMiddleware(postPurchaseOrderHandler, {
  roles: ["EMPLOYEE"],
  allowedDepartments: ["LOGISTICS"],
  requireApproved: true,
});

export const GET = withRouteMiddleware(getPurchaseOrdersHandler, {
  roles: ["EMPLOYEE"],
  allowedDepartments: ["LOGISTICS"],
  requireApproved: true,
});

export const PUT = withRouteMiddleware(putPurchaseOrderHandler, {
  roles: ["EMPLOYEE"],
  allowedDepartments: ["LOGISTICS"],
  requireApproved: true,
});
