"use client";
import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

const SalesFlowContext = createContext(null);

// Strict True Zero State Architecture - All Static Mock Data Purged
const INITIAL_UNASSIGNED_LEADS = [];
const INITIAL_COLD_CALL_QUEUE = [];
const INITIAL_FOLLOW_UPS = [];
const INITIAL_DEALS = [];
const INITIAL_FIELD_VISITS = [];
const INITIAL_ESTIMATES = [];
const INITIAL_SALES_ORDERS = [];
const INITIAL_CLIENT_MASTER = [];
const INITIAL_FULFILLMENT = [];

export function SalesFlowProvider({ children }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Core Data States
  const [unassignedLeads, setUnassignedLeads] = useState(INITIAL_UNASSIGNED_LEADS);
  const [coldCallQueue, setColdCallQueue] = useState(INITIAL_COLD_CALL_QUEUE);
  const [followUps, setFollowUps] = useState(INITIAL_FOLLOW_UPS);
  const [deals, setDeals] = useState(INITIAL_DEALS);
  const [fieldVisits, setFieldVisits] = useState(INITIAL_FIELD_VISITS);
  const [estimates, setEstimates] = useState(INITIAL_ESTIMATES);
  const [salesOrders, setSalesOrders] = useState(INITIAL_SALES_ORDERS);
  const [clientMaster, setClientMaster] = useState(INITIAL_CLIENT_MASTER);
  const [fulfillmentOrders, setFulfillmentOrders] = useState(INITIAL_FULFILLMENT);

  // Staged Records for Seamless Cross-Flow Pre-filling
  const [stagedLeadForDeal, setStagedLeadForDeal] = useState(null);
  const [stagedQuoteForOrder, setStagedQuoteForOrder] = useState(null);

  // Modals visibility toggles
  const [dealModalOpen, setDealModalOpen] = useState(false);
  const [soModalOpen, setSoModalOpen] = useState(false);
  const [toastNotification, setToastNotification] = useState("");

  const triggerToast = useCallback((msg) => {
    setToastNotification(msg);
    setTimeout(() => {
      setToastNotification("");
    }, 4500);
  }, []);

  // 1. Claim Lead: Move raw inbound inquiry to Cold Call Queue
  const claimLead = useCallback((leadId) => {
    setUnassignedLeads((prev) => {
      const target = prev.find((l) => l.id === leadId);
      if (!target) return prev;
      
      const claimedRecord = {
        ...target,
        claimedBy: "You (Active AE)",
        callAttempts: 0,
        disposition: "PENDING_FIRST_CALL",
        lastContact: "Just Now",
        city: target.city || "Direct Inbound",
      };
      
      setColdCallQueue((cPrev) => [claimedRecord, ...cPrev]);
      triggerToast(`✓ Lead "${target.companyName || target.contactName}" claimed into Cold Call Queue!`);
      return prev.filter((l) => l.id !== leadId);
    });
  }, [triggerToast]);

  // 2. Log Call Disposition: Record outcome, schedule callback if needed
  const logCallDisposition = useCallback((leadId, disposition, notes = "", callbackData = null) => {
    setColdCallQueue((prev) =>
      prev.map((lead) => {
        if (lead.id === leadId) {
          return {
            ...lead,
            disposition,
            callAttempts: (lead.callAttempts || 0) + 1,
            lastContact: "Just Now",
            notes: notes || lead.notes,
          };
        }
        return lead;
      })
    );

    if (disposition === "CALLBACK_SCHEDULED" && callbackData) {
      const newFollowUp = {
        id: `FU-${Date.now().toString().slice(-4)}`,
        leadId,
        contactName: callbackData.contactName || "Contact",
        companyName: callbackData.companyName || "Client",
        phone: callbackData.phone || "",
        scheduledDate: callbackData.date || "Tomorrow",
        scheduledTime: callbackData.time || "11:30 AM",
        priority: callbackData.priority || "HIGH",
        agenda: notes || "Scheduled telecall follow-up",
        status: "PENDING",
      };
      setFollowUps((prev) => [newFollowUp, ...prev]);
      triggerToast("Follow-up callback slot added to agenda!");
    } else {
      triggerToast(`Call disposition recorded: ${disposition.replace(/_/g, " ")}`);
    }
  }, [triggerToast]);

  // 3. Cross-Flow Step 1: "Qualify & Create Deal"
  // Pushes lead data into temporary context and navigates to Deals view with pre-filled modal
  const qualifyAndCreateDeal = useCallback((lead) => {
    const formattedStagedData = {
      sourceLeadId: lead.id,
      title: `${lead.companyName || lead.contactName} - Primary Supply Deal`,
      clientName: lead.companyName || lead.contactName,
      contactPerson: lead.contactName,
      phone: lead.phone,
      email: lead.email || "",
      dealValue: 250000, // standard baseline proposal
      marginPercent: 22, // satisfies 18% floor
      city: lead.city || "Direct Regional Office",
      notes: lead.notes || lead.interest || "Inbound lead qualified via telecalling queue.",
    };

    setStagedLeadForDeal(formattedStagedData);
    setDealModalOpen(true);

    // Smart route handling: deep link to Deals subtab or /deals
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set("tab", "deals_quotes");
    params.set("dealSubtab", "active-deals");
    
    if (pathname?.includes("/department")) {
      router.push(`${pathname}?${params.toString()}`);
    } else {
      router.push(`/deals?tab=active-deals`);
    }

    triggerToast(`⚡ Record qualified! Pre-filling deal modal for ${formattedStagedData.clientName}`);
  }, [pathname, router, searchParams, triggerToast]);

  // Helper: Auto-register client in Client Master Directory upon WON Deal
  const registerClientFromWonDeal = useCallback((wonDeal) => {
    setClientMaster((prev) => {
      const exists = prev.some(
        (c) => c.clientName?.toLowerCase() === wonDeal.clientName?.toLowerCase()
      );
      if (exists) {
        return prev.map((c) =>
          c.clientName?.toLowerCase() === wonDeal.clientName?.toLowerCase()
            ? {
                ...c,
                lifetimeValue: (c.lifetimeValue || 0) + (Number(wonDeal.dealValue) || 0),
                totalOrders: (c.totalOrders || 0) + 1,
              }
            : c
        );
      }

      const newClient = {
        id: `CLI-${Date.now().toString().slice(-4)}`,
        clientName: wonDeal.clientName,
        contactPerson: wonDeal.contactPerson || wonDeal.clientName,
        phone: wonDeal.phone || "9800000000",
        email: wonDeal.email || `${wonDeal.clientName?.toLowerCase().replace(/\s+/g, "")}@example.com`,
        city: wonDeal.city || "Branch Territory",
        address: `${wonDeal.city || "Industrial Estate"}, Client HQ`,
        gstin: `24AABC${Date.now().toString().slice(-5)}1Z${Math.floor(Math.random() * 9)}`,
        lifetimeValue: Number(wonDeal.dealValue) || 250000,
        totalOrders: 1,
        status: "ACTIVE",
        registeredVia: `Won Deal (${wonDeal.id})`,
      };
      return [newClient, ...prev];
    });
  }, []);

  // 4. Create Deal: Insert into deals array, and if WON auto-register in Client Master
  const createDeal = useCallback((dealData) => {
    const newDeal = {
      id: `DEAL-${Date.now().toString().slice(-4)}`,
      ...dealData,
      dealValue: Number(dealData.dealValue) || 100000,
      stage: dealData.stage || "REQUIREMENT_GATHERING",
      createdAt: new Date().toLocaleDateString("en-IN"),
    };

    setDeals((prev) => [newDeal, ...prev]);

    // Automatic Client Master population if Won on creation
    if (newDeal.stage === "WON") {
      registerClientFromWonDeal(newDeal);
    }

    setStagedLeadForDeal(null);
    setDealModalOpen(false);
    triggerToast(`✓ New deal "${newDeal.title}" created in pipeline!`);
  }, [registerClientFromWonDeal, triggerToast]);

  // 5. Update Deal Stage (Kanban Drag / Button action)
  const updateDealStage = useCallback((dealId, newStage) => {
    setDeals((prev) => {
      return prev.map((deal) => {
        if (deal.id === dealId) {
          const updated = { ...deal, stage: newStage };
          if (newStage === "WON") {
            registerClientFromWonDeal(updated);
          }
          return updated;
        }
        return deal;
      });
    });
    triggerToast(`Deal stage moved to: ${newStage.replace(/_/g, " ")}`);
  }, [registerClientFromWonDeal, triggerToast]);

  // 6. Cross-Flow Step 2: "Convert Quote to Sales Order"
  // Pushes financial quote data into temporary context and navigates to Counter Desk
  const convertQuoteToSalesOrder = useCallback((quote) => {
    const stagedData = {
      quoteId: quote.id,
      quoteNumber: quote.quoteNumber,
      dealId: quote.dealId,
      clientName: quote.clientName,
      contactPerson: quote.contactPerson,
      phone: quote.phone,
      totalAmount: quote.grandTotal,
      advanceCollected: Math.round(quote.grandTotal * 0.5), // 50% owner advance rule
      balanceDue: Math.round(quote.grandTotal * 0.5),
      itemsSummary: quote.lineItems?.map((li) => `${li.qty}x ${li.item}`).join(", ") || "Standard Finished Products",
      paymentTerms: quote.paymentTerms || "50% Advance with PO",
      paymentMode: "UPI",
    };

    setStagedQuoteForOrder(stagedData);
    setSoModalOpen(true);

    // Deep link to Counter Desk Confirmed SO tab
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set("tab", "sales_orders");
    params.set("counterSubtab", "confirmed-so");

    if (pathname?.includes("/department")) {
      router.push(`${pathname}?${params.toString()}`);
    } else {
      router.push(`/counter-desk?tab=confirmed-so`);
    }

    triggerToast(`⚡ Quote "${quote.quoteNumber}" converted to Sales Order! Pre-filling Counter Desk billing.`);
  }, [pathname, router, searchParams, triggerToast]);

  // 7. Create Confirmed Sales Order: Syncs to general ledger & triggers warehouse fulfillment
  const createSalesOrder = useCallback((orderData) => {
    const newSo = {
      id: `SO-${Date.now().toString().slice(-4)}`,
      ...orderData,
      totalAmount: Number(orderData.totalAmount) || 50000,
      advanceCollected: Number(orderData.advanceCollected) || 25000,
      balanceDue: (Number(orderData.totalAmount) || 50000) - (Number(orderData.advanceCollected) || 25000),
      paymentStatus:
        Number(orderData.advanceCollected) >= Number(orderData.totalAmount)
          ? "FULL"
          : "PARTIAL",
      ledgerSyncStatus: "SYNCED",
      createdAt: new Date().toLocaleDateString("en-IN"),
    };

    setSalesOrders((prev) => [newSo, ...prev]);

    // Create Initial Warehouse Fulfillment Stepper Record
    const newFulfillment = {
      id: `FUL-${Date.now().toString().slice(-4)}`,
      soId: newSo.id,
      clientName: newSo.clientName,
      itemsSummary: newSo.itemsSummary || "Confirmed Line Items",
      warehouseHub: "Main (HQ) Warehouse - Central Bay",
      currentStage: "BOOKED",
      trackingNumber: `TRK-IN-${Date.now().toString().slice(-4)}`,
      estimatedDispatch: "Tomorrow, 04:00 PM",
      timeline: [
        {
          step: "Order Booked & Advance Received",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          completed: true,
          note: `₹${Number(newSo.advanceCollected).toLocaleString("en-IN")} received via ${newSo.paymentMode || "UPI"}`,
        },
        {
          step: "Warehouse Picking Cleared",
          time: "Queued for Stock Bay",
          completed: false,
          note: "Waiting for inventory dispatch clearance",
        },
        {
          step: "QC Inspection & Packaging",
          time: "Pending",
          completed: false,
          note: "Quality seal checklist pending",
        },
        {
          step: "Logistics Fleet Dispatch",
          time: "Pending",
          completed: false,
          note: "Awaiting transport vehicle loading",
        },
      ],
    };

    setFulfillmentOrders((prev) => [newFulfillment, ...prev]);

    setStagedQuoteForOrder(null);
    setSoModalOpen(false);
    triggerToast(`✓ Confirmed Sales Order ${newSo.id} booked & posted to ledger!`);
  }, [triggerToast]);

  const value = useMemo(
    () => ({
      // Data states
      unassignedLeads,
      setUnassignedLeads,
      coldCallQueue,
      setColdCallQueue,
      followUps,
      setFollowUps,
      deals,
      setDeals,
      fieldVisits,
      setFieldVisits,
      estimates,
      setEstimates,
      salesOrders,
      setSalesOrders,
      clientMaster,
      setClientMaster,
      fulfillmentOrders,
      setFulfillmentOrders,

      // Staged data
      stagedLeadForDeal,
      setStagedLeadForDeal,
      stagedQuoteForOrder,
      setStagedQuoteForOrder,

      // Modal state
      dealModalOpen,
      setDealModalOpen,
      soModalOpen,
      setSoModalOpen,

      // Toast feedback
      toastNotification,
      triggerToast,

      // Action Handlers
      claimLead,
      logCallDisposition,
      qualifyAndCreateDeal,
      createDeal,
      updateDealStage,
      convertQuoteToSalesOrder,
      createSalesOrder,
    }),
    [
      unassignedLeads,
      coldCallQueue,
      followUps,
      deals,
      fieldVisits,
      estimates,
      salesOrders,
      clientMaster,
      fulfillmentOrders,
      stagedLeadForDeal,
      stagedQuoteForOrder,
      dealModalOpen,
      soModalOpen,
      toastNotification,
      triggerToast,
      claimLead,
      logCallDisposition,
      qualifyAndCreateDeal,
      createDeal,
      updateDealStage,
      convertQuoteToSalesOrder,
      createSalesOrder,
    ]
  );

  return (
    <SalesFlowContext.Provider value={value}>
      {children}
    </SalesFlowContext.Provider>
  );
}

export function useSalesFlow() {
  const context = useContext(SalesFlowContext);
  if (!context) {
    throw new Error("useSalesFlow must be used within a SalesFlowProvider");
  }
  return context;
}

export default SalesFlowContext;
