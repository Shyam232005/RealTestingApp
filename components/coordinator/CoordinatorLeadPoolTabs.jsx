"use client";

import React, { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Users,
  ClipboardList,
  Plus,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  UserCheck,
  Send,
  X,
  Phone,
  Building2,
  Tag,
  Check,
  ArrowRight,
  Filter,
  Sparkles,
  ListTodo,
} from "lucide-react";
import { dexieDb } from "@/lib/dexieDb";
import { createDelegatedTask } from "@/actions/coordinator";
import TaskZeroState from "./TaskZeroState";
import ActiveLeadsContent from "./ActiveLeadsContent";

// Task Validation Schema for React Hook Form + Zod
const taskFormSchema = z.object({
  taskType: z.enum(["PAYMENT_FOLLOWUP", "DISPATCH"], {
    errorMap: () => ({ message: "Please select a task type" }),
  }),
  priority: z.enum(["HIGH", "NORMAL"]),
  assignedToName: z.string().min(2, "Assigned employee name is required"),
  customerId: z.string().optional(),
  customerName: z.string().min(2, "Customer / Company name is required"),
  dueDate: z.string().min(1, "Due date is required"),
  description: z.string().min(5, "Please provide a detailed task description"),
});

function generateTaskIdentifier() {
  return "TSK-" + Math.floor(1000 + Math.random() * 9000);
}

