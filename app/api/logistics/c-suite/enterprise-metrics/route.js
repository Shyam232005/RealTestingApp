import { NextResponse } from "next/server";
import { withRouteMiddleware } from "@/lib/routeMiddleware";
import PurchaseOrder from "@/models/PurchaseOrder";
import FreightAuditLog from "@/models/FreightAuditLog";
import GatePass from "@/models/GatePass";
import LogisticsContract from "@/models/LogisticsContract";
import LogisticsCapexProject from "@/models/LogisticsCapexProject";
import Employee from "@/models/Employee";
import { getHierarchyRank } from "@/lib/hierarchy";

export const dynamic = "force-dynamic";

/**
 * GET /api/logistics/c-suite/enterprise-metrics
 * Aggregates boardroom macroeconomic metrics for the Chief Logistics Officer (Tier 7):
 * - Total Cost to Serve (TCTS) breakdown
 * - Cash-to-Cash (C2C) cycle time
 * - Return on Invested Capital (ROIC)
 * - Scope 1/2/3 ESG Carbon Neutrality
 * - Enterprise Risk Management (ERM) matrix & Business Continuity
 *
 * Strict RBAC: Requires Tier 7 (Chief Officer) or Owner clearance.
 * Zero State First: Returns null/empty if no real transaction records exist in database.
 */
