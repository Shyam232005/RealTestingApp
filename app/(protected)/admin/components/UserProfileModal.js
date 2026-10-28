"use client";
import React, { useState } from "react";
import {
  X,
  Building2,
  Users,
  Briefcase,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Calendar,
  FileText,
  Paperclip,
  Check,
  Zap,
  Edit,
  Trash2,
  BarChart3,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  Download,
  AlertCircle,
  Copy,
} from "lucide-react";

export default function UserProfileModal({
  user,
  profileData,
  loading,
  onClose,
  onEdit,
  onDelete,
  onAudit,
  onOpenPlanDetails,
}) {
  const [activeSubTab, setActiveSubTab] = useState("overview");
  const [copiedField, setCopiedField] = useState("");

  if (!user) return null;

  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(""), 2000);
  };

  const userType = profileData?.userType || user.userType || "OWNER";
  const displayUser = profileData || user;

  const typeColorMap = {
    OWNER: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    EMPLOYEE: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    CA: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 lg:p-6 animate-in fade-in duration-150">
      <div className="bg-slate-900 rounded-3xl max-w-4xl w-full border border-slate-700 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-slate-100 flex flex-col max-h-[92vh]">
        {/* Header Profile Identity Banner */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-purple-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-black text-xl flex items-center justify-center shrink-0 shadow-lg shadow-purple-600/30 border border-purple-400/20">
              {displayUser.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg sm:text-xl font-black text-white">
                  {displayUser.name}
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded-xl text-[10px] font-black uppercase tracking-wider border ${
                    typeColorMap[userType] || typeColorMap.OWNER
                  }`}
                >
                  {userType}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                  {displayUser.approvalStatus || (displayUser.isActive !== false ? "ACTIVE" : "INACTIVE")}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                <span>{displayUser.email}</span>
                <span>•</span>
                <span className="font-mono">{displayUser.phoneNumber || "No Phone"}</span>
                <span>•</span>
                <span className="font-mono text-[11px] text-slate-500">
                  ID: {displayUser._id?.toString()?.slice(-8)}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onAudit && onAudit(user)}
              className="px-3.5 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Inspect complete lifetime generated audit records"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Full Audit</span>
            </button>
            <button
              type="button"
              onClick={() => onEdit && onEdit(user)}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer"
              title="Edit profile & reset password"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="px-5 pt-3 border-b border-slate-800 bg-slate-950/60 flex items-center gap-2 overflow-x-auto shrink-0">
          {[
            { id: "overview", label: "Overview & Identity" },
            ...(userType === "OWNER"
              ? [
                  { id: "organization", label: "Organization & Banking" },
                  { id: "team", label: `Enrolled Staff (${displayUser.team?.totalEmployees || 0})` },
                  { id: "plan", label: "Active Plan & Quota" },
                ]
              : userType === "EMPLOYEE"
              ? [
                  { id: "employment", label: "Job & Hierarchy" },
                  { id: "attendance", label: "Live Punch & Shifts" },
                  { id: "submissions", label: "Work Submissions & Files" },
                  { id: "tasks_leaves", label: "Tasks & Leaves" },
                ]
              : [
                  { id: "ca_profile", label: "Audit Firm & ICAI" },
                  { id: "connected_clients", label: `Connected Clients (${displayUser.connectedClients?.length || 0})` },
                ]),
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id)}
              className={`px-3.5 py-2 rounded-t-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer border-b-2 ${
                activeSubTab === tab.id
                  ? "border-purple-500 text-white bg-slate-800/80"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-6">
          {loading ? (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-20 rounded-2xl bg-slate-800/60 animate-pulse border border-slate-800" />
                ))}
              </div>
              <div className="h-48 rounded-2xl bg-slate-800/40 animate-pulse border border-slate-800" />
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW */}
              {activeSubTab === "overview" && (
                <div className="space-y-6">
                  {/* Identity Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/70">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Full Name</span>
                      <p className="text-sm font-black text-white mt-1">{displayUser.name}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/70">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Phone Number</span>
                      <p className="text-sm font-mono font-bold text-white mt-1">{displayUser.phoneNumber}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/70">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Account Role</span>
                      <p className="text-sm font-bold text-purple-300 mt-1 uppercase">{userType}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/70">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Member Since</span>
                      <p className="text-sm font-mono text-slate-200 mt-1">
                        {displayUser.createdAt ? new Date(displayUser.createdAt).toLocaleDateString() : "Day 1"}
                      </p>
                    </div>
                  </div>

                  {/* Core System Information Box */}
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                    <h5 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span>Security & Access Credentials</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(displayUser._id?.toString(), "mongoId")}
                        className="text-[10px] text-purple-400 hover:text-purple-300 font-mono flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedField === "mongoId" ? "Copied ID!" : "Copy Database ID"}</span>
                      </button>
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Email Address:</span>
                        <span className="font-mono text-white font-bold">{displayUser.email}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Authentication Method:</span>
                        <span className="text-slate-300">Password / OTP Verified</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Account Status:</span>
                        <span className="text-emerald-400 font-bold uppercase">
                          {displayUser.approvalStatus || (displayUser.isActive !== false ? "Active & Verified" : "Suspended")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Role Specific Highlight */}
                  {userType === "OWNER" && (
                    <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/30 to-indigo-950/30 border border-purple-500/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-5 h-5 text-purple-400" />
                          <h4 className="font-black text-white text-sm">
                            {displayUser.organization?.name || "Corporate Organization"}
                          </h4>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          {displayUser.subscription?.planName || "Free Trial"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                        <div>
                          <span className="text-[10px] text-slate-400 block">GSTIN</span>
                          <span className="font-mono font-bold text-white">{displayUser.organization?.gst || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Location</span>
                          <span className="font-bold text-white">{displayUser.organization?.location || "Headquarters"}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Total Staff</span>
                          <span className="font-bold text-white">{displayUser.team?.totalEmployees || 0} Staff</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Branches</span>
                          <span className="font-bold text-white">{displayUser.organization?.totalBranches || 1} Units</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {userType === "EMPLOYEE" && (
                    <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/30 to-slate-900 border border-indigo-500/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-5 h-5 text-indigo-400" />
                          <div>
                            <h4 className="font-black text-white text-sm">
                              {displayUser.workDetails?.postTitle || "Department Staff"}
                            </h4>
                            <p className="text-[11px] text-slate-400">
                              Assigned to: <strong className="text-white">{displayUser.employer?.companyName}</strong> ({displayUser.employer?.ownerName})
                            </p>
                          </div>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                          {displayUser.workDetails?.department}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Hierarchy Level</span>
                          <span className="font-bold text-purple-300">{displayUser.workDetails?.postLevel}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Branch Unit</span>
                          <span className="font-bold text-white">{displayUser.workDetails?.branchName || "Main HQ"}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Live Shift Status</span>
                          <span className={`font-bold ${displayUser.livePunchStatus?.isCurrentlyPunchedIn ? "text-emerald-400" : "text-slate-400"}`}>
                            {displayUser.livePunchStatus?.isCurrentlyPunchedIn ? "Punched In (On Duty)" : "Clocked Out"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Total Shift Punches</span>
                          <span className="font-bold text-white">{displayUser.attendanceSummary?.totalPunches || 0} Records</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {userType === "CA" && (
                    <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/30 to-slate-900 border border-emerald-500/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          <div>
                            <h4 className="font-black text-white text-sm">{displayUser.firmName}</h4>
                            <p className="text-[11px] text-slate-400">Chartered Accountant Firm</p>
                          </div>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          ICAI: {displayUser.icaiNumber}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300">
                        Total connected corporate clients: <strong className="text-white">{displayUser.connectedClients?.length || 0} Businesses</strong>
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: ORGANIZATION & BANKING (Owner only) */}
              {activeSubTab === "organization" && userType === "OWNER" && (
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/70 space-y-4">
                    <h5 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-purple-400" />
                      <span>Company Legal & Registration Master</span>
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Registered Name:</span>
                        <p className="text-sm font-bold text-white mt-0.5">{displayUser.organization?.name || "N/A"}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">GST Number:</span>
                        <p className="text-sm font-mono font-bold text-purple-300 mt-0.5">{displayUser.organization?.gst || "N/A"}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Industry Sector:</span>
                        <p className="text-sm font-bold text-white mt-0.5">{displayUser.organization?.industry || "Manufacturing"}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Headquarters Location:</span>
                        <p className="text-sm font-bold text-white mt-0.5">{displayUser.organization?.location || "Headquarters"}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Total Configured Branches:</span>
                        <p className="text-sm font-bold text-white mt-0.5">{displayUser.organization?.totalBranches || 1} Units</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Stock Catalog Count:</span>
                        <p className="text-sm font-bold text-white mt-0.5">{displayUser.organization?.stockCatalogCount || 0} Items</p>
                      </div>
                    </div>
                  </div>

                  {/* Banking Details */}
                  <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/70 space-y-3">
                    <h5 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-emerald-400" />
                      <span>Official Commercial Banking Context</span>
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Bank Name</span>
                        <span className="font-bold text-white text-sm">{displayUser.organization?.bankName || "State Bank of India"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Account Number</span>
                        <span className="font-mono font-bold text-white text-sm">{displayUser.organization?.accNo || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">IFSC Code</span>
                        <span className="font-mono font-bold text-white text-sm">{displayUser.organization?.ifsc || "N/A"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Linked CA */}
                  {displayUser.linkedCA && (
                    <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/70 space-y-2">
                      <h5 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-indigo-400" />
                        <span>Connected Statutory Auditor (CA)</span>
                      </h5>
                      <div className="flex items-center justify-between text-xs pt-1">
                        <div>
                          <p className="font-bold text-white text-sm">{displayUser.linkedCA.name}</p>
                          <p className="text-slate-400">{displayUser.linkedCA.firmName} • {displayUser.linkedCA.email}</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                          {displayUser.linkedCA.dataSharingStatus || "CONNECTED"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: ENROLLED STAFF (Owner only) */}
              {activeSubTab === "team" && userType === "OWNER" && (
                <div className="space-y-4">
                  {/* Department distribution */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {Object.entries(displayUser.team?.deptBreakdown || {}).map(([dept, count]) => (
                      <div key={dept} className="p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700">
                        <span className="text-[10px] font-bold uppercase text-slate-400">{dept}</span>
                        <p className="text-xl font-black text-white font-mono mt-1">{count} Staff</p>
                      </div>
                    ))}
                  </div>

                  {/* Staff Table */}
                  <div className="rounded-2xl border border-slate-800 overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase text-[10px]">
                        <tr>
                          <th className="py-3 px-4">Employee</th>
                          <th className="py-3 px-4">Department</th>
                          <th className="py-3 px-4">Post & Hierarchy</th>
                          <th className="py-3 px-4">Branch</th>
                          <th className="py-3 px-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 bg-slate-900/60">
                        {(!displayUser.team?.members || displayUser.team.members.length === 0) ? (
                          <tr>
                            <td colSpan="5" className="py-8 text-center text-slate-500">
                              No employees enrolled under this owner yet.
                            </td>
                          </tr>
                        ) : (
                          displayUser.team.members.map((emp) => (
                            <tr key={emp._id} className="hover:bg-slate-800/40">
                              <td className="py-3 px-4 font-bold text-white">
                                {emp.name}
                                <span className="block text-[10px] font-normal text-slate-400">{emp.email}</span>
                              </td>
                              <td className="py-3 px-4 uppercase font-mono text-purple-300">
                                {emp.department}
                              </td>
                              <td className="py-3 px-4 text-slate-200">
                                {emp.postTitle || emp.postLevel}
                              </td>
                              <td className="py-3 px-4 text-slate-400">
                                {emp.branchName || "Main HQ"}
                              </td>
                              <td className="py-3 px-4">
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                                  {emp.approvalStatus || "APPROVED"}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 4: PLAN & SUBSCRIPTION (Owner only) */}
              {activeSubTab === "plan" && userType === "OWNER" && (
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-950/50 via-slate-900 to-indigo-950/40 border border-purple-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-purple-300">
                        Current Subscribed Tier
                      </span>
                      <h4 className="text-xl font-black text-white mt-1">
                        {displayUser.subscription?.planName || "Free Trial"}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 capitalize">
                        Billing Cycle: <strong className="text-white">{displayUser.subscription?.cycle || "annual"}</strong> • Payment Status: <strong className="text-emerald-400">{displayUser.subscription?.paymentStatus || "paid"}</strong>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onOpenPlanDetails && onOpenPlanDetails(displayUser)}
                      className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/30 flex items-center gap-1.5 cursor-pointer w-max"
                    >
                      <Zap className="w-4 h-4" />
                      <span>Upgrade / Modify Plan</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700">
                      <span className="text-[10px] text-slate-400 block uppercase">Start Date</span>
                      <span className="font-mono text-white font-bold mt-1 block">
                        {displayUser.subscription?.startDate
                          ? new Date(displayUser.subscription.startDate).toLocaleDateString()
                          : "Day 1"}
                      </span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700">
                      <span className="text-[10px] text-slate-400 block uppercase">Valid Until</span>
                      <span className="font-mono text-purple-300 font-bold mt-1 block">
                        {displayUser.subscription?.endDate
                          ? new Date(displayUser.subscription.endDate).toLocaleDateString()
                          : "Active Subscription"}
                      </span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700">
                      <span className="text-[10px] text-slate-400 block uppercase">Status</span>
                      <span className="font-bold text-emerald-400 uppercase mt-1 block">
                        {displayUser.subscription?.status || "active"}
                      </span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700">
                      <span className="text-[10px] text-slate-400 block uppercase">Used Trial</span>
                      <span className="font-bold text-white mt-1 block">
                        {displayUser.subscription?.hasUsedTrial ? "Yes" : "No"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* EMPLOYEE TABS: Job & Hierarchy */}
              {activeSubTab === "employment" && userType === "EMPLOYEE" && (
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/70 space-y-4">
                    <h5 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-indigo-400" />
                      <span>Corporate Hierarchy & Workplace Role</span>
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Department:</span>
                        <p className="text-sm font-bold text-purple-300 uppercase mt-0.5">
                          {displayUser.workDetails?.department}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Hierarchy Level:</span>
                        <p className="text-sm font-mono font-bold text-white mt-0.5">
                          {displayUser.workDetails?.postLevel}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Designated Title:</span>
                        <p className="text-sm font-bold text-white mt-0.5">
                          {displayUser.workDetails?.postTitle}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Assigned Branch:</span>
                        <p className="text-sm font-bold text-white mt-0.5">
                          {displayUser.workDetails?.branchName || "Main HQ"}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Employer Company:</span>
                        <p className="text-sm font-bold text-white mt-0.5">
                          {displayUser.employer?.companyName}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Business Owner:</span>
                        <p className="text-sm font-bold text-white mt-0.5">
                          {displayUser.employer?.ownerName} ({displayUser.employer?.ownerPhone})
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* EMPLOYEE TABS: Live Attendance & Shifts */}
              {activeSubTab === "attendance" && userType === "EMPLOYEE" && (
                <div className="space-y-4">
                  {/* Today's live punch banner */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950/40 border border-indigo-500/30 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 uppercase">
                        Today ({displayUser.livePunchStatus?.todayDate})
                      </span>
                      <h5 className="text-base font-black text-white mt-0.5 flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${displayUser.livePunchStatus?.isCurrentlyPunchedIn ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
                        <span>{displayUser.livePunchStatus?.isCurrentlyPunchedIn ? "Live On Duty (Punched In)" : "Currently Punched Out"}</span>
                      </h5>
                      <p className="text-xs text-slate-300 mt-1">
                        In: {displayUser.livePunchStatus?.todayPunchInTime ? new Date(displayUser.livePunchStatus.todayPunchInTime).toLocaleTimeString() : "--"} • Out: {displayUser.livePunchStatus?.todayPunchOutTime ? new Date(displayUser.livePunchStatus.todayPunchOutTime).toLocaleTimeString() : "--"}
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-xl text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {Math.round((displayUser.livePunchStatus?.todayDurationMinutes || 0) / 60 * 10) / 10} hrs logged today
                    </span>
                  </div>

                  {/* Attendance Log */}
                  <div className="rounded-2xl border border-slate-800 overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase text-[10px]">
                        <tr>
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4">Branch</th>
                          <th className="py-3 px-4">First In</th>
                          <th className="py-3 px-4">Last Out</th>
                          <th className="py-3 px-4">Duration</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 bg-slate-900/60">
                        {(!displayUser.attendanceSummary?.recentLogs || displayUser.attendanceSummary.recentLogs.length === 0) ? (
                          <tr>
                            <td colSpan="5" className="py-8 text-center text-slate-500">
                              No attendance shift logs found.
                            </td>
                          </tr>
                        ) : (
                          displayUser.attendanceSummary.recentLogs.map((att) => (
                            <tr key={att._id} className="hover:bg-slate-800/40">
                              <td className="py-3 px-4 font-mono font-bold text-white">{att.date}</td>
                              <td className="py-3 px-4 text-slate-400">{att.branchName || "Main HQ"}</td>
                              <td className="py-3 px-4 font-mono text-emerald-400">
                                {att.punchIn ? new Date(att.punchIn).toLocaleTimeString() : "--"}
                              </td>
                              <td className="py-3 px-4 font-mono text-slate-300">
                                {att.punchOut ? new Date(att.punchOut).toLocaleTimeString() : "Live Active"}
                              </td>
                              <td className="py-3 px-4 font-mono text-purple-300">
                                {att.durationMinutes ? `${Math.round(att.durationMinutes / 60 * 10) / 10} hrs` : "In Progress"}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* EMPLOYEE TABS: Submissions */}
              {activeSubTab === "submissions" && userType === "EMPLOYEE" && (
                <div className="space-y-3">
                  {(!displayUser.submissionsSummary?.recentSubmissions || displayUser.submissionsSummary.recentSubmissions.length === 0) ? (
                    <div className="py-12 text-center text-slate-500">
                      <FileText className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                      <p className="font-bold text-sm text-slate-400">No submissions uploaded</p>
                      <p className="text-xs text-slate-500">Employee has not submitted any reports yet.</p>
                    </div>
                  ) : (
                    displayUser.submissionsSummary.recentSubmissions.map((sub) => (
                      <div key={sub._id} className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/70 space-y-2">
                        <div className="flex items-center justify-between">
                          <h6 className="font-bold text-white text-sm">{sub.title}</h6>
                          <span className="font-mono text-xs text-slate-400">{sub.date}</span>
                        </div>
                        {sub.summary && <p className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-xl">{sub.summary}</p>}
                        {sub.files && sub.files.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {sub.files.map((f, fIdx) => (
                              <div key={fIdx} className="px-2.5 py-1 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-200 text-xs flex items-center gap-1.5">
                                <Paperclip className="w-3 h-3 text-purple-400" />
                                <span>{f.name || "File Attachment"}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* EMPLOYEE TABS: Tasks & Leaves */}
              {activeSubTab === "tasks_leaves" && userType === "EMPLOYEE" && (
                <div className="space-y-4">
                  {/* Tasks */}
                  <div className="space-y-2">
                    <h6 className="text-xs font-black uppercase text-slate-300">
                      Recent Task Directives ({displayUser.tasksSummary?.totalTasks || 0})
                    </h6>
                    <div className="divide-y divide-slate-800 rounded-2xl border border-slate-800 overflow-hidden bg-slate-900/60">
                      {(!displayUser.tasksSummary?.recentTasks || displayUser.tasksSummary.recentTasks.length === 0) ? (
                        <p className="p-4 text-xs text-slate-500 text-center">No task assignments recorded.</p>
                      ) : (
                        displayUser.tasksSummary.recentTasks.map((t) => (
                          <div key={t._id} className="p-3 flex items-center justify-between text-xs">
                            <div>
                              <p className="font-bold text-white">{t.title}</p>
                              <span className="text-[10px] text-slate-400">Due: {t.dueDate || "N/A"}</span>
                            </div>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-purple-500/20 text-purple-300">
                              {t.priority || "MEDIUM"}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Leaves */}
                  <div className="space-y-2">
                    <h6 className="text-xs font-black uppercase text-slate-300">
                      Leave Applications ({displayUser.leavesSummary?.totalLeaves || 0})
                    </h6>
                    <div className="divide-y divide-slate-800 rounded-2xl border border-slate-800 overflow-hidden bg-slate-900/60">
                      {(!displayUser.leavesSummary?.recentLeaves || displayUser.leavesSummary.recentLeaves.length === 0) ? (
                        <p className="p-4 text-xs text-slate-500 text-center">No leave applications found.</p>
                      ) : (
                        displayUser.leavesSummary.recentLeaves.map((l) => (
                          <div key={l._id} className="p-3 flex items-center justify-between text-xs">
                            <div>
                              <p className="font-bold text-white">{l.startDate} to {l.endDate} ({l.totalDays} days)</p>
                              <span className="text-[10px] text-slate-400">{l.reason}</span>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                              {l.status || "APPROVED"}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* CA TABS: Connected Clients */}
              {activeSubTab === "connected_clients" && userType === "CA" && (
                <div className="space-y-3">
                  {(!displayUser.connectedClients || displayUser.connectedClients.length === 0) ? (
                    <div className="py-12 text-center text-slate-500">
                      <Building2 className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                      <p className="font-bold text-sm text-slate-400">No client companies connected</p>
                      <p className="text-xs text-slate-500">This CA has not been linked to any business yet.</p>
                    </div>
                  ) : (
                    displayUser.connectedClients.map((client) => (
                      <div key={client.ownerId} className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/70 flex items-center justify-between text-xs">
                        <div>
                          <h6 className="font-bold text-white text-sm">{client.companyName}</h6>
                          <p className="text-slate-400">{client.name} • {client.email} • {client.phone}</p>
                          <span className="font-mono text-[10px] text-purple-300">GST: {client.gst}</span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                          {client.dataSharingStatus}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onEdit && onEdit(user)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-slate-700"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit Details / Reset Password</span>
            </button>
            <button
              type="button"
              onClick={() => onDelete && onDelete(user)}
              className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete User</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/30 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
