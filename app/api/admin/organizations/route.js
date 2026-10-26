import { NextResponse } from "next/server";
import { getAuthenticatedSuperAdmin } from "@/lib/adminAuth";
import connectDB from "@/lib/mongodb";
import Organization from "@/models/Organization";
import Owner from "@/models/Owner";
import Employee from "@/models/Employee";
import {
  buildFullPlanDetails,
  normalizePlanName,
} from "@/lib/subscriptionHelper";

export async function GET() {
  try {
    const auth = await getAuthenticatedSuperAdmin();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    await connectDB();
    const [organizations, owners] = await Promise.all([
      Organization.find().sort({ createdAt: -1 }).lean(),
      Owner.find().lean(),
    ]);

    // Build owner lookup maps
    const ownerById = new Map();
    const ownerByOrgId = new Map();

    owners.forEach((o) => {
      const oId = o._id.toString();
      ownerById.set(oId, o);

      if (o.organizationId) {
        if (Array.isArray(o.organizationId)) {
          o.organizationId.forEach((oid) => {
            if (oid) ownerByOrgId.set(oid.toString(), o);
          });
        } else {
          ownerByOrgId.set(o.organizationId.toString(), o);
        }
      }
    });

    // Count employees per companyId
    const employeeCounts = await Employee.aggregate([
      {
        $group: {
          _id: "$companyId",
          count: { $sum: 1 },
        },
      },
    ]);

    const countMap = new Map();
    employeeCounts.forEach((ec) => {
      if (ec._id) countMap.set(ec._id.toString(), ec.count);
    });

    // Enrich organizations with canonical owner & plan data
    const enriched = organizations.map((org) => {
      const orgIdStr = org._id.toString();
      const ownerIdStr = org.ownerId ? org.ownerId.toString() : null;

      // Dual-path resolution: by org.ownerId or owner.organizationId
      const owner =
        (ownerIdStr && ownerById.get(ownerIdStr)) ||
        ownerByOrgId.get(orgIdStr) ||
        null;

      const employeeCount =
        (owner && countMap.get(owner._id.toString())) ||
        countMap.get(orgIdStr) ||
        0;

      const planDetails = buildFullPlanDetails(owner, org, employeeCount);

      return {
        _id: org._id,
        name: org.RegisterName || org.name || "Unnamed Business",
        plan: planDetails.planName || normalizePlanName(org.planName || "Free Trial"),
        cycle: planDetails.cycle,
        status: planDetails.status,
        planDetails,
        ownerId: owner ? owner._id : org.ownerId,
        ownerName: owner?.name || "Unknown Owner",
        ownerEmail: owner?.email || "N/A",
        ownerPhone: owner?.phoneNumber || "N/A",
        branchCount: Array.isArray(org.branchList) ? org.branchList.length : 1,
        branchList: org.branchList || [],
        employeeCount,
        createdAt: org.createdAt || owner?.createdAt,
      };
    });

    return NextResponse.json({
      success: true,
      organizations: enriched,
      totalCount: enriched.length,
    });
  } catch (error) {
    console.error("SuperAdmin Organizations GET Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load organizations" },
      { status: 500 }
    );
  }
}