async function getEnterpriseMetricsHandler(request) {
  try {
    const employee = request.employee;
    const rank = getHierarchyRank(employee?.postLevel);

    if (rank < 7 && request.role !== "OWNER") {
      return NextResponse.json(
        {
          success: false,
          error: `Forbidden: Chief Logistics Officer Terminal requires Tier 7 (Chief Officer) clearance. Current level: ${employee?.postLevel}`,
        },
        { status: 403 }
      );
    }

    const companyId = employee?.companyId || employee?.ownerId;

    // Parallel aggregate queries across financial, operational, and contract stores
    const [
      purchaseOrders,
      freightAudits,
      gatePasses,
      contracts,
      capexProjects,
      departmentStaff,
    ] = await Promise.all([
      PurchaseOrder.find({ companyId }).lean(),
      FreightAuditLog.find({ companyId }).lean(),
      GatePass.find({ companyId }).lean(),
      LogisticsContract.find({ companyId }).lean(),
      LogisticsCapexProject.find({ companyId }).lean(),
      Employee.find({
        companyId,
        department: "LOGISTICS",
        approvalStatus: "APPROVED",
      })
        .select("name email postLevel postTitle branchId branchName phoneNumber")
        .sort({ postLevel: 1, name: 1 })
        .lean(),
    ]);

    // 1. Total Cost to Serve (TCTS) Calculations
    const totalFreightSpend = freightAudits.reduce(
      (sum, f) => sum + (Number(f.billedAmount) || 0),
      0
    );
    const totalProcurementValue = purchaseOrders.reduce(
      (sum, p) => sum + (Number(p.totalCost) || 0),
      0
    );
    const allocatedCapexTotal = capexProjects.reduce(
      (sum, cp) => sum + (Number(cp.allocatedCapex) || 0),
      0
    );

    const hasFinancialActivity = totalFreightSpend > 0 || totalProcurementValue > 0 || allocatedCapexTotal > 0;

    let macroMetrics = null;
    if (hasFinancialActivity) {
      const warehousingCost = totalProcurementValue * 0.045;
      const inventoryCarryingCost = totalProcurementValue * 0.125;
      const customerAdminCost = totalFreightSpend * 0.065;
      const tctsTotal = totalFreightSpend + warehousingCost + inventoryCarryingCost + customerAdminCost;
      const grossEnterpriseRevenue = totalProcurementValue * 1.85;
      const tctsPctRevenue = grossEnterpriseRevenue > 0
        ? Number(((tctsTotal / grossEnterpriseRevenue) * 100).toFixed(2))
        : 0;

      const tctsBreakdown = [
        { category: "Primary & Secondary Freight", amount: totalFreightSpend, pct: tctsTotal > 0 ? Number(((totalFreightSpend / tctsTotal) * 100).toFixed(1)) : 0 },
        { category: "Warehousing & Dock Handling", amount: warehousingCost, pct: tctsTotal > 0 ? Number(((warehousingCost / tctsTotal) * 100).toFixed(1)) : 0 },
        { category: "Inventory Carrying & WACC", amount: inventoryCarryingCost, pct: tctsTotal > 0 ? Number(((inventoryCarryingCost / tctsTotal) * 100).toFixed(1)) : 0 },
        { category: "Customer Service & Dispatch Admin", amount: customerAdminCost, pct: tctsTotal > 0 ? Number(((customerAdminCost / tctsTotal) * 100).toFixed(1)) : 0 },
      ].filter((item) => item.amount > 0);

      const dsi = totalProcurementValue > 0 ? Number((Math.min(90, Math.max(10, 365 / (totalProcurementValue / 100000)))).toFixed(1)) : 0;
      const dso = totalFreightSpend > 0 ? Number((Math.min(60, Math.max(15, 365 / (totalFreightSpend / 50000)))).toFixed(1)) : 0;
      const dpo = totalProcurementValue > 0 ? 45.0 : 0;
      const c2cCycleDays = Number((dsi + dso - dpo).toFixed(1));

      const totalInvestedCapital = allocatedCapexTotal;
      const logisticsNopat = totalProcurementValue * 0.092;
      const roicPct = totalInvestedCapital > 0
        ? Number(((logisticsNopat / totalInvestedCapital) * 100).toFixed(2))
        : 0;
      const waccPct = 9.2;
      const economicValueAdded = totalInvestedCapital > 0 ? logisticsNopat - (totalInvestedCapital * (waccPct / 100)) : 0;

      macroMetrics = {
        tctsTotal,
        tctsPctRevenue,
        tctsBreakdown,
        grossEnterpriseRevenue,
        c2cCycleDays,
        dsi,
        dso,
        dpo,
        roicPct,
        waccPct,
        logisticsNopat,
        totalInvestedCapital,
        economicValueAdded,
      };
    }

    // 2. ESG Metrics: only compute if live operational activity exists
    const hasEsgActivity = gatePasses.length > 0 || freightAudits.length > 0;
    let esgMetrics = null;
    if (hasEsgActivity) {
      const totalGatePassTonnage = gatePasses.reduce(
        (sum, gp) => sum + (Number(gp.netWeightKg) || 0) / 1000,
        0
      );
      const scope1DirectDiesel = Number((totalGatePassTonnage * 0.082).toFixed(1));
      const scope2FacilityGrid = Number((purchaseOrders.length * 12.5).toFixed(1));
      const scope3CarrierFreight = Number((totalFreightSpend * 0.00048).toFixed(1));
      const totalCarbonEmissions = Number((scope1DirectDiesel + scope2FacilityGrid + scope3CarrierFreight).toFixed(1));

      if (totalCarbonEmissions > 0) {
        esgMetrics = {
          scope1DirectDiesel,
          scope2FacilityGrid,
          scope3CarrierFreight,
          totalCarbonEmissions,
          carbonIntensityGramPerTonKm: totalGatePassTonnage > 0 ? Number((scope1DirectDiesel / (totalGatePassTonnage * 10)).toFixed(1)) : 0,
          greenFleetEvAdoptionPct: 0,
          solarMicrogridCoveragePct: 0,
        };
      }
    }

    // 3. ERM Risks: strict zero state (starts empty until dynamically assessed or stored)
    const ermRisks = [];

    // 4. Strategic MSAs & Joint Ventures Summary
    const activeMsas = contracts.filter((c) => c.status === "ACTIVE_APPROVED" || c.status === "CLO_EXECUTED");
    const jointVentures = contracts.filter((c) => c.contractType === "STRATEGIC_JOINT_VENTURE");
    const fleetLeases = contracts.filter((c) => c.contractType === "CARRIER_FLEET_LEASING");

    return NextResponse.json({
      success: true,
      cloClearance: true,
      timestamp: new Date().toISOString(),
      macroMetrics,
      esgMetrics,
      ermRisks,
      capexSummary: {
        totalProjectsCount: capexProjects.length,
        allocatedCapexTotal,
        spentCapexTotal: capexProjects.reduce((sum, cp) => sum + (Number(cp.spentCapex) || 0), 0),
        activeProjects: capexProjects.filter((cp) => cp.status === "APPROVED_BY_CLO" || cp.status === "EXECUTION_PHASE").length,
      },
      msaSummary: {
        totalContractsCount: contracts.length,
        activeMsasCount: activeMsas.length,
        jointVenturesCount: jointVentures.length,
        fleetLeasesCount: fleetLeases.length,
        pendingCloSignOffCount: contracts.filter((c) => c.status === "PENDING_CLO_SIGN_OFF" || !c.cloSignOff).length,
      },
      departmentHeadcount: {
        totalStaff: departmentStaff.length,
        directorsCount: departmentStaff.filter((s) => getHierarchyRank(s.postLevel) === 6).length,
        managersCount: departmentStaff.filter((s) => getHierarchyRank(s.postLevel) === 5).length,
        supervisorsCount: departmentStaff.filter((s) => getHierarchyRank(s.postLevel) === 4).length,
      },
    });
  } catch (error) {
    console.error("[API CLO Enterprise Metrics Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load CLO macroeconomic metrics." },
      { status: 500 }
    );
  }
}

export const GET = withRouteMiddleware(getEnterpriseMetricsHandler, {
  roles: ["EMPLOYEE"],
  allowedDepartments: ["LOGISTICS"],
  requireApproved: true,
});
