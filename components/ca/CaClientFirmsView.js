"use client";
import React, { useState } from "react";
import {
  Building2,
  Search,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Plus,
  Send,
  KeyRound,
  Sparkles,
} from "lucide-react";
import { useCa } from "./CaContext";
import CrownZeroState from "@/components/ui/CrownZeroState";
import { emitCaLinkOwner, emitCaDataRequest } from "@/lib/socketClient";

export default function CaClientFirmsView() {
  const { user, setActiveTab, refreshProfile } = useCa();
  const [inviteCodeInput, setInviteCodeInput] = useState("");
  const [linking, setLinking] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showLinkModal, setShowLinkModal] = useState(false);

  const dbClients = user?.clients || [];

  const handleLinkClient = async (e) => {
    e.preventDefault();
    if (!inviteCodeInput.trim()) return;
    setLinking(true);

    try {
      const res = await fetch("/api/ca/link-client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: inviteCodeInput.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to link client.");
      }

      setToastMessage(data.message || "Client linked successfully!");
      setInviteCodeInput("");
      setShowLinkModal(false);
      refreshProfile();

      // Emit live socket events to notify Owner immediately
      emitCaLinkOwner({
        caFirmId: user?.id,
        caName: user?.name,
        client: data.client,
      });

      if (data.request) {
        emitCaDataRequest({
          ...data.request,
          caFirmId: user?.id,
          caName: user?.name,
        });
      }

      setTimeout(() => setToastMessage(""), 4000);
    } catch (err) {
      alert(err.message || "Linking error.");
    } finally {
      setLinking(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-4 rounded-2xl bg-slate-900 text-white text-xs font-bold border border-slate-700 shadow-xl flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900">
              Connected Client MSME Entities
            </h2>
            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              Mutual Linking
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Master roll of multi-tenant businesses linked for statutory auditing, GST, and tax sign-offs.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-xs font-bold bg-white border border-slate-200 px-3.5 py-2 rounded-xl text-slate-700 shadow-2xs">
            Total Linked: <strong className="text-slate-900">{dbClients.length} Entities</strong>
          </span>
          <button
            type="button"
            onClick={() => setShowLinkModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900 hover:bg-black text-white text-xs font-black shadow-md shadow-slate-900/10 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Link Client Business</span>
          </button>
        </div>
      </div>

      {/* ZERO STATE (When CA has 0 clients linked) */}
      {dbClients.length === 0 ? (
        <CrownZeroState
          variant="ca_hub"
          icon={Building2}
          badge="Client MSME Roll"
          title="No Client MSME Entities Linked Yet"
          description="Your practice does not have any connected businesses linked yet. Enter a business founder's invite code (e.g. BIZ-XXXXXX) or share your CA firm code to start auditing client books."
          actionText="Link Business via Invite Code"
          onAction={() => setShowLinkModal(true)}
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-3.5 px-5">Client Legal Entity</th>
                <th className="py-3.5 px-4">Contact &amp; Code</th>
                <th className="py-3.5 px-4 text-center">Data Authorization</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {dbClients.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/70">
                  <td className="py-4 px-5">
                    <span className="font-black text-slate-900 block text-xs">{c.name}</span>
                    <span className="text-[11px] text-slate-400">{c.email}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="font-mono font-bold text-slate-800 block text-[11px]">
                      {c.inviteCode || "BIZ-CONNECTED"}
                    </span>
                    <span className="text-[11px] text-slate-400">{c.phoneNumber}</span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                        c.dataSharingStatus === "CONNECTED"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {c.dataSharingStatus === "CONNECTED" ? "Full Data Access" : "Pending Authorization"}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveTab("data-requests")}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors cursor-pointer"
                      >
                        <KeyRound className="w-3 h-3" />
                        <span>Data Requests</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("audit-signoffs")}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-black transition-colors cursor-pointer"
                      >
                        <span>Audit Ledger</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* LINK CLIENT MODAL */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Link Business MSME</h3>
                  <p className="text-[11px] text-slate-500">Connect via Founder's Invite Code</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleLinkClient} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Owner Business Invite Code:
                </label>
                <input
                  type="text"
                  placeholder="e.g. BIZ-XXXXXX"
                  value={inviteCodeInput}
                  onChange={(e) => setInviteCodeInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold uppercase focus:outline-hidden focus:border-indigo-600"
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Ask the business owner to copy their invite code from their Crownops dashboard.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={linking}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{linking ? "Linking..." : "Link Entity"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