export default function CoordinatorLeadPoolTabs({
  coordinatorId = "coord_sys_01",
  coordinatorName = "Tier 2 Sales Coordinator",
  className = "",
}) {
  const [activeTab, setActiveTab] = useState("active-leads"); // 'active-leads' | 'delegated-tasks'
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Live Query 1: Active Inbound / Qualified Leads
  const activeLeads = useLiveQuery(
    async () => {
      try {
        return await dexieDb.leads
          .filter((lead) => lead.status !== "archived")
          .reverse()
          .sortBy("createdAt");
      } catch (e) {
        console.error("Dexie active leads query error:", e);
        return [];
      }
    },
    [],
    []
  );

  // Live Query 2: Delegated Tasks assigned by this Coordinator
  const tasks = useLiveQuery(
    async () => {
      try {
        return await dexieDb.tasks
          .filter(
            (t) =>
              t.assignedBy === coordinatorId ||
              t.assignedByName === coordinatorName ||
              !t.assignedBy // include unassigned-by for local demo resiliency
          )
          .reverse()
          .sortBy("dueDate");
      } catch (e) {
        console.error("Dexie delegated tasks query error:", e);
        return [];
      }
    },
    [coordinatorId, coordinatorName],
    []
  );
  const delegatedTasks = tasks || [];

  // React Hook Form for Delegated Task Modal
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      taskType: "PAYMENT_FOLLOWUP",
      priority: "NORMAL",
      assignedToName: "Tier 1 Sales Assistant (Desk 1)",
      customerId: "CUST-WALK-IN",
      customerName: "",
      dueDate: "",
      description: "",
    },
  });

  const onSubmitTask = async (data) => {
    setIsSubmitting(true);
    try {
      const taskId = generateTaskIdentifier();
      const localTaskRecord = {
        taskId,
        assignedBy: coordinatorId,
        assignedByName: coordinatorName,
        assignedTo: "tier1_assistant",
        assignedToName: data.assignedToName,
        customerId: data.customerId || "CUST-MSME",
        customerName: data.customerName,
        taskType: data.taskType,
        priority: data.priority,
        status: "OPEN",
        description: data.description,
        dueDate: new Date(data.dueDate).toISOString(),
        createdAt: new Date().toISOString(),
        synced: false,
      };

      // 1. Write immediately to Dexie for local-first zero latency
      await dexieDb.tasks.add(localTaskRecord);

      // 2. Dispatch Server Action to persist in MongoDB
      const serverResult = await createDelegatedTask({
        assignedBy: coordinatorId,
        assignedByName: coordinatorName,
        assignedToName: data.assignedToName,
        customerId: data.customerId,
        customerName: data.customerName,
        taskType: data.taskType,
        priority: data.priority,
        status: "OPEN",
        description: data.description,
        dueDate: data.dueDate,
      });

      if (serverResult?.success) {
        // Mark synced in local IndexedDB
        await dexieDb.tasks
          .where("taskId")
          .equals(taskId)
          .modify({ synced: true });
      }

      showToast(`Task assigned to ${data.assignedToName} successfully!`);
      reset();
      setIsTaskModalOpen(false);
    } catch (err) {
      console.error("Failed to create delegated task:", err);
      showToast("Error creating task. Check console for details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleTaskStatus = async (task) => {
    const newStatus = task.status === "OPEN" ? "CLOSED" : "OPEN";
    try {
      if (task.id) {
        await dexieDb.tasks.update(task.id, {
          status: newStatus,
          completedAt: newStatus === "CLOSED" ? new Date().toISOString() : null,
        });
        showToast(`Task marked as ${newStatus}`);
      }
    } catch (e) {
      console.error("Error updating task status:", e);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-slate-900 text-white text-xs font-bold rounded-2xl shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* MODULE HEADER & SUB-NAVIGATION PILLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0 border border-blue-200/60 shadow-2xs">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              Lead Pool &amp; Telecalling Hub
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Capture raw inquiries, dial cold call prospects, and schedule targeted follow-ups
            </p>
          </div>
        </div>

        {/* PILL MENU NAVIGATION */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="p-1 bg-slate-100/90 rounded-2xl border border-slate-200/70 inline-flex items-center gap-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveTab("active-leads")}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "active-leads"
                  ? "bg-white text-slate-900 font-bold shadow-xs border border-slate-200/50"
                  : "text-slate-500 hover:text-slate-800 font-semibold hover:bg-slate-200/50"
              }`}
            >
              <Users className={`w-3.5 h-3.5 ${activeTab === "active-leads" ? "text-blue-600" : "text-slate-400"}`} />
              <span>Active Leads</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold font-mono ${
                  activeTab === "active-leads"
                    ? "bg-blue-50 text-blue-700"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {activeLeads?.length || 0}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("delegated-tasks")}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "delegated-tasks"
                  ? "bg-white text-slate-900 font-bold shadow-xs border border-slate-200/50"
                  : "text-slate-500 hover:text-slate-800 font-semibold hover:bg-slate-200/50"
              }`}
            >
              <ClipboardList className={`w-3.5 h-3.5 ${activeTab === "delegated-tasks" ? "text-indigo-600" : "text-slate-400"}`} />
              <span>Delegated Tasks</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold font-mono ${
                  activeTab === "delegated-tasks"
                    ? "bg-indigo-50 text-indigo-700"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {delegatedTasks?.length || 0}
              </span>
            </button>
          </div>

          {activeTab === "delegated-tasks" && (
            <button
              type="button"
              onClick={() => setIsTaskModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Assign Task</span>
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: ACTIVE LEADS TABLE */}
      {activeTab === "active-leads" && (
        <ActiveLeadsContent
          leads={activeLeads}
          onAssignLead={() => {
            setActiveTab("delegated-tasks");
            setIsTaskModalOpen(true);
          }}
        />
      )}

      {/* TAB 2: DELEGATED TASKS TABLE */}
      {activeTab === "delegated-tasks" && (
        <div className="space-y-4">
          {!tasks || tasks.length === 0 ? (
            /* Strict Tier 2 Component-Level Zero State: No Table or Thead Rendered */
            <TaskZeroState onDelegateTask={() => setIsTaskModalOpen(true)} />
          ) : (
            <div className="rounded-3xl bg-white border border-slate-200/80 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5">Task &amp; Description</th>
                      <th className="px-5 py-3.5">Type &amp; Priority</th>
                      <th className="px-5 py-3.5">Assigned To</th>
                      <th className="px-5 py-3.5">Customer / Account</th>
                      <th className="px-5 py-3.5">Due Date</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {delegatedTasks.map((task) => (
                      <tr key={task.id || task.taskId} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-4 max-w-xs">
                          <span className="font-bold text-slate-900 block text-xs">
                            {task.description}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            By: {task.assignedByName || coordinatorName}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-1 items-start">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                                task.taskType === "PAYMENT_FOLLOWUP"
                                  ? "bg-amber-50 text-amber-800 border border-amber-200"
                                  : "bg-blue-50 text-blue-800 border border-blue-200"
                              }`}
                            >
                              {task.taskType === "PAYMENT_FOLLOWUP" ? "Payment Followup" : "Dispatch Coord"}
                            </span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                task.priority === "HIGH"
                                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {task.priority} Priority
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5 text-slate-800 font-semibold">
                            <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                            <span>{task.assignedToName || "Sales Assistant"}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-medium text-slate-700 block">
                            {task.customerName || task.customerId || "MSME Client"}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5 text-slate-600 font-mono text-[11px]">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "Pending"}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                              task.status === "OPEN"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            }`}
                          >
                            {task.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleToggleTaskStatus(task)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                              task.status === "OPEN"
                                ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200"
                                : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                            }`}
                          >
                            <Check className="w-3 h-3" />
                            <span>{task.status === "OPEN" ? "Mark Done" : "Reopen"}</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL: ASSIGN TASK TO TIER 1 SALES ASSISTANT */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <ClipboardList className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Assign Task to Assistant
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Delegated from {coordinatorName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTaskModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmitTask)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Task Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    {...register("taskType")}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-hidden focus:border-indigo-600"
                  >
                    <option value="PAYMENT_FOLLOWUP">Payment Followup</option>
                    <option value="DISPATCH">Dispatch Coordination</option>
                  </select>
                  {errors.taskType && (
                    <span className="text-[10px] text-rose-500 mt-1 block">
                      {errors.taskType.message}
                    </span>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Priority <span className="text-rose-500">*</span>
                  </label>
                  <select
                    {...register("priority")}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-hidden focus:border-indigo-600"
                  >
                    <option value="NORMAL">Normal Priority</option>
                    <option value="HIGH">High Priority (Urgent)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Assign To <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register("assignedToName")}
                    placeholder="e.g. Rahul (Tier 1 Desk 1)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-indigo-600"
                  />
                  {errors.assignedToName && (
                    <span className="text-[10px] text-rose-500 mt-1 block">
                      {errors.assignedToName.message}
                    </span>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Due Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    {...register("dueDate")}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-indigo-600"
                  />
                  {errors.dueDate && (
                    <span className="text-[10px] text-rose-500 mt-1 block">
                      {errors.dueDate.message}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Customer / Account Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  {...register("customerName")}
                  placeholder="e.g. Apex Industrial Solutions Ltd"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-indigo-600"
                />
                {errors.customerName && (
                  <span className="text-[10px] text-rose-500 mt-1 block">
                    {errors.customerName.message}
                  </span>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Detailed Instructions <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  {...register("description")}
                  placeholder="Specify payment milestones to follow up or dispatch loading documents to verify..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-hidden focus:border-indigo-600 resize-none"
                />
                {errors.description && (
                  <span className="text-[10px] text-rose-500 mt-1 block">
                    {errors.description.message}
                  </span>
                )}
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? "Assigning..." : "Delegate Task"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
