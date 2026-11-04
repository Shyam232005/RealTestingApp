import { NextResponse } from "next/server";
import { withRouteMiddleware, parseRequestBody } from "@/lib/routeMiddleware";
import WarehouseBin from "@/models/WarehouseBin";

export const dynamic = "force-dynamic";

/**
 * GET /api/logistics/inventory/bins
 * Fetches real warehouse aisle & bin allocations for the active tenant.
 * Adheres strictly to Zero State First (returns empty array when unpopulated).
 */
async function getWarehouseBinsHandler(request) {
  try {
    const employee = request.employee;
    const companyId = employee?.companyId || employee?.ownerId;

    const bins = await WarehouseBin.find({ companyId })
      .sort({ bin: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      count: bins.length,
      bins: bins.map((b) => ({
        id: b._id,
        bin: b.bin,
        item: b.item || "Unallocated Space",
        skuCode: b.skuCode || "",
        qty: b.qty || "0",
        uom: b.uom || "Units",
        status: b.status || "AVAILABLE",
        zone: b.zone || "Zone 1",
        aisle: b.aisle || "Aisle A",
        updatedAt: b.updatedAt,
      })),
    });
  } catch (error) {
    console.error("[API Get Warehouse Bins Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve warehouse bins." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/logistics/inventory/bins
 * Configures or allocates a warehouse bin.
 */
async function postWarehouseBinHandler(request) {
  try {
    const body = await parseRequestBody(request);
    const {
      bin,
      item = "",
      skuCode = "",
      qty = "0",
      uom = "Units",
      status = "AVAILABLE",
      zone = "Zone 1",
      aisle = "Aisle A",
    } = body;

    if (!bin) {
      return NextResponse.json(
        { success: false, error: "Bin designation (e.g. Bin A-01) is required." },
        { status: 400 }
      );
    }

    const employee = request.employee;
    const companyId = employee?.companyId || employee?.ownerId;
    const cleanBin = String(bin).trim().toUpperCase();

    const record = await WarehouseBin.findOneAndUpdate(
      { companyId, bin: cleanBin },
      {
        bin: cleanBin,
        item,
        skuCode,
        qty: String(qty),
        uom,
        status,
        zone,
        aisle,
        companyId,
        branchId: employee?.branchId || "branch-1",
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({
      success: true,
      message: `Warehouse bin ${cleanBin} allocated successfully.`,
      bin: record,
    });
  } catch (error) {
    console.error("[API Post Warehouse Bin Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save warehouse bin." },
      { status: 500 }
    );
  }
}

export const GET = withRouteMiddleware(getWarehouseBinsHandler, {
  roles: ["EMPLOYEE"],
  allowedDepartments: ["LOGISTICS"],
  requireApproved: true,
});

export const POST = withRouteMiddleware(postWarehouseBinHandler, {
  roles: ["EMPLOYEE"],
  allowedDepartments: ["LOGISTICS"],
  requireApproved: true,
});
