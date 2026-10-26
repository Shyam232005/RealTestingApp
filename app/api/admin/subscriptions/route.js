import { NextResponse } from "next/server";
import { getAuthenticatedSuperAdmin } from "@/lib/adminAuth";
import connectDB from "@/lib/mongodb";
import Owner from "@/models/Owner";
import Organization from "@/models/Organization";
import Employee from "@/models/Employee";
import {
  PLAN_TIERS_CONFIG,
  resolveOrganizationForOwner,
  buildFullPlanDetails,
} from "@/lib/subscriptionHelper";

// Re-export for any consumers
export { PLAN_TIERS_CONFIG };

// GET /api/admin/subscriptions - Platform-wide plan telemetry & subscriber list
export async function GET() {
  try {
    const auth = await getAuthenticatedSuperAdmin();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    await connectDB();

    // Query all Owners and Organizations
    const [owners, organizations] = await Promise.all([
      Owner.find().select("-password").sort({ createdAt: -1 }).lean(),
      Organization.find().lean(),
    ]);

    // Build bi-directional lookup maps
    const orgMapByOwnerId = {};
    const orgMapByOrgId = {};
    organizations.forEach((org) => {
      if (org.ownerId) orgMapByOwnerId[org.ownerId.toString()] = org;
      if (org._id) orgMapByOrgId[org._id.toString()] = org;
    });

    // Query employee counts per owner
    const employeeCounts = await Employee.aggregate([
      { $group: { _id: "$companyId", count: { $sum: 1 } } },
    ]);
    const empCountMap = {};
    employeeCounts.forEach((ec) => {
      if (ec._id) empCountMap[ec._id.toString()] = ec.count;
    });

    // Track Tier Summaries
    const tierSummaries = {
      "Free Trial": { count: 0, activeCount: 0, totalRevenue: 0, subscribers: [] },
      "MSME Starter": { count: 0, activeCount: 0, totalRevenue: 0, subscribers: [] },
      "Manufacturing & Growth": { count: 0, activeCount: 0, totalRevenue: 0, subscribers: [] },
      "Enterprise Multi-Unit": { count: 0, activeCount: 0, totalRevenue: 0, subscribers: [] },
    };

    let totalActivePaid = 0;
    let totalTrialing = 0;
    let totalPastDueOrExpired = 0;
    let totalEstimatedMRR = 0;
    let cycleSplit = { monthly: 0, annual: 0, trial: 0 };

    const subscribers = owners.map((owner) => {
      const org = resolveOrganizationForOwner(owner, orgMapByOwnerId, orgMapByOrgId);
      const activeEmployees =
        empCountMap[owner._id.toString()] ||
        (Array.isArray(owner.employees) ? owner.employees.length : 0);

      const planDetails = buildFullPlanDetails(owner, org, activeEmployees);
      const tierConfig = PLAN_TIERS_CONFIG[planDetails.planName] || PLAN_TIERS_CONFIG["Free Trial"];

      // Aggregate revenue & metrics
      if (planDetails.status === "active" && planDetails.planName !== "Free Trial") {
        totalActivePaid++;
        totalEstimatedMRR += tierConfig.monthlyPrice;
      } else if (planDetails.status === "trialing" || planDetails.planName === "Free Trial") {
        totalTrialing++;
      } else if (planDetails.status === "expired" || planDetails.status === "past_due") {
        totalPastDueOrExpired++;
      }

      if (planDetails.cycle === "monthly") cycleSplit.monthly++;
      else if (planDetails.cycle === "annual") cycleSplit.annual++;
      else cycleSplit.trial++;

      if (tierSummaries[planDetails.planName]) {
        tierSummaries[planDetails.planName].count++;
        if (planDetails.status === "active") {
          tierSummaries[planDetails.planName].activeCount++;
          tierSummaries[planDetails.planName].totalRevenue += tierConfig.monthlyPrice;
        }
      }

      const subscriberRecord = {
        ownerId: owner._id,
        ownerName: owner.name,
        ownerEmail: owner.email,
        ownerPhone: owner.phoneNumber,
        organizationId: org?._id || null,
        organizationName: org?.RegisterName || org?.name || `${owner.name}'s Organization`,
        location: org?.location || planDetails.location || "Headquarters",
        gst: org?.GST || planDetails.gstNumber || "N/A",
        branchesCount: planDetails.branchesConfigured,
        planName: planDetails.planName,
        tierConfig,
        cycle: planDetails.cycle,
        status: planDetails.status,
        paymentStatus: planDetails.paymentStatus,
        startDate: planDetails.startDate,
        endDate: planDetails.endDate,
        daysRemaining: planDetails.daysRemaining,
        isExpiringSoon: planDetails.isExpiringSoon,
        isExpired: planDetails.isExpired,
        currentEmployees: activeEmployees,
        maxAllowedUsers: planDetails.maxAllowedUsers,
        quotaUtilizationPercent: planDetails.quotaUtilizationPercent,
        hasUsedTrial: planDetails.hasUsedTrial,
        planDetails,
        createdAt: owner.createdAt,
      };

      if (tierSummaries[planDetails.planName]) {
        tierSummaries[planDetails.planName].subscribers.push(subscriberRecord);
      }

      return subscriberRecord;
    });

    return NextResponse.json({
      success: true,
      metrics: {
        totalOrganizations: owners.length,
        totalActivePaid,
        totalTrialing,
        totalPastDueOrExpired,
        totalEstimatedMRR,
        totalEstimatedARR: totalEstimatedMRR * 12,
        cycleSplit,
      },
      tierSummaries: Object.entries(tierSummaries).map(([tierName, summary]) => ({
        tierName,
        config: PLAN_TIERS_CONFIG[tierName],
        count: summary.count,
        activeCount: summary.activeCount,
        monthlyRevenue: summary.totalRevenue,
      })),
      subscribers,
    });
  } catch (error) {
    console.error("SuperAdmin Subscriptions GET Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch subscriptions telemetry" },
      { status: 500 }
    );
  }
}
