"use server";

import connectDB from "@/lib/mongodb";
import Lead from "@/models/Lead";
import Deal from "@/models/Deal";
import SalesOrder from "@/models/SalesOrder";
import JournalEntry from "@/models/JournalEntry";

/**
 * Serializes Mongoose documents into plain JSON objects for Next.js Server Action boundaries.
 */
function serializeDoc(doc) {
  if (!doc) return null;
  const raw = doc.toObject ? doc.toObject() : doc;
  return JSON.parse(
    JSON.stringify(raw, (key, value) => {
      if (key === "_id" || (value && typeof value === "object" && value._bsontype === "ObjectID")) {
        return value.toString();
      }
      return value;
    })
  );
}

/**
 * Fetch latest records from MongoDB to hydrate or synchronize client Dexie store.
 */
export async function fetchLatestRecordsFromMongoDB() {
  try {
    await connectDB();

    const [leads, deals, salesOrders] = await Promise.all([
      Lead.find({}).sort({ createdAt: -1 }).limit(100).lean(),
      Deal.find({}).sort({ createdAt: -1 }).limit(100).lean(),
      SalesOrder.find({}).sort({ createdAt: -1 }).limit(100).lean(),
    ]);

    return {
      success: true,
      leads: leads.map((l) => serializeDoc(l)),
      deals: deals.map((d) => serializeDoc(d)),
      salesOrders: salesOrders.map((so) => serializeDoc(so)),
    };
  } catch (error) {
    console.error("Failed to fetch records from MongoDB:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch remote records",
      leads: [],
      deals: [],
      salesOrders: [],
    };
  }
}

/**
 * Synchronize a single Lead document from Dexie to MongoDB.
 */
export async function syncLeadToMongoDB(leadData) {
  try {
    await connectDB();

    const filter = { leadCode: leadData.leadCode };
    const update = {
      leadCode: leadData.leadCode,
      contactName: leadData.contactName,
      companyName: leadData.companyName || leadData.contactName,
      phone: leadData.phone,
      email: leadData.email || "",
      inquiryType: leadData.inquiryType || "WALK_IN_RETAIL",
      interest: leadData.interest || leadData.notes || "",
      notes: leadData.notes || "",
      source: leadData.source || "MANUAL_WALKIN",
      status: leadData.status || "unassigned",
      claimedBy: leadData.claimedBy || "",
      callAttempts: leadData.callAttempts || 0,
      disposition: leadData.disposition || "PENDING",
    };

    const lead = await Lead.findOneAndUpdate(filter, update, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    });

    return {
      success: true,
      lead: serializeDoc(lead),
    };
  } catch (error) {
    console.error("Failed to sync Lead to MongoDB:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Synchronize a single Deal document from Dexie to MongoDB.
 */
export async function syncDealToMongoDB(dealData) {
  try {
    await connectDB();

    const filter = { dealCode: dealData.dealCode };
    const update = {
      dealCode: dealData.dealCode,
      title: dealData.title || `${dealData.clientName} Contract`,
      clientName: dealData.clientName,
      contactPerson: dealData.contactPerson || dealData.clientName,
      phone: dealData.phone || "",
      email: dealData.email || "",
      dealValue: Number(dealData.dealValue) || 100000,
      stage: dealData.stage || "requirement_gathering",
      expectedCloseDate: dealData.expectedCloseDate || "",
      assignedAE: dealData.assignedAE || "Active AE",
      marginPercent: Number(dealData.marginPercent) || 22,
      sourceLeadId: dealData.sourceLeadId || "",
      city: dealData.city || "",
      notes: dealData.notes || "",
    };

    const deal = await Deal.findOneAndUpdate(filter, update, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    });

    return {
      success: true,
      deal: serializeDoc(deal),
    };
  } catch (error) {
    console.error("Failed to sync Deal to MongoDB:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Synchronize a SalesOrder document to MongoDB and create a live double-entry CA audit trail log.
 */
export async function syncSalesOrderToMongoDB(orderData) {
  try {
    await connectDB();

    const grossAmount = Number(orderData.totalAmount) || 0;
    const advanceAmount = Number(orderData.advanceCollected) || 0;
    const balanceAmount = grossAmount - advanceAmount;

    // 1. Generate live double-entry log in JournalEntry for CA audit trail
    let journalEntryId = null;
    try {
      const entryLines = [];

      // Debit: Bank or Cash for advance received
      if (advanceAmount > 0) {
        entryLines.push({
          accountCode: orderData.paymentMode === "CASH" ? "1010" : "1020",
          accountName: orderData.paymentMode === "CASH" ? "Cash-in-Hand (Counter Desk)" : "Primary Operating Bank A/c",
          debit: advanceAmount,
          credit: 0,
          description: `Advance received via ${orderData.paymentMode || "UPI"} for ${orderData.orderNumber}`,
        });
      }

      // Debit: Accounts Receivable for remaining balance
      if (balanceAmount > 0) {
        entryLines.push({
          accountCode: "1100",
          accountName: `Trade Debtors - ${orderData.clientName}`,
          debit: balanceAmount,
          credit: 0,
          description: `Balance credit terms for ${orderData.orderNumber}`,
        });
      }

      // Credit: Sales Revenue for full order amount
      entryLines.push({
        accountCode: "4000",
        accountName: "Sales Revenue (Commercial Counter)",
        debit: 0,
        credit: grossAmount,
        description: `Gross revenue recognition for Order ${orderData.orderNumber}`,
      });

      const journalEntry = await JournalEntry.create({
        entryNumber: `JE-SO-${Date.now().toString().slice(-6)}`,
        entryDate: new Date(),
        narration: `Counter Desk Booking: ${orderData.orderNumber} - ${orderData.clientName} (${orderData.itemsSummary || "Line Items"})`,
        lines: entryLines,
        totalDebit: grossAmount,
        totalCredit: grossAmount,
        status: "POSTED",
        auditStamp: "AUTO_GENERATED_COUNTER_DESK",
        sourceModule: "SALES_ORDER",
        sourceReferenceId: orderData.orderNumber,
      });

      journalEntryId = journalEntry._id;
    } catch (journalErr) {
      console.warn("Could not log double-entry journal entry:", journalErr.message);
    }

    // 2. Upsert SalesOrder document
    const filter = { orderNumber: orderData.orderNumber };
    const update = {
      orderNumber: orderData.orderNumber,
      dealId: orderData.dealId || "",
      quoteNumber: orderData.quoteNumber || "",
      clientName: orderData.clientName,
      contactPerson: orderData.contactPerson || orderData.clientName,
      customerPhone: orderData.customerPhone || "",
      itemsSummary: orderData.itemsSummary,
      totalAmount: grossAmount,
      advanceCollected: advanceAmount,
      balanceDue: balanceAmount,
      paymentTerms: orderData.paymentTerms || "50% Advance with PO",
      paymentMode: orderData.paymentMode || "UPI",
      paymentStatus: advanceAmount >= grossAmount ? "PAID" : "PARTIAL",
      ledgerSyncStatus: "SYNCED",
      deliveryBranch: orderData.deliveryBranch || "Main (HQ) Warehouse",
      ...(journalEntryId ? { journalEntryId } : {}),
    };

    const salesOrder = await SalesOrder.findOneAndUpdate(filter, update, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    });

    return {
      success: true,
      salesOrder: serializeDoc(salesOrder),
      journalEntryId: journalEntryId ? journalEntryId.toString() : null,
    };
  } catch (error) {
    console.error("Failed to sync SalesOrder to MongoDB:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}
