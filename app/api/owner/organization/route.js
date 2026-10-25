import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";
import Owner from "@/models/Owner";
import Organization from "@/models/Organization";
import Employee from "@/models/Employee";
import CA from "@/models/CA";

// Helper: Extract & verify authenticated Owner session
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
            ? `${organization?.RegisterName || "Branch 1"} - Main (HQ)`
            : `Branch ${bNum}`),
        location:
          existing.location ||
          (bNum === 1 ? organization?.location || "Headquarters" : ""),
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
          (bNum === 1 ? organization?.createdAt || new Date() : null),
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

// GET /api/owner/organization - Retrieve current setup status and organization data
export async function GET() {
  try {
    const auth = await getAuthenticatedOwner();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { owner } = auth;
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

    // Auto-repair and guarantee embedded branchList matches branchCount in strict order
    if (organization) {
      const completeBranches = getCompleteBranchList(organization);

      const totalActiveStaff = completeBranches
        .filter((b) => b.status === "active")
        .reduce((sum, b) => sum + (Number(b.staffCount) || 0), 0);

      const needsUpdate =
        JSON.stringify(organization.branchList || []) !==
          JSON.stringify(completeBranches) ||
        organization.employeeCount !== totalActiveStaff;

      if (needsUpdate) {
        await Organization.collection.updateOne(
          { _id: organization._id },
          {
            $set: {
              branchList: completeBranches,
              employeeCount: totalActiveStaff,
              updatedAt: new Date(),
            },
          }
        );
        organization = await Organization.collection.findOne({ _id: organization._id });
      }
    }

    // Ensure owner has an invite code for staff and CA connections
    if (!owner.inviteCode) {
      owner.inviteCode = `BIZ-${owner._id.toString().slice(-6).toUpperCase()}`;
      await owner.save();
    }

    // Fetch all employees registered under this owner
    const employees = await Employee.find({
      $or: [
        { companyId: owner._id },
        { ownerId: owner._id },
        { _id: { $in: owner.employees || [] } },
      ],
    })
      .select("name email phoneNumber role roleInCompany department isActive createdAt")
      .lean();

    // Fetch linked CAs
    let linkedCAsList = [];
    if (owner.linkedCA) {
      const primaryCA = await CA.findById(owner.linkedCA)
        .select("name email phoneNumber icaiNumber caInviteCode isVerifiedICAI isActive")
        .lean();
      if (primaryCA) linkedCAsList.push({ ...primaryCA, isPrimary: true });
    }

    if (owner.linkedCAs && owner.linkedCAs.length > 0) {
      const extraCAs = await CA.find({ _id: { $in: owner.linkedCAs } })
        .select("name email phoneNumber icaiNumber caInviteCode isVerifiedICAI isActive")
        .lean();
      extraCAs.forEach((c) => {
        if (!linkedCAsList.some((item) => item._id?.toString() === c._id?.toString())) {
          linkedCAsList.push(c);
        }
      });
    }

    // Also check if any CA lists this owner in their clients or clientCompanies
    const clientCAs = await CA.find({
      $or: [{ clients: owner._id }, { clientCompanies: owner._id }],
    })
      .select("name email phoneNumber icaiNumber caInviteCode isVerifiedICAI isActive")
      .lean();

    clientCAs.forEach((c) => {
      if (!linkedCAsList.some((item) => item._id?.toString() === c._id?.toString())) {
        linkedCAsList.push(c);
      }
    });

    return NextResponse.json(
      {
        isSetupComplete: !!owner.isSetupComplete,
        organization: organization,
        owner: {
          id: owner._id,
          name: owner.name,
          email: owner.email,
          phoneNumber: owner.phoneNumber,
          inviteCode: owner.inviteCode,
          subscription: owner.subscription,
          dataSharingStatus: owner.dataSharingStatus || "NONE",
          employees: employees || [],
          linkedCAs: linkedCAsList || [],
        },
      },
      {
        status: 200,
        headers: { "X-Finora-Version": "live-v2" },
      }
    );
  } catch (error) {
    console.error("GET /api/owner/organization error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST /api/owner/organization - Setup or update organization
export async function POST(request) {
  try {
    const auth = await getAuthenticatedOwner();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { owner, decoded } = auth;
    const body = await request.json();

    const {
      planName,
      billingCycle,
      paymentStatus,
      RegisterName,
      GST,
      BankName,
      IFSC,
      AccNo,
      location,
      industry,
      branches,
      activeDepartments,
      primaryWarehouse,
      openingBalance,
      openingCash,
      currentStockValue,
      monthlyRevenueTarget,
      monthlyProductionTarget,
      defaultCreditDays,
      poApprovalLimit,
      maxDiscountPercent,
      minCashReserveAlert,
      lowStockThresholdPercent,
      inventoryValuationMethod,
      mcaAuditLog,
    } = body;

    // Strict Validations with Min & Max Limits
    if (!RegisterName || RegisterName.trim().length < 3 || RegisterName.trim().length > 120) {
      return NextResponse.json(
        { error: "Business name must be between 3 and 120 characters." },
        { status: 400 }
      );
    }

    const cleanGST = GST ? GST.trim().toUpperCase() : "";
    if (!cleanGST || cleanGST.length !== 15) {
      return NextResponse.json(
        { error: "GSTIN must be exactly 15 characters." },
        { status: 400 }
      );
    }

    if (!location || location.trim().length < 2 || location.trim().length > 100) {
      return NextResponse.json(
        { error: "Operating location must be between 2 and 100 characters." },
        { status: 400 }
      );
    }

    if (!industry || !industry.trim()) {
      return NextResponse.json(
        { error: "Please select an industry sector." },
        { status: 400 }
      );
    }

    const branchCount = Number(branches);
    if (!branches || isNaN(branchCount) || branchCount < 1 || branchCount > 1000) {
      return NextResponse.json(
        { error: "Operating branches must be a valid number between 1 and 1000." },
        { status: 400 }
      );
    }

    if (!BankName || BankName.trim().length < 2 || BankName.trim().length > 80) {
      return NextResponse.json(
        { error: "Bank name must be between 2 and 80 characters." },
        { status: 400 }
      );
    }

    const cleanIFSC = IFSC ? IFSC.trim().toUpperCase() : "";
    if (!cleanIFSC || cleanIFSC.length !== 11) {
      return NextResponse.json(
        { error: "Bank IFSC code must be exactly 11 characters (e.g. SBIN0001234)." },
        { status: 400 }
      );
    }

    const cleanAccNo = AccNo ? AccNo.trim() : "";
    if (!cleanAccNo || cleanAccNo.length < 9 || cleanAccNo.length > 18 || !/^\d+$/.test(cleanAccNo)) {
      return NextResponse.json(
        { error: "Bank account number must be between 9 and 18 digits (numbers only)." },
        { status: 400 }
      );
    }

    if (!primaryWarehouse || primaryWarehouse.trim().length < 2) {
      return NextResponse.json(
        { error: "Primary warehouse name must be at least 2 characters." },
        { status: 400 }
      );
    }

    if (!Array.isArray(activeDepartments) || activeDepartments.length === 0) {
      return NextResponse.json(
        { error: "Please select at least one active operational department." },
        { status: 400 }
      );
    }

    const creditDays = Number(defaultCreditDays);
    if (defaultCreditDays !== undefined && (isNaN(creditDays) || creditDays < 1 || creditDays > 90)) {
      return NextResponse.json(
        { error: "Default vendor credit days must be between 1 and 90 days." },
        { status: 400 }
      );
    }

    const poLimit = Number(poApprovalLimit);
    if (poApprovalLimit !== undefined && (isNaN(poLimit) || poLimit < 1 || poLimit > 1000000000)) {
      return NextResponse.json(
        { error: "PO approval threshold must be between ₹1 and ₹1,00,00,00,000." },
        { status: 400 }
      );
    }

    const maxDisc = Number(maxDiscountPercent);
    if (maxDiscountPercent !== undefined && (isNaN(maxDisc) || maxDisc < 0 || maxDisc > 100)) {
      return NextResponse.json(
        { error: "Maximum sales discount percentage must be between 0% and 100%." },
        { status: 400 }
      );
    }

    const lowStock = Number(lowStockThresholdPercent);
    if (lowStockThresholdPercent !== undefined && (isNaN(lowStock) || lowStock < 1 || lowStock > 100)) {
      return NextResponse.json(
        { error: "Low stock alert threshold must be between 1% and 100%." },
        { status: 400 }
      );
    }

    // Format multiple stock items if submitted
    let cleanStockCatalog = [];
    if (Array.isArray(body.stockItems)) {
      cleanStockCatalog = body.stockItems
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

    // Preserve existing branches if updating, or create fresh branchList
    let existingOrg = null;
    if (owner.organizationId) {
      const orgId = Array.isArray(owner.organizationId)
        ? owner.organizationId[0]
        : owner.organizationId;
      existingOrg = await Organization.findById(orgId);
    }
    if (!existingOrg) {
      existingOrg = await Organization.findOne({ ownerId: owner._id });
    }

    const mainStaff = Math.max(0, Number(body.employeeCount) || 0);

    const completeBranches = getCompleteBranchList({
      ...(existingOrg ? (typeof existingOrg.toObject === "function" ? existingOrg.toObject() : existingOrg) : {}),
      branches: branchCount,
      RegisterName,
      location,
      employeeCount: mainStaff,
    });

    // Update Main HQ (Branch 1) with latest statutory profile details
    completeBranches[0].name = `${RegisterName.trim()} - Main (HQ)`;
    completeBranches[0].location = location.trim();
    if (body.employeeCount !== undefined) {
      completeBranches[0].staffCount = mainStaff;
    }
    if (cleanStockCatalog.length > 0) {
      completeBranches[0].stockItems = cleanStockCatalog;
    }

    const trimmedBranches = completeBranches.slice(0, branchCount);

    const totalStaffAcrossAllActive = trimmedBranches
      .filter((b) => b.status === "active")
      .reduce((sum, b) => sum + (Number(b.staffCount) || 0), 0);

    const orgPayload = {
      ownerId: owner._id,
      planName: planName || owner.subscription?.planName || "MSME Starter",
      billingCycle: billingCycle || owner.subscription?.cycle || "annual",
      paymentStatus:
        paymentStatus ||
        (owner.subscription?.status === "active" ? "paid" : "trialing"),
      RegisterName: RegisterName.trim(),
      GST: cleanGST,
      BankName: BankName.trim(),
      IFSC: cleanIFSC,
      AccNo: cleanAccNo,
      location: location.trim(),
      industry: industry.trim(),
      branches: branchCount,
      employeeCount: totalStaffAcrossAllActive,
      branchList: trimmedBranches,
      stockCatalog:
        cleanStockCatalog.length > 0
          ? cleanStockCatalog
          : existingOrg?.stockCatalog || [],
      activeDepartments: activeDepartments,
      primaryWarehouse: primaryWarehouse.trim(),
      openingBalance: Number(openingBalance) || 0,
      openingCash: Number(openingCash) || 0,
      currentStockValue: Number(currentStockValue) || 0,
      monthlyRevenueTarget: Number(monthlyRevenueTarget) || 0,
      monthlyProductionTarget: Number(monthlyProductionTarget) || 0,
      defaultCreditDays: creditDays || 30,
      poApprovalLimit: poLimit || 25000,
      maxDiscountPercent: isNaN(maxDisc) ? 10 : maxDisc,
      minCashReserveAlert: Number(minCashReserveAlert) || 100000,
      lowStockThresholdPercent: lowStock || 15,
      inventoryValuationMethod: inventoryValuationMethod || "lot_wise",
      mcaAuditLog: mcaAuditLog !== undefined ? Boolean(mcaAuditLog) : true,
    };

    // Upsert Organization directly to MongoDB
    await Organization.collection.updateOne(
      { ownerId: owner._id },
      { $set: orgPayload },
      { upsert: true }
    );
    const organization = await Organization.collection.findOne({ ownerId: owner._id });

    // Update Owner status
    owner.isSetupComplete = true;
    owner.organizationId = organization._id;
    await owner.save();

    // Re-issue updated JWT session with isSetupComplete: true & companyId
    // CRITICAL FIX: Strip existing 'iat' and 'exp' so jwt.sign with expiresIn works without collision
    const { iat, exp, ...cleanDecoded } = decoded;
    const updatedPayload = {
      ...cleanDecoded,
      companyId: organization._id.toString(),
      isSetupComplete: true,
    };

    const token = jwt.sign(updatedPayload, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    const cookieStore = await cookies();
    cookieStore.set({
      name: "crown_session",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Organization initialized successfully!",
        organization: organization,
        redirectUrl: "/owner/dashboard",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/owner/organization error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save organization." },
      { status: 500 }
    );
  }
}
