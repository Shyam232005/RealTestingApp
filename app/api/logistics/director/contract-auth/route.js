import { NextResponse } from "next/server";
import { withRouteMiddleware, parseRequestBody, parseRequestQuery } from "@/lib/routeMiddleware";
import LogisticsContract from "@/models/LogisticsContract";
import { getHierarchyRank } from "@/lib/hierarchy";

export const dynamic = "force-dynamic";

/**
 * GET /api/logistics/director/contract-auth
 * Lists all multi-year 3PL/4PL Master Service Agreements (MSAs),
 * facility lease acquisitions, and vendor master contracts.
 * Strict RBAC: Requires Tier 6 (Director of Logistics) or Owner clearance.
 */
async function getContractsHandler(request) {
  try {
    const employee = request.employee;
    const rank = getHierarchyRank(employee?.postLevel);

    if (rank < 6 && request.role !== "OWNER") {
      return NextResponse.json(
        {
          success: false,
          error: `Forbidden: Director Contract Strategy Terminal requires Tier 6 (Director) clearance. Current level: ${employee?.postLevel}`,
        },
        { status: 403 }
      );
    }

    const companyId = employee?.companyId || employee?.ownerId;
    const query = parseRequestQuery(request);

    const filter = { companyId };
    if (query.contractType) {
      filter.contractType = query.contractType;
    }
    if (query.status) {
      filter.status = query.status.toUpperCase();
    }

    const contracts = await LogisticsContract.find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({
      success: true,
      count: contracts.length,
      contracts: contracts.map((c) => ({
        id: c._id,
        contractCode: c.contractCode,
        partnerName: c.partnerName,
        partnerType: c.partnerType,
        contractType: c.contractType,
        title: c.title,
        annualValue: c.annualValue,
        tenureYears: c.tenureYears,
        totalContractValue: c.totalContractValue || c.annualValue * c.tenureYears,
        serviceRegions: c.serviceRegions,
        committedThroughputTons: c.committedThroughputTons,
        slaCommitmentOtif: c.slaCommitmentOtif,
        penaltyClause: c.penaltyClause,
        governingLaw: c.governingLaw,
        status: c.status,
        authorizedByName: c.authorizedByName,
        authorizedAt: c.authorizedAt,
        directorNotes: c.directorNotes,
        createdAt: c.createdAt,
      })),
    });
  } catch (error) {
    console.error("[API Get Contracts Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch logistics contracts." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/logistics/director/contract-auth
 * Registers a new draft multi-year 3PL/4PL MSA or facility lease contract.
 */
async function postContractHandler(request) {
  try {
    const employee = request.employee;
    const rank = getHierarchyRank(employee?.postLevel);

    if (rank < 6 && request.role !== "OWNER") {
      return NextResponse.json(
        {
          success: false,
          error: `Forbidden: Authorizing multi-year logistics contracts requires Tier 6 (Director) clearance.`,
        },
        { status: 403 }
      );
    }

    const body = await parseRequestBody(request);
    const {
      partnerName,
      partnerType = "3PL_CARRIER",
      contractType = "3PL_MASTER_SERVICE_AGREEMENT",
      title,
      annualValue,
      tenureYears = 3,
      serviceRegions = ["Pan-India"],
      committedThroughputTons = 1200,
      slaCommitmentOtif = 98.0,
      penaltyClause,
      governingLaw,
    } = body;

    if (!partnerName || !annualValue || !title) {
      return NextResponse.json(
        { success: false, error: "Validation Failure: Partner Name, Title, and Annual Value are required." },
        { status: 400 }
      );
    }

    const companyId = employee?.companyId || employee?.ownerId;
    const organizationId = request.organization?._id;
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const contractCode = `MSA-${partnerName.slice(0, 4).toUpperCase()}-${new Date().getFullYear()}-${randSuffix}`;

    const newContract = await LogisticsContract.create({
      contractCode,
      partnerName: String(partnerName).trim(),
      partnerType,
      contractType,
      title: String(title).trim(),
      annualValue: Number(annualValue),
      tenureYears: Number(tenureYears),
      totalContractValue: Number(annualValue) * Number(tenureYears),
      serviceRegions: Array.isArray(serviceRegions) ? serviceRegions : [serviceRegions],
      committedThroughputTons: Number(committedThroughputTons),
      slaCommitmentOtif: Number(slaCommitmentOtif),
      penaltyClause: penaltyClause || "Standard 2.5% billing deduction on OTIF drop below 95%",
      governingLaw: governingLaw || "Arbitration & Conciliation Act (Commercial Jurisdiction)",
      status: "PENDING_DIRECTOR_SIGN_OFF",
      companyId,
      organizationId,
      branchId: employee?.branchId || "branch-1",
    });

    return NextResponse.json({
      success: true,
      message: `Contract proposal ${contractCode} registered successfully and routed to Director review.`,
      contract: newContract,
    });
  } catch (error) {
    console.error("[API Create Contract Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create logistics contract." },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/logistics/director/contract-auth
 * Authorizes, signs off, or rejects multi-year 3PL/4PL MSAs and facility leases.
 * Strict RBAC: Requires Tier 6 (Director of Logistics) or Owner clearance.
 */
async function putContractAuthHandler(request) {
  try {
    const employee = request.employee;
    const rank = getHierarchyRank(employee?.postLevel);

    if (rank < 6 && request.role !== "OWNER") {
      return NextResponse.json(
        {
          success: false,
          error: `Forbidden: Multi-Year Contract Authorization requires Tier 6 (Director of Logistics) clearance. Current level: ${employee?.postLevel}`,
        },
        { status: 403 }
      );
    }

    const body = await parseRequestBody(request);
    const {
      contractId,
      action = "APPROVE", // "APPROVE" | "REJECT" | "TERMINATE"
      directorNotes = "Executive Master Service Agreement approved under Enterprise Logistics Authority.",
    } = body;

    if (!contractId) {
      return NextResponse.json(
        { success: false, error: "Validation Failure: Contract ID is required for authorization." },
        { status: 400 }
      );
    }

    const companyId = employee?.companyId || employee?.ownerId;
    const targetStatus =
      action === "APPROVE"
        ? "ACTIVE_APPROVED"
        : action === "REJECT"
        ? "REJECTED"
        : "TERMINATED";

    const updatedContract = await LogisticsContract.findOneAndUpdate(
      { _id: contractId, companyId },
      {
        $set: {
          status: targetStatus,
          authorizedBy: employee?._id,
          authorizedByName: employee?.name || "Director of Logistics",
          authorizedAt: new Date(),
          directorNotes: `${directorNotes} [Signed by Director ${employee?.name || "Executive"}]`,
        },
      },
      { new: true }
    );

    if (!updatedContract) {
      return NextResponse.json(
        { success: false, error: "Contract record not found or unauthorized tenant access." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Master Service Agreement ${updatedContract.contractCode} status updated to ${targetStatus}.`,
      action,
      contract: updatedContract,
    });
  } catch (error) {
    console.error("[API Put Contract Auth Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to authorize contract." },
      { status: 500 }
    );
  }
}

export const GET = withRouteMiddleware(getContractsHandler, {
  roles: ["EMPLOYEE"],
  allowedDepartments: ["LOGISTICS"],
  requireApproved: true,
});

export const POST = withRouteMiddleware(postContractHandler, {
  roles: ["EMPLOYEE"],
  allowedDepartments: ["LOGISTICS"],
  requireApproved: true,
});

export const PUT = withRouteMiddleware(putContractAuthHandler, {
  roles: ["EMPLOYEE"],
  allowedDepartments: ["LOGISTICS"],
  requireApproved: true,
});
