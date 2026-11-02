"use client";
import React, { useState } from "react";
import {
  TrendingUp,
  PhoneCall,
  Handshake,
  ShoppingCart,
  Megaphone,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  DollarSign,
  FileText,
  User,
  Users,
  MapPin,
  Clock,
  ArrowRight,
  Send,
  Eye,
  Check,
  X,
} from "lucide-react";
import { DEPARTMENT_CONFIGS } from "./departmentConfig";
import WithZeroErrorOcr from "@/components/ocr/WithZeroErrorOcr";
import AIDocumentScannerModal from "@/components/ocr/AIDocumentScannerModal";
import {
  LeadPoolZeroState,
  DealsZeroState,
  CounterDeskZeroState,
  LeadPoolTabs,
  DealTabs,
  CounterDeskTabs,
  SalesFlowProvider,
} from "@/components/sales";
import {
  CoordinatorLeadPoolTabs,
  CoordinatorDealsTabs,
  CoordinatorCounterDeskTabs,
} from "@/components/coordinator";
import {
  RevenueQuotaDashboard,
  CampaignsSalesOps,
} from "@/components/analyst";

export default function SalesDepartmentView({
  tabId = "sales_dashboard",
  employee,
  company,
  onNotify = () => {},
}) {
  const deptConfig = DEPARTMENT_CONFIGS.SALES;
  const currentTab = deptConfig.tabs.find((t) => t.id === tabId) || deptConfig.tabs[0];
  const [subViewsByTab, setSubViewsByTab] = useState({});

  const validSubViewIds = currentTab?.subViews?.map((s) => s.id) || [];
  const activeSubView =
    subViewsByTab[tabId] && validSubViewIds.includes(subViewsByTab[tabId])
      ? subViewsByTab[tabId]
      : validSubViewIds[0] || "";

  const handleSubViewChange = (subId) => {
    setSubViewsByTab((prev) => ({ ...prev, [tabId]: subId }));
  };

  // Sales State (Zero-State Driven)
  const [leads, setLeads] = useState([]);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [leadForm, setLeadForm] = useState({
    contactName: "",
    companyName: "",
    phone: "",
    productInterest: "",
    source: "INBOUND_WEB",
  });

  const [deals, setDeals] = useState([]);
  const [showDealModal, setShowDealModal] = useState(false);
  const [dealForm, setDealForm] = useState({
    clientName: "",
    dealValue: "",
    stage: "QUALIFIED",
    expectedCloseDate: "",
    assignedAE: employee?.name || "Account Exec",
  });

  const [salesOrders, setSalesOrders] = useState([]);
  const [showSoModal, setShowSoModal] = useState(false);
  const [soForm, setSoForm] = useState({
    clientName: "",
    itemsSummary: "",
    totalAmount: "",
    paymentTerms: "NET_30",
    deliveryBranch: employee?.branchName || "Main HQ",
  });

  // Handlers
  const handleCreateLead = (e) => {
    e.preventDefault();
    const newLead = {
      id: `LEAD-${Date.now().toString().slice(-5)}`,
      ...leadForm,
      status: "NEW",
      createdAt: new Date().toLocaleDateString(),
    };
    setLeads([newLead, ...leads]);
    setShowLeadModal(false);
    setLeadForm({
      contactName: "",
      companyName: "",
      phone: "",
      productInterest: "",
      source: "INBOUND_WEB",
    });
    onNotify("New sales inquiry logged in lead pool!");
  };

  const handleCreateDeal = (e) => {
    e.preventDefault();
    const newDeal = {
      id: `DEAL-${Date.now().toString().slice(-5)}`,
      ...dealForm,
      createdAt: new Date().toLocaleDateString(),
    };
    setDeals([newDeal, ...deals]);
    setShowDealModal(false);
    setDealForm({
      clientName: "",
      dealValue: "",
      stage: "QUALIFIED",
      expectedCloseDate: "",
      assignedAE: employee?.name || "Account Exec",
    });
    onNotify("Deal entered into pipeline!");
  };

  const handleCreateSo = (e) => {
    e.preventDefault();
    const newSo = {
      id: `SO-${Date.now().toString().slice(-5)}`,
      ...soForm,
      status: "CONFIRMED",
      createdAt: new Date().toLocaleDateString(),
    };
    setSalesOrders([newSo, ...salesOrders]);
    setShowSoModal(false);
    setSoForm({
      clientName: "",
      itemsSummary: "",
      totalAmount: "",
      paymentTerms: "NET_30",
      deliveryBranch: employee?.branchName || "Main HQ",
    });
    onNotify("Confirmed Sales Order (SO) booked!");
  };

  return (
    <SalesFlowProvider>
      <div className="space-y-6">
      {/* =========================================================================
          TAB 1: SALES_DASHBOARD (Revenue & Quota Dashboard)
         ========================================================================= */}
      {tabId === "sales_dashboard" && (
        <RevenueQuotaDashboard
          activeSubView={activeSubView}
          onSubViewChange={handleSubViewChange}
          employee={employee}
          onBookOrder={() => setShowSoModal(true)}
        />
      )}

      {/* =========================================================================
          TAB 2: LEAD_TELECALLING (Lead Pool & Telecalling Hub)
         ========================================================================= */}
      {tabId === "lead_telecalling" &&
        (employee?.postLevel === "COORDINATOR" ? (
          <CoordinatorLeadPoolTabs
            coordinatorId={employee?._id || "coord_sys_01"}
            coordinatorName={employee?.name || "Tier 2 Sales Coordinator"}
          />
        ) : (
          <LeadPoolTabs
            ownerName={company?.name || "Main HQ"}
            paramKey="leadSubtab"
          />
        ))}

      {/* =========================================================================
          TAB 3: DEALS_QUOTES (Deals & Quotations)
         ========================================================================= */}
      {tabId === "deals_quotes" &&
        (employee?.postLevel === "COORDINATOR" ? (
          <CoordinatorDealsTabs
            coordinatorId={employee?._id || "coord_sys_01"}
            coordinatorName={employee?.name || "Tier 2 Sales Coordinator"}
          />
        ) : (
          <DealTabs
            ownerName={company?.name || "Main HQ"}
            paramKey="dealSubtab"
          />
        ))}

      {/* =========================================================================
          TAB 4: SALES_ORDERS (Sales Orders & Counter Desk)
         ========================================================================= */}
      {tabId === "sales_orders" &&
        (employee?.postLevel === "COORDINATOR" ? (
          <CoordinatorCounterDeskTabs
            coordinatorId={employee?._id || "coord_sys_01"}
            coordinatorName={employee?.name || "Tier 2 Sales Coordinator"}
          />
        ) : (
          <CounterDeskTabs
            hqWarehouseName={`${company?.name || "Main"} (HQ) Warehouse`}
            paramKey="counterSubtab"
          />
        ))}

      {/* =========================================================================
          TAB 5: CAMPAIGNS_OPS (Campaigns & Sales Ops)
         ========================================================================= */}
      {tabId === "campaigns_ops" && (
        <CampaignsSalesOps
          activeSubView={activeSubView}
          onSubViewChange={handleSubViewChange}
          employee={employee}
          onNotify={onNotify}
        />
      )}

      {/* =========================================================================
          MODALS WITH ZERO-ERROR SELF-LEARNING OCR
         ========================================================================= */}
      {/* 1. Lead Modal */}
      {showLeadModal && (
        <WithZeroErrorOcr
          isOpen={showLeadModal}
          onClose={() => setShowLeadModal(false)}
          title="Log New Sales Lead"
          subtitle="AI auto-extracts contact name, business card details, company & requirements"
          documentContext="lead_capture"
          formData={leadForm}
          setFormData={setLeadForm}
          onSubmit={handleCreateLead}
          submitLabel="Save Lead"
          submitColor="bg-blue-600 hover:bg-blue-700"
        >
          <form onSubmit={handleCreateLead} className="space-y-3 bg-white p-5 rounded-2xl border border-slate-200">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Contact Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Rajesh Sharma"
                value={leadForm.contactName}
                onChange={(e) => setLeadForm({ ...leadForm, contactName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Company / Store</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Hardware"
                  value={leadForm.companyName}
                  onChange={(e) => setLeadForm({ ...leadForm, companyName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 98765 43210"
                  value={leadForm.phone}
                  onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Product Requirement</label>
              <input
                type="text"
                placeholder="e.g. 500 units Heavy-Duty Brackets"
                value={leadForm.productInterest}
                onChange={(e) => setLeadForm({ ...leadForm, productInterest: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowLeadModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs cursor-pointer shadow-xs"
              >
                Save Lead
              </button>
            </div>
          </form>
        </WithZeroErrorOcr>
      )}

      {/* 2. Deal Modal */}
      {showDealModal && (
        <WithZeroErrorOcr
          isOpen={showDealModal}
          onClose={() => setShowDealModal(false)}
          title="Enter Deal into Pipeline"
          subtitle="AI auto-extracts quote values, client proposal terms & estimated close dates"
          documentContext="deal_quote"
          formData={dealForm}
          setFormData={setDealForm}
          onSubmit={handleCreateDeal}
          submitLabel="Commit Deal"
          submitColor="bg-blue-600 hover:bg-blue-700"
        >
          <form onSubmit={handleCreateDeal} className="space-y-3 bg-white p-5 rounded-2xl border border-slate-200">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Client Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Metro Builders Ltd"
                value={dealForm.clientName}
                onChange={(e) => setDealForm({ ...dealForm, clientName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Deal Value (₹)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 250000"
                  value={dealForm.dealValue}
                  onChange={(e) => setDealForm({ ...dealForm, dealValue: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Pipeline Stage</label>
                <select
                  value={dealForm.stage}
                  onChange={(e) => setDealForm({ ...dealForm, stage: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 focus:outline-hidden"
                >
                  <option value="QUALIFIED">Qualified</option>
                  <option value="DEMO_VISIT">Demo / Field Visit</option>
                  <option value="PRICE_NEGOTIATION">Negotiation</option>
                  <option value="WON">Closed Won</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDealModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs cursor-pointer shadow-xs"
              >
                Commit Deal
              </button>
            </div>
          </form>
        </WithZeroErrorOcr>
      )}

      {/* 3. SO Modal - Opt-In AI Document Scanner Modal */}
      {showSoModal && (
        <AIDocumentScannerModal
          isOpen={showSoModal}
          onClose={() => setShowSoModal(false)}
          title="Book Confirmed Sales Order (SO)"
          subtitle="Enter customer order details manually or opt-in to scan a paper bill/invoice."
          documentContext="sales_order"
          formData={soForm}
          setFormData={setSoForm}
          onSubmit={handleCreateSo}
          submitLabel="Confirm Sales Order"
        >
          <div className="space-y-3 bg-white p-5 rounded-2xl border border-slate-200">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Customer / Client</label>
              <input
                type="text"
                required
                placeholder="e.g. Krishna Enterprises"
                value={soForm.clientName}
                onChange={(e) => setSoForm({ ...soForm, clientName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Order Items &amp; Quantities</label>
              <input
                type="text"
                required
                placeholder="e.g. 200x Bracket A, 50x Fasteners"
                value={soForm.itemsSummary}
                onChange={(e) => setSoForm({ ...soForm, itemsSummary: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Total Amount (₹)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 85000"
                  value={soForm.totalAmount}
                  onChange={(e) => setSoForm({ ...soForm, totalAmount: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Payment Terms</label>
                <select
                  value={soForm.paymentTerms}
                  onChange={(e) => setSoForm({ ...soForm, paymentTerms: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 focus:outline-hidden"
                >
                  <option value="IMMEDIATE_CASH">Cash / UPI Immediate</option>
                  <option value="NET_15">Net 15 Days</option>
                  <option value="NET_30">Net 30 Days</option>
                </select>
              </div>
            </div>
          </div>
        </AIDocumentScannerModal>
      )}
    </div>
  </SalesFlowProvider>
);
}
