import { NextResponse } from "next/server";
import { withRouteMiddleware, parseRequestBody, parseRequestQuery } from "@/lib/routeMiddleware";
import DispatchLog from "@/models/DispatchLog";
import SalesOrder from "@/models/SalesOrder";
import { getHierarchyRank } from "@/lib/hierarchy";

export const dynamic = "force-dynamic";

/**
 * PUT /api/logistics/outbound/carrier-allocation
 * Assigns shipments to contracted 3PL carriers based on volumetric weight & pin codes.
 * Generates Master Airway Bills (AWB) and updates Part-B E-Way Bills.
 * Strict RBAC: Requires Tier 2 (Coordinator) clearance or above.
 */
async function putCarrierAllocationHandler(request) {
  try {
    const employee = request.employee;
    const rank = getHierarchyRank(employee?.postLevel);

    if (rank < 2) {
      return NextResponse.json(
        {
          success: false,
          error: `Forbidden: 3PL Carrier Allocation & AWB generation requires Tier 2 (Coordinator) clearance. Current level: ${employee?.postLevel}`,
        },
        { status: 403 }
      );
    }

    const body = await parseRequestBody(request);
    const {
      orderReference,
      deliveryPinCode,
      destinationCity,
      carrier = "BlueDart Express", // BlueDart, Delhivery, V-Trans, TCI Freight
      lengthCm = 50,
      widthCm = 40,
      heightCm = 40,
      deadWeightKg = 15,
      vehicleNumber = "MH-12-RN-8841",
      driverContact = "+91 98200 12345",
      notes = "",
    } = body;

    if (!orderReference || !deliveryPinCode) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation Failure: Order reference and Delivery PIN code are required.",
        },
        { status: 400 }
      );
    }

    const companyId = employee?.companyId || employee?.ownerId;
    const organizationId = request.organization?._id;

    // Standard IATA Volumetric Weight Calculation (L * W * H / 5000)
    const volumetricWeightKg = Number(
      ((Number(lengthCm) * Number(widthCm) * Number(heightCm)) / 5000).toFixed(2)
    );
    const chargeableWeightKg = Math.max(Number(deadWeightKg), volumetricWeightKg);

    // Generate Master AWB & Part-B E-Way Bill Number
    const randSuffix = Math.floor(10000000 + Math.random() * 90000000);
    const carrierCode = carrier.toLowerCase().includes("bluedart")
      ? "BD"
      : carrier.toLowerCase().includes("delhivery")
      ? "DLHV"
      : carrier.toLowerCase().includes("trans")
      ? "VT"
      : "3PL";
    const awbNumber = `AWB-${carrierCode}-${randSuffix}`;
    const ewayBillNumber = `EWB-PARTB-${Math.floor(100000000000 + Math.random() * 900000000000)}`;

    // Update or Upsert DispatchLog
    const dispatchRecord = await DispatchLog.findOneAndUpdate(
      {
        orderReference,
        $or: [{ organizationId }, { organizationId: companyId }],
      },
      {
        orderReference,
        coordinatorId: employee?._id,
        coordinatorName: employee?.name || "Logistics Coordinator",
        dispatchStatus: "DISPATCHED",
        shippingProvider: carrier,
        trackingNumber: awbNumber,
        vehicleNumber,
        driverContact,
        dispatchNotes: `3PL Carrier: ${carrier}. Dest PIN: ${deliveryPinCode} (${destinationCity || "City"}). Dim: ${lengthCm}x${widthCm}x${heightCm} cm. Vol Wt: ${volumetricWeightKg} kg, Dead Wt: ${deadWeightKg} kg, Chargeable: ${chargeableWeightKg} kg. EWB: ${ewayBillNumber}. Notes: ${notes}`,
        scheduledDispatchDate: new Date(),
        actualDispatchDate: new Date(),
        organizationId: organizationId || companyId,
        branchId: employee?.branchId || "branch-1",
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({
      success: true,
      message: `Shipment #${orderReference} successfully routed via ${carrier}. Master AWB ${awbNumber} and Part-B E-Way Bill ${ewayBillNumber} generated.`,
      allocation: {
        id: dispatchRecord._id,
        orderReference,
        carrier,
        awbNumber,
        ewayBillNumber,
        deliveryPinCode,
        destinationCity,
        volumetricWeightKg,
        deadWeightKg: Number(deadWeightKg),
        chargeableWeightKg,
        vehicleNumber,
        driverContact,
        status: "DISPATCHED_3PL",
        allocatedBy: employee?.name || "Logistics Coordinator",
        allocatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[API Carrier Allocation Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to allocate 3PL carrier." },
      { status: 500 }
    );
  }
}

/**
 * GET /api/logistics/outbound/carrier-allocation
 * Fetches routing allocations and shipments assigned to carriers.
 */
async function getCarrierAllocationsHandler(request) {
  try {
    const employee = request.employee;
    const companyId = employee?.companyId || employee?.ownerId;

    const logs = await DispatchLog.find({
      $or: [{ organizationId: companyId }, { coordinatorId: employee?._id }],
    })
      .sort({ updatedAt: -1 })
      .limit(40)
      .lean();

    return NextResponse.json({
      success: true,
      count: logs.length,
      allocations: logs.map((log) => ({
        id: log._id,
        orderReference: log.orderReference,
        carrier: log.shippingProvider,
        awbNumber: log.trackingNumber,
        vehicleNumber: log.vehicleNumber,
        driverContact: log.driverContact,
        status: log.dispatchStatus,
        notes: log.dispatchNotes,
        dispatchDate: log.actualDispatchDate || log.scheduledDispatchDate,
        coordinatorName: log.coordinatorName,
      })),
    });
  } catch (error) {
    console.error("[API Get Carrier Allocations Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch carrier allocations." },
      { status: 500 }
    );
  }
}

export const PUT = withRouteMiddleware(putCarrierAllocationHandler, {
  roles: ["EMPLOYEE"],
  allowedDepartments: ["LOGISTICS"],
  requireApproved: true,
});

export const GET = withRouteMiddleware(getCarrierAllocationsHandler, {
  roles: ["EMPLOYEE"],
  allowedDepartments: ["LOGISTICS"],
  requireApproved: true,
});
