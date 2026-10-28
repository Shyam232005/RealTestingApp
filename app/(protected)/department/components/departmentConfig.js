import {
  Activity,
  Calendar,
  ShieldCheck,
  FileSpreadsheet,
  Wrench,
  TrendingUp,
  PhoneCall,
  Handshake,
  ShoppingCart,
  Megaphone,
  Truck,
  PackageCheck,
  Warehouse,
  Send,
  DollarSign,
  Receipt,
  CreditCard,
  BookOpen,
  FileCheck2,
  Store,
  ScanLine,
} from "lucide-react";

export const TAB_ICON_MAP = {
  // Operations
  ops_dashboard: Activity,
  production_planner: Calendar,
  qc_gate: ShieldCheck,
  requisitions_logs: FileSpreadsheet,
  maintenance_hub: Wrench,

  // Sales
  sales_dashboard: TrendingUp,
  lead_telecalling: PhoneCall,
  deals_quotes: Handshake,
  sales_orders: ShoppingCart,
  campaigns_ops: Megaphone,

  // Logistics
  logistics_dashboard: Truck,
  procurement_po: PackageCheck,
  warehouse_stock: Warehouse,
  dispatch_fleet: Send,

  // Financial
  cfo_dashboard: DollarSign,
  billing_ar: Receipt,
  payables_ap: CreditCard,
  general_ledger: BookOpen,
  tax_audit_portal: FileCheck2,

  // Retail & POS Counter (D-Mart & Haldiram's Model)
  pos_terminal: ShoppingCart,
  daily_cash_register: Receipt,
  store_inventory: Store,
  walkin_customers: TrendingUp,
};

