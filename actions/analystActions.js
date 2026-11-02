"use server";

import connectDB from "@/lib/mongodb";
import SalesOrder from "@/models/SalesOrder";
import MarketingCampaign from "@/models/MarketingCampaign";
import Deal from "@/models/Deal";
import Lead from "@/models/Lead";
import { revalidatePath } from "next/cache";
import { z } from "zod";

/**
 * Helper to serialize Mongoose documents to plain JSON for Server Action boundaries
 */
function serializeDoc(doc) {
  if (!doc) return null;
  const raw = doc.toObject ? doc.toObject() : doc;
  return JSON.parse(
    JSON.stringify(raw, (key, value) => {
      if (
        key === "_id" ||
        (value && typeof value === "object" && value._bsontype === "ObjectID")
      ) {
        return value.toString();
      }
      return value;
    })
  );
}

// Zod Validation Schema for Campaign Creation
const CampaignInputSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  channel: z.string().default("Google Ads"),
  budget: z.coerce.number().min(0).default(0),
  spend: z.coerce.number().min(0).default(0),
  leadsCount: z.coerce.number().min(0).default(0),
  revenueGenerated: z.coerce.number().min(0).default(0),
  status: z.enum(["ACTIVE", "PAUSED", "COMPLETED"]).default("ACTIVE"),
  startDate: z.string().optional().default(""),
  endDate: z.string().optional().default(""),
  branchName: z.string().optional().default("Main HQ"),
  createdBy: z.string().optional().default("Sales Ops Analyst"),
});

/**
 * Server Action: Aggregates all SalesOrder documents from MongoDB via Mongoose.
 * Also retrieves Deal and Lead metrics to supply a unified live analytical picture.
 */
export async function getRevenueMetrics() {
  try {
    await connectDB();

    const [salesOrdersDocs, dealsDocs, leadsDocs] = await Promise.all([
      SalesOrder.find({}).sort({ createdAt: -1 }).lean(),
      Deal.find({}).lean(),
      Lead.find({}).lean(),
    ]);

    const salesOrders = (salesOrdersDocs || []).map(serializeDoc);
    const deals = (dealsDocs || []).map(serializeDoc);
    const leads = (leadsDocs || []).map(serializeDoc);

    const totalBookedRevenue = salesOrders.reduce((sum, so) => {
      return sum + (Number(so?.grandTotal ?? so?.totalAmount ?? 0) || 0);
    }, 0);

    const activePipelineValue = deals.reduce((sum, d) => {
      const stage = (d?.stage || "").toLowerCase();
      if (
        stage !== "won" &&
        stage !== "lost" &&
        stage !== "closed_won" &&
        stage !== "closed_lost"
      ) {
        return sum + (Number(d?.dealValue || d?.value || 0) || 0);
      }
      return sum;
    }, 0);

    const inboundLeadsCount = leads.filter(
      (l) => (l?.status || "").toLowerCase() === "unassigned" || (l?.status || "").toLowerCase() === "new"
    ).length;

    return {
      success: true,
      salesOrders,
      totalBookedRevenue,
      salesOrdersCount: salesOrders.length,
      activePipelineValue,
      inboundLeadsCount,
      deals,
    };
  } catch (error) {
    console.error("Failed to aggregate revenue metrics from MongoDB:", error);
    return {
      success: false,
      salesOrders: [],
      totalBookedRevenue: 0,
      salesOrdersCount: 0,
      activePipelineValue: 0,
      inboundLeadsCount: 0,
      deals: [],
      error: error.message || "Failed to fetch revenue metrics",
    };
  }
}

/**
 * Server Action: Fetches all MarketingCampaign documents from MongoDB.
 */
export async function getCampaignMetrics() {
  try {
    await connectDB();

    const campaignsDocs = await MarketingCampaign.find({})
      .sort({ createdAt: -1 })
      .lean();

    const campaigns = (campaignsDocs || []).map(serializeDoc);

    return {
      success: true,
      campaigns,
    };
  } catch (error) {
    console.error("Failed to fetch campaign metrics from MongoDB:", error);
    return {
      success: false,
      campaigns: [],
      error: error.message || "Failed to fetch campaign metrics",
    };
  }
}

/**
 * Server Action: Persists a new campaign payload to MongoDB and revalidates the route.
 */
export async function createMarketingCampaign(data) {
  try {
    const validated = CampaignInputSchema.parse(data);

    await connectDB();

    const spendNum = Number(validated.spend) || 0;
    const revNum = Number(validated.revenueGenerated) || 0;
    const computedRoi =
      spendNum > 0
        ? Number((((revNum - spendNum) / spendNum) * 100).toFixed(1))
        : 0;

    const campaign = await MarketingCampaign.create({
      ...validated,
      roi: computedRoi,
    });

    revalidatePath("/department/sales");

    return {
      success: true,
      campaign: serializeDoc(campaign),
    };
  } catch (error) {
    console.error("Failed to create marketing campaign:", error);
    return {
      success: false,
      error: error.message || "Failed to persist marketing campaign",
    };
  }
}
