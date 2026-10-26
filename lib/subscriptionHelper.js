// Unified Subscription & Plan Lifecycle Engine for FinOps SaaS Platform

export const PLAN_TIERS_CONFIG = {
  "Free Trial": {
    badge: "Free Trial",
    subtitle: "30-Day Evaluation Period",
    monthlyPrice: 0,
    annualPrice: 0,
    priceLabel: "Free Access",
    cycleDefault: "trial",
    defaultDurationDays: 30,
    maxUsers: 2,
    maxInvoices: "50 Bills / mo",
    caPortals: "1 CA Portal Login",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    branchesAllowed: "1 Unit",
    features: [
      "Always-Balanced Double Entry",
      "3-Way Order Matching Engine",
      "Section 43B(h) Policy Monitor",
      "Basic Shift Punch Attendance",
    ],
  },
  "MSME Starter": {
    badge: "MSME Starter",
    subtitle: "Small Trading & Service Units",
    monthlyPrice: 1999,
    annualPrice: 1499, // ₹1,499/mo billed annually
    priceLabel: "₹1,499 / mo",
    cycleDefault: "annual",
    defaultDurationDays: 365,
    maxUsers: 3,
    maxInvoices: "150 Invoices / mo",
    caPortals: "1 Dedicated CA Portal",
    badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    branchesAllowed: "Up to 3 Units",
    features: [
      "Native Double-Entry General Ledger",
      "Founder PO & Bill Approval Flow",
      "Basic GSTR-2B ITC Verification",
      "MCA Statutory Audit Trail",
      "Live Shift & Task Management",
    ],
  },
  "Manufacturing & Growth": {
    badge: "Manufacturing & Growth",
    subtitle: "Manufacturing Units & Busy Distributors",
    monthlyPrice: 4299,
    annualPrice: 3499, // ₹3,499/mo billed annually
    priceLabel: "₹3,499 / mo",
    cycleDefault: "annual",
    defaultDurationDays: 365,
    maxUsers: 10,
    maxInvoices: "Unlimited Bill Ingestion",
    caPortals: "2 Dedicated CA Portals",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    branchesAllowed: "Up to 10 Units",
    features: [
      "Full 3-Way Matching (PO, GRN & Bill)",
      "Section 43B(h) 45-Day Dues Tracker",
      "Automated TDS (194C, 194J, 194Q)",
      "Godown Low-Stock Auto-Alerts",
      "Multi-Department Work Deliverables",
    ],
  },
  "Enterprise Multi-Unit": {
    badge: "Enterprise Multi-Unit",
    subtitle: "Multi-Branch & Multi-GSTIN Units",
    monthlyPrice: 8499,
    annualPrice: 6999, // ₹6,999/mo billed annually
    priceLabel: "₹6,999 / mo",
    cycleDefault: "annual",
    defaultDurationDays: 365,
    maxUsers: 999,
    maxInvoices: "High-Volume & API Integration",
    caPortals: "Priority CA Concierge",
    badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    branchesAllowed: "Unlimited Multi-Branch",
    features: [
      "Multi-Branch & Multi-GSTIN Support",
      "Immutable Cloud Audit Trail Engine",
      "Custom Approval Hierarchies",
      "Dedicated FinOps Account Manager",
      "Unrestricted Corporate RBAC Roles",
    ],
  },
};

/**
 * Maps any raw plan string to one of the 4 canonical tier names
 */
export function normalizePlanName(rawPlan) {
  if (!rawPlan) return "Free Trial";
  const str = rawPlan.toString().trim();
  if (str.includes("Enterprise")) return "Enterprise Multi-Unit";
  if (str.includes("Manufacturing") || str.includes("Growth")) return "Manufacturing & Growth";
  if (str.includes("MSME") || str.includes("Starter")) return "MSME Starter";
  if (str.includes("Trial")) return "Free Trial";
  return "MSME Starter";
}

/**
 * Normalizes billing cycle string ("annual", "monthly", "trial")
 */
export function normalizeCycle(rawCycle, planName) {
  if (planName === "Free Trial") return "trial";
  if (!rawCycle) return "annual";
  const str = rawCycle.toString().toLowerCase().trim();
  if (str.includes("month")) return "monthly";
  if (str.includes("trial")) return "trial";
  return "annual";
}

/**
 * Calculates accurate Subscription End Date from Start Date & Cycle
 */
export function calculateSubscriptionEndDate(startDateInput, cycleInput, extendDays = 0) {
  const start = startDateInput ? new Date(startDateInput) : new Date();
  const cycle = (cycleInput || "annual").toLowerCase();
  const end = new Date(start.getTime());

  if (cycle === "monthly") {
    end.setMonth(end.getMonth() + 1);
  } else if (cycle === "trial") {
    end.setDate(end.getDate() + 30);
  } else {
    // Annual (default 1 calendar year)
    end.setFullYear(end.getFullYear() + 1);
  }

  if (extendDays && typeof extendDays === "number" && extendDays > 0) {
    end.setDate(end.getDate() + extendDays);
  }

  return end;
}

/**
 * Computes live subscription status & days remaining against current time
 */
