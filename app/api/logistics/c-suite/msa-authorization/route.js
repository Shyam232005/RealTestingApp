import { NextResponse } from "next/server";
import { withRouteMiddleware, parseRequestBody } from "@/lib/routeMiddleware";
import LogisticsContract from "@/models/LogisticsContract";
import { getHierarchyRank } from "@/lib/hierarchy";

export const dynamic = "force-dynamic";

/**
 * GET /api/logistics/c-suite/msa-authorization
 * Fetches strategic enterprise contracts, joint ventures, carrier fleet leasing, and asset divestments.
 */
async function getStrategicContractsHandler(request) {
  try {
    const employee = request.employee;
    const rank = getHierarchyRank(employee?.postLevel);

    if (rank < 6 && request.role !== "OWNER") {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden: Viewing strategic enterprise MSAs requires Tier 6+ clearance.",
        },
        { status: 403 }
      );
    }

    const companyId = employee?.companyId || employee?.ownerId;

    const contracts = await LogisticsContract.find({ companyId })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
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
        status: c.status,
        cloSignOff: c.cloSignOff,
        cloSignOffByName: c.cloSignOffByName,
        cloSignOffAt: c.cloSignOffAt,
        boardResolutionRef: c.boardResolutionRef,
        jvEquityPct: c.jvEquityPct,
        divestmentProceeds: c.divestmentProceeds,
        createdAt: c.createdAt,
      })),
      strategicSummary: {
        totalContracts: contracts.length,
        cloExecutedCount: contracts.filter((c) => c.status === "CLO_EXECUTED" || c.cloSignOff).length,
        jointVenturesCount: contracts.filter((c) => c.contractType === "STRATEGIC_JOINT_VENTURE").length,
        fleetLeasingCount: contracts.filter((c) => c.contractType === "CARRIER_FLEET_LEASING").length,
        divestmentsCount: contracts.filter((c) => c.contractType === "ASSET_DIVESTMENT").length,
      },
    });
  } catch (error) {
    console.error("[API GET Strategic Contracts Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch strategic contracts." },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/logistics/c-suite/msa-authorization
 * Executes supreme CLO sign-off for enterprise master service agreements with national 3PLs/4PLs,
 * strategic joint ventures, carrier fleet leasing, and asset divestments.
 * Strict RBAC: Requires Tier 7 (Chief Officer) or Owner clearance.
 */
async function putStrategicMsaAuthorizationHandler(request) {
  try {
    const employee = request.employee;
    const rank = getHierarchyRank(employee?.postLevel);

    if (rank < 7 && request.role !== "OWNER") {
      return NextResponse.json(
        {
          success: false,
          error: `Forbidden: Strategic MSA authorization and M&A execution requires Chief Logistics Officer (Tier 7) clearance. Current level: ${employee?.postLevel}`,
        },
        { status: 403 }
      );
    }

    const companyId = employee?.companyId || employee?.ownerId;
    const body = await parseRequestBody(request);

    const {
      contractId,
      action = "APPROVE_CLO_EXECUTION", // APPROVE_CLO_EXECUTION | CREATE_STRATEGIC
      partnerName,
      partnerType = "3PL_CARRIER",
      contractType = "3PL_MASTER_SERVICE_AGREEMENT",
      title,
      annualValue,
      tenureYears = 3,
      serviceRegions = ["Pan-India Corridor"],
      committedThroughputTons = 5000,
      slaCommitmentOtif = 99.0,
      penaltyClause,
      boardResolutionRef,
      cloNotes,
      jvEquityPct = 0,
      divestmentProceeds = 0,
    } = body;

    const boardRef =
      boardResolutionRef?.trim() ||
      `BR-${new Date().getFullYear()}-CLO-${Math.floor(1000 + Math.random() * 9000)}`;

    if (action === "CREATE_STRATEGIC" || !contractId) {
      // Validate mandatory fields for new strategic contract creation
      if (!partnerName || !title || !annualValue) {
        return NextResponse.json(
          {
            success: false,
            error: "Missing required fields: partnerName, title, and annualValue are required.",
          },
          { status: 400 }
        );
      }

      const count = await LogisticsContract.countDocuments({ companyId });
      const prefix =
        contractType === "STRATEGIC_JOINT_VENTURE"
          ? "JV"
          : contractType === "CARRIER_FLEET_LEASING"
          ? "CFL"
          : contractType === "ASSET_DIVESTMENT"
          ? "DIV"
          : "MSA";

      const contractCode = `${prefix}-${new Date().getFullYear()}-${String(count + 1).padStart(3, "0")}`;
      const annVal = Number(annualValue);
      const tenure = Number(tenureYears) || 3;

      const newContract = await LogisticsContract.create({
        contractCode,
        partnerName: partnerName.trim(),
        partnerType,
        contractType,
        title: title.trim(),
        annualValue: annVal,
        tenureYears: tenure,
        totalContractValue: annVal * tenure,
        serviceRegions: Array.isArray(serviceRegions) ? serviceRegions : [serviceRegions],
        committedThroughputTons: Number(committedThroughputTons) || 5000,
        slaCommitmentOtif: Number(slaCommitmentOtif) || 99.0,
        penaltyClause: penaltyClause?.trim() || "Strict 3% penalty on OTIF breach below 96.0%.",
        status: "CLO_EXECUTED",
        cloSignOff: true,
        cloSignOffBy: employee?._id,
        cloSignOffByName: employee?.name || "Chief Logistics Officer",
        cloSignOffAt: new Date(),
        boardResolutionRef: boardRef,
        cloNotes: cloNotes?.trim() || "Supreme corporate execution signed by Chief Logistics Officer under Board authorization.",
        jvEquityPct: Number(jvEquityPct) || 0,
        divestmentProceeds: Number(divestmentProceeds) || 0,
        companyId,
        branchId: employee?.branchId || "branch-1",
      });

      return NextResponse.json({
        success: true,
        message: `Strategic agreement ${contractCode} (${title}) executed by CLO under Board Ref ${boardRef}.`,
        contract: newContract,
      });
    }

    // Otherwise, execute sign-off on existing contract
    const existing = await LogisticsContract.findOne({ _id: contractId, companyId });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Contract not found." },
        { status: 404 }
      );
    }

    existing.status = "CLO_EXECUTED";
    existing.cloSignOff = true;
    existing.cloSignOffBy = employee?._id;
    existing.cloSignOffByName = employee?.name || "Chief Logistics Officer";
    existing.cloSignOffAt = new Date();
    existing.boardResolutionRef = boardRef;
    if (cloNotes) existing.cloNotes = cloNotes.trim();
    if (jvEquityPct) existing.jvEquityPct = Number(jvEquityPct);
    if (divestmentProceeds) existing.divestmentProceeds = Number(divestmentProceeds);

    await existing.save();

    return NextResponse.json({
      success: true,
      message: `Master Agreement ${existing.contractCode} (${existing.partnerName}) fully executed by Chief Logistics Officer.`,
      contract: existing,
    });
  } catch (error) {
    console.error("[API PUT Strategic MSA Authorization Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to execute strategic MSA authorization." },
      { status: 500 }
    );
  }
}

export const GET = withRouteMiddleware(getStrategicContractsHandler, {
  roles: ["EMPLOYEE"],
  allowedDepartments: ["LOGISTICS"],
  requireApproved: true,
});

export const PUT = withRouteMiddleware(putStrategicMsaAuthorizationHandler, {
  roles: ["EMPLOYEE"],
  allowedDepartments: ["LOGISTICS"],
  requireApproved: true,
});
