import { NextResponse } from "next/server";
import { withRouteMiddleware, parseRequestBody, parseRequestQuery } from "@/lib/routeMiddleware";
import LogisticsException from "@/models/LogisticsException";
import { getHierarchyRank } from "@/lib/hierarchy";

export const dynamic = "force-dynamic";

/**
 * POST /api/logistics/outbound/exceptions
 * Exception Management Dashboard (NDR / RTO).
 * Logs Non-Delivery Reports, schedules re-attempts, updates delivery address, or approves RTO.
 * Strict RBAC: Requires Tier 2 (Coordinator) clearance or above.
 */
async function postLogisticsExceptionHandler(request) {
  try {
    const employee = request.employee;
    const rank = getHierarchyRank(employee?.postLevel);

    if (rank < 2) {
      return NextResponse.json(
        {
          success: false,
          error: `Forbidden: NDR Exception handling and RTO approval requires Tier 2 (Coordinator) clearance. Current level: ${employee?.postLevel}`,
        },
        { status: 403 }
      );
    }

    const body = await parseRequestBody(request);
    const {
      awbNumber,
      orderReference,
      customerName,
      customerPhone = "",
      deliveryPinCode,
      destinationCity = "",
      carrier = "BlueDart Express",
      exceptionType = "NDR_CUSTOMER_UNAVAILABLE",
      actionTaken = "PENDING_COORDINATOR_ACTION",
      coordinatorNotes = "",
    } = body;

    if (!awbNumber || !orderReference) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation Failure: AWB Number and Order Reference are required.",
        },
        { status: 400 }
      );
    }

    const companyId = employee?.companyId || employee?.ownerId;
    const organizationId = request.organization?._id;
    const exceptionId = `EXC-${awbNumber.slice(-6)}-${Date.now().toString().slice(-4)}`;

    const isRtoApproved = actionTaken === "RTO_APPROVED_BY_COORDINATOR";

    const record = await LogisticsException.findOneAndUpdate(
      { awbNumber, companyId },
      {
        exceptionId,
        awbNumber,
        orderReference,
        customerName: customerName || "Customer",
        customerPhone,
        deliveryPinCode: deliveryPinCode || "400001",
        destinationCity,
        carrier,
        exceptionType,
        actionTaken,
        rtoApprovalDate: isRtoApproved ? new Date() : null,
        coordinatorNotes,
        handledBy: employee?._id,
        handledByName: employee?.name || "Logistics Coordinator",
        companyId,
        organizationId,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({
      success: true,
      message: isRtoApproved
        ? `RTO approved for AWB #${awbNumber}. Consignment flagged for return to warehouse godown.`
        : `NDR Exception logged for AWB #${awbNumber} with action: ${actionTaken}.`,
      exception: record,
    });
  } catch (error) {
    console.error("[API Logistics Exception Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to log delivery exception." },
      { status: 500 }
    );
  }
}

/**
 * GET /api/logistics/outbound/exceptions
 * Retrieves active NDR reports and RTO approvals.
 */
async function getLogisticsExceptionsHandler(request) {
  try {
    const employee = request.employee;
    const companyId = employee?.companyId || employee?.ownerId;
    const query = parseRequestQuery(request);

    const filter = { companyId };
    if (query.actionTaken) {
      filter.actionTaken = query.actionTaken;
    }

    const exceptions = await LogisticsException.find(filter)
      .sort({ updatedAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({
      success: true,
      count: exceptions.length,
      exceptions: exceptions.map((e) => ({
        id: e._id,
        exceptionId: e.exceptionId,
        awbNumber: e.awbNumber,
        orderReference: e.orderReference,
        customerName: e.customerName,
        customerPhone: e.customerPhone,
        deliveryPinCode: e.deliveryPinCode,
        destinationCity: e.destinationCity,
        carrier: e.carrier,
        exceptionType: e.exceptionType,
        actionTaken: e.actionTaken,
        rtoApprovalDate: e.rtoApprovalDate,
        coordinatorNotes: e.coordinatorNotes,
        handledByName: e.handledByName,
        createdAt: e.createdAt,
      })),
    });
  } catch (error) {
    console.error("[API Get Logistics Exceptions Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch delivery exceptions." },
      { status: 500 }
    );
  }
}

export const POST = withRouteMiddleware(postLogisticsExceptionHandler, {
  roles: ["EMPLOYEE"],
  allowedDepartments: ["LOGISTICS"],
  requireApproved: true,
});

export const GET = withRouteMiddleware(getLogisticsExceptionsHandler, {
  roles: ["EMPLOYEE"],
  allowedDepartments: ["LOGISTICS"],
  requireApproved: true,
});
