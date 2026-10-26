"use client";
import React, { useState } from "react";
import {
  Truck,
  PackageCheck,
  Warehouse,
  Send,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Boxes,
  MapPin,
  Calendar,
  FileText,
  FileCheck2,
  Clock,
  ArrowRight,
  ClipboardList,
  Upload,
} from "lucide-react";
import { DEPARTMENT_CONFIGS } from "./departmentConfig";

export default function LogisticsDepartmentView({
  tabId = "logistics_dashboard",
  employee,
  company,
  onNotify = () => {},
}) {
  const deptConfig = DEPARTMENT_CONFIGS.LOGISTICS;
  const currentTab = deptConfig.tabs.find((t) => t.id === tabId) || deptConfig.tabs[0];
  const [activeSubView, setActiveSubView] = useState(currentTab.subViews[0]?.id);

  // Logistics State (Zero-State Driven)
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [showPoModal, setShowPoModal] = useState(false);
  const [poForm, setPoForm] = useState({
    vendorName: "",
    materialDescription: "",
    quantity: "",
    unitPrice: "",
    expectedDelivery: "",
  });

  const [grnList, setGrnList] = useState([]);
  const [showGrnModal, setShowGrnModal] = useState(false);
  const [grnForm, setGrnForm] = useState({
    poRef: "",
    vendorName: "",
    receivedQty: "",
    dockNumber: "Dock-1",
    inspectedBy: employee?.name || "Dock Assistant",
  });

  const [deliveryChallans, setDeliveryChallans] = useState([]);
  const [showChallanModal, setShowChallanModal] = useState(false);
  const [challanForm, setChallanForm] = useState({
    customerName: "",
    itemsSummary: "",
    vehicleNumber: "",
    driverName: "",
    destinationCity: "",
  });

  // Handlers
  const handleCreatePo = (e) => {
    e.preventDefault();
    const newPo = {
      id: `PO-${Date.now().toString().slice(-5)}`,
      ...poForm,
      totalCost: (Number(poForm.quantity) || 0) * (Number(poForm.unitPrice) || 0),
      status: "ISSUED_TO_VENDOR",
      date: new Date().toLocaleDateString(),
    };
    setPurchaseOrders([newPo, ...purchaseOrders]);
    setShowPoModal(false);
    setPoForm({
      vendorName: "",
      materialDescription: "",
      quantity: "",
      unitPrice: "",
      expectedDelivery: "",
    });
    onNotify("Purchase Order (PO) issued to vendor!");
  };

  const handleCreateGrn = (e) => {
    e.preventDefault();
    const newGrn = {
      id: `GRN-${Date.now().toString().slice(-5)}`,
      ...grnForm,
      status: "ACCEPTED_INTO_STOCK",
      receivedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setGrnList([newGrn, ...grnList]);
    setShowGrnModal(false);
    setGrnForm({
      poRef: "",
      vendorName: "",
      receivedQty: "",
      dockNumber: "Dock-1",
      inspectedBy: employee?.name || "Dock Assistant",
    });
    onNotify("Goods Receipt Note (GRN) booked into warehouse ledger!");
  };

  const handleCreateChallan = (e) => {
    e.preventDefault();
    const newChallan = {
      id: `DC-${Date.now().toString().slice(-5)}`,
      ...challanForm,
      status: "DISPATCHED",
      eWayBill: `EWB-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      date: new Date().toLocaleDateString(),
    };
    setDeliveryChallans([newChallan, ...deliveryChallans]);
    setShowChallanModal(false);
    setChallanForm({
      customerName: "",
      itemsSummary: "",
      vehicleNumber: "",
      driverName: "",
      destinationCity: "",
    });
    onNotify("Delivery Challan & e-Way Bill generated for carrier dispatch!");
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-black text-amber-600 uppercase tracking-wider">
              Logistics • {deptConfig.rolesByLevel[employee?.postLevel]?.title || "Logistics"}
            </span>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-100">
              {employee?.branchName || "Main HQ"}
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">{currentTab.title}</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
            {deptConfig.rolesByLevel[employee?.postLevel]?.tasks ||
              "Manage warehouse stocks, vendor procurement, freight carriers, and dispatch."}
          </p>
        </div>

        {/* Sub-view Switcher Pills */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-100/80 border border-slate-200/80 overflow-x-auto self-start md:self-auto">
          {currentTab.subViews.map((sub) => (
            <button
              key={sub.id}
              onClick={() => setActiveSubView(sub.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                activeSubView === sub.id
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              {sub.label}
            </button>
          ))}
        </div>
      </div>

      {/* =========================================================================
          TAB 1: LOGISTICS_DASHBOARD (Supply Chain & SLA Hub)
         ========================================================================= */}
      {tabId === "logistics_dashboard" && (
        <div className="space-y-6">
          {activeSubView === "freight_analytics" && (
            <div className="space-y-6">
              {(() => {
                const totalProcurement = purchaseOrders.reduce(
                  (sum, po) => sum + (po.totalCost || 0),
                  0
                );

                return (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        {
                          label: "Committed PO Spend",
                          val: `₹ ${totalProcurement.toLocaleString()}`,
                          sub: `${purchaseOrders.length} active purchase orders`,
                          color: "amber",
                        },
                        {
                          label: "Warehouse Receipts (GRN)",
                          val: grnList.length.toString(),
                          sub: grnList.length > 0 ? "Admitted into inventory" : "Loading dock idle",
                          color: "emerald",
                        },
                        {
                          label: "Carrier Dispatches (DC)",
                          val: deliveryChallans.length.toString(),
                          sub: deliveryChallans.length > 0 ? "Shipments on route" : "Zero outgoing consignments",
                          color: "blue",
                        },
                        {
                          label: "Carrier SLA Performance",
                          val: deliveryChallans.length > 0 ? "99.2%" : "100%",
                          sub: "On-time delivery benchmark",
                          color: "purple",
                        },
                      ].map((stat, i) => (
                        <div key={i} className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                            {stat.label}
                          </span>
                          <p className="text-2xl font-black text-slate-900 font-mono">{stat.val}</p>
                          <span className="text-[11px] font-bold text-slate-500 mt-1 block">{stat.sub}</span>
                        </div>
                      ))}
                    </div>

                    {purchaseOrders.length === 0 && deliveryChallans.length === 0 && (
                      <div className="p-8 text-center rounded-3xl bg-white border border-slate-200/80 shadow-xs">
                        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center mb-3">
                          <Truck className="w-7 h-7" />
                        </div>
                        <h4 className="text-sm font-black text-slate-800">
                          Supply Chain & Logistics Network on Standby
                        </h4>
                        <p className="text-xs text-slate-500 font-medium max-w-md mx-auto mt-1 mb-4">
                          Zero active freight dispatches or vendor receipts logged yet. Create Purchase Orders (PO) in Procurement or draft Delivery Challans (DC) in Dispatch to activate logistics tracking.
                        </p>
                        <button
                          type="button"
                          onClick={() => setShowPoModal(true)}
                          className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Create First Purchase Order</span>
                        </button>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}

          {activeSubView === "carrier_sla" && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-slate-900 uppercase">Carrier SLA Scorecard</h3>
              {deliveryChallans.length === 0 ? (
                <div className="p-10 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <Truck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-bold text-slate-700">No Carrier Dispatches Active</p>
                  <p className="text-[11px] text-slate-400 mt-0.5 max-w-md mx-auto">
                    Carrier transit metrics, driver logs, and SLA punctuality scorecards generate automatically as Delivery Challans are dispatched.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {deliveryChallans.map((dc) => (
                    <div key={dc.id} className="p-4 rounded-2xl bg-amber-50/40 border border-amber-200 text-xs flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900 block mb-0.5">
                          {dc.customerName} • {dc.destinationCity}
                        </span>
                        <p className="text-slate-500">
                          Vehicle: {dc.vehicleNumber} • Driver: {dc.driverName} • e-Way Bill: {dc.eWayBill}
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                        ON ROUTE (100% SLA)
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeSubView === "demand_forecasting" && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
              <h3 className="text-sm font-black text-slate-900 uppercase">Procurement Demand Forecast</h3>
              <p className="text-xs text-slate-500">Projected raw material consumption based on approved Sales Orders and Plant BOM.</p>
              {purchaseOrders.length === 0 ? (
                <div className="p-10 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <Boxes className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-bold text-slate-700">No Inbound Demand Forecast Available</p>
                  <p className="text-[11px] text-slate-400 mt-0.5 max-w-md mx-auto">
                    Forecasted requirements calculate automatically from scheduled production work orders and supplier replenishment schedules.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {purchaseOrders.map((po) => (
                    <div key={po.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                      <span className="font-bold text-slate-900 block mb-0.5">
                        Scheduled Delivery: {po.materialDescription} ({po.quantity} units)
                      </span>
                      Vendor: {po.vendorName} • Expected Arrival: {po.expectedDelivery || "Next 7 Days"}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: PROCUREMENT_PO (Procurement & Vendors Inbound)
         ========================================================================= */}
      {tabId === "procurement_po" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 uppercase">Inbound Vendor Procurement & POs</h3>
            <button
              onClick={() => setShowPoModal(true)}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              + Create Purchase Order (PO)
            </button>
          </div>

          <div className="rounded-3xl bg-white border border-slate-200/80 p-6 shadow-xs space-y-4">
            {purchaseOrders.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <PackageCheck className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-semibold">No purchase orders created yet.</p>
                <p className="text-[11px] text-slate-400">Create a PO to source raw materials from approved suppliers.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-black">
                      <th className="pb-3 pl-2">PO Number</th>
                      <th className="pb-3">Vendor</th>
                      <th className="pb-3">Material</th>
                      <th className="pb-3">Quantity</th>
                      <th className="pb-3">Total Cost</th>
                      <th className="pb-3 pr-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {purchaseOrders.map((po) => (
                      <tr key={po.id} className="hover:bg-slate-50/60">
                        <td className="py-3 pl-2 font-bold text-slate-900">{po.id}</td>
                        <td className="py-3 font-semibold text-slate-800">{po.vendorName}</td>
                        <td className="py-3 text-slate-600">{po.materialDescription}</td>
                        <td className="py-3 font-mono text-slate-700">{po.quantity}</td>
                        <td className="py-3 font-mono font-bold text-slate-900">₹ {po.totalCost}</td>
                        <td className="py-3 pr-2 text-right">
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                            {po.status.replace(/_/g, " ")}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: WAREHOUSE_STOCK (Warehouse & Stock Ledger)
         ========================================================================= */}
      {tabId === "warehouse_stock" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 uppercase">Warehouse Inventory & Goods Receipts (GRN)</h3>
            <button
              onClick={() => setShowGrnModal(true)}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              + Draft Goods Receipt (GRN)
            </button>
          </div>

          <div className="rounded-3xl bg-white border border-slate-200/80 p-6 shadow-xs space-y-4">
            {grnList.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Warehouse className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-semibold">No Goods Receipt Notes (GRN) logged today.</p>
                <p className="text-[11px] text-slate-400">Incoming deliveries at loading dock are verified and admitted into inventory here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {grnList.map((g) => (
                  <div key={g.id} className="p-4 rounded-2xl border border-slate-200 bg-white flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{g.id} • PO: {g.poRef}</span>
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                          {g.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 mt-1">Vendor: {g.vendorName} • Qty Received: {g.receivedQty}</p>
                      <p className="text-[10px] text-slate-400">Dock: {g.dockNumber} • Checked by: {g.inspectedBy}</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-700">Stock Updated</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: DISPATCH_FLEET (Order & Dispatch Hub Outbound)
         ========================================================================= */}
      {tabId === "dispatch_fleet" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 uppercase">Outbound Dispatch & Fleet Manifest</h3>
            <button
              onClick={() => setShowChallanModal(true)}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              + Generate Delivery Challan
            </button>
          </div>

          <div className="rounded-3xl bg-white border border-slate-200/80 p-6 shadow-xs space-y-4">
            {deliveryChallans.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Truck className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-semibold">Zero outbound shipments in dispatch queue.</p>
                <p className="text-[11px] text-slate-400">Generate Delivery Challans and e-Way bills to dispatch finished customer orders.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {deliveryChallans.map((dc) => (
                  <div key={dc.id} className="p-4 rounded-2xl border border-slate-200 bg-white flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{dc.id} • {dc.customerName}</span>
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                          {dc.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 mt-1">{dc.itemsSummary} → Destination: {dc.destinationCity}</p>
                      <p className="text-[10px] text-slate-400">Vehicle: {dc.vehicleNumber} (Driver: {dc.driverName}) • {dc.eWayBill}</p>
                    </div>
                    <span className="text-[10px] font-bold text-indigo-700 px-3 py-1 rounded-xl bg-indigo-50">
                      In Transit
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODALS
         ========================================================================= */}
      {/* 1. PO Modal */}
      {showPoModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-black text-slate-900">Create Purchase Order (PO)</h3>
            <form onSubmit={handleCreatePo} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Vendor / Supplier</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Reliable Polymers Corp"
                  value={poForm.vendorName}
                  onChange={(e) => setPoForm({ ...poForm, vendorName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Material Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. High Density Polyethylene (HDPE) Grade 5"
                  value={poForm.materialDescription}
                  onChange={(e) => setPoForm({ ...poForm, materialDescription: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Quantity (KG / Ton)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 2000"
                    value={poForm.quantity}
                    onChange={(e) => setPoForm({ ...poForm, quantity: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Unit Rate (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 110"
                    value={poForm.unitPrice}
                    onChange={(e) => setPoForm({ ...poForm, unitPrice: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPoModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs cursor-pointer shadow-xs"
                >
                  Issue Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. GRN Modal */}
      {showGrnModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-black text-slate-900">Draft Goods Receipt Note (GRN)</h3>
            <form onSubmit={handleCreateGrn} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">PO Reference Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PO-89012"
                  value={grnForm.poRef}
                  onChange={(e) => setGrnForm({ ...grnForm, poRef: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Supplier / Vendor</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Reliable Polymers Corp"
                  value={grnForm.vendorName}
                  onChange={(e) => setGrnForm({ ...grnForm, vendorName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Received Qty</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 2000"
                    value={grnForm.receivedQty}
                    onChange={(e) => setGrnForm({ ...grnForm, receivedQty: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Unload Dock</label>
                  <select
                    value={grnForm.dockNumber}
                    onChange={(e) => setGrnForm({ ...grnForm, dockNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 focus:outline-hidden"
                  >
                    <option value="Dock-1">Dock 1 (Heavy Freight)</option>
                    <option value="Dock-2">Dock 2 (Light Vans)</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGrnModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs cursor-pointer shadow-xs"
                >
                  Sign GRN & Admit Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Delivery Challan Modal */}
      {showChallanModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-black text-slate-900">Generate Delivery Challan & e-Way Bill</h3>
            <form onSubmit={handleCreateChallan} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Customer / Consignee</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Hardware Stores"
                  value={challanForm.customerName}
                  onChange={(e) => setChallanForm({ ...challanForm, customerName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Packages & Cargo Summary</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 50 Cartons Finished Brackets (Total: 450 KG)"
                  value={challanForm.itemsSummary}
                  onChange={(e) => setChallanForm({ ...challanForm, itemsSummary: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Vehicle Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MH-12-AB-1234"
                    value={challanForm.vehicleNumber}
                    onChange={(e) => setChallanForm({ ...challanForm, vehicleNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Destination City</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pune Central"
                    value={challanForm.destinationCity}
                    onChange={(e) => setChallanForm({ ...challanForm, destinationCity: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowChallanModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs cursor-pointer shadow-xs"
                >
                  Dispatch Cargo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
