import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import Owner from "@/models/Owner";
import Organization from "@/models/Organization";

async function getAuthenticatedOwner() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("crown_session")?.value;

  if (!sessionToken) {
    return { error: "Not authenticated. Please log in.", status: 401 };
  }

  let decoded;
  try {
    decoded = jwt.verify(sessionToken, process.env.JWT_SECRET);
  } catch (err) {
    return { error: "Invalid or expired session. Please log in again.", status: 401 };
  }

  if (decoded.normalizedRole !== "OWNER" && decoded.role !== "Owner" && decoded.role !== "OWNER") {
    return { error: "Access denied. Only business owners can perform this action.", status: 403 };
  }

  await connectDB();
  const owner = await Owner.findById(decoded.userId);
  if (!owner) {
    return { error: "Owner account not found.", status: 404 };
  }

  return { owner, decoded };
}

// Helper: Build or repair complete, in-order branchList from 1 to branchCount
function getCompleteBranchList(organization) {
  const branchCount = Math.max(1, Number(organization?.branches || 1));
  const rawList = Array.isArray(organization?.branchList)
    ? JSON.parse(JSON.stringify(organization.branchList))
    : [];

  const completeList = [];

  for (let bNum = 1; bNum <= branchCount; bNum++) {
    const bId = `branch-${bNum}`;
    const existing = rawList.find(
      (b) => b.branchId === bId || b.branchNumber === bNum
    );

    if (existing) {
      completeList.push({
        ...existing,
        branchId: bId,
        branchNumber: bNum,
        name:
          existing.name ||
          (bNum === 1
            ? `${organization.RegisterName} - Main (HQ)`
            : `Branch ${bNum}`),
        location:
          existing.location ||
          (bNum === 1 ? organization.location || "Headquarters" : ""),
        status: bNum === 1 ? "active" : existing.status || "inactive",
        staffCount: Math.max(0, Number(existing.staffCount) || 0),
        lastMonthSales: Math.max(0, Number(existing.lastMonthSales) || 0),
        monthlySalesTarget: Math.max(0, Number(existing.monthlySalesTarget) || 0),
        currentMonthSales: Math.max(0, Number(existing.currentMonthSales) || 0),
        allocatedFunds: Math.max(0, Number(existing.allocatedFunds) || 0),
        stockItems: Array.isArray(existing.stockItems) ? existing.stockItems : [],
        customers: Array.isArray(existing.customers) ? existing.customers : [],
        offers: Array.isArray(existing.offers) ? existing.offers : [],
        activatedAt:
          existing.activatedAt ||
          (bNum === 1 ? organization.createdAt || new Date() : null),
      });
    } else {
      completeList.push({
        branchId: bId,
        branchNumber: bNum,
        name:
          bNum === 1
            ? `${organization?.RegisterName || "Branch 1"} - Main (HQ)`
            : `Branch ${bNum}`,
        location:
          bNum === 1 ? organization?.location || "Headquarters" : "",
        status: bNum === 1 ? "active" : "inactive",
        staffCount:
          bNum === 1
            ? Math.max(0, Number(organization?.employeeCount) || 0)
            : 0,
        lastMonthSales:
          bNum === 1 ? Number(organization?.monthlyRevenueTarget) || 0 : 0,
        monthlySalesTarget:
          bNum === 1 ? Number(organization?.monthlyRevenueTarget) || 0 : 0,
        currentMonthSales: 0,
        allocatedFunds:
          bNum === 1
            ? (Number(organization?.openingBalance) || 0) +
              (Number(organization?.openingCash) || 0)
            : 0,
        stockItems: bNum === 1 ? organization?.stockCatalog || [] : [],
        customers: [],
        offers: [],
        activatedAt: bNum === 1 ? organization?.createdAt || new Date() : null,
      });
    }
  }

  return completeList;
}

export async function POST(request) {
  try {
    const auth = await getAuthenticatedOwner();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { owner } = auth;
    const body = await request.json();
    const {
      branchId,
      branchNumber,
      name,
      location,
      staffCount,
      lastMonthSales,
      monthlySalesTarget,
      allocatedFunds,
      stockItems,
    } = body;

    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Branch name must be at least 2 characters." },
        { status: 400 }
      );
    }

    if (!location || location.trim().length < 2) {
      return NextResponse.json(
        { error: "Branch location / address must be at least 2 characters." },
        { status: 400 }
      );
    }

    let organization = null;
    if (owner.organizationId) {
      const orgId = Array.isArray(owner.organizationId)
        ? owner.organizationId[0]
        : owner.organizationId;
      organization = await Organization.findById(orgId);
    }
    if (!organization) {
      organization = await Organization.findOne({ ownerId: owner._id });
    }

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found. Complete organization setup first." },
        { status: 404 }
      );
    }

    // Always work with complete in-order branch list
    const branches = getCompleteBranchList(organization);
    const bNum = Number(branchNumber) || 1;
    const targetIndex = branches.findIndex(
      (b) => b.branchId === branchId || b.branchNumber === bNum
    );

    if (targetIndex === -1) {
      return NextResponse.json(
        { error: `Branch unit #${bNum} is not part of this organization.` },
        { status: 404 }
      );
    }

    // Format stock items
    let cleanStock = [];
    if (Array.isArray(stockItems)) {
      cleanStock = stockItems
        .filter((item) => item && item.name && item.name.trim())
        .map((item) => ({
          itemId: item.itemId || new mongoose.Types.ObjectId().toString(),
          name: item.name.trim(),
          category: item.category ? item.category.trim() : "Finished Goods",
          sku: item.sku ? item.sku.trim() : "",
          quantity: Math.max(0, Number(item.quantity) || 0),
          unit: item.unit ? item.unit.trim() : "Pcs",
          unitPrice: Math.max(0, Number(item.unitPrice) || 0),
          stockStatus:
            Number(item.quantity) > 10
              ? "in_stock"
              : Number(item.quantity) > 0
              ? "low_stock"
              : "out_of_stock",
          lastUpdated: new Date(),
        }));
    }

    const branchData = {
      ...branches[targetIndex],
      branchId: branchId || `branch-${bNum}`,
      branchNumber: bNum,
      name: name.trim(),
      location: location.trim(),
      status: "active",
      staffCount: Math.max(0, Number(staffCount) || 0),
      lastMonthSales: Math.max(0, Number(lastMonthSales) || 0),
      monthlySalesTarget: Math.max(0, Number(monthlySalesTarget) || 0),
      currentMonthSales: branches[targetIndex].currentMonthSales || 0,
      allocatedFunds: Math.max(0, Number(allocatedFunds) || 0),
      stockItems: cleanStock.length > 0 ? cleanStock : branches[targetIndex].stockItems || [],
      activatedAt: branches[targetIndex].activatedAt || new Date(),
    };

    branches[targetIndex] = branchData;

    // Recalculate total staff capacity across all active branches
    const totalStaff = branches
      .filter((b) => b.status === "active")
      .reduce((sum, b) => sum + (Number(b.staffCount) || 0), 0);

    // Atomically and permanently persist updated branchList & staff count directly to MongoDB
    await Organization.collection.updateOne(
      { _id: organization._id },
      {
        $set: {
          branchList: branches,
          employeeCount: totalStaff,
          updatedAt: new Date(),
        },
      }
    );

    const freshOrg = await Organization.collection.findOne({ _id: organization._id });

    return NextResponse.json(
      {
        message: `Branch "${branchData.name}" activated permanently!`,
        branch: branchData,
        organization: freshOrg,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/owner/branches/activate error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
