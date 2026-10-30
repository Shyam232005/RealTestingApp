"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useStaff } from "./StaffContext";
import {
  Building2,
  BookOpenCheck,
  AlertTriangle,
  Scale,
  Clock,
  CheckCircle2,
  ArrowRight,
  Stamp,
  FileSpreadsheet,
  FileText,
  Play,
  Check,
  Plus,
  RefreshCw,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import CrownZeroState from "@/components/ui/CrownZeroState";
import { emitStaffSubmitAudit, subscribeToEvent } from "@/lib/socketClient";

export default function StaffWorkspaceView() {
  const { user, setActiveTab } = useStaff();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updateModalTask, setUpdateModalTask] = useState(null);
  const [vouchersInput, setVouchersInput] = useState(0);
  const [discrepanciesInput, setDiscrepanciesInput] = useState(0);
  const [notesInput, setNotesInput] = useState("");
  const [updating, setUpdating] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const staffName = user?.name || "Karan Mehta (Article Assistant)";
  const firmName = user?.firmName || "Singhal & Associates, Chartered Accountants";
  const assignedClientsCount = user?.assignedClients?.length ?? 0;

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/ca/tasks");
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch (err) {
      console.error("Failed to load staff tasks:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isSubscribed = true;

    const initLoad = async () => {
      try {
        const res = await fetch("/api/ca/tasks");
        if (res.ok && isSubscribed) {
          const data = await res.json();
          setTasks(data.tasks || []);
        }
      } catch (err) {
        console.error("Failed to load staff tasks:", err);
      } finally {
        if (isSubscribed) setLoading(false);
      }
    };

    initLoad();

    // Listen for live task assignment from CA Partner via Socket.io
    let cleanupSocket = () => {};
    (async () => {
      cleanupSocket = await subscribeToEvent("partner-assign-task", (payload) => {
        setToastMessage(`⚡ New Assignment: Partner assigned "${payload?.title || "Audit Work"}" to you!`);
        initLoad();
        setTimeout(() => setToastMessage(""), 5000);
      });
    })();

    return () => {
      isSubscribed = false;
      cleanupSocket();
    };
  }, []);

  // Handle task status transition (e.g. Start Work -> IN_PROGRESS, Mark Complete -> WORK_COMPLETED)
  const handleTaskStatusChange = async (taskId, newStatus) => {
    try {
      const res = await fetch("/api/ca/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, status: newStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        setToastMessage(data.message || "Task updated!");
        fetchTasks();

        if (newStatus === "WORK_COMPLETED") {
          emitStaffSubmitAudit({
            caFirmId: user?.caFirmId,
            staffName: user?.name,
            taskId,
            submittedAt: new Date().toISOString(),
          });
        }
        setTimeout(() => setToastMessage(""), 3500);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenUpdateModal = (task) => {
    setUpdateModalTask(task);
    setVouchersInput(task.vouchersChecked || 0);
    setDiscrepanciesInput(task.discrepanciesCount || 0);
    setNotesInput(task.staffNotes || "");
  };

  const handleSaveProgress = async (e) => {
    e.preventDefault();
    if (!updateModalTask) return;
    setUpdating(true);
    try {
      const res = await fetch("/api/ca/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: updateModalTask._id,
          vouchersChecked: Number(vouchersInput) || 0,
          discrepanciesCount: Number(discrepanciesInput) || 0,
          staffNotes: notesInput,
          status: "IN_PROGRESS",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setToastMessage("Progress logged successfully!");
        setUpdateModalTask(null);
        fetchTasks();
        setTimeout(() => setToastMessage(""), 3500);
      }
    } catch (err) {
      alert("Failed to save progress.");
    } finally {
      setUpdating(false);
    }
  };

  const totalVouchersChecked = tasks.reduce((sum, t) => sum + (t.vouchersChecked || 0), 0);
  const activeTasksCount = tasks.filter((t) => t.status === "ASSIGNED" || t.status === "IN_PROGRESS").length;
  const completedTasksCount = tasks.filter((t) => t.status === "WORK_COMPLETED" || t.status === "REVIEWED_APPROVED").length;

  // Stat Cards adapted from reference DNA
  const statCards = [
    {
      id: "clients",
      icon: Building2,
      iconBg: "bg-blue-50 text-blue-600",
      value: assignedClientsCount.toString(),
      label: "Assigned Client MSMEs",
      pill: assignedClientsCount > 0 ? `${assignedClientsCount} Active` : "None Assigned",
      pillColor: assignedClientsCount > 0 ? "text-slate-400 font-bold" : "text-amber-700 font-bold",
    },
    {
      id: "tasks",
      icon: Clock,
      iconBg: "bg-indigo-50 text-indigo-600",
      value: activeTasksCount.toString(),
      label: "Active Partner Assignments",
      pill: activeTasksCount > 0 ? `${activeTasksCount} In Progress` : "Queue Clear",
      pillColor: activeTasksCount > 0 ? "text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200" : "text-slate-400 font-bold",
    },
    {
      id: "vouchers",
      icon: BookOpenCheck,
      iconBg: "bg-teal-50 text-teal-600",
      value: totalVouchersChecked > 0 ? totalVouchersChecked.toString() : "0",
      label: "Vouchers Verified",
      pill: totalVouchersChecked > 0 ? "99.2% Accuracy" : "Starting Run",
      pillColor: "text-slate-400 font-bold",
    },
    {
      id: "completed",
      icon: CheckCircle2,
      iconBg: "bg-emerald-50 text-emerald-600",
      value: completedTasksCount.toString(),
      label: "Completed & Submitted",
      pill: "Submitted to Partner",
      pillColor: "text-emerald-700 font-bold",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-4 rounded-2xl bg-slate-900 text-white text-xs font-bold border border-slate-700 shadow-xl flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Greeting Header matching reference DNA */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Staff Audit Workspace
        </h1>
        <p className="text-xs font-bold text-slate-500 mt-1">
          Welcome back, <span className="text-slate-800 font-black">{staffName}</span> • {firmName}
        </p>
      </div>

      {/* Row of 4 Rounded Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-4 hover:shadow-xs transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${card.iconBg}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-[11px] ${card.pillColor}`}>{card.pill}</span>
              </div>

              <div>
                <span className="text-3xl font-black text-slate-900 font-mono tracking-tight block">
                  {card.value}
                </span>
                <span className="text-xs font-bold text-slate-500 block mt-0.5">
                  {card.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two-Column Area: Works Assigned by Partner + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left: Works Assigned by CA Partner */}
        <div className="bg-white rounded-3xl p-7 border border-slate-200/80 shadow-2xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Works &amp; Tasks Assigned by CA Partner
              </h3>
              <p className="text-xs text-slate-500">
                Statutory audit delegations from your Managing Partner
              </p>
            </div>
            <button
              type="button"
              onClick={fetchTasks}
              className="p-1.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
              title="Refresh Tasks"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {tasks.length === 0 ? (
            <CrownZeroState
              variant="ca_hub"
              compact={true}
              badge="Queue Clear"
              title="No Works Assigned Yet"
              description="Your Managing Partner has not assigned any audit tasks to your desk yet. Check back once audit works are delegated or ask your partner for assignments."
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {tasks.map((task) => {
                const isAssigned = task.status === "ASSIGNED";
                const isInProgress = task.status === "IN_PROGRESS";
                const isCompleted = task.status === "WORK_COMPLETED";

                return (
                  <div key={task._id} className="py-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-black text-slate-900">{task.title}</h4>
                          <span
                            className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                              isCompleted
                                ? "bg-emerald-100 text-emerald-800"
                                : isInProgress
                                ? "bg-amber-100 text-amber-900"
                                : "bg-blue-100 text-blue-900"
                            }`}
                          >
                            {task.status.replace(/_/g, " ")}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Client: <strong className="text-slate-700">{task.clientName}</strong> • Category: {task.category.replace(/_/g, " ")}
                        </p>
                      </div>

                      <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md shrink-0">
                        {task.priority} Priority
                      </span>
                    </div>

                    {task.description && (
                      <p className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        {task.description}
                      </p>
                    )}

                    {/* Task Progress & Action Buttons */}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] font-mono font-bold text-slate-500">
                        {task.vouchersChecked} Vouchers Verified • {task.discrepanciesCount} Discrepancies
                      </span>

                      <div className="flex items-center gap-2">
                        {isAssigned && (
                          <button
                            type="button"
                            onClick={() => handleTaskStatusChange(task._id, "IN_PROGRESS")}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors cursor-pointer"
                          >
                            <Play className="w-3 h-3" />
                            <span>Start Work</span>
                          </button>
                        )}

                        {isInProgress && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleOpenUpdateModal(task)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
                            >
                              <span>Log Progress</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleTaskStatusChange(task._id, "WORK_COMPLETED")}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer"
                            >
                              <Check className="w-3 h-3" />
                              <span>Submit to Partner</span>
                            </button>
                          </>
                        )}

                        <button
                          type="button"
                          onClick={() => setActiveTab("ledger-audit")}
                          className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                          title="Open Ledger Audit"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Quick Actions (2x2 Grid from reference DNA) */}
        <div className="bg-white rounded-3xl p-7 border border-slate-200/80 shadow-2xs space-y-6">
          <h3 className="text-sm font-black text-slate-900">
            High-Priority Audit Actions
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Action 1 */}
            <button
              type="button"
              onClick={() => setActiveTab("ledger-audit")}
              className="p-5 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 flex flex-col items-center justify-center text-center gap-2.5 transition-all group cursor-pointer shadow-2xs"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition-colors">
                <BookOpenCheck className="w-5 h-5" />
              </div>
              <span className="text-xs font-black text-slate-800 group-hover:text-indigo-900">
                Audit Inward Vouchers
              </span>
            </button>

            {/* Action 2 */}
            <button
              type="button"
              onClick={() => setActiveTab("discrepancies")}
              className="p-5 rounded-2xl border border-slate-200 hover:border-rose-300 hover:bg-rose-50/30 flex flex-col items-center justify-center text-center gap-2.5 transition-all group cursor-pointer shadow-2xs"
            >
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 group-hover:bg-rose-600 group-hover:text-white flex items-center justify-center transition-colors">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <span className="text-xs font-black text-slate-800 group-hover:text-rose-900">
                Report Discrepancy
              </span>
            </button>

            {/* Action 3 */}
            <button
              type="button"
              onClick={() => setActiveTab("reconciliation")}
              className="p-5 rounded-2xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/30 flex flex-col items-center justify-center text-center gap-2.5 transition-all group cursor-pointer shadow-2xs"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 group-hover:bg-purple-600 group-hover:text-white flex items-center justify-center transition-colors">
                <Scale className="w-5 h-5" />
              </div>
              <span className="text-xs font-black text-slate-800 group-hover:text-purple-900">
                Bank Reconciliation (BRS)
              </span>
            </button>

            {/* Action 4 */}
            <button
              type="button"
              onClick={() => setActiveTab("draft-reports")}
              className="p-5 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30 flex flex-col items-center justify-center text-center gap-2.5 transition-all group cursor-pointer shadow-2xs"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center transition-colors">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-xs font-black text-slate-800 group-hover:text-emerald-900">
                Submit Draft to Partner
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* LOG PROGRESS MODAL */}
      {updateModalTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-black text-slate-900">Log Audit Work Progress</h3>
                <p className="text-[11px] text-slate-500">{updateModalTask.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setUpdateModalTask(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProgress} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Vouchers Checked:
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={vouchersInput}
                    onChange={(e) => setVouchersInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Discrepancies Flagged:
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={discrepanciesInput}
                    onChange={(e) => setDiscrepanciesInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Staff Audit Notes / Observations:
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Verified HSN tax codes on all 42 vouchers. Found 1 missing transporter bilty..."
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setUpdateModalTask(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold disabled:opacity-50"
                >
                  <span>{updating ? "Saving..." : "Save Progress"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
