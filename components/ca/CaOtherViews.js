"use client";
import React from "react";
import {
  Users,
  AlertTriangle,
  FileSpreadsheet,
  Settings,
  Scale,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  Plus,
  Mail,
  Phone,
  FileText,
  BadgeCheck,
  Building2,
  ArrowRight,
  Stamp,
  Download,
} from "lucide-react";
import { useCa } from "./CaContext";
import Link from "next/link";
import CrownZeroState from "@/components/ui/CrownZeroState";

// 1. Team Management & Work Assignment View (Articles & Senior Auditors)
export function CaTeamView() {
  const { user, refreshProfile } = useCa();
  const [staffList, setStaffList] = React.useState([]);
  const [tasksList, setTasksList] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [assignModalOpen, setAssignModalOpen] = React.useState(false);
  const [selectedStaffForAssign, setSelectedStaffForAssign] = React.useState("");
  const [copied, setCopied] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState("");

  // Assign Form fields
  const [taskTitle, setTaskTitle] = React.useState("");
  const [taskDescription, setTaskDescription] = React.useState("");
  const [selectedClient, setSelectedClient] = React.useState("");
  const [taskCategory, setTaskCategory] = React.useState("VOUCHER_AUDIT");
  const [taskPriority, setTaskPriority] = React.useState("HIGH");
  const [taskDueDate, setTaskDueDate] = React.useState("");

  const staffInviteCode = user?.staffInviteCode || "STF-CROWN9";
  const connectedClients = user?.clients || [];

  const loadStaffAndTasks = React.useCallback(async () => {
    try {
      const [staffRes, tasksRes] = await Promise.all([
        fetch("/api/ca/staff"),
        fetch("/api/ca/tasks"),
      ]);
      if (staffRes.ok) {
        const staffData = await staffRes.json();
        setStaffList(staffData.staff || []);
      }
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setTasksList(tasksData.tasks || []);
      }
    } catch (err) {
      console.error("Failed to fetch staff data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    let isSubscribed = true;
    (async () => {
      try {
        const [staffRes, tasksRes] = await Promise.all([
          fetch("/api/ca/staff"),
          fetch("/api/ca/tasks"),
        ]);
        if (staffRes.ok && isSubscribed) {
          const staffData = await staffRes.json();
          setStaffList(staffData.staff || []);
        }
        if (tasksRes.ok && isSubscribed) {
          const tasksData = await tasksRes.json();
          setTasksList(tasksData.tasks || []);
        }
      } catch (err) {
        console.error("Failed to fetch staff data:", err);
      } finally {
        if (isSubscribed) setLoading(false);
      }
    })();

    return () => {
      isSubscribed = false;
    };
  }, []);

  const copyCode = () => {
    navigator.clipboard?.writeText(staffInviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleOpenAssign = (staffId = "") => {
    if (connectedClients.length === 0) {
      alert("No client business connected yet. Please link a client or request data access first.");
      setActiveTab("clients");
      return;
    }
    setSelectedStaffForAssign(staffId || (staffList[0]?.id || ""));
    setSelectedClient(connectedClients[0]?.name || "");
    setTaskTitle("");
    setTaskDescription("");
    setTaskCategory("VOUCHER_AUDIT");
    setTaskPriority("HIGH");
    setTaskDueDate("");
    setAssignModalOpen(true);
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStaffForAssign || !taskTitle.trim()) {
      alert("Please select a staff member and specify work title.");
      return;
    }
    setSubmitting(true);
    try {
      const matchedClient = connectedClients.find((c) => c.name === selectedClient);
      const res = await fetch("/api/ca/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffId: selectedStaffForAssign,
          clientId: matchedClient?.id || null,
          clientName: selectedClient,
          title: taskTitle.trim(),
          description: taskDescription.trim(),
          category: taskCategory,
          priority: taskPriority,
          dueDate: taskDueDate,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to assign work.");
      }

      setToastMessage(data.message || "Work assigned to staff member successfully!");
      setAssignModalOpen(false);
      loadStaffAndTasks();
      refreshProfile();
      setTimeout(() => setToastMessage(""), 4000);
    } catch (err) {
      alert(err.message || "Work assignment failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const displayStaff = staffList.length > 0 ? staffList : (user?.staff || []);

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-4 rounded-2xl bg-slate-900 text-white text-xs font-bold border border-slate-700 shadow-xl flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900">
              Audit Staff &amp; Work Assignment
            </h2>
            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
              Partner Delegation
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Assign statutory audit works, review vouchers, and monitor what each staff member is currently working on in real time.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Practice Code Copy */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-2xl">
            <span className="text-[11px] font-bold text-slate-500">Staff Code:</span>
            <span className="font-mono font-black text-indigo-700 text-xs">{staffInviteCode}</span>
            <button
              type="button"
              onClick={copyCode}
              className="text-[9px] font-black uppercase bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 rounded-lg transition-colors cursor-pointer"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleOpenAssign()}
            disabled={displayStaff.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-slate-900 text-white font-bold text-xs hover:bg-black transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Assign Work to Staff</span>
          </button>
        </div>
      </div>

      {/* ZERO STATE (If no staff added yet) */}
      {displayStaff.length === 0 ? (
        <CrownZeroState
          variant="team"
          icon={Users}
          badge="Audit Staff &amp; Articles"
          title="No Audit Staff or Articles Added Yet"
          description={`Your practice currently has zero registered article assistants. Share your Practice Staff Invite Code (${staffInviteCode}) with your article assistants so they can register and link directly to your practice.`}
          actionText="Copy Staff Invite Code"
          onAction={copyCode}
        />
      ) : (
        <div className="space-y-6">
          {/* Staff Member Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayStaff.map((member) => {
              const currentWork = member.currentWork;
              const initials = (member.name || "ST").slice(0, 2).toUpperCase();

              return (
                <div
                  key={member.id || member._id}
                  className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-2xs space-y-4 hover:shadow-xs transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-sm">
                        {initials}
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900">{member.name}</h4>
                        <p className="text-[11px] font-bold text-indigo-700">{member.roleInFirm || "Article Assistant"}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Active
                    </span>
                  </div>

                  {/* What Staff is Currently Doing (Live Work Status) */}
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1.5">
                    <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                      Current Work Status:
                    </span>
                    {currentWork ? (
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-black text-slate-900 block text-[11px]">
                            {currentWork.title}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            Client: <strong className="text-slate-700">{currentWork.clientName}</strong> • {currentWork.vouchersChecked} Vouchers Checked
                          </span>
                        </div>
                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md shrink-0 ${
                            currentWork.status === "IN_PROGRESS"
                              ? "bg-amber-100 text-amber-900"
                              : "bg-indigo-100 text-indigo-900"
                          }`}
                        >
                          {currentWork.status === "IN_PROGRESS" ? "In Progress" : "Assigned"}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Ready for new work assignment</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 py-2 px-3 rounded-xl bg-slate-50 text-[11px] border border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Assigned MSMEs</span>
                      <span className="font-black text-slate-800">
                        {member.assignedClientsCount || member.assignedCount || 0} Clients
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Contact</span>
                      <span className="font-mono text-slate-700">{member.phoneNumber || member.email}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                    <span className="text-[11px] text-slate-400 truncate max-w-[180px]">{member.email}</span>
                    <button
                      type="button"
                      onClick={() => handleOpenAssign(member.id || member._id)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 hover:text-indigo-900 cursor-pointer"
                    >
                      <span>Assign Work</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Firm Tasks Roll */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  Staff Work Queue &amp; Progress Roll
                </h3>
                <p className="text-xs text-slate-500">
                  All audit tasks assigned by the Managing Partner and their live completion states
                </p>
              </div>
              <span className="text-xs font-bold px-3 py-1 bg-slate-100 rounded-xl text-slate-700">
                {tasksList.length} Tasks Logged
              </span>
            </div>

            {tasksList.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">
                No tasks assigned yet. Click "Assign Work to Staff" above to delegate audit tasks.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {tasksList.map((task) => (
                  <div key={task._id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900">{task.title}</span>
                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                            task.status === "WORK_COMPLETED"
                              ? "bg-emerald-100 text-emerald-800"
                              : task.status === "IN_PROGRESS"
                              ? "bg-amber-100 text-amber-900"
                              : "bg-blue-100 text-blue-900"
                          }`}
                        >
                          {task.status.replace(/_/g, " ")}
                        </span>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                          {task.priority} Priority
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Assigned to: <strong className="text-slate-700">{task.staffName}</strong> • Client: <strong className="text-slate-700">{task.clientName}</strong>
                        {task.vouchersChecked > 0 && ` • ${task.vouchersChecked} Vouchers Verified`}
                      </p>
                    </div>

                    <span className="text-[10px] text-slate-400 font-mono">
                      Due: {task.dueDate || "Standard"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ASSIGN WORK MODAL */}
      {assignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Assign Work to Staff</h3>
                  <p className="text-[11px] text-slate-500">Delegate ledger audit or tax verification task</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAssignModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Select Staff Member:
                </label>
                <select
                  value={selectedStaffForAssign}
                  onChange={(e) => setSelectedStaffForAssign(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-indigo-600"
                  required
                >
                  {displayStaff.map((st) => (
                    <option key={st.id || st._id} value={st.id || st._id}>
                      {st.name} ({st.roleInFirm || "Article"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Select Client MSME Company:
                </label>
                <select
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-indigo-600"
                >
                  {connectedClients.length > 0 ? (
                    connectedClients.map((c) => (
                      <option key={c.id || c._id} value={c.name}>
                        {c.name}
                      </option>
                    ))
                  ) : (
                    <option value="">No client companies connected yet</option>
                  )}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Work Title / Assignment Scope:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Audit Q2 Inward Purchase Bills & GSTR-2B Matching"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-indigo-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Category:</label>
                  <select
                    value={taskCategory}
                    onChange={(e) => setTaskCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800"
                  >
                    <option value="VOUCHER_AUDIT">Voucher Audit</option>
                    <option value="GST_RECONCILIATION">GST GSTR-2B Match</option>
                    <option value="BANK_RECONCILIATION">Bank Reconciliation</option>
                    <option value="TDS_CHECK">TDS 194C / 194Q Check</option>
                    <option value="STOCK_AUDIT">Stock &amp; Godown Audit</option>
                    <option value="TAX_AUDIT_3CD">Tax Audit 3CD Schedule</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Priority:</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800"
                  >
                    <option value="LOW">Low Priority</option>
                    <option value="MEDIUM">Medium Priority</option>
                    <option value="HIGH">High Priority</option>
                    <option value="URGENT">Urgent (Statutory Due)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Due Date (Optional):
                </label>
                <input
                  type="date"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Instructions / Work Notes:
                </label>
                <textarea
                  rows={2}
                  placeholder="Specific items to verify, e.g. check transporter e-way bills and 15G declarations..."
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold disabled:opacity-50 cursor-pointer shadow-md"
                >
                  <span>{submitting ? "Assigning..." : "Assign Work"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// 2. Query Escalations & Discrepancies View
export function CaEscalationsView() {
  const { user, setActiveTab } = useCa();
  const connectedClients = user?.clients || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900">
            Query Escalations &amp; Audit Discrepancies
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Track unresolved voucher errors, GST mismatches, and statutory non-compliance alerts
          </p>
        </div>
      </div>

      <CrownZeroState
        variant="ca_hub"
        badge="Audit Queue Clean"
        title="Zero Audit Escalations Flagged"
        description="All double-entry vouchers, GSTIN transactions, and purchase bills across your connected client entities are verified with zero unresolved discrepancy flags."
      />
    </div>
  );
}

// 3. Bank & Cash Reconciliation View
export function CaReconciliationView() {
  const { user } = useCa();
  const connectedClients = user?.clients || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-900">
          Statutory Bank &amp; Cash Reconciliation (BRS)
        </h2>
        <p className="text-xs text-slate-500 font-medium">
          Automated multi-bank OCR feed verification against cash book and bank statements
        </p>
      </div>

      {connectedClients.length === 0 ? (
        <CrownZeroState
          variant="financial_statements"
          icon={Scale}
          badge="BRS Clean"
          title="No Bank Accounts Connected for BRS"
          description="Link client MSMEs to stream automated bank statement OCR feeds, match debit/credit transactions against cash books, and identify unreconciled contra items."
        />
      ) : (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-6">
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="font-black text-emerald-950 block">All Bank Feeds Clean &amp; In-Sync</span>
                <p className="text-[11px] text-emerald-800">
                  Bank accounts for {connectedClients[0]?.name || "Connected Entity"} are reconciled with zero unexplained contra variances.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-900 bg-white/70 px-2 py-1 rounded-md">
              Variance: ₹0.00
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// 4. Final Statutory Reports View
export function CaReportsView() {
  const { user } = useCa();
  const connectedClients = user?.clients || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900">
            Statutory Audit Reports &amp; Filing Bundles
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            ICAI compliant Form 3CA/3CD statements, audited schedules, and tax audit workpapers
          </p>
        </div>
      </div>

      <CrownZeroState
        variant="invoices"
        icon={FileText}
        badge="Audit Workpapers"
        title="No Final Statutory Reports Compiled Yet"
        description="Statutory audit balance sheets, Form 3CD schedules, and depreciation registers will appear here once client ledger accounts are stamped and verified under Audit Sign-offs."
      />
    </div>
  );
}

// 5. Firm Settings View
export function CaSettingsView() {
  const { user } = useCa();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-900">
          CA Firm Profile &amp; ICAI Compliance
        </h2>
        <p className="text-xs text-slate-500 font-medium">
          Verify registered firm particulars, active digital audit stamp, and ICAI statutory credentials
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
          <h3 className="text-sm font-black text-slate-900">Registered Practice Profile</h3>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">CA Firm Name</span>
              <span className="font-black text-slate-900 text-sm block">
                {user?.firmName || "Singhal & Associates, Chartered Accountants"}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Managing Partner</span>
              <span className="font-bold text-slate-800 block">
                {user?.name || "CA Rajesh K. Singhal (FCA)"}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">ICAI Registration / Membership</span>
              <span className="font-mono font-bold text-indigo-700 block">
                {user?.icaiNumber || "FCA-048912"}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Registered Office Address</span>
              <p className="text-slate-600 leading-relaxed">
                {user?.officeAddress || "402, Trade Square, C.G. Road, Navrangpura, Ahmedabad, Gujarat - 380009"}
              </p>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="/ca/setup"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Update Onboarding Particulars</span>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
          <h3 className="text-sm font-black text-slate-900">Active Digital Audit Stamp</h3>
          <p className="text-xs text-slate-500">
            This official rubber stamp vector is applied onto audited balance sheets alongside the statutory UDIN.
          </p>

          <div className="w-52 h-52 mx-auto rounded-full border-4 border-dashed border-emerald-700 bg-emerald-50/40 p-4 flex flex-col items-center justify-center text-center">
            {user?.digitalStampUrl ? (
              <img
                src={user.digitalStampUrl}
                alt="Active CA Stamp"
                className="w-full h-full object-contain"
              />
            ) : (
              <>
                <Stamp className="w-8 h-8 text-emerald-700 mb-1" />
                <span className="text-[10px] font-black uppercase text-emerald-800">
                  ★ CHARTERED ACCOUNTANT ★
                </span>
                <span className="text-xs font-black text-emerald-950 mt-1">
                  {user?.name || "CA Rajesh K. Singhal"}
                </span>
                <span className="text-[10px] font-mono font-bold text-emerald-800">
                  {user?.icaiNumber || "FCA-048912"}
                </span>
                <span className="text-[9px] font-bold text-emerald-700 mt-1">
                  Singhal &amp; Associates
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