export function computeSubscriptionTimeline(endDateInput, requestedStatus) {
  if (!endDateInput) {
    return {
      status: requestedStatus || "active",
      daysRemaining: null,
      isExpiringSoon: false,
      isExpired: false,
    };
  }

  const now = Date.now();
  const end = new Date(endDateInput).getTime();
  const diffMs = end - now;
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  let status = requestedStatus || "active";
  const isExpired = daysRemaining < 0;
  const isExpiringSoon = daysRemaining >= 0 && daysRemaining <= 7;

  if (isExpired) {
    status = daysRemaining >= -7 ? "past_due" : "expired";
  } else if (status === "expired" || status === "past_due") {
    // If end date is in future, it's active
    status = "active";
  }

  return {
    status,
    daysRemaining,
    isExpiringSoon,
    isExpired,
  };
}

/**
 * Resolves an Organization record for an Owner using all possible link paths
 */
export function resolveOrganizationForOwner(owner, orgMapByOwnerId = {}, orgMapByOrgId = {}) {
  if (!owner) return null;
  const ownerIdStr = owner._id?.toString();

  // 1. Direct match by org.ownerId
  if (ownerIdStr && orgMapByOwnerId[ownerIdStr]) {
    return orgMapByOwnerId[ownerIdStr];
  }

  // 2. Match by owner.organizationId
  if (owner.organizationId) {
    if (Array.isArray(owner.organizationId)) {
      for (const orgRef of owner.organizationId) {
        const idStr = orgRef?.toString ? orgRef.toString() : orgRef;
        if (idStr && orgMapByOrgId[idStr]) return orgMapByOrgId[idStr];
      }
    } else {
      const idStr = owner.organizationId?.toString ? owner.organizationId.toString() : owner.organizationId;
      if (idStr && orgMapByOrgId[idStr]) return orgMapByOrgId[idStr];
    }
  }

  return null;
}

/**
 * Builds a standardized, complete planDetails payload for any Owner & Organization
 */
export function buildFullPlanDetails(owner, organization, currentEmployees = 0) {
  if (!owner) return null;

  // Resolve plan name: check owner.subscription -> owner.planName -> org.planName -> org.plan
  const rawPlan =
    owner.subscription?.planName ||
    owner.planName ||
    organization?.planName ||
    organization?.plan ||
    "Free Trial";

  const canonicalPlan = normalizePlanName(rawPlan);
  const tierConfig = PLAN_TIERS_CONFIG[canonicalPlan] || PLAN_TIERS_CONFIG["Free Trial"];

  // Resolve cycle
  const rawCycle =
    owner.subscription?.cycle ||
    organization?.billingCycle ||
    tierConfig.cycleDefault;
  const canonicalCycle = normalizeCycle(rawCycle, canonicalPlan);

  // Resolve start date
  const startDate =
    owner.subscription?.startDate ||
    owner.createdAt ||
    organization?.createdAt ||
    new Date();

  // Resolve end date
  let endDate =
    owner.subscription?.endDate ||
    owner.subscriptionExpiry ||
    organization?.subscriptionEndDate ||
    null;

  if (!endDate) {
    endDate = calculateSubscriptionEndDate(startDate, canonicalCycle);
  }

  // Compute live timeline
  const rawStatus =
    owner.subscription?.status ||
    (canonicalPlan === "Free Trial" ? "trialing" : "active");
  const timeline = computeSubscriptionTimeline(endDate, rawStatus);

  // Resolve payment status
  const paymentStatus =
    organization?.paymentStatus ||
    (timeline.status === "active" ? "paid" : canonicalPlan === "Free Trial" ? "trialing" : "overdue");

  // Branches count
  const branchesConfigured = Array.isArray(organization?.branchList)
    ? organization.branchList.length
    : organization?.branches || 1;

  const maxSeats = tierConfig.maxUsers;
  const quotaPercent =
    maxSeats === 999
      ? 5
      : Math.min(100, Math.round((currentEmployees / maxSeats) * 100));

  const resolvedCompanyName =
    organization?.RegisterName ||
    organization?.name ||
    (owner.name ? `${owner.name}'s Organization` : "Unnamed Business");

  return {
    companyName: resolvedCompanyName,
    planName: canonicalPlan,
    badge: tierConfig.badge,
    subtitle: tierConfig.subtitle,
    badgeColor: tierConfig.badgeColor,
    priceLabel: tierConfig.priceLabel,
    price: tierConfig.priceLabel,
    monthlyPrice: tierConfig.monthlyPrice,
    annualPrice: tierConfig.annualPrice,
    priceMonthlyInr: tierConfig.monthlyPrice,
    priceAnnualInr: tierConfig.annualPrice,
    cycle: canonicalCycle,
    status: timeline.status,
    paymentStatus,
    startDate: new Date(startDate).toISOString(),
    endDate: new Date(endDate).toISOString(),
    daysRemaining: timeline.daysRemaining,
    isExpiringSoon: timeline.isExpiringSoon,
    isExpired: timeline.isExpired,
    hasUsedTrial: !!owner.subscription?.hasUsedTrial,
    currentEmployees,
    maxAllowedUsers: maxSeats,
    maxUsers: maxSeats,
    employeeLimit: maxSeats,
    maxInvoices: tierConfig.maxInvoices,
    caPortals: tierConfig.caPortals,
    quotaUtilizationPercent: quotaPercent,
    branchesConfigured,
    branchesAllowed: tierConfig.branchesAllowed,
    branchLimit: tierConfig.branchesAllowed,
    features: tierConfig.features,
    // Organization legal & banking context
    gstNumber: organization?.GST || "N/A",
    industry: organization?.industry || "Manufacturing",
    location: organization?.location || "Headquarters",
    bankName: organization?.BankName || "State Bank of India",
    ifsc: organization?.IFSC || "N/A",
    accNo: organization?.AccNo || "N/A",
  };
}
