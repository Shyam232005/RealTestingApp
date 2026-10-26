import { NextResponse } from "next/server";
import { getAuthenticatedSuperAdmin } from "@/lib/adminAuth";
import connectDB from "@/lib/mongodb";
import Owner from "@/models/Owner";
import Organization from "@/models/Organization";
import {
  normalizePlanName,
  normalizeCycle,
  calculateSubscriptionEndDate,
} from "@/lib/subscriptionHelper";

// PUT /api/admin/subscriptions/[id] - SuperAdmin updates or extends subscription
export async function PUT(request, { params }) {
  try {
    const auth = await getAuthenticatedSuperAdmin();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    await connectDB();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const {
      planName,
      cycle,
      status,
      extendDays,
      endDate,
      paymentStatus,
    } = body;

    // Find Owner by ID or by organization ownerId
    let owner = await Owner.findById(id);
    if (!owner) {
      const org = await Organization.findById(id);
      if (org && org.ownerId) {
        owner = await Owner.findById(org.ownerId);
      }
    }

    if (!owner) {
      return NextResponse.json(
        { error: "Owner or Organization subscription record not found." },
        { status: 404 }
      );
    }

    // Ensure subscription object exists
    if (!owner.subscription) {
      owner.subscription = {
        planName: "Free Trial",
        cycle: "trial",
        status: "trialing",
        startDate: owner.createdAt || new Date(),
        endDate: null,
      };
    }

    // Canonical values
    const canonicalPlan = normalizePlanName(planName || owner.subscription.planName || owner.planName);
    const canonicalCycle = normalizeCycle(cycle || owner.subscription.cycle, canonicalPlan);

    owner.subscription.planName = canonicalPlan;
    owner.planName = canonicalPlan;
    owner.subscription.cycle = canonicalCycle;
    owner.subscription.status = status || (canonicalPlan === "Free Trial" ? "trialing" : "active");

    const startDate = owner.subscription.startDate || owner.createdAt || new Date();
    owner.subscription.startDate = startDate;

    // Calculate End Date
    let newExpiry;
    if (endDate) {
      newExpiry = new Date(endDate);
    } else if (extendDays && typeof extendDays === "number" && extendDays > 0) {
      const currentExpiry = owner.subscription.endDate
        ? new Date(owner.subscription.endDate).getTime()
        : Date.now();
      const baseTime = Math.max(currentExpiry, Date.now());
      newExpiry = new Date(baseTime + extendDays * 24 * 60 * 60 * 1000);
    } else {
      // Calculate standard cycle duration from startDate (or today if already in past)
      newExpiry = calculateSubscriptionEndDate(startDate, canonicalCycle);
      // If calculated date is still in past, renew from today for standard cycle
      if (newExpiry.getTime() < Date.now()) {
        newExpiry = calculateSubscriptionEndDate(new Date(), canonicalCycle);
      }
    }

    owner.subscription.endDate = newExpiry;
    owner.subscriptionExpiry = newExpiry;

    await owner.save();

    // Sync with Organization
    const resolvedPaymentStatus =
      paymentStatus || (owner.subscription.status === "active" ? "paid" : "trialing");

    const orgFilter = {
      $or: [
        { ownerId: owner._id },
        ...(owner.organizationId
          ? [{ _id: { $in: Array.isArray(owner.organizationId) ? owner.organizationId : [owner.organizationId] } }]
          : []),
      ],
    };

    await Organization.updateOne(
      orgFilter,
      {
        $set: {
          planName: canonicalPlan,
          plan: canonicalPlan,
          billingCycle: canonicalCycle,
          paymentStatus: resolvedPaymentStatus,
          subscriptionStartDate: startDate,
          subscriptionEndDate: newExpiry,
          subscriptionStatus: owner.subscription.status,
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: `Subscription for ${owner.name} updated to ${canonicalPlan} (${canonicalCycle} cycle, status: ${owner.subscription.status})!`,
      subscription: {
        planName: canonicalPlan,
        cycle: canonicalCycle,
        status: owner.subscription.status,
        paymentStatus: resolvedPaymentStatus,
        startDate: owner.subscription.startDate,
        endDate: newExpiry,
      },
    });
  } catch (error) {
    console.error("SuperAdmin Subscription Update Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update subscription" },
      { status: 500 }
    );
  }
}
