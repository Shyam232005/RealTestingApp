import { NextResponse } from "next/server";
import { withRouteMiddleware, parseRequestBody } from "@/lib/routeMiddleware";
import LogisticsCapexProject from "@/models/LogisticsCapexProject";
import { getHierarchyRank } from "@/lib/hierarchy";

export const dynamic = "force-dynamic";

/**
 * GET /api/logistics/c-suite/capex-allocation
 * Lists all enterprise CAPEX expansion projects, greenfield hubs, and AMR automation initiatives.
 */
async function getCapexProjectsHandler(request) {
  try {
    const employee = request.employee;
    const rank = getHierarchyRank(employee?.postLevel);

    if (rank < 6 && request.role !== "OWNER") {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden: Viewing CAPEX deployment requires Tier 6+ executive clearance.",
        },
        { status: 403 }
      );
    }

    const companyId = employee?.companyId || employee?.ownerId;

    const projects = await LogisticsCapexProject.find({ companyId })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      projects: projects.map((p) => ({
        id: p._id,
        projectCode: p.projectCode,
        title: p.title,
        category: p.category,
        region: p.region,
        location: p.location,
        allocatedCapex: p.allocatedCapex,
        spentCapex: p.spentCapex,
        tenureYears: p.tenureYears,
        projectedIrrPct: p.projectedIrrPct,
        paybackYears: p.paybackYears,
        esgRating: p.esgRating,
        scope3ReductionPct: p.scope3ReductionPct,
        engineeringPartner: p.engineeringPartner,
        boardResolutionRef: p.boardResolutionRef,
        status: p.status,
        approvedByName: p.approvedByName,
        approvedAt: p.approvedAt,
        notes: p.notes,
        createdAt: p.createdAt,
      })),
      totalAllocated: projects.reduce((sum, p) => sum + (Number(p.allocatedCapex) || 0), 0),
      totalSpent: projects.reduce((sum, p) => sum + (Number(p.spentCapex) || 0), 0),
    });
  } catch (error) {
    console.error("[API GET CAPEX Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch CAPEX projects." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/logistics/c-suite/capex-allocation
 * Authorizes a major multi-year capital deployment project or automated infrastructure budget.
 * Strict RBAC: Requires Tier 7 (Chief Officer) or Owner clearance.
 */
async function postCapexAllocationHandler(request) {
  try {
    const employee = request.employee;
    const rank = getHierarchyRank(employee?.postLevel);

    if (rank < 7 && request.role !== "OWNER") {
      return NextResponse.json(
        {
          success: false,
          error: `Forbidden: Authorizing multi-million CAPEX projects requires Chief Logistics Officer (Tier 7) clearance. Current level: ${employee?.postLevel}`,
        },
        { status: 403 }
      );
    }

    const companyId = employee?.companyId || employee?.ownerId;
    const body = await parseRequestBody(request);

    const {
      title,
      category = "GREENFIELD_MEGA_HUB",
      region = "West Zone",
      location,
      allocatedCapex,
      tenureYears = 3,
      projectedIrrPct = 18.5,
      paybackYears = 4.2,
      esgRating = "A+",
      scope3ReductionPct = 24.0,
      engineeringPartner = "L&T Industrial Infrastructure",
      boardResolutionRef,
      notes,
    } = body;

    if (!title || !location || !allocatedCapex) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: title, location, and allocatedCapex are mandatory.",
        },
        { status: 400 }
      );
    }

    const capexAmount = Number(allocatedCapex);
    if (isNaN(capexAmount) || capexAmount <= 0) {
      return NextResponse.json(
        { success: false, error: "Allocated CAPEX must be a positive monetary figure." },
        { status: 400 }
      );
    }

    // Auto-generate project code
    const count = await LogisticsCapexProject.countDocuments({ companyId });
    const projectCode = `CPX-${new Date().getFullYear()}-${String(count + 1).padStart(3, "0")}`;

    const newProject = await LogisticsCapexProject.create({
      projectCode,
      title: title.trim(),
      category,
      region,
      location: location.trim(),
      allocatedCapex: capexAmount,
      spentCapex: 0,
      tenureYears: Number(tenureYears) || 3,
      projectedIrrPct: Number(projectedIrrPct) || 18.5,
      paybackYears: Number(paybackYears) || 4.2,
      esgRating,
      scope3ReductionPct: Number(scope3ReductionPct) || 24.0,
      engineeringPartner: engineeringPartner.trim(),
      boardResolutionRef: boardResolutionRef?.trim() || `BR-${new Date().getFullYear()}-CLO-${Math.floor(1000 + Math.random() * 9000)}`,
      status: "APPROVED_BY_CLO",
      approvedBy: employee?._id,
      approvedByName: employee?.name || "Chief Logistics Officer",
      approvedAt: new Date(),
      notes: notes?.trim() || "Multi-year enterprise capital allocation authorized by Chief Logistics Officer under supreme Board charter.",
      companyId,
      branchId: employee?.branchId || "branch-1",
    });

    return NextResponse.json({
      success: true,
      message: `CAPEX Project ${projectCode} (${title}) authorized for ₹${capexAmount.toLocaleString("en-IN")}.`,
      project: {
        id: newProject._id,
        projectCode: newProject.projectCode,
        title: newProject.title,
        category: newProject.category,
        region: newProject.region,
        location: newProject.location,
        allocatedCapex: newProject.allocatedCapex,
        status: newProject.status,
        approvedByName: newProject.approvedByName,
        approvedAt: newProject.approvedAt,
      },
    });
  } catch (error) {
    console.error("[API POST CAPEX Allocation Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to authorize CAPEX project." },
      { status: 500 }
    );
  }
}

export const GET = withRouteMiddleware(getCapexProjectsHandler, {
  roles: ["EMPLOYEE"],
  allowedDepartments: ["LOGISTICS"],
  requireApproved: true,
});

export const POST = withRouteMiddleware(postCapexAllocationHandler, {
  roles: ["EMPLOYEE"],
  allowedDepartments: ["LOGISTICS"],
  requireApproved: true,
});
