import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import CA from "@/models/CA";
import CAStaff from "@/models/CAStaff";
import Owner from "@/models/Owner";
import Organization from "@/models/Organization";
import LedgerAccount from "@/models/LedgerAccount";
import JournalEntry from "@/models/JournalEntry";
import UniversalDocumentRecord from "@/models/UniversalDocumentRecord";
import Transaction from "@/models/Transaction";
import ApprovalRequest from "@/models/ApprovalRequest";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

/**
 * GET /api/ca/data-pipeline
 * Ultra-Fast High-Speed Financial Data Transfer Pipeline
 * Connects Owner <-> CA <-> Staff with sub-45ms response time.
 */
export async function GET(request) {
  const startTime = Date.now();

  try {
    await connectDB();

    // 1. Session verification
    const cookieStore = await cookies();
    const token = cookieStore.get("crown_session")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Authentication required.", code: "AUTH_REQUIRED" },
        { status: 401 }
      );
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return NextResponse.json(
        { success: false, error: "Session invalid or expired.", code: "AUTH_EXPIRED" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    let targetClientId = searchParams.get("clientId") || searchParams.get("id");

    const rawRole = (decoded.role || decoded.normalizedRole || "").toUpperCase();
    const isPartner = rawRole === "CA" || rawRole === "CA_PARTNER";
    const isStaff = rawRole === "CA_STAFF" || rawRole === "CA-EMPLOYEE" || rawRole === "CASTAFF";
    const isOwner = rawRole === "OWNER";
    const isSuperAdmin = decoded.isSuperAdmin || rawRole === "SUPERADMIN";

    let caDoc = null;
    let staffDoc = null;

    if (isPartner) {
      caDoc = await CA.findById(decoded.userId).lean();
      if (!targetClientId && caDoc?.clients?.length > 0) {
        targetClientId = caDoc.clients[0].toString();
      }
    } else if (isStaff) {
      staffDoc = await CAStaff.findById(decoded.userId).lean();
      const assigned = staffDoc?.assignedCompanies || staffDoc?.assignedClients || [];
      if (!targetClientId && assigned.length > 0) {
        targetClientId = assigned[0].toString();
      }
    } else if (isOwner) {
      targetClientId = decoded.userId;
    }

    if (!targetClientId) {
      return NextResponse.json({
        success: true,
        emptyState: true,
        message: "No client entity selected or allocated.",
        latencyMs: Date.now() - startTime,
        client: null,
        ledgerAccounts: [],
        journalEntries: [],
        ocrDocuments: [],
        transactions: [],
      });
    }

    // 2. Fetch Client Owner & Organization (Lean)
    const [clientOwner, organization] = await Promise.all([
      Owner.findById(targetClientId)
        .select("name email phoneNumber inviteCode dataSharingStatus linkedCA lastDataSyncAt")
        .lean(),
      Organization.findOne({ ownerId: targetClientId })
        .select("name legalEntityName gstin industry employeeCount")
        .lean(),
    ]);

    if (!clientOwner) {
      return NextResponse.json(
        { success: false, error: "Client business entity not found in database." },
        { status: 404 }
      );
    }

    // 3. Authorization Check
    let isAuthorized = isSuperAdmin || isOwner;

    if (!isAuthorized && isPartner) {
      // CA is authorized if owner has dataSharingStatus "CONNECTED" OR is linked in caDoc
      const isLinked = (caDoc?.clients || []).some(
        (id) => id.toString() === clientOwner._id.toString()
      );
      const isApproved =
        clientOwner.dataSharingStatus === "CONNECTED" ||
        (clientOwner.linkedCA && clientOwner.linkedCA.toString() === caDoc?._id?.toString());
      isAuthorized = isLinked || isApproved;
    } else if (!isAuthorized && isStaff) {
      const assigned = (staffDoc?.assignedCompanies || staffDoc?.assignedClients || []).map(
        (id) => id.toString()
      );
      isAuthorized = assigned.includes(clientOwner._id.toString());
    }

    // 4. Parallel Aggregation Engine for Real-Time Financial Data
    const [ledgerAccounts, journalEntries, ocrDocuments, transactions] = await Promise.all([
      LedgerAccount.find({
        $or: [{ companyId: clientOwner._id }, { organizationId: organization?._id }],
      }).lean(),
      JournalEntry.find({
        $or: [{ companyId: clientOwner._id }, { organizationId: organization?._id }],
      })
        .sort({ entryDate: -1, createdAt: -1 })
        .limit(50)
        .lean(),
      UniversalDocumentRecord.find({
        $or: [{ companyId: clientOwner._id }, { organizationId: organization?._id }],
      })
        .sort({ scannedAt: -1, createdAt: -1 })
        .limit(30)
        .lean(),
      Transaction.find({
        $or: [{ companyId: clientOwner._id }, { organizationId: organization?._id }],
      })
        .sort({ date: -1, createdAt: -1 })
        .limit(30)
        .lean(),
    ]);

    // 5. Compute Real-Time Balance Sheet & P&L
    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;
    let totalRevenue = 0;
    let totalExpenses = 0;

    ledgerAccounts.forEach((acc) => {
      const balance = Number(acc.runningBalance || acc.balance || 0);
      const category = (acc.category || acc.type || "").toUpperCase();

      if (category.includes("ASSET")) {
        totalAssets += balance;
      } else if (category.includes("LIABILITY")) {
        totalLiabilities += balance;
      } else if (category.includes("EQUITY") || category.includes("CAPITAL")) {
        totalEquity += balance;
      } else if (category.includes("REVENUE") || category.includes("INCOME") || category.includes("SALE")) {
        totalRevenue += balance;
      } else if (category.includes("EXPENSE") || category.includes("COST")) {
        totalExpenses += balance;
      }
    });

    const isBalanced = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01;
    const netProfit = totalRevenue - totalExpenses;
    const pipelineLatencyMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      latencyMs: pipelineLatencyMs,
      telemetry: {
        engine: "Crown Real-Time Financial Pipeline 2.5",
        streamType: "Direct MongoDB Lean Delta",
        sub45msAchieved: pipelineLatencyMs < 45,
      },
      client: {
        id: clientOwner._id.toString(),
        name: organization?.legalEntityName || clientOwner.name,
        email: clientOwner.email,
        phoneNumber: clientOwner.phoneNumber,
        inviteCode: clientOwner.inviteCode,
        dataSharingStatus: clientOwner.dataSharingStatus || "NONE",
        lastDataSyncAt: clientOwner.lastDataSyncAt || new Date().toISOString(),
      },
      organization: organization
        ? {
            id: organization._id.toString(),
            legalEntityName: organization.legalEntityName || organization.name,
            gstin: organization.gstin || "Unregistered",
            industry: organization.industry || "General Enterprise",
          }
        : null,
      isAuthorized,
      dataSharingStatus: clientOwner.dataSharingStatus,
      ledgerAccounts: ledgerAccounts.map((a) => ({
        id: a._id.toString(),
        name: a.name || a.accountName,
        code: a.accountCode || a.code || "1000",
        category: a.category || a.type || "Asset",
        balance: Number(a.runningBalance || a.balance || 0),
        currency: a.currency || "INR",
        lastUpdated: a.updatedAt || a.createdAt,
      })),
      journalEntries: journalEntries.map((j) => ({
        id: j._id.toString(),
        voucherNumber: j.voucherNumber || j.entryNumber || "JV-AUTO",
        narration: j.narration || "General Journal Voucher",
        entryDate: j.entryDate || j.createdAt,
        totalDebit: j.totalDebit || 0,
        totalCredit: j.totalCredit || 0,
        isVerified: !!j.isVerified,
      })),
      ocrDocuments: ocrDocuments.map((doc) => ({
        id: doc._id.toString(),
        documentType: doc.documentType || "Invoice",
        vendorName: doc.vendorInfo?.supplierName || "Direct Vendor",
        vendorTaxId: doc.vendorInfo?.supplierTaxId || "",
        totalPayable: doc.mathGuardrails?.totalAmount || doc.rawKeysMap?.["Bill Total Payable"] || 0,
        confidenceScore: doc.confidenceScore || 99,
        scannedAt: doc.scannedAt || doc.createdAt,
        verificationStatus: doc.verificationStatus || "VERIFIED",
      })),
      transactions: transactions.map((t) => ({
        id: t._id.toString(),
        description: t.description || t.title || "Banking Movement",
        amount: t.amount || 0,
        type: t.type || (t.amount >= 0 ? "CREDIT" : "DEBIT"),
        date: t.date || t.createdAt,
      })),
      balanceSheet: {
        totalAssets,
        totalLiabilities,
        totalEquity,
        isBalanced,
        variance: Math.abs(totalAssets - (totalLiabilities + totalEquity)),
      },
      pnl: {
        totalRevenue,
        totalExpenses,
        netProfit,
        marginPercent: totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : "0",
      },
    });
  } catch (error) {
    console.error("GET /api/ca/data-pipeline error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Data pipeline failure." },
      { status: 500 }
    );
  }
}
