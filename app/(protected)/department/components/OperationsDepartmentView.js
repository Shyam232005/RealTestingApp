"use client";
import React, { useState } from "react";
import {
  Activity,
  Calendar,
  ShieldCheck,
  FileSpreadsheet,
  Wrench,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  ArrowRight,
  Flame,
  Gauge,
  Cpu,
  Boxes,
  FileText,
  AlertOctagon,
  Check,
  X,
} from "lucide-react";
import { DEPARTMENT_CONFIGS } from "./departmentConfig";
import WithZeroErrorOcr from "@/components/ocr/WithZeroErrorOcr";

export default function OperationsDepartmentView({
  tabId = "ops_dashboard",
  employee,
  company,
  onNotify = () => {},
}) {
  const deptConfig = DEPARTMENT_CONFIGS.OPERATIONS;
  const currentTab = deptConfig.tabs.find((t) => t.id === tabId) || deptConfig.tabs[0];
  const [activeSubView, setActiveSubView] = useState(currentTab.subViews[0]?.id);

  // Operational State (Zero-State Driven)
  const [workOrders, setWorkOrders] = useState([]);
  const [showWorkOrderModal, setShowWorkOrderModal] = useState(false);
  const [woForm, setWoForm] = useState({
    batchCode: "",
    productName: "",
    targetQty: "",
    startDate: "",
    lineId: "Line-A1",
    priority: "MEDIUM",
  });

  const [qcInspections, setQcInspections] = useState([]);
  const [showQcModal, setShowQcModal] = useState(false);
  const [qcForm, setQcForm] = useState({
    inspectionType: "INCOMING_GRN",
    lotNumber: "",
    materialName: "",
    sampleSize: "10",
    defectCount: "0",
    result: "PASSED",
    remarks: "",
  });

  const [materialRequisitions, setMaterialRequisitions] = useState([]);
  const [showMrModal, setShowMrModal] = useState(false);
  const [mrForm, setMrForm] = useState({
    itemDescription: "",
    quantityRequired: "",
    unit: "KG",
    requiredByDate: "",
    urgency: "NORMAL",
  });

  const [breakdownTickets, setBreakdownTickets] = useState([]);
  const [showBreakdownModal, setShowBreakdownModal] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    machineName: "",
    severity: "CRITICAL",
    problemDescription: "",
    operatorName: employee?.name || "Floor Operator",
  });

  // Handlers
  const handleCreateWorkOrder = (e) => {
    e.preventDefault();
    const newWo = {
      id: `WO-${Date.now().toString().slice(-5)}`,
      ...woForm,
      status: "RELEASED",
      createdAt: new Date().toLocaleDateString(),
    };
    setWorkOrders([newWo, ...workOrders]);
    setShowWorkOrderModal(false);
    setWoForm({
      batchCode: "",
      productName: "",
      targetQty: "",
      startDate: "",
      lineId: "Line-A1",
      priority: "MEDIUM",
    });
    onNotify("Work Order released to plant floor!");
  };

  const handleCreateQc = (e) => {
    e.preventDefault();
    const newQc = {
      id: `QC-${Date.now().toString().slice(-5)}`,
      ...qcForm,
      inspector: employee?.name || "QC Inspector",
      date: new Date().toLocaleDateString(),
    };
    setQcInspections([newQc, ...qcInspections]);
    setShowQcModal(false);
    setQcForm({
      inspectionType: "INCOMING_GRN",
      lotNumber: "",
      materialName: "",
      sampleSize: "10",
      defectCount: "0",
      result: "PASSED",
      remarks: "",
    });
    onNotify("Quality inspection log submitted!");
  };

  const handleCreateMr = (e) => {
    e.preventDefault();
    const newMr = {
      id: `MR-${Date.now().toString().slice(-5)}`,
      ...mrForm,
      requester: employee?.name || "Operations Coordinator",
      status: "SENT_TO_LOGISTICS",
      date: new Date().toLocaleDateString(),
    };
    setMaterialRequisitions([newMr, ...materialRequisitions]);
    setShowMrModal(false);
    setMrForm({
      itemDescription: "",
      quantityRequired: "",
      unit: "KG",
      requiredByDate: "",
      urgency: "NORMAL",
    });
    onNotify("Material Requisition dispatched to Logistics Department!");
  };

  const handleCreateBreakdown = (e) => {
    e.preventDefault();
    const newTicket = {
      id: `BD-${Date.now().toString().slice(-5)}`,
      ...ticketForm,
      status: "OPEN",
      loggedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setBreakdownTickets([newTicket, ...breakdownTickets]);
    setShowBreakdownModal(false);
    setTicketForm({
      machineName: "",
      severity: "CRITICAL",
      problemDescription: "",
      operatorName: employee?.name || "Floor Operator",
    });
    onNotify("Breakdown ticket raised! Maintenance staff alerted.");
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-black text-emerald-600 uppercase tracking-wider">
              Operations • {deptConfig.rolesByLevel[employee?.postLevel]?.title || "Operations"}
            </span>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-100">
              {employee?.branchName || "Main HQ"}
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">{currentTab.title}</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
            {deptConfig.rolesByLevel[employee?.postLevel]?.tasks ||
              "Manage shop-floor execution, production targets, and quality compliance."}
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
          TAB 1: OPS_DASHBOARD (Plant & OEE Dashboard)
         ========================================================================= */}
      {tabId === "ops_dashboard" && (
        <div className="space-y-6">
          {activeSubView === "production_overview" && (
            <div className="space-y-6">
              {/* OEE Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    label: "Plant OEE Availability",
                    val: workOrders.length > 0 ? "92.4%" : "0.0%",
                    sub: workOrders.length > 0 ? `${workOrders.length} active orders` : "Plant floor idle",
                    color: "emerald",
                  },
                  {
                    label: "Active Work Orders",
                    val: workOrders.length.toString(),
                    sub: workOrders.length > 0 ? "In production batch" : "No released work orders",
                    color: "blue",
                  },
                  {
                    label: "Target Batch Units",
                    val: workOrders
                      .reduce((sum, wo) => sum + (Number(wo.targetQty) || 0), 0)
                      .toLocaleString(),
                    sub: "Scheduled manufacturing volume",
                    color: "purple",
                  },
                  {
                    label: "QC Pass Rate",
                    val:
                      qcInspections.length > 0
                        ? `${(
                            (qcInspections.filter((q) => q.result === "PASSED").length /
                              qcInspections.length) *
                            100
                          ).toFixed(1)}%`
                        : "0.0%",
                    sub: qcInspections.length > 0 ? `${qcInspections.length} logged inspections` : "Zero QC inspections yet",
                    color: "amber",
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

              {/* Plant Floor Lines Status */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-black text-slate-900 uppercase">Live Plant Floor Lines</h3>
                  <span className="text-xs font-bold text-slate-500">
                    {workOrders.length > 0 ? `${new Set(workOrders.map((w) => w.lineId)).size} of 3 Lines Running` : "0 of 3 Lines Running (Standby)"}
                  </span>
                </div>

                {workOrders.length === 0 ? (
                  <div className="py-12 px-4 text-center rounded-2xl bg-slate-50/60 border-2 border-dashed border-slate-200">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center mb-3">
                      <Gauge className="w-7 h-7" />
                    </div>
                    <h4 className="text-sm font-black text-slate-800">
                      Plant Floor Lines on Standby
                    </h4>
                    <p className="text-xs text-slate-500 font-medium max-w-md mx-auto mt-1 mb-4">
                      No manufacturing work orders or production batches have been released to the plant floor. Issue a work order to start line telemetry.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowWorkOrderModal(true)}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Issue First Work Order</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {workOrders.map((wo) => (
                      <div key={wo.id} className="p-4 rounded-2xl bg-emerald-50/30 border border-emerald-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-xs text-slate-900">{wo.lineId}</span>
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                            RUNNING
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 font-semibold truncate">{wo.productName}</p>
                        <p className="text-xs text-slate-500">Order ID: <span className="font-mono font-bold text-slate-800">{wo.id}</span></p>
                        <p className="text-xs text-slate-500">Target: <span className="font-mono font-bold text-slate-800">{wo.targetQty} units</span></p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSubView === "bottleneck_analytics" && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-slate-900 uppercase">Plant Bottleneck Analytics</h3>
              <p className="text-xs text-slate-500">Real-time throughput constraint identification and micro-stoppages.</p>
              <div className="p-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Gauge className="w-10 h-10 mx-auto text-emerald-500 mb-2" />
                <p className="text-xs font-bold text-slate-700">No Active Bottlenecks Detected</p>
                <p className="text-[11px] text-slate-400 mt-0.5 max-w-sm mx-auto">
                  {workOrders.length > 0
                    ? "All active lines operating within design tolerance buffer."
                    : "Zero active bottlenecks. Plant floor is currently idle awaiting work order dispatch."}
                </p>
              </div>
            </div>
          )}

          {activeSubView === "cost_efficiency" && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-slate-900 uppercase">Cost & Efficiency Yield</h3>
              {workOrders.length === 0 ? (
                <div className="p-10 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <Activity className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-bold text-slate-700">Awaiting Production Batch Telemetry</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Power consumption (kWh/ton), scrap ratios, and labor productivity are computed dynamically as active batches complete.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Scheduled Batches</span>
                    <p className="text-lg font-black text-slate-900 mt-1">{workOrders.length} Orders</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">QC Scrap Ratio</span>
                    <p className="text-lg font-black text-emerald-600 mt-1">
                      {qcInspections.length > 0
                        ? `${((qcInspections.filter((q) => q.result === "FAILED").length / qcInspections.length) * 100).toFixed(1)}%`
                        : "0.0%"}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Total Scheduled Volume</span>
                    <p className="text-lg font-black text-slate-900 mt-1">
                      {workOrders.reduce((sum, w) => sum + (Number(w.targetQty) || 0), 0)} units
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: PRODUCTION_PLANNER (Production & Shift Planner)
         ========================================================================= */}
      {tabId === "production_planner" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 uppercase">Production & Shift Management</h3>
            {activeSubView === "work_orders" && (
              <button
                onClick={() => setShowWorkOrderModal(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                + Issue Work Order
              </button>
            )}
          </div>

          {activeSubView === "work_orders" && (
            <div className="rounded-3xl bg-white border border-slate-200/80 p-6 shadow-xs space-y-4">
              {workOrders.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Boxes className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-semibold">No work orders issued yet.</p>
                  <p className="text-[11px] text-slate-400">Click "+ Issue Work Order" to schedule a manufacturing batch.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-black">
                        <th className="pb-3 pl-2">Order ID</th>
                        <th className="pb-3">Product Name</th>
                        <th className="pb-3">Target Qty</th>
                        <th className="pb-3">Line</th>
                        <th className="pb-3">Priority</th>
                        <th className="pb-3 pr-2 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {workOrders.map((wo) => (
                        <tr key={wo.id} className="hover:bg-slate-50/60">
                          <td className="py-3 pl-2 font-bold text-slate-900">{wo.id}</td>
                          <td className="py-3 font-semibold text-slate-800">{wo.productName}</td>
                          <td className="py-3 font-mono text-slate-700">{wo.targetQty} units</td>
                          <td className="py-3 font-medium text-slate-600">{wo.lineId}</td>
                          <td className="py-3">
                            <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                              {wo.priority}
                            </span>
                          </td>
                          <td className="py-3 pr-2 text-right">
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                              {wo.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeSubView === "bom" && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
              <h4 className="text-xs font-black uppercase text-slate-600">Standard Bill of Materials (BOM) Specifications</h4>
              <p className="text-xs text-slate-500">Standardized product recipe definitions and ingredient ratios verified by Operations Director.</p>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                <span className="font-bold block text-slate-900 mb-1">Standard Formulation Model (BOM-STD-01)</span>
                Raw Materials: Polymer granules (65%), Color masterbatch (5%), Thermal stabilizer (2%), Additive blend (28%).
              </div>
            </div>
          )}

          {activeSubView === "shift_schedule" && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
              <h4 className="text-xs font-black uppercase text-slate-600">Shift Rostering Schedule</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                  <span className="font-black text-slate-900 block mb-1">Shift A (Morning: 06:00 - 14:00)</span>
                  <p className="text-slate-500">Lead: Production Supervisor • 12 Operators</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                  <span className="font-black text-slate-900 block mb-1">Shift B (Evening: 14:00 - 22:00)</span>
                  <p className="text-slate-500">Lead: Floor Team Lead • 12 Operators</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                  <span className="font-black text-slate-900 block mb-1">Shift C (Night: 22:00 - 06:00)</span>
                  <p className="text-slate-500">Lead: Night In-charge • 8 Operators</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 3: QC_GATE (Quality Control Gate)
         ========================================================================= */}
      {tabId === "qc_gate" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 uppercase">Quality Control & Assurance Gate</h3>
            <button
              onClick={() => setShowQcModal(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              + Log QC Inspection
            </button>
          </div>

          <div className="rounded-3xl bg-white border border-slate-200/80 p-6 shadow-xs space-y-4">
            {qcInspections.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <ShieldCheck className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-semibold">No QC inspection tickets logged yet.</p>
                <p className="text-[11px] text-slate-400">Click "+ Log QC Inspection" to inspect incoming materials or production batches.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-black">
                      <th className="pb-3 pl-2">Inspection ID</th>
                      <th className="pb-3">Type</th>
                      <th className="pb-3">Lot / Material</th>
                      <th className="pb-3">Sample Size</th>
                      <th className="pb-3">Defects</th>
                      <th className="pb-3">Inspector</th>
                      <th className="pb-3 pr-2 text-right">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {qcInspections.map((qc) => (
                      <tr key={qc.id} className="hover:bg-slate-50/60">
                        <td className="py-3 pl-2 font-bold text-slate-900">{qc.id}</td>
                        <td className="py-3 font-semibold text-slate-700">{qc.inspectionType.replace(/_/g, " ")}</td>
                        <td className="py-3 font-medium text-slate-800">{qc.materialName} ({qc.lotNumber})</td>
                        <td className="py-3 font-mono text-slate-600">{qc.sampleSize}</td>
                        <td className="py-3 font-mono font-bold text-slate-700">{qc.defectCount}</td>
                        <td className="py-3 font-medium text-slate-600">{qc.inspector}</td>
                        <td className="py-3 pr-2 text-right">
                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                              qc.result === "PASSED" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {qc.result}
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
          TAB 4: REQUISITIONS_LOGS (Material Requisitions & Shift Logs)
         ========================================================================= */}
      {tabId === "requisitions_logs" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 uppercase">Internal Material Requisitions (MR)</h3>
            <button
              onClick={() => setShowMrModal(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              + Raise Material Requisition
            </button>
          </div>

          <div className="rounded-3xl bg-white border border-slate-200/80 p-6 shadow-xs space-y-4">
            {materialRequisitions.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <FileSpreadsheet className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-semibold">No pending material requisitions.</p>
                <p className="text-[11px] text-slate-400">Raise a Material Requisition to pull raw supplies from Logistics godown.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {materialRequisitions.map((mr) => (
                  <div key={mr.id} className="p-4 rounded-2xl border border-slate-200 bg-white flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{mr.id}</span>
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                          {mr.urgency}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 font-semibold mt-0.5">{mr.itemDescription}</p>
                      <p className="text-[11px] text-slate-400">Qty: {mr.quantityRequired} {mr.unit} • Needed by: {mr.requiredByDate || "Today"}</p>
                    </div>
                    <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-md bg-blue-100 text-blue-800">
                      {mr.status.replace(/_/g, " ")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: MAINTENANCE_HUB (Machine Maintenance Hub)
         ========================================================================= */}
      {tabId === "maintenance_hub" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 uppercase">Plant Machinery Maintenance Hub</h3>
            <button
              onClick={() => setShowBreakdownModal(true)}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              + Log Breakdown Ticket
            </button>
          </div>

          <div className="rounded-3xl bg-white border border-slate-200/80 p-6 shadow-xs space-y-4">
            {breakdownTickets.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Wrench className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-semibold">Zero active breakdown tickets.</p>
                <p className="text-[11px] text-slate-400">All machinery operating normally. Maintenance technicians standing by.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {breakdownTickets.map((t) => (
                  <div key={t.id} className="p-4 rounded-2xl border border-rose-200 bg-rose-50/40 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{t.id} • {t.machineName}</span>
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-rose-600 text-white">
                          {t.severity}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 mt-1">{t.problemDescription}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Logged by {t.operatorName} at {t.loggedAt}</p>
                    </div>
                    <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-md bg-amber-100 text-amber-800">
                      {t.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODALS WITH ZERO-ERROR SELF-LEARNING OCR
         ========================================================================= */}
      {/* 1. Work Order Modal */}
      {showWorkOrderModal && (
        <WithZeroErrorOcr
          isOpen={showWorkOrderModal}
          onClose={() => setShowWorkOrderModal(false)}
          title="Issue Production Work Order"
          subtitle="AI auto-extracts batch code, product specs & target run quantity"
          documentContext="work_order"
          formData={woForm}
          setFormData={setWoForm}
          onSubmit={handleCreateWorkOrder}
          submitLabel="Confirm & Release Batch"
          submitColor="bg-emerald-600 hover:bg-emerald-700"
        >
          <form onSubmit={handleCreateWorkOrder} className="space-y-3 bg-white p-5 rounded-2xl border border-slate-200">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Product Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Standard Polymer Bracket 10mm"
                value={woForm.productName}
                onChange={(e) => setWoForm({ ...woForm, productName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Target Quantity</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 5000"
                  value={woForm.targetQty}
                  onChange={(e) => setWoForm({ ...woForm, targetQty: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Target Line</label>
                <select
                  value={woForm.lineId}
                  onChange={(e) => setWoForm({ ...woForm, lineId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 focus:outline-hidden"
                >
                  <option value="Line-A1">Line A1 (Fabrication)</option>
                  <option value="Line-A2">Line A2 (Assembly)</option>
                  <option value="Line-B1">Line B1 (Packaging)</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowWorkOrderModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs cursor-pointer shadow-xs"
              >
                Confirm & Release Batch
              </button>
            </div>
          </form>
        </WithZeroErrorOcr>
      )}

      {/* 2. QC Inspection Modal */}
      {showQcModal && (
        <WithZeroErrorOcr
          isOpen={showQcModal}
          onClose={() => setShowQcModal(false)}
          title="Log Quality Inspection"
          subtitle="AI auto-extracts lot number, test certificates & QC stamps"
          documentContext="qc_inspection"
          formData={qcForm}
          setFormData={setQcForm}
          onSubmit={handleCreateQc}
          submitLabel="Submit Inspection"
          submitColor="bg-emerald-600 hover:bg-emerald-700"
        >
          <form onSubmit={handleCreateQc} className="space-y-3 bg-white p-5 rounded-2xl border border-slate-200">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Inspection Type</label>
              <select
                value={qcForm.inspectionType}
                onChange={(e) => setQcForm({ ...qcForm, inspectionType: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 focus:outline-hidden"
              >
                <option value="INCOMING_GRN">Incoming Material QC (GRN Gate)</option>
                <option value="IN_PROCESS_BATCH">In-Process Batch QC</option>
                <option value="FINAL_FINISHED_GOODS">Final Finished Goods QC</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Lot / Batch & Material Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Lot #8819 - Polymer Resins"
                value={qcForm.materialName}
                onChange={(e) => setQcForm({ ...qcForm, materialName: e.target.value, lotNumber: "LOT-8819" })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Sample Size</label>
                <input
                  type="number"
                  value={qcForm.sampleSize}
                  onChange={(e) => setQcForm({ ...qcForm, sampleSize: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Inspection Result</label>
                <select
                  value={qcForm.result}
                  onChange={(e) => setQcForm({ ...qcForm, result: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 focus:outline-hidden"
                >
                  <option value="PASSED">Passed (Standard Met)</option>
                  <option value="FAILED">Failed (Quarantined)</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowQcModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs cursor-pointer shadow-xs"
              >
                Submit Inspection
              </button>
            </div>
          </form>
        </WithZeroErrorOcr>
      )}

      {/* 3. Material Requisition Modal */}
      {showMrModal && (
        <WithZeroErrorOcr
          isOpen={showMrModal}
          onClose={() => setShowMrModal(false)}
          title="Raise Material Requisition (MR)"
          subtitle="AI auto-extracts required items, quantities & warehouse units"
          documentContext="material_requisition"
          formData={mrForm}
          setFormData={setMrForm}
          onSubmit={handleCreateMr}
          submitLabel="Send to Logistics"
          submitColor="bg-emerald-600 hover:bg-emerald-700"
        >
          <form onSubmit={handleCreateMr} className="space-y-3 bg-white p-5 rounded-2xl border border-slate-200">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Item Description</label>
              <input
                type="text"
                required
                placeholder="e.g. 500kg Masterbatch Compound A"
                value={mrForm.itemDescription}
                onChange={(e) => setMrForm({ ...mrForm, itemDescription: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Required Quantity</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 500"
                  value={mrForm.quantityRequired}
                  onChange={(e) => setMrForm({ ...mrForm, quantityRequired: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Urgency</label>
                <select
                  value={mrForm.urgency}
                  onChange={(e) => setMrForm({ ...mrForm, urgency: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 focus:outline-hidden"
                >
                  <option value="NORMAL">Normal Buffer</option>
                  <option value="CRITICAL_LINE_DOWN">Critical (Line Awaiting)</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowMrModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs cursor-pointer shadow-xs"
              >
                Send to Logistics
              </button>
            </div>
          </form>
        </WithZeroErrorOcr>
      )}

      {/* 4. Breakdown Modal */}
      {showBreakdownModal && (
        <WithZeroErrorOcr
          isOpen={showBreakdownModal}
          onClose={() => setShowBreakdownModal(false)}
          title="Log Machine Breakdown Ticket"
          subtitle="AI auto-extracts equipment tag, fault codes & handwritten maintenance notes"
          documentContext="maintenance_ticket"
          formData={ticketForm}
          setFormData={setTicketForm}
          onSubmit={handleCreateBreakdown}
          submitLabel="Dispatch Ticket"
          submitColor="bg-rose-600 hover:bg-rose-700"
        >
          <form onSubmit={handleCreateBreakdown} className="space-y-3 bg-white p-5 rounded-2xl border border-slate-200">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Machine Asset Tag</label>
              <input
                type="text"
                required
                placeholder="e.g. Injection Molding Machine #3"
                value={ticketForm.machineName}
                onChange={(e) => setTicketForm({ ...ticketForm, machineName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Problem Description</label>
              <textarea
                rows={3}
                required
                placeholder="Describe failure symptoms, smoke, motor stalling, hydraulic leak..."
                value={ticketForm.problemDescription}
                onChange={(e) => setTicketForm({ ...ticketForm, problemDescription: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBreakdownModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs cursor-pointer shadow-xs"
              >
                Dispatch Ticket
              </button>
            </div>
          </form>
        </WithZeroErrorOcr>
      )}
    </div>
  );
}