export const DEPARTMENT_CONFIGS = {
  OPERATIONS: {
    name: "Operations",
    subtitle: "Production, Plant & Quality",
    accentColor: "emerald",
    rolesByLevel: {
      CHIEF_OFFICER: {
        title: "Chief Operating Officer (COO)",
        tasks: "Multi-branch plant strategy, OEE oversight, policy locking.",
      },
      DIRECTOR: {
        title: "Director of Operations / Operations Head",
        tasks: "BOM standardization, compliance, process optimization, plant budget sign-off.",
      },
      MANAGER: {
        title: "Operations / Plant Manager",
        tasks: "Day-to-day plant execution, shift supervisor management, hitting daily production targets.",
      },
      SUPERVISOR: {
        title: "Production Supervisor / Floor Team Lead",
        tasks: "Frontline worker management, shift rosters, issuing job cards, resolving floor bottlenecks.",
      },
      ANALYST: {
        title: "Operations Analyst / QC Inspector",
        tasks: "Incoming raw material & finished batch QC inspection, defect/scrap analytics, bottleneck evaluation.",
      },
      COORDINATOR: {
        title: "Operations Coordinator",
        tasks: "Raising internal Material Requisitions (MR) to Logistics, vendor service comms, resource scheduling.",
      },
      ASSISTANT: {
        title: "Operations Assistant / Floor Clerk",
        tasks: "Entry-level shop-floor data entry, routine shift paperwork, daily batch output counts.",
      },
      OTHER: {
        title: "Maintenance Tech & Plant Staff",
        tasks: "Machine servicing, preventative maintenance schedules, breakdown repair tickets.",
      },
    },
    tabs: [
      {
        id: "ops_dashboard",
        title: "Plant & OEE Dashboard",
        allowedLevels: ["CHIEF_OFFICER", "DIRECTOR", "MANAGER", "ANALYST"],
        subViews: [
          { id: "production_overview", label: "Production Overview" },
          { id: "bottleneck_analytics", label: "Bottleneck Analytics" },
          { id: "cost_efficiency", label: "Cost & Efficiency" },
        ],
      },
      {
        id: "production_planner",
        title: "Production & Shift Planner",
        allowedLevels: ["CHIEF_OFFICER", "DIRECTOR", "MANAGER", "SUPERVISOR", "COORDINATOR"],
        subViews: [
          { id: "work_orders", label: "Work Orders & Batches" },
          { id: "bom", label: "Bill of Materials (BOM)" },
          { id: "shift_schedule", label: "Shift & Roster Schedule" },
        ],
      },
      {
        id: "qc_gate",
        title: "Quality Control (QC) Gate",
        allowedLevels: ["DIRECTOR", "MANAGER", "SUPERVISOR", "ANALYST"],
        subViews: [
          { id: "incoming_qc", label: "Incoming Material QC (GRN Gate)" },
          { id: "batch_qc", label: "In-Process/Final Batch QC" },
          { id: "scrap_logs", label: "Scrap & Defect Logs" },
        ],
      },
      {
        id: "requisitions_logs",
        title: "Material Requisitions & Floor Logs",
        allowedLevels: ["MANAGER", "SUPERVISOR", "COORDINATOR", "ASSISTANT"],
        subViews: [
          { id: "material_requisitions", label: "Material Requisitions (MR to Logistics)" },
          { id: "shift_logs", label: "Daily Shift Logs" },
          { id: "vendor_comms", label: "Vendor Service Comms" },
        ],
      },
      {
        id: "maintenance_hub",
        title: "Machine Maintenance Hub",
        allowedLevels: ["MANAGER", "SUPERVISOR", "COORDINATOR", "OTHER"],
        subViews: [
          { id: "breakdown_tickets", label: "Breakdown Tickets" },
          { id: "preventative_schedule", label: "Preventative Schedule" },
          { id: "spare_parts", label: "Spare Parts Request" },
        ],
      },
    ],
  },
  SALES: {
    name: "Sales",
    subtitle: "Revenue, CRM & Marketing",
    accentColor: "blue",
    rolesByLevel: {
      CHIEF_OFFICER: {
        title: "Chief Sales Officer (CSO / CRO)",
        tasks: "Global revenue strategy, aligning sales with marketing and inventory capacity.",
      },
      DIRECTOR: {
        title: "Sales Director / Sales & Marketing Head",
        tasks: "Territory management, pipeline forecasting, approving custom credit limits & discount tiers.",
      },
      MANAGER: {
        title: "Sales Manager",
        tasks: "Managing AE/SDR teams, daily metric reviews, enforcing branch revenue quotas.",
      },
      SUPERVISOR: {
        title: "Field Sales Lead / Account Executive (AE)",
        tasks: "Primary deal closer, client visits/demos, price negotiation, booking confirmed Sales Orders (SO).",
      },
      ANALYST: {
        title: "Sales Ops Analyst / Digital Marketing Exec",
        tasks: "CRM hygiene, campaign ROI tracking, funnel analytics, commission calculation.",
      },
      COORDINATOR: {
        title: "Sales Coordinator / SDR & BDR",
        tasks: "Qualifying inbound leads, booking demo meetings for AEs, order fulfillment coordination.",
      },
      ASSISTANT: {
        title: "Counter Sales / Billing Desk Assistant",
        tasks: "Walk-in counter order entry, quote formatting, scheduling, basic lead data entry.",
      },
      OTHER: {
        title: "Telecaller / Outbound Support",
        tasks: "Frontline cold calling, outreach messaging, logging call dispositions and follow-ups.",
      },
    },
    tabs: [
      {
        id: "sales_dashboard",
        title: "Revenue & Quota Dashboard",
        allowedLevels: ["CHIEF_OFFICER", "DIRECTOR", "MANAGER", "ANALYST"],
        subViews: [
          { id: "quota_actuals", label: "Quota vs. Actuals" },
          { id: "territory_forecast", label: "Territory Forecast" },
          { id: "team_leaderboard", label: "Team Leaderboard" },
        ],
      },
      {
        id: "lead_telecalling",
        title: "Lead Pool & Telecalling Hub",
        allowedLevels: ["MANAGER", "COORDINATOR", "ASSISTANT", "OTHER"],
        subViews: [
          { id: "unassigned_inquiries", label: "Unassigned Inquiries" },
          { id: "cold_call_queue", label: "Cold Call Queue" },
          { id: "followup_calendar", label: "Follow-Up Calendar" },
        ],
      },
      {
        id: "deals_quotes",
        title: "Deals & Quotations",
        allowedLevels: ["DIRECTOR", "MANAGER", "SUPERVISOR", "COORDINATOR", "ASSISTANT"],
        subViews: [
          { id: "active_deals", label: "Active Deals (Kanban)" },
          { id: "field_geo_tracker", label: "Field Visit Geo-Tracker" },
          { id: "estimates_quotes", label: "Estimates & Price Quotes" },
        ],
      },
      {
        id: "sales_orders",
        title: "Sales Orders & Counter Desk",
        allowedLevels: ["MANAGER", "SUPERVISOR", "COORDINATOR", "ASSISTANT"],
        subViews: [
          { id: "confirmed_so", label: "Confirmed Sales Orders (SO)" },
          { id: "client_directory", label: "Client Master Directory" },
          { id: "fulfillment_status", label: "Live Order Fulfillment Status" },
        ],
      },
      {
        id: "campaigns_ops",
        title: "Campaigns & Sales Ops",
        allowedLevels: ["CHIEF_OFFICER", "DIRECTOR", "ANALYST"],
        subViews: [
          { id: "campaign_roi", label: "Campaign ROI & Leads" },
          { id: "commission_tracker", label: "Commission Tracker" },
          { id: "crm_hygiene", label: "CRM Data Hygiene" },
        ],
      },
    ],
  },
  LOGISTICS: {
    name: "Logistics",
    subtitle: "Supply Chain, Procurement, Warehouse & Fleet",
    accentColor: "amber",
    rolesByLevel: {
      CHIEF_OFFICER: {
        title: "Chief Logistics Officer (CLO / CSCO)",
        tasks: "End-to-end supply chain alignment, multi-warehouse inventory strategy.",
      },
      DIRECTOR: {
        title: "Director of Logistics / Supply Chain Head",
        tasks: "Distribution network design, major carrier/vendor rate contracts, trade compliance.",
      },
      MANAGER: {
        title: "Logistics & Supply Chain Manager",
        tasks: "Facility/branch logistics, freight budgets, carrier SLA monitoring.",
      },
      SUPERVISOR: {
        title: "Warehouse In-charge / Fleet Supervisor",
        tasks: "Warehouse workforce & loading dock management, GRN approval, stock audits, vehicle safety.",
      },
      ANALYST: {
        title: "Logistics Analyst / Procurement Exec",
        tasks: "Inventory demand forecasting, vendor RFQ comparisons, drafting Purchase Orders (PO), route cost analysis.",
      },
      COORDINATOR: {
        title: "Order & Dispatch Coordinator",
        tasks: "Booking freight carriers, driver scheduling, generating Delivery Challans / Bills of Lading, live shipment tracking.",
      },
      ASSISTANT: {
        title: "Logistics Clerk / Dock Assistant",
        tasks: "Verifying packing slips at dock, drafting GRNs, generating e-Way bills, logging customer returns.",
      },
      OTHER: {
        title: "Material Handler / Loader / Driver",
        tasks: "Physical bin movement, barcode scanning, loading/unloading, uploading Proof of Delivery (POD).",
      },
    },
    tabs: [
      {
        id: "logistics_dashboard",
        title: "Supply Chain & SLA Hub",
        allowedLevels: ["CHIEF_OFFICER", "DIRECTOR", "MANAGER", "ANALYST"],
        subViews: [
          { id: "freight_analytics", label: "Freight & Budget Analytics" },
          { id: "carrier_sla", label: "Carrier SLA Scorecard" },
          { id: "demand_forecasting", label: "Demand Forecasting" },
        ],
      },
      {
        id: "procurement_po",
        title: "Procurement & Vendors (Inbound)",
        allowedLevels: ["CHIEF_OFFICER", "DIRECTOR", "MANAGER", "ANALYST", "COORDINATOR"],
        subViews: [
          { id: "mr_queue", label: "Material Requisition Queue" },
          { id: "rfq_comparison", label: "RFQ & Quote Comparison" },
          { id: "purchase_orders", label: "Purchase Orders (PO)" },
          { id: "vendor_master", label: "Vendor Master" },
        ],
      },
      {
        id: "warehouse_stock",
        title: "Warehouse & Stock Ledger",
        allowedLevels: ["DIRECTOR", "MANAGER", "SUPERVISOR", "ANALYST", "ASSISTANT", "OTHER"],
        subViews: [
          { id: "live_inventory", label: "Live Inventory & Bins" },
          { id: "grn_notes", label: "Goods Receipt Notes (GRN)" },
          { id: "stock_audits", label: "Stock Audit & Returns" },
          { id: "loading_dock", label: "Loading Dock Schedule" },
        ],
      },
      {
        id: "dispatch_fleet",
        title: "Order & Dispatch Hub (Outbound)",
        allowedLevels: ["MANAGER", "SUPERVISOR", "COORDINATOR", "ASSISTANT", "OTHER"],
        subViews: [
          { id: "pick_pack_queue", label: "Pick & Pack Queue" },
          { id: "delivery_challans", label: "Delivery Challans & e-Way Bills" },
          { id: "shipment_fleet_map", label: "Live Shipment & Fleet Map" },
          { id: "pod_uploads", label: "POD Uploads" },
        ],
      },
    ],
  },
  FINANCIAL: {
    name: "Financial",
    subtitle: "Accounting, Billing, Treasury & Statutory Audit",
    accentColor: "purple",
    rolesByLevel: {
      CHIEF_OFFICER: {
        title: "Chief Financial Officer (CFO)",
        tasks: "Capital structure, financial risk, cash runway, board P&L reporting.",
      },
      DIRECTOR: {
        title: "Director of Finance / Corporate Controller",
        tasks: "Historical accounting legality, statutory compliance, company-wide budgets, period locking.",
      },
      MANAGER: {
        title: "Finance & Accounting Manager",
        tasks: "Branch financial operations, monthly/annual close coordination, internal controls, payout approvals.",
      },
      SUPERVISOR: {
        title: "Senior Accountant / Audit Lead",
        tasks: "General Ledger management, manual Journal Vouchers (JV), GST/TDS tax preparation, audit schedules.",
      },
      ANALYST: {
        title: "Accounts Analyst / Staff Accountant",
        tasks: "Bank statement reconciliation, daily transaction verification, ROI & budget variance tracking.",
      },
      COORDINATOR: {
        title: "Billing Coordinator / Payroll Specialist",
        tasks: "Converting dispatch logs into GST Tax Invoices, credit/debit notes, running staff payroll.",
      },
      ASSISTANT: {
        title: "Billing Desk Assistant / AP & AR Clerk",
        tasks: "Recording incoming customer receipts (AR), logging vendor bills for 3-way match (AP), counter billing, payment reminders.",
      },
      OTHER: {
        title: "Outsourced CA / External Auditor",
        tasks: "Read-only statutory audit portal, voucher verification, tax sign-off, exporting Tally-compatible XML/JSON ledgers.",
      },
    },
    tabs: [
      {
        id: "cfo_dashboard",
        title: "CFO & Treasury Dashboard",
        allowedLevels: ["CHIEF_OFFICER", "DIRECTOR", "MANAGER", "ANALYST"],
        subViews: [
          { id: "cash_runway", label: "Cash Flow & Runway" },
          { id: "budget_vs_actuals", label: "Budget vs. Actuals" },
          { id: "financial_ratios", label: "Financial Ratios & ROI" },
        ],
      },
      {
        id: "billing_ar",
        title: "Billing & Receivables Desk (AR)",
        allowedLevels: ["DIRECTOR", "MANAGER", "COORDINATOR", "ASSISTANT"],
        subViews: [
          { id: "dispatch_invoice_queue", label: "Dispatch-to-Invoice Queue" },
          { id: "gst_invoices", label: "GST Tax Invoices & Credit Notes" },
          { id: "customer_aging", label: "Customer Aging & Dues" },
        ],
      },
      {
        id: "payables_ap",
        title: "Payables & Payroll (AP)",
        allowedLevels: ["DIRECTOR", "MANAGER", "SUPERVISOR", "COORDINATOR", "ASSISTANT"],
        subViews: [
          { id: "vendor_bills_3way", label: "Vendor Bills (3-Way Match: PO + GRN + Bill)" },
          { id: "payout_queue", label: "Outgoing Payout Queue" },
          { id: "staff_payroll", label: "Staff Payroll & Expenses" },
        ],
      },
      {
        id: "general_ledger",
        title: "General Ledger & Banking",
        allowedLevels: ["CHIEF_OFFICER", "DIRECTOR", "MANAGER", "SUPERVISOR", "ANALYST"],
        subViews: [
          { id: "chart_of_accounts", label: "Chart of Accounts" },
          { id: "journal_vouchers", label: "Journal Vouchers (JV)" },
          { id: "bank_recon", label: "Bank Reconciliation" },
          { id: "trial_balance", label: "Trial Balance" },
        ],
      },
      {
        id: "tax_audit_portal",
        title: "Tax & CA Audit Portal",
        allowedLevels: ["CHIEF_OFFICER", "DIRECTOR", "MANAGER", "SUPERVISOR", "OTHER"],
        subViews: [
          { id: "gst_tds_filings", label: "GST / TDS Filings" },
          { id: "audit_trail", label: "Immutable Voucher Audit Trail" },
          { id: "period_lock", label: "Period Lock & Controls" },
          { id: "tally_export", label: "Tally XML/JSON Export" },
        ],
      },
    ],
  },
  RETAIL: {
    name: "Retail & POS Counter",
    subtitle: "Point of Sale, Walk-in Counter & Fast Billing (D-Mart & Haldiram's Model)",
    accentColor: "rose",
    rolesByLevel: {
      CHIEF_OFFICER: {
        title: "Chief Retail Officer (CRO) / Head of Retail",
        tasks: "Multi-store retail network strategy, store profitability, POS technology oversight.",
      },
      DIRECTOR: {
        title: "Director of Retail Store Operations",
        tasks: "Store floor layouts, counter throughput SLAs, retail pricing & discount rules.",
      },
      MANAGER: {
        title: "Store / Supermarket Manager",
        tasks: "D-Mart style store execution, daily cash register closing, managing cashiers & counter staff.",
      },
      SUPERVISOR: {
        title: "POS & Billing Counter Supervisor",
        tasks: "Counter float allocation, till overrides, void/refund approvals, shift change handovers.",
      },
      ANALYST: {
        title: "Retail & Basket Analyst",
        tasks: "Average basket size (ATV), fast-moving FMCG items, sweets/counter shrinkage analytics.",
      },
      COORDINATOR: {
        title: "Counter Stock & Shelf Replenisher",
        tasks: "Replenishing billing counter racks & shelves from back-godown, price barcode labeling.",
      },
      ASSISTANT: {
        title: "Cashier & Counter Billing Operator",
        tasks: "Walk-in customer barcode scanning, cash/UPI/card payment collection, printing invoices.",
      },
      OTHER: {
        title: "Store Associate & Counter Sweets Clerk",
        tasks: "Haldiram's style sweets/item packaging, weighing scale entry, bag packing, customer greetings.",
      },
    },
    tabs: [
      {
        id: "pos_terminal",
        title: "POS Counter Billing Terminal",
        allowedLevels: ["MANAGER", "SUPERVISOR", "COORDINATOR", "ASSISTANT", "OTHER"],
        subViews: [
          { id: "counter_checkout", label: "Live Walk-in Checkout (D-Mart / Haldiram's)" },
          { id: "recent_receipts", label: "Recent Cash & Thermal Receipts" },
          { id: "barcode_lookup", label: "Barcode / Item Lookup" },
        ],
      },
      {
        id: "daily_cash_register",
        title: "Cash Register & Till Close",
        allowedLevels: ["CHIEF_OFFICER", "DIRECTOR", "MANAGER", "SUPERVISOR", "ASSISTANT"],
        subViews: [
          { id: "drawer_reconciliation", label: "Till & Drawer Reconciliation" },
          { id: "shift_float", label: "Shift Opening Float" },
          { id: "day_end_summary", label: "End-of-Day Sales Report" },
        ],
      },
      {
        id: "store_inventory",
        title: "Store Shelves & FMCG Racks",
        allowedLevels: ["DIRECTOR", "MANAGER", "SUPERVISOR", "ANALYST", "COORDINATOR"],
        subViews: [
          { id: "fast_moving_skus", label: "Fast-Moving FMCG Goods" },
          { id: "shelf_restock", label: "Shelf Restock Alerts" },
          { id: "wastage_spoilage", label: "Spillage & Expiry Logs" },
        ],
      },
      {
        id: "walkin_customers",
        title: "Walk-in Footfall & Loyalty",
        allowedLevels: ["CHIEF_OFFICER", "DIRECTOR", "MANAGER", "ANALYST"],
        subViews: [
          { id: "footfall_tracker", label: "Daily Footfall Tracker" },
          { id: "walkin_directory", label: "Walk-in Customer Ledger" },
          { id: "loyalty_discounts", label: "Store Promos & Combos" },
        ],
      },
    ],
  },
};

DEPARTMENT_CONFIGS.RETAIL_POS = DEPARTMENT_CONFIGS.RETAIL;
