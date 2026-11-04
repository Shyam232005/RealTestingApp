import { NextResponse } from "next/server";
import { withRouteMiddleware, parseRequestBody, parseRequestQuery } from "@/lib/routeMiddleware";
import DispatchLog from "@/models/DispatchLog";
import SalesOrder from "@/models/SalesOrder";

export const dynamic = "force-dynamic";

/**
 * PUT /api/logistics/outbound/pack-stage
 * Updates order status to packed/staged in designated staging bays.
 * Logs document collation timestamps (enforcing Tax Invoice, DC, E-Way Bill, LR attachment).
 */
async function putPackStageHandler(request) {
  try {
    const body = await parseRequestBody(request);
    const {
      orderId,
      orderReference,
      stagingBay = "Bay 1 (Local Courier)",
      weightMarkers = { tareWeight: 0, netWeight: 0, grossWeight: 0 },
      documentCollation = {
        taxInvoiceAttached: false,
        deliveryChallanAttached: false,
        ewayBillAttached: false,
        lrCopyAttached: false,
      },
      shippingProvider = "V-Trans / BlueDart",
      vehicleNumber = "MH-12-AB-1234",
      driverContact = "",
      notes = "",
    } = body;

    if (!orderId && !orderReference) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation Failure: orderId or orderReference is required to stage consignment.",
        },
        { status: 400 }
      );
    }

    // Strict Document Collation Verification
    const {
      taxInvoiceAttached,
      deliveryChallanAttached,
      ewayBillAttached,
      lrCopyAttached,
    } = documentCollation;

    if (
      !taxInvoiceAttached ||
      !deliveryChallanAttached ||
      !ewayBillAttached ||
      !lrCopyAttached
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Document Collation Incomplete: All 4 mandatory physical documents (Tax Invoice, Delivery Challan, E-Way Bill, and LR/Bilty) must be collated before packaging & staging can be finalized.",
          missingDocuments: {
            taxInvoice: !taxInvoiceAttached,
            deliveryChallan: !deliveryChallanAttached,
            ewayBill: !ewayBillAttached,
            lrCopy: !lrCopyAttached,
          },
        },
        { status: 422 }
      );
    }

    const employee = request.employee;
    const companyId = employee?.companyId || employee?.ownerId;
    const organizationId = request.organization?._id;
    const collationTimestamp = new Date();

    // Check or find target Sales Order
    let targetOrder = null;
    if (orderId && orderId.length === 24) {
      targetOrder = await SalesOrder.findById(orderId);
    }
    if (!targetOrder && orderReference) {
      targetOrder = await SalesOrder.findOne({
        $or: [{ orderNumber: orderReference }, { orderReference }],
      });
    }

    const refStr =
      orderReference ||
      targetOrder?.orderNumber ||
      targetOrder?.orderReference ||
      `SO-${orderId?.slice(-6) || "STAGED"}`;

    // Upsert or create DispatchLog record
    const dispatchRecord = await DispatchLog.findOneAndUpdate(
      {
        orderReference: refStr,
        organizationId: organizationId || companyId,
      },
      {
        orderId: targetOrder?._id || companyId,
        orderReference: refStr,
        coordinatorId: employee?._id,
        coordinatorName: employee?.name || "Logistics Assistant",
        dispatchStatus: "PENDING_PICKUP", // Staged in Bay, awaiting final carrier departure
        shippingProvider,
        trackingNumber: `TRK-${Date.now().toString().slice(-8)}`,
        vehicleNumber,
        driverContact,
        dispatchNotes: `Staged at: ${stagingBay}. Weight: Gross ${weightMarkers.grossWeight || 0}kg / Net ${weightMarkers.netWeight || 0}kg. Notes: ${notes}`,
        scheduledDispatchDate: new Date(),
        actualDispatchDate: null,
        organizationId,
        branchId: employee?.branchId || "branch-1",
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Update SalesOrder allocation status to ALLOCATED / STAGED
    if (targetOrder) {
      targetOrder.items = targetOrder.items.map((it) => {
        it.allocationStatus = "ALLOCATED";
        return it;
      });
      await targetOrder.save();
    }

    return NextResponse.json({
      success: true,
      message: `Consignment #${refStr} successfully packed and staged in ${stagingBay}. All 4 shipping documents validated and collated.`,
      stagingData: {
        id: dispatchRecord._id,
        orderReference: refStr,
        stagingBay,
        dispatchStatus: "STAGED_FOR_PICKUP",
        weightMarkers,
        documentCollation: {
          ...documentCollation,
          verifiedAt: collationTimestamp.toISOString(),
          verifiedBy: employee?.name || "Logistics Assistant",
        },
        shippingProvider,
        vehicleNumber,
        stagedAt: collationTimestamp.toISOString(),
      },
    });
  } catch (error) {
    console.error("[API Pack Stage Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update staging status." },
      { status: 500 }
    );
  }
}

/**
 * GET /api/logistics/outbound/pack-stage
 * Fetches all currently staged consignments across warehouse bays.
 */
async function getPackStageHandler(request) {
  try {
    const employee = request.employee;
    const companyId = employee?.companyId || employee?.ownerId;

    const stagedLogs = await DispatchLog.find({
      $or: [{ organizationId: companyId }, { coordinatorId: employee?._id }],
    })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    return NextResponse.json({
      success: true,
      count: stagedLogs.length,
      stagedConsignments: stagedLogs.map((log) => ({
        id: log._id,
        orderReference: log.orderReference,
        shippingProvider: log.shippingProvider,
        trackingNumber: log.trackingNumber,
        vehicleNumber: log.vehicleNumber,
        status: log.dispatchStatus,
        notes: log.dispatchNotes,
        scheduledDate: log.scheduledDispatchDate,
        stagedAt: log.updatedAt || log.createdAt,
      })),
    });
  } catch (error) {
    console.error("[API Get Pack Stage Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve staged consignments." },
      { status: 500 }
    );
  }
}

export const PUT = withRouteMiddleware(putPackStageHandler, {
  roles: ["EMPLOYEE"],
  allowedDepartments: ["LOGISTICS"],
  requireApproved: true,
});

export const GET = withRouteMiddleware(getPackStageHandler, {
  roles: ["EMPLOYEE"],
  allowedDepartments: ["LOGISTICS"],
  requireApproved: true,
});
