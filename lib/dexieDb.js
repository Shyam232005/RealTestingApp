import Dexie from "dexie";

/**
 * CrownEcosystemsDexieDB - Unified Offline-First IndexedDB Layer
 * Powers real-time reactive live queries (<15ms) across Tier 1 Assistants & Tier 2 Coordinators.
 */
export class CrownEcosystemsDexieDB extends Dexie {
  constructor() {
    super("CrownEcosystemsDB");

    // Version 1 Legacy Schema (Tier 1 Sales)
    this.version(1).stores({
      leads: "++id, leadCode, contactName, companyName, phone, inquiryType, source, status, createdAt, synced",
      deals: "++id, dealCode, title, clientName, dealValue, stage, expectedCloseDate, marginPercent, createdAt, synced",
      salesOrders: "++id, orderNumber, clientName, totalAmount, advanceCollected, balanceDue, paymentMode, paymentStatus, ledgerSyncStatus, createdAt, synced",
    });

    // Version 2 Schema - Extended for Tier 2 Coordinator Workspace
    this.version(2).stores({
      leads: "++id, leadCode, contactName, companyName, phone, inquiryType, source, status, leadScore, createdAt, synced",
      deals: "++id, dealCode, title, clientName, dealValue, stage, expectedCloseDate, marginPercent, createdAt, synced",
      salesOrders: "++id, orderReference, orderNumber, clientName, status, estimateId, approvedBy, paymentTerms, totalAmount, balanceDue, paymentStatus, createdAt, synced",
      dispatchLogs: "++id, orderId, coordinatorId, dispatchStatus, shippingProvider, trackingNumber, vehicleNumber, scheduledDispatchDate, createdAt, synced",
      tasks: "++id, assignedBy, assignedTo, customerId, taskType, priority, status, dueDate, createdAt, synced",
    });

    // Version 3 Schema - Extended for Tier 3 Analyst (Campaigns & Sales Ops)
    this.version(3).stores({
      leads: "++id, leadCode, contactName, companyName, phone, inquiryType, source, status, leadScore, createdAt, synced",
      deals: "++id, dealCode, title, clientName, dealValue, stage, expectedCloseDate, marginPercent, createdAt, synced",
      salesOrders: "++id, orderReference, orderNumber, clientName, status, estimateId, approvedBy, paymentTerms, totalAmount, balanceDue, paymentStatus, createdAt, synced",
      dispatchLogs: "++id, orderId, coordinatorId, dispatchStatus, shippingProvider, trackingNumber, vehicleNumber, scheduledDispatchDate, createdAt, synced",
      tasks: "++id, assignedBy, assignedTo, customerId, taskType, priority, status, dueDate, createdAt, synced",
      marketingCampaigns: "++id, name, channel, budget, spend, leadsCount, dealsCount, revenueGenerated, roi, status, startDate, endDate, createdAt, synced",
    });

    this.leads = this.table("leads");
    this.deals = this.table("deals");
    this.salesOrders = this.table("salesOrders");
    this.dispatchLogs = this.table("dispatchLogs");
    this.tasks = this.table("tasks");
    this.marketingCampaigns = this.table("marketingCampaigns");
  }
}

// Global singleton pattern to prevent multiple instances across Fast Refresh
const globalDexie = typeof window !== "undefined"
  ? (window.__crown_dexie_db || (window.__crown_dexie_db = new CrownEcosystemsDexieDB()))
  : new CrownEcosystemsDexieDB();

export const dexieDb = globalDexie;
export const db = globalDexie;

export default dexieDb;
