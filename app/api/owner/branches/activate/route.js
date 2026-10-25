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

    const organization = await Organization.findOne({ ownerId: owner._id });
    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found. Complete organization setup first." },
        { status: 404 }
      );
    }

    let branches = organization.branchList || [];
    const bNum = Number(branchNumber) || 1;
    const targetIndex = branches.findIndex(
      (b) => b.branchId === branchId || b.branchNumber === bNum
    );

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
      branchId: branchId || `branch-${bNum}`,
      branchNumber: bNum,
      name: name.trim(),
      location: location.trim(),
      status: "active",
      staffCount: Math.max(0, Number(staffCount) || 0),
      lastMonthSales: Math.max(0, Number(lastMonthSales) || 0),
      monthlySalesTarget: Math.max(0, Number(monthlySalesTarget) || 0),
      currentMonthSales: 0,
      allocatedFunds: Math.max(0, Number(allocatedFunds) || 0),
      stockItems: cleanStock,
      customers: targetIndex >= 0 ? branches[targetIndex].customers || [] : [],
      offers: targetIndex >= 0 ? branches[targetIndex].offers || [] : [],
      activatedAt: new Date(),
    };

    if (targetIndex >= 0) {
      branches[targetIndex] = branchData;
    } else {
      branches.push(branchData);
    }

    organization.branchList = branches;
    await organization.save();

    return NextResponse.json(
      {
        message: `Branch "${branchData.name}" activated successfully!`,
        branch: branchData,
        organization,
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
