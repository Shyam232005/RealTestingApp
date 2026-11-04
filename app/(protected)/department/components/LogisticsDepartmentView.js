"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { toast } from "sonner";
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
  ScanLine,
  Eye,
  Thermometer,
  AlertTriangle,
  Receipt,
  ShieldCheck,
  ShieldAlert,
  CheckSquare,
  Square,
  Scale,
  Layers,
  Sparkles,
  RefreshCw,
  X,
  FileBox,
  Check,
  RotateCcw,
  Percent,
  Printer,
  Download,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import CrownZeroState from "@/components/ui/CrownZeroState";
import {
  TableSkeleton,
  MetricsCardsSkeleton,
  ScannerLaserSkeleton,
} from "@/components/ui/CrownSkeletonLoader";
import { DEPARTMENT_CONFIGS } from "./departmentConfig";
import GrnOcrScannerModal from "./GrnOcrScannerModal";
import GrnDetailsModal from "./GrnDetailsModal";
import CreatePoModal from "./CreatePoModal";
import AllocateCarrierModal from "./AllocateCarrierModal";
import LogisticsExceptionModal from "./LogisticsExceptionModal";
import FreightAuditModal from "./FreightAuditModal";
import { getHierarchyRank } from "@/lib/hierarchy";

export default function LogisticsDepartmentView({
  tabId = "warehouse_stock",
  employee,
  company,
  onNotify = () => {},
}) {
  const deptConfig = DEPARTMENT_CONFIGS.LOGISTICS;
  const currentTab = deptConfig.tabs.find((t) => t.id === tabId) || deptConfig.tabs[2];
  const userRank = getHierarchyRank(employee?.postLevel);
  const isCoordinator = userRank >= 2;

  // Active SubView state
  const [activeSubView, setActiveSubView] = useState(() => {
    if (tabId === "procurement_po") return "purchase_orders";
    if (tabId === "dispatch_fleet") return isCoordinator ? "carrier_allocation" : "picklist_execution";
    return "grn_notes";
  });

  // Zero-State Initializations (Strictly initialized empty/null)
  const [grnList, setGrnList] = useState([]);
  const [quarantineList, setQuarantineList] = useState([]);
  const [picklists, setPicklists] = useState([]);
  const [stagedConsignments, setStagedConsignments] = useState([]);
  const [binList, setBinList] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [carrierAllocations, setCarrierAllocations] = useState([]);
  const [exceptionsList, setExceptionsList] = useState([]);
  const [freightAudits, setFreightAudits] = useState([]);

  // Loading States
  const [loadingGrns, setLoadingGrns] = useState(false);
  const [loadingQuarantine, setLoadingQuarantine] = useState(false);
  const [loadingPicklists, setLoadingPicklists] = useState(false);
  const [loadingBins, setLoadingBins] = useState(false);
  const [loadingPos, setLoadingPos] = useState(false);
  const [loadingAllocations, setLoadingAllocations] = useState(false);
  const [loadingExceptions, setLoadingExceptions] = useState(false);
  const [loadingFreight, setLoadingFreight] = useState(false);

  // Modals
  const [showGrnModal, setShowGrnModal] = useState(false);
  const [selectedGrnDossier, setSelectedGrnDossier] = useState(null);
  const [showQuarantineModal, setShowQuarantineModal] = useState(false);
  const [showPackStageModal, setShowPackStageModal] = useState(false);
  const [selectedPicklistForPack, setSelectedPicklistForPack] = useState(null);
  const [showCreatePoModal, setShowCreatePoModal] = useState(false);
  const [showAllocateCarrierModal, setShowAllocateCarrierModal] = useState(false);
  const [showExceptionModal, setShowExceptionModal] = useState(false);
  const [selectedExceptionForEdit, setSelectedExceptionForEdit] = useState(null);
  const [showFreightAuditModal, setShowFreightAuditModal] = useState(false);
  const [selectedFreightAuditForEdit, setSelectedFreightAuditForEdit] = useState(null);

  // Quarantine form state
  const [quarantineForm, setQuarantineForm] = useState({
    cartonId: "",
    skuCode: "",
    itemDescription: "",
    batchLotNumber: "",
    quantity: "1",
    discrepancyType: "CRUSHED_CARTON",
    severity: "HIGH",
    quarantineBay: "Quarantine Bay Q-1 (Dock Hold)",
    notes: "",
  });

  // Pack stage form state
  const [packStageForm, setPackStageForm] = useState({
    stagingBay: "Bay 1 (Local Courier - BlueDart / Delhivery)",
    tareWeight: "15",
    netWeight: "120",
    grossWeight: "135",
    shippingProvider: "V-Trans Heavy Freight / BlueDart Express",
    vehicleNumber: "MH-12-RN-8841",
    notes: "",
    documents: {
      taxInvoiceAttached: false,
      deliveryChallanAttached: false,
      ewayBillAttached: false,
      lrCopyAttached: false,
    },
  });

  // Sync subview when parent tabId changes
  useEffect(() => {
    if (tabId === "procurement_po") {
      setActiveSubView("purchase_orders");
    } else if (tabId === "warehouse_stock") {
      setActiveSubView("grn_notes");
    } else if (tabId === "dispatch_fleet") {
      setActiveSubView(isCoordinator ? "carrier_allocation" : "picklist_execution");
    } else if (currentTab.subViews?.[0]?.id) {
      setActiveSubView(currentTab.subViews[0].id);
    }
  }, [tabId, currentTab, isCoordinator]);

  // Initial Data Fetching from All Backend Routes
  useEffect(() => {
    let isCancelled = false;

    async function fetchAllLogisticsData() {
      // 1. Fetch Draft GRNs
      setLoadingGrns(true);
      try {
        const res = await fetch("/api/logistics/inbound/draft-grn");
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled && data.drafts) setGrnList(data.drafts);
        }
      } catch (e) {
        console.warn("Could not fetch draft GRNs:", e);
      } finally {
        if (!isCancelled) setLoadingGrns(false);
      }

      // 2. Fetch Quarantine Discrepancies
      setLoadingQuarantine(true);
      try {
        const res = await fetch("/api/logistics/inventory/quarantine");
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled && data.quarantinedItems) setQuarantineList(data.quarantinedItems);
        }
      } catch (e) {
        console.warn("Could not fetch quarantine records:", e);
      } finally {
        if (!isCancelled) setLoadingQuarantine(false);
      }

      // 3. Fetch Outbound Picklists
      setLoadingPicklists(true);
      try {
        const res = await fetch("/api/logistics/outbound/picklists");
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled && data.picklists) setPicklists(data.picklists);
        }
      } catch (e) {
        console.warn("Could not fetch outbound picklists:", e);
      } finally {
        if (!isCancelled) setLoadingPicklists(false);
      }

      // 4. Fetch Staged Consignments
      try {
        const res = await fetch("/api/logistics/outbound/pack-stage");
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled && data.stagedConsignments) setStagedConsignments(data.stagedConsignments);
        }
      } catch (e) {
        console.warn("Could not fetch staged consignments:", e);
      }

      // 5. Fetch Warehouse Bins
      setLoadingBins(true);
      try {
        const res = await fetch("/api/logistics/inventory/bins");
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled && data.bins) setBinList(data.bins);
        }
      } catch (e) {
        console.warn("Could not fetch warehouse bins:", e);
      } finally {
        if (!isCancelled) setLoadingBins(false);
      }

      // 6. Fetch Purchase Orders (Tier 2)
      setLoadingPos(true);
      try {
        const res = await fetch("/api/logistics/procurement/purchase-orders");
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled && data.purchaseOrders) setPurchaseOrders(data.purchaseOrders);
        }
      } catch (e) {
        console.warn("Could not fetch purchase orders:", e);
      } finally {
        if (!isCancelled) setLoadingPos(false);
      }

      // 7. Fetch Carrier Allocations (Tier 2)
      setLoadingAllocations(true);
      try {
        const res = await fetch("/api/logistics/outbound/carrier-allocation");
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled && data.allocations) setCarrierAllocations(data.allocations);
        }
      } catch (e) {
        console.warn("Could not fetch carrier allocations:", e);
      } finally {
        if (!isCancelled) setLoadingAllocations(false);
      }

      // 8. Fetch Delivery Exceptions NDR / RTO (Tier 2)
      setLoadingExceptions(true);
      try {
        const res = await fetch("/api/logistics/outbound/exceptions");
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled && data.exceptions) setExceptionsList(data.exceptions);
        }
      } catch (e) {
        console.warn("Could not fetch delivery exceptions:", e);
      } finally {
        if (!isCancelled) setLoadingExceptions(false);
      }

      // 9. Fetch Freight Audits (Tier 2)
      setLoadingFreight(true);
      try {
        const res = await fetch("/api/logistics/freight/audit");
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled && data.audits) setFreightAudits(data.audits);
        }
      } catch (e) {
        console.warn("Could not fetch freight audits:", e);
      } finally {
        if (!isCancelled) setLoadingFreight(false);
      }
    }

    fetchAllLogisticsData();

    return () => {
      isCancelled = true;
    };
  }, []);

  // Dedicated Fetchers
  const fetchBins = async () => {
    setLoadingBins(true);
    try {
      const res = await fetch("/api/logistics/inventory/bins");
      if (res.ok) {
        const data = await res.json();
        if (data.bins) setBinList(data.bins);
      }
    } catch (e) {
      console.warn("Could not fetch bins:", e);
    } finally {
      setLoadingBins(false);
    }
  };

  const fetchPurchaseOrders = async () => {
    setLoadingPos(true);
    try {
      const res = await fetch("/api/logistics/procurement/purchase-orders");
      if (res.ok) {
        const data = await res.json();
        if (data.purchaseOrders) setPurchaseOrders(data.purchaseOrders);
      }
    } catch (e) {
      console.warn("Could not fetch purchase orders:", e);
    } finally {
      setLoadingPos(false);
    }
  };

  const fetchCarrierAllocations = async () => {
    setLoadingAllocations(true);
    try {
      const res = await fetch("/api/logistics/outbound/carrier-allocation");
      if (res.ok) {
        const data = await res.json();
        if (data.allocations) setCarrierAllocations(data.allocations);
      }
    } catch (e) {
      console.warn("Could not fetch allocations:", e);
    } finally {
      setLoadingAllocations(false);
    }
  };

  const fetchExceptions = async () => {
    setLoadingExceptions(true);
    try {
      const res = await fetch("/api/logistics/outbound/exceptions");
      if (res.ok) {
        const data = await res.json();
        if (data.exceptions) setExceptionsList(data.exceptions);
      }
    } catch (e) {
      console.warn("Could not fetch exceptions:", e);
    } finally {
      setLoadingExceptions(false);
    }
  };

  const fetchFreightAudits = async () => {
    setLoadingFreight(true);
    try {
      const res = await fetch("/api/logistics/freight/audit");
      if (res.ok) {
        const data = await res.json();
        if (data.audits) setFreightAudits(data.audits);
      }
    } catch (e) {
      console.warn("Could not fetch freight audits:", e);
    } finally {
      setLoadingFreight(false);
    }
  };

  // ---------------------------------------------------------------------------
  // HANDLERS: Tier 1 Features
  // ---------------------------------------------------------------------------
  const handleConfirmGrnFromOcr = (extractedData) => {
    const meta = extractedData.documentMetadata || {};
    const vendor = extractedData.vendorInfo || {};
    const lineItems = extractedData.lineItems || [];
    const transit = extractedData.logisticsTransit || {};
    const fin = extractedData.financialsBilling || {};
    const markers = extractedData.edgeCasesMarkers || {};

    const totalQty = lineItems.reduce(
      (sum, item) => sum + (Number(item.quantityInvoiced || item.quantity) || 0),
      0
    );

    const newDraftGrn = {
      id: meta.documentNumber || `GRN-DRAFT-${Date.now().toString().slice(-5)}`,
      poRef: meta.referencePoNumber || "PO-DIRECT",
      lrRef: transit.waybillNumber || "LR-AWB-PENDING",
      isLrPoCrossReferenced: true,
      vendorName: vendor.supplierName || "Direct Supplier",
      vendorGstin: vendor.supplierTaxId || "N/A",
      receivedQty: totalQty || 1,
      itemsCount: lineItems.length,
      dockNumber: vendor.destinationWarehouseId || "Dock Door 1",
      inspectedBy: employee?.name || "Logistics Assistant",
      status: "DRAFT",
      receivedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      date: meta.deliveryDate || new Date().toISOString().split("T")[0],
      vehicleNumber: transit.vehicleNumber || "N/A",
      transporter: transit.transporterName || "Direct Carrier",
      grandTotal: fin.grandTotal || 0,
      hasTemperature: !!markers.temperatureReading && !markers.temperatureReading.includes("Ambient"),
      temperature: markers.temperatureReading,
      hasQcStamp: !!markers.stampDetected,
      qcStampText: markers.stampDetails,
      hasHandwrittenNote: !!markers.handwrittenNotesPresent,
      handwrittenNoteText: markers.handwrittenNotesText,
      ocrData: extractedData,
    };

    setGrnList([newDraftGrn, ...grnList]);
    setShowGrnModal(false);

    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
    } catch {}

    toast.success("Draft GRN logged successfully!", {
      description: `Inward delivery #${newDraftGrn.id} cross-referenced with LR/PO. Awaiting supervisor sign-off.`,
    });
  };

  const handleFlagQuarantine = async (e) => {
    e.preventDefault();
    if (!quarantineForm.cartonId || !quarantineForm.itemDescription) {
      toast.error("Carton ID and Item Description are mandatory.");
      return;
    }

    const optimisticRecord = {
      id: quarantineForm.cartonId.toUpperCase(),
      cartonId: quarantineForm.cartonId.toUpperCase(),
      skuCode: quarantineForm.skuCode || "SKU-DEFECT",
      itemDescription: quarantineForm.itemDescription,
      batchLotNumber: quarantineForm.batchLotNumber || "BATCH-DOCK",
      quantity: Number(quarantineForm.quantity) || 1,
      discrepancyType: quarantineForm.discrepancyType,
      severity: quarantineForm.severity,
      quarantineBay: quarantineForm.quarantineBay,
      notes: quarantineForm.notes,
      status: "QUARANTINED",
      reportedByName: employee?.name || "Logistics Assistant",
      createdAt: new Date().toISOString(),
    };

    setQuarantineList([optimisticRecord, ...quarantineList]);
    setShowQuarantineModal(false);
    toast.success(`Carton #${optimisticRecord.cartonId} quarantined!`, {
      description: `Discrepancy logged into ${optimisticRecord.quarantineBay}.`,
    });

    try {
      const res = await fetch("/api/logistics/inventory/quarantine", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quarantineForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setQuarantineForm({
        cartonId: "",
        skuCode: "",
        itemDescription: "",
        batchLotNumber: "",
        quantity: "1",
        discrepancyType: "CRUSHED_CARTON",
        severity: "HIGH",
        quarantineBay: "Quarantine Bay Q-1 (Dock Hold)",
        notes: "",
      });
    } catch (err) {
      toast.error("Failed to sync quarantine record to database: " + err.message);
    }
  };

  const handleTogglePickItem = (picklistId, itemId) => {
    setPicklists((prev) =>
      prev.map((pl) => {
        if (pl.id !== picklistId) return pl;

        const updatedItems = pl.items.map((it) => {
          if (it.id !== itemId) return it;
          const newStatus = it.status === "PICKED" ? "PENDING_PICK" : "PICKED";
          return {
            ...it,
            status: newStatus,
            pickedQty: newStatus === "PICKED" ? it.quantityRequired : 0,
          };
        });

        const allPicked = updatedItems.every((i) => i.status === "PICKED");
        return {
          ...pl,
          status: allPicked ? "PICKED" : "AWAITING_PICKING",
          items: updatedItems,
        };
      })
    );
  };

  const handleOpenPackStageModal = (pl) => {
    setSelectedPicklistForPack(pl);
    setPackStageForm({
      stagingBay: "Bay 1 (Local Courier - BlueDart / Delhivery)",
      tareWeight: "15",
      netWeight: String(pl.totalQuantity * 5 || 100),
      grossWeight: String(pl.totalQuantity * 5 + 15 || 115),
      shippingProvider: "V-Trans Heavy Freight / BlueDart Express",
      vehicleNumber: "MH-12-RN-8841",
      notes: "",
      documents: {
        taxInvoiceAttached: false,
        deliveryChallanAttached: false,
        ewayBillAttached: false,
        lrCopyAttached: false,
      },
    });
    setShowPackStageModal(true);
  };

  const handleFinalizePackAndStage = async (e) => {
    e.preventDefault();
    const docs = packStageForm.documents;

    if (
      !docs.taxInvoiceAttached ||
      !docs.deliveryChallanAttached ||
      !docs.ewayBillAttached ||
      !docs.lrCopyAttached
    ) {
      toast.error("Document Collation Incomplete!", {
        description:
          "All 4 statutory physical shipping documents (Tax Invoice, Delivery Challan, E-Way Bill, LR) must be checked and attached before dispatch staging.",
      });
      return;
    }

    const pl = selectedPicklistForPack;
    const optimisticStaged = {
      id: `STAGE-${Date.now().toString().slice(-6)}`,
      orderReference: pl?.orderReference || "SO-STAGED",
      shippingProvider: packStageForm.shippingProvider,
      trackingNumber: `TRK-${Date.now().toString().slice(-8)}`,
      vehicleNumber: packStageForm.vehicleNumber,
      status: "PENDING_PICKUP",
      notes: `Staged in ${packStageForm.stagingBay}. Gross Wt: ${packStageForm.grossWeight}kg.`,
      scheduledDate: new Date().toISOString(),
      stagedAt: new Date().toISOString(),
    };

    setStagedConsignments([optimisticStaged, ...stagedConsignments]);

    setPicklists((prev) =>
      prev.map((item) =>
        item.id === pl.id ? { ...item, status: "PACKED_AND_STAGED" } : item
      )
    );

    setShowPackStageModal(false);

    try {
      confetti({ particleCount: 70, spread: 80, origin: { y: 0.7 } });
    } catch {}

    toast.success(`Consignment #${pl?.orderReference} Packed & Staged!`, {
      description: `Moved into ${packStageForm.stagingBay} with all 4 shipping documents attached.`,
    });

    try {
      await fetch("/api/logistics/outbound/pack-stage", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: pl?.orderId,
          orderReference: pl?.orderReference,
          stagingBay: packStageForm.stagingBay,
          weightMarkers: {
            tareWeight: Number(packStageForm.tareWeight),
            netWeight: Number(packStageForm.netWeight),
            grossWeight: Number(packStageForm.grossWeight),
          },
          documentCollation: packStageForm.documents,
          shippingProvider: packStageForm.shippingProvider,
          vehicleNumber: packStageForm.vehicleNumber,
          notes: packStageForm.notes,
        }),
      });
    } catch (err) {
      console.warn("Backend staging sync error:", err);
    }
  };

  const handleShiftBay = (consignmentId, targetBay) => {
    setStagedConsignments((prev) =>
      prev.map((c) =>
        c.id === consignmentId
          ? {
              ...c,
              notes: `Staged in ${targetBay}. Last shifted at ${new Date().toLocaleTimeString(
                [],
                { hour: "2-digit", minute: "2-digit" }
              )}`,
            }
          : c
      )
    );
    toast.info(`Consignment shifted to ${targetBay}`);
  };

  // Quick Action: Exception Re-attempt or RTO Approval
  const handleQuickExceptionAction = async (exception, action) => {
    try {
      const res = await fetch("/api/logistics/outbound/exceptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          awbNumber: exception.awbNumber,
          orderReference: exception.orderReference,
          customerName: exception.customerName,
          carrier: exception.carrier,
          actionTaken: action,
          coordinatorNotes: `Quick action triggered by ${employee?.name || "Coordinator"}.`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(`Exception updated to ${action}`);
      fetchExceptions();
    } catch (err) {
      toast.error(err.message || "Failed to update exception");
    }
  };

  // Quick Action: Pre-audit 5% Approval or Dispute
  const handleQuickFreightAudit = async (audit, action) => {
    try {
      const res = await fetch("/api/logistics/freight/audit", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceNumber: audit.invoiceNumber,
          awbNumber: audit.awbNumber,
          orderReference: audit.orderReference,
          carrier: audit.carrier,
          actualWeightKg: audit.actualWeightKg,
          billedWeightKg: audit.billedWeightKg,
          disputeReason: action === "DISPUTE" ? "Coordinator flagged invoice for credit note." : "",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(data.message);
      fetchFreightAudits();
    } catch (err) {
      toast.error(err.message || "Failed to update freight audit");
    }
  };

  const areAllDocsAttached =
    packStageForm.documents.taxInvoiceAttached &&
    packStageForm.documents.deliveryChallanAttached &&
    packStageForm.documents.ewayBillAttached &&
    packStageForm.documents.lrCopyAttached;

  return (
    <div className="space-y-6">
      {/* =========================================================================
          HEADER BANNER (Clean white surface with light blue employee highlights)
         ========================================================================= */}
      <div className="rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-xs font-black text-sky-700 uppercase tracking-wider flex items-center gap-1.5 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200/60">
              <Boxes className="w-3.5 h-3.5 text-sky-600" />
              Logistics & Supplies •{" "}
              {isCoordinator
                ? "Logistics Coordinator (Tier 2)"
                : "Logistics Assistant (Tier 1)"}
            </span>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
              {employee?.branchName || "Main Central Godown"}
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                isCoordinator
                  ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
              }`}
            >
              {isCoordinator ? "Tier 2 Inbound/Outbound Clearance" : "Tier 1 Inward/Outbound Clearance"}
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            {tabId === "procurement_po"
              ? "Procurement & Vendors (Inbound POs & Dock Slots)"
              : tabId === "warehouse_stock"
              ? "Warehouse & Inward Receiving (Draft GRN)"
              : tabId === "dispatch_fleet"
              ? "Order & Dispatch Hub (3PL Routing, AWB & Exceptions)"
              : currentTab.title}
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            {isCoordinator
              ? "Supervisory terminal for vendor Purchase Orders & ASNs, dock appointment scheduling to prevent demurrage, 3PL volumetric carrier routing, NDR/RTO exception resolution, freight pre-auditing (5% tolerance gate), and subordinate delegation."
              : "Frontline terminal for cross-referencing Lorry Receipts (LR) with Purchase Orders, logging defect quarantine sheets, executing pick lists with bin cards, and staging packed shipments with collated paperwork."}
          </p>
        </div>

        {/* Dynamic Sub-View Switcher Pills */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-100/90 border border-slate-200/80 overflow-x-auto self-start md:self-auto shrink-0">
          {tabId === "procurement_po" ? (
            <>
              {[
                { id: "purchase_orders", label: "Purchase Orders & ASNs", badge: purchaseOrders.length },
                {
                  id: "dock_scheduling",
                  label: "Dock Appointment Timeline",
                  badge: purchaseOrders.filter((p) => p.dockAppointmentSlot).length,
                },
              ].map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setActiveSubView(sub.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all flex items-center gap-1.5 ${
                    activeSubView === sub.id
                      ? "bg-white text-sky-900 shadow-xs border border-sky-100"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                  }`}
                >
                  <span>{sub.label}</span>
                  {sub.badge !== undefined && sub.badge > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-md font-mono bg-sky-100 text-sky-800">
                      {sub.badge}
                    </span>
                  )}
                </button>
              ))}
            </>
          ) : tabId === "warehouse_stock" ? (
            <>
              {[
                { id: "grn_notes", label: "Inward Draft GRNs", badge: grnList.length },
                {
                  id: "quarantine_discrepancy",
                  label: "Quarantine & Defects",
                  badge: quarantineList.length,
                  alert: quarantineList.length > 0,
                },
                { id: "live_inventory", label: "Bin Stock Map", badge: binList.length },
              ].map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setActiveSubView(sub.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all flex items-center gap-1.5 ${
                    activeSubView === sub.id
                      ? "bg-white text-sky-900 shadow-xs border border-sky-100"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                  }`}
                >
                  <span>{sub.label}</span>
                  {sub.badge !== undefined && sub.badge > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                        sub.alert ? "bg-amber-100 text-amber-800" : "bg-sky-100 text-sky-800"
                      }`}
                    >
                      {sub.badge}
                    </span>
                  )}
                </button>
              ))}
            </>
          ) : tabId === "dispatch_fleet" ? (
            <>
              {(isCoordinator
                ? [
                    { id: "carrier_allocation", label: "3PL Carrier Routing", badge: carrierAllocations.length },
                    { id: "dispatch_documentation", label: "AWB & Part-B E-Way Bills" },
                    {
                      id: "ndr_rto_exceptions",
                      label: "NDR & RTO Exceptions",
                      badge: exceptionsList.length,
                      alert: exceptionsList.length > 0,
                    },
                    { id: "freight_audit", label: "Freight Volumetric Audit", badge: freightAudits.length },
                    { id: "picklist_execution", label: "Pick Lists (Bin Cards)", badge: picklists.length },
                    { id: "staging_bays", label: "Dispatch Staging Bays", badge: stagedConsignments.length },
                  ]
                : [
                    { id: "picklist_execution", label: "Pick Lists (Bin Cards)", badge: picklists.length },
                    { id: "staging_bays", label: "Dispatch Staging Bays", badge: stagedConsignments.length },
                    { id: "document_collation", label: "Document Collation Rule" },
                  ]
              ).map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setActiveSubView(sub.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all flex items-center gap-1.5 ${
                    activeSubView === sub.id
                      ? "bg-white text-sky-900 shadow-xs border border-sky-100"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                  }`}
                >
                  <span>{sub.label}</span>
                  {sub.badge !== undefined && sub.badge > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                        sub.alert ? "bg-rose-100 text-rose-800" : "bg-sky-100 text-sky-800"
                      }`}
                    >
                      {sub.badge}
                    </span>
                  )}
                </button>
              ))}
            </>
          ) : (
            currentTab.subViews?.map((sub) => (
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
            ))
          )}
        </div>
      </div>

      {/* =========================================================================
          MODULE 1: PROCUREMENT & VENDORS (Tier 2 Coordinator)
         ========================================================================= */}
      {tabId === "procurement_po" && (
        <div className="space-y-6">
          {/* Sub-view 1: Purchase Orders & ASNs */}
          {activeSubView === "purchase_orders" && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-black text-slate-900 uppercase">
                      Vendor Purchase Orders & Advanced Shipping Notices (ASN)
                    </h3>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                      Tier 2 Authorization
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Generate supplier Purchase Orders, issue ASNs, and assign inward dock arrival slots to prevent transporter demurrage penalties.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCreatePoModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs shadow-xs flex items-center gap-2 cursor-pointer transition-all shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Create Purchase Order (PO)</span>
                </button>
              </div>

              {loadingPos ? (
                <TableSkeleton rows={4} cols={5} />
              ) : purchaseOrders.length === 0 ? (
                <CrownZeroState
                  variant="invoices"
                  badge="Procurement Standby"
                  title="Zero Active Purchase Orders"
                  description="No purchase orders or Advanced Shipping Notices (ASNs) generated yet. Create a vendor PO to assign dock slots and schedule inward freight."
                  actionText="+ Create First Purchase Order (PO)"
                  onAction={() => setShowCreatePoModal(true)}
                />
              ) : (
                <div className="rounded-3xl bg-white border border-slate-200/90 p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs font-bold text-slate-700">
                    <span>Active Vendor POs & Dock Passes ({purchaseOrders.length})</span>
                    <button
                      type="button"
                      onClick={fetchPurchaseOrders}
                      className="text-[11px] text-sky-700 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" /> Refresh
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-black">
                          <th className="pb-3 pl-2">PO & ASN Number</th>
                          <th className="pb-3">Vendor / Supplier</th>
                          <th className="pb-3">Material Summary</th>
                          <th className="pb-3">Dock Slot (Anti-Demurrage)</th>
                          <th className="pb-3">Est. Value</th>
                          <th className="pb-3">Expected Delivery</th>
                          <th className="pb-3 pr-2 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {purchaseOrders.map((po) => (
                          <tr key={po.id || po._id} className="hover:bg-slate-50/70">
                            <td className="py-3 pl-2">
                              <span className="font-mono font-black text-slate-900 block">{po.poNumber}</span>
                              <span className="font-mono text-[10px] text-sky-700">{po.asnNumber}</span>
                            </td>
                            <td className="py-3 font-semibold text-slate-800">
                              <span>{po.vendorName}</span>
                              {po.vendorGstin && (
                                <span className="block text-[10px] text-slate-400 font-mono">
                                  GST: {po.vendorGstin}
                                </span>
                              )}
                            </td>
                            <td className="py-3 text-slate-700 max-w-xs">
                              <span className="truncate block font-medium">
                                {po.itemsSummary || "General Raw Materials"}
                              </span>
                            </td>
                            <td className="py-3">
                              <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-800 border border-sky-200 text-[10px] font-bold block w-fit">
                                {po.dockAppointmentSlot || "Bay 1 (Morning)"}
                              </span>
                            </td>
                            <td className="py-3 font-mono font-bold text-slate-900">
                              ₹{Number(po.totalCost || 0).toLocaleString("en-IN")}
                            </td>
                            <td className="py-3 text-slate-600 font-mono text-[11px]">
                              {po.expectedDeliveryDate || "Pending"}
                            </td>
                            <td className="py-3 pr-2 text-right">
                              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                                {po.status ? po.status.replace(/_/g, " ") : "APPROVED"}
                              </span>
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

          {/* Sub-view 2: Dock Appointment Timeline (Anti-Demurrage) */}
          {activeSubView === "dock_scheduling" && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-slate-900 uppercase">
                      Inward Dock Appointment Schedule & Demurrage Shield
                    </h3>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Demurrage Protection Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pre-assigned unloading windows across warehouse bays. Vehicles exceeding the 120-minute dock window trigger demurrage alerts.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCreatePoModal(true)}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs shadow-xs flex items-center gap-2 cursor-pointer transition-all shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Book Dock Slot via PO</span>
                </button>
              </div>

              {/* Protocol Banner */}
              <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200 flex items-start gap-3 text-xs">
                <ShieldCheck className="w-5 h-5 text-sky-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-sky-950 block">Demurrage Prevention Protocol</span>
                  <p className="text-slate-600 mt-0.5">
                    SLA Rule: Unloading must commence within 30 minutes of gate-in. Staging bays must be verified clear before offloading begins.
                  </p>
                </div>
              </div>

              {purchaseOrders.length === 0 ? (
                <CrownZeroState
                  variant="warehouse"
                  badge="Dock Schedule Clear"
                  title="No Dock Appointments Scheduled"
                  description="All dock bays are currently idle with zero incoming demurrage risks. Appointments are assigned automatically when generating vendor POs."
                  actionText="+ Book First Dock Appointment"
                  onAction={() => setShowCreatePoModal(true)}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { bay: "Bay 1", name: "Bay 1 (Dock Hold & Raw Materials)", color: "sky" },
                    { bay: "Bay 2", name: "Bay 2 (Heavy Freight & Metals)", color: "indigo" },
                    { bay: "Bay 3", name: "Bay 3 (Dedicated Direct Fleet)", color: "purple" },
                  ].map((bayInfo) => {
                    const bayOrders = purchaseOrders.filter(
                      (p) => p.dockAppointmentSlot && p.dockAppointmentSlot.includes(bayInfo.bay)
                    );

                    return (
                      <div
                        key={bayInfo.bay}
                        className="rounded-3xl bg-white border border-slate-200/90 p-5 shadow-xs space-y-3"
                      >
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <div>
                            <span className="text-xs font-black text-slate-900 block">{bayInfo.bay}</span>
                            <span className="text-[10px] text-slate-400 font-bold">{bayInfo.name}</span>
                          </div>
                          <span className="text-xs font-mono font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
                            {bayOrders.length} Booked
                          </span>
                        </div>

                        {bayOrders.length === 0 ? (
                          <div className="py-8 text-center text-slate-400 text-xs">
                            <Truck className="w-8 h-8 mx-auto text-slate-300 mb-1" />
                            <span>Slot currently available</span>
                          </div>
                        ) : (
                          <div className="space-y-2.5">
                            {bayOrders.map((o) => (
                              <div
                                key={o.id || o._id}
                                className="p-3.5 rounded-2xl bg-sky-50/40 border border-sky-200/80 text-xs space-y-1.5"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-mono font-black text-slate-900">{o.poNumber}</span>
                                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                                    Slot Locked ✓
                                  </span>
                                </div>
                                <p className="text-[11px] font-semibold text-slate-800">{o.vendorName}</p>
                                <p className="text-[10px] text-slate-500 font-mono">
                                  ASN: {o.asnNumber} • Delivery: {o.expectedDeliveryDate || "Upcoming"}
                                </p>
                                <div className="pt-1 border-t border-sky-100 flex items-center justify-between text-[10px] text-sky-800">
                                  <span>{o.dockAppointmentSlot}</span>
                                  <span className="font-bold">Zero Demurrage</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          MODULE 2: WAREHOUSE & STOCK LEDGER (Inbound Receiving & Quarantine)
         ========================================================================= */}
      {tabId === "warehouse_stock" && (
        <div className="space-y-6">
          {/* Sub-view 1: Inward Draft GRNs (Cross-Referencing LR <-> PO) */}
          {activeSubView === "grn_notes" && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-black text-slate-900 uppercase">
                      Inward Goods Receipts (Draft GRN)
                    </h3>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                      AI OCR Scanner Active
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                      Tier 1: Draft-Only Workflow
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Scan vendor delivery challans or bilty slips to cross-reference Lorry Receipts (LR) with Purchase Orders (PO). Saves strictly as Draft awaiting supervisor approval.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setShowQuarantineModal(true)}
                    className="px-3.5 py-2 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 font-extrabold text-xs shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Flag Defect / Quarantine</span>
                  </button>

                  <button
                    onClick={() => setShowGrnModal(true)}
                    className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs shadow-xs flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <ScanLine className="w-4 h-4" />
                    <span>📸 AI OCR: Draft Inward GRN</span>
                  </button>
                </div>
              </div>

              {/* Data Table or Zero State */}
              {loadingGrns ? (
                <TableSkeleton rows={4} cols={5} />
              ) : grnList.length === 0 ? (
                <CrownZeroState
                  variant="ocr_scanner"
                  badge="Dock Receiving Idle"
                  title="Zero Inward Receipts Logged Today"
                  description="Incoming trucks at the loading dock can be verified by scanning delivery slips or Lorry Receipts (LR). Crown AI auto-matches PO numbers and extracts all line items without typing."
                  actionText="Draft First Inward GRN"
                  onAction={() => setShowGrnModal(true)}
                  secondaryActionText="Flag Defective Carton"
                  onSecondaryAction={() => setShowQuarantineModal(true)}
                />
              ) : (
                <div className="rounded-3xl bg-white border border-slate-200/90 p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs font-bold text-slate-700">
                    <span>Recent Inward Draft Submissions ({grnList.length})</span>
                    <span className="text-[11px] text-slate-400">Strictly Stored as 'draft'</span>
                  </div>

                  <div className="space-y-3">
                    {grnList.map((g) => (
                      <div
                        key={g.id || g._id}
                        className="p-4 rounded-2xl border border-slate-200/80 bg-white hover:border-sky-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-black text-xs text-slate-900">{g.id}</span>
                            <span className="text-[10px] font-mono text-sky-800 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-md font-bold">
                              PO: {g.poRef}
                            </span>
                            <span className="text-[10px] font-mono text-indigo-800 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md font-bold">
                              LR / Bilty: {g.lrRef || "LR-AWB-PENDING"}
                            </span>
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                              DRAFT (Awaiting Supervisor)
                            </span>
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              LR:PO Cross-Referenced
                            </span>
                            {g.hasTemperature && (
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200 flex items-center gap-1">
                                <Thermometer className="w-3 h-3 text-cyan-600" />
                                {g.temperature}
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-semibold text-slate-800">
                            Vendor: <strong className="text-slate-900">{g.vendorName}</strong>{" "}
                            {g.vendorGstin && g.vendorGstin !== "N/A" && `(GSTIN: ${g.vendorGstin})`}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {g.itemsCount ? `${g.itemsCount} SKUs • ` : ""}Total Qty:{" "}
                            <strong className="text-slate-700 font-mono">{g.receivedQty} units</strong> • Dock:{" "}
                            {g.dockNumber} • Inspector: {g.inspectedBy}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => setSelectedGrnDossier(g)}
                            className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            View Draft Dossier
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sub-view 2: Defect Flagging & Quarantine Discrepancy Sheets */}
          {activeSubView === "quarantine_discrepancy" && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-slate-900 uppercase">
                      Quarantine & Defect Discrepancy Sheets
                    </h3>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                      Isolation Bay
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Flag broken, crushed, or tampered cartons into designated quarantine bays (Q-1 / Q-2) to prevent accidental stock entry before QC disposition.
                  </p>
                </div>

                <button
                  onClick={() => setShowQuarantineModal(true)}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black text-xs shadow-xs flex items-center gap-2 cursor-pointer transition-all self-start sm:self-auto shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Flag Damaged Carton</span>
                </button>
              </div>

              {loadingQuarantine ? (
                <TableSkeleton rows={3} cols={5} />
              ) : quarantineList.length === 0 ? (
                <CrownZeroState
                  variant="warehouse"
                  badge="Zero Defect Hold"
                  title="Quarantine Bay is Empty"
                  description="All physical packages at the inward dock passed initial structural checks. No broken seals, crushed cartons, or leaked packages logged."
                  actionText="+ Flag First Damaged Carton"
                  onAction={() => setShowQuarantineModal(true)}
                />
              ) : (
                <div className="rounded-3xl bg-white border border-slate-200/90 p-5 shadow-xs space-y-3">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-black">
                          <th className="pb-3 pl-2">Carton / Barcode</th>
                          <th className="pb-3">Material / Description</th>
                          <th className="pb-3">Batch / Lot</th>
                          <th className="pb-3">Defect Reason</th>
                          <th className="pb-3">Quarantine Bay</th>
                          <th className="pb-3">Severity</th>
                          <th className="pb-3 pr-2 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {quarantineList.map((item) => (
                          <tr key={item.id || item._id} className="hover:bg-slate-50/70">
                            <td className="py-3 pl-2 font-mono font-bold text-slate-900 flex items-center gap-1.5">
                              <ShieldAlert className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                              <span>{item.cartonId}</span>
                            </td>
                            <td className="py-3 font-semibold text-slate-800">
                              {item.itemDescription}
                              {item.quantity > 1 && (
                                <span className="text-slate-400 font-mono ml-1">({item.quantity} units)</span>
                              )}
                            </td>
                            <td className="py-3 font-mono text-purple-700">{item.batchLotNumber || "N/A"}</td>
                            <td className="py-3 text-slate-700">
                              <span className="font-semibold text-rose-700">
                                {item.discrepancyType.replace(/_/g, " ")}
                              </span>
                              {item.notes && <p className="text-[10px] text-slate-400 truncate max-w-xs">{item.notes}</p>}
                            </td>
                            <td className="py-3 font-medium text-amber-800 bg-amber-50/50 px-2 rounded">
                              {item.quarantineBay}
                            </td>
                            <td className="py-3">
                              <span
                                className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                                  item.severity === "CRITICAL"
                                    ? "bg-rose-100 text-rose-800"
                                    : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {item.severity}
                              </span>
                            </td>
                            <td className="py-3 pr-2 text-right">
                              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                                {item.status.replace(/_/g, " ")}
                              </span>
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

          {/* Sub-view 3: Live Bin Stock Map (Zero State First) */}
          {activeSubView === "live_inventory" && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase">Warehouse Aisle & Bin Allocation</h3>
                  <p className="text-xs text-slate-500">Real-time bin cards for picking and inward replenishment.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-sky-700 bg-sky-50 px-3 py-1 rounded-xl border border-sky-200">
                    Zone 1: Aisle Racks
                  </span>
                  <button
                    type="button"
                    onClick={fetchBins}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 cursor-pointer transition-colors"
                    title="Refresh Bins"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {loadingBins ? (
                <MetricsCardsSkeleton count={4} />
              ) : binList.length === 0 ? (
                <CrownZeroState
                  variant="warehouse"
                  badge="Zero Bin Allocations"
                  title="No Bin Allocations Found"
                  description="Warehouse bins have not been configured or populated yet. Bin cards will display dynamically once aisle racks are registered or inward stock is assigned."
                  actionText="Refresh Bin Map"
                  onAction={fetchBins}
                />
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {binList.map((b, i) => (
                    <div
                      key={b.id || b.bin || i}
                      className={`p-3.5 rounded-2xl border text-xs ${
                        b.status === "AVAILABLE"
                          ? "bg-slate-50 border-dashed border-slate-200 text-slate-400"
                          : b.status === "HOLD"
                          ? "bg-amber-50/60 border-amber-200 text-amber-900"
                          : "bg-sky-50/40 border-sky-200/80 text-slate-900"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono font-black text-slate-900">{b.bin}</span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                            b.status === "AVAILABLE"
                              ? "bg-slate-200 text-slate-600"
                              : b.status === "HOLD"
                              ? "bg-amber-200 text-amber-800"
                              : "bg-sky-100 text-sky-800"
                          }`}
                        >
                          {b.status}
                        </span>
                      </div>
                      <p className="font-semibold text-slate-800 truncate">{b.item}</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {b.qty} {b.uom || ""}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          MODULE 3: ORDER & DISPATCH HUB (Tier 2 Coordinator & Tier 1 Assistant)
         ========================================================================= */}
      {tabId === "dispatch_fleet" && (
        <div className="space-y-6">
          {/* Sub-view 1: 3PL Carrier Routing (Tier 2 Coordinator) */}
          {activeSubView === "carrier_allocation" && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-black text-slate-900 uppercase">
                      3PL Freight Carrier Allocation & Volumetric Routing
                    </h3>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                      IATA Volumetric Engine
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Route outbound consignments to BlueDart, Delhivery, or V-Trans based on destination PIN code and volumetric calculation: (L × W × H) / 5000.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAllocateCarrierModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs shadow-xs flex items-center gap-2 cursor-pointer transition-all shrink-0"
                >
                  <Truck className="w-4 h-4" />
                  <span>+ Allocate 3PL Carrier</span>
                </button>
              </div>

              {/* Volumetric Formula Guide Card */}
              <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <Scale className="w-5 h-5 text-sky-700 shrink-0" />
                  <div>
                    <span className="font-bold text-sky-950 block">Chargeable Weight Rule</span>
                    <span className="text-slate-600">
                      Billing Weight = Max(Actual Dead Weight, Volumetric Weight). Volumetric = (L × W × H in cm) / 5000.
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-black px-2.5 py-1 rounded-lg bg-sky-200 text-sky-900 shrink-0">
                  IATA Factor: 5000
                </span>
              </div>

              {loadingAllocations ? (
                <TableSkeleton rows={4} cols={5} />
              ) : carrierAllocations.length === 0 ? (
                <CrownZeroState
                  variant="warehouse"
                  badge="Carrier Allocation Idle"
                  title="No 3PL Carrier Allocations Logged"
                  description="Assign 3PL freight carriers (BlueDart, Delhivery, V-Trans) based on volumetric weight and destination pin code to automatically generate Master AWBs."
                  actionText="+ Allocate Carrier to Consignment"
                  onAction={() => setShowAllocateCarrierModal(true)}
                />
              ) : (
                <div className="rounded-3xl bg-white border border-slate-200/90 p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs font-bold text-slate-700">
                    <span>Active Dispatched Carrier Routes ({carrierAllocations.length})</span>
                    <button
                      type="button"
                      onClick={fetchCarrierAllocations}
                      className="text-[11px] text-sky-700 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" /> Refresh
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-black">
                          <th className="pb-3 pl-2">Order Reference</th>
                          <th className="pb-3">3PL Carrier & AWB</th>
                          <th className="pb-3">Truck Plate / Driver</th>
                          <th className="pb-3">Routing Notes</th>
                          <th className="pb-3">Dispatch Date</th>
                          <th className="pb-3 pr-2 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {carrierAllocations.map((alloc) => (
                          <tr key={alloc.id || alloc._id} className="hover:bg-slate-50/70">
                            <td className="py-3 pl-2 font-mono font-bold text-slate-900">
                              {alloc.orderReference}
                            </td>
                            <td className="py-3 font-semibold text-slate-800">
                              <span>{alloc.carrier}</span>
                              <span className="block font-mono text-[10px] text-sky-700">
                                {alloc.awbNumber || "AWB-PENDING"}
                              </span>
                            </td>
                            <td className="py-3 font-mono text-slate-600">
                              <span>{alloc.vehicleNumber || "MH-12-RN-8841"}</span>
                              {alloc.driverContact && (
                                <span className="block text-[10px] text-slate-400">
                                  {alloc.driverContact}
                                </span>
                              )}
                            </td>
                            <td className="py-3 text-slate-600 text-[11px] max-w-xs truncate">
                              {alloc.notes || "Standard 3PL route"}
                            </td>
                            <td className="py-3 font-mono text-[11px] text-slate-500">
                              {alloc.dispatchDate
                                ? new Date(alloc.dispatchDate).toLocaleDateString()
                                : "Today"}
                            </td>
                            <td className="py-3 pr-2 text-right">
                              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                                {alloc.status ? alloc.status.replace(/_/g, " ") : "DISPATCHED"}
                              </span>
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

          {/* Sub-view 2: Master AWB & Part-B E-Way Bills (Tier 2 Coordinator) */}
          {activeSubView === "dispatch_documentation" && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-slate-900 uppercase">
                      Master Airway Bills (AWB) & Part-B E-Way Bill Vault
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      NIC E-Way Portal Compatible
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Generate, download, or print official shipping waybills with embedded Part-B vehicle conveyance updates.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    toast.success("Consolidated Waybill Dossier Generated", {
                      description: "Downloaded active Part-B E-Way bills in PDF format.",
                    });
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Download Part-B Manifest</span>
                </button>
              </div>

              {carrierAllocations.length === 0 ? (
                <CrownZeroState
                  variant="invoices"
                  badge="Documentation Ready"
                  title="Zero Active Dispatch Waybills"
                  description="Master AWBs and Part-B E-Way bills populate automatically once 3PL carriers are allocated to outbound consignments."
                  actionText="+ Allocate First Carrier Route"
                  onAction={() => setShowAllocateCarrierModal(true)}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {carrierAllocations.map((c) => (
                    <div
                      key={c.id || c._id}
                      className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-3"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-sky-600" />
                          <span className="font-mono font-black text-xs text-slate-900">
                            {c.awbNumber || `AWB-BD-${Math.floor(10000000 + Math.random() * 90000000)}`}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md font-bold">
                          Part-B Updated ✓
                        </span>
                      </div>

                      <div className="text-xs space-y-1">
                        <p className="text-slate-600">
                          Order Reference: <strong className="font-mono text-slate-900">{c.orderReference}</strong>
                        </p>
                        <p className="text-slate-600">
                          Carrier Partner: <strong className="text-slate-900">{c.carrier}</strong>
                        </p>
                        <p className="text-slate-600">
                          Vehicle Plate: <strong className="font-mono text-slate-900">{c.vehicleNumber}</strong>
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => {
                            toast.info(`Printing AWB #${c.awbNumber}`);
                          }}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-[11px] font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5 text-slate-500" />
                          <span>Print Label</span>
                        </button>
                        <span className="text-[10px] font-mono text-slate-400">
                          NIC-EWB Verified
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sub-view 3: NDR & RTO Exceptions Dashboard (Tier 2 Coordinator) */}
          {activeSubView === "ndr_rto_exceptions" && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-black text-slate-900 uppercase">
                      Non-Delivery Reports (NDR) & Return to Origin (RTO) Hub
                    </h3>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                      Tier 2 Exception Authority
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Resolve failed customer delivery attempts (door closed, wrong address). Schedule re-attempts or authorize formal Return to Origin (RTO).
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedExceptionForEdit(null);
                    setShowExceptionModal(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black text-xs shadow-xs flex items-center gap-2 cursor-pointer transition-all shrink-0"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>+ Log Delivery Exception</span>
                </button>
              </div>

              {loadingExceptions ? (
                <TableSkeleton rows={4} cols={5} />
              ) : exceptionsList.length === 0 ? (
                <CrownZeroState
                  variant="ca_hub"
                  icon={ShieldCheck}
                  badge="Transit Zero Exceptions"
                  title="Zero Active NDR / RTO Exceptions"
                  description="All dispatched shipments are moving without courier delivery exceptions. When a carrier logs a delivery failure, NDR re-attempt or RTO approval will appear here."
                  actionText="+ Log NDR Delivery Exception"
                  onAction={() => setShowExceptionModal(true)}
                />
              ) : (
                <div className="rounded-3xl bg-white border border-slate-200/90 p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs font-bold text-slate-700">
                    <span>Transit Exceptions Awaiting Action ({exceptionsList.length})</span>
                    <button
                      type="button"
                      onClick={fetchExceptions}
                      className="text-[11px] text-sky-700 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" /> Refresh
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-black">
                          <th className="pb-3 pl-2">AWB & Order Ref</th>
                          <th className="pb-3">Customer & Destination</th>
                          <th className="pb-3">Carrier Partner</th>
                          <th className="pb-3">Exception Reason</th>
                          <th className="pb-3">Action Status</th>
                          <th className="pb-3 pr-2 text-right">Coordinator Decisions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {exceptionsList.map((exc) => {
                          const isRto = exc.actionTaken === "RTO_APPROVED_BY_COORDINATOR";
                          return (
                            <tr key={exc.id || exc._id} className="hover:bg-slate-50/70">
                              <td className="py-3 pl-2">
                                <span className="font-mono font-black text-slate-900 block">{exc.awbNumber}</span>
                                <span className="font-mono text-[10px] text-slate-500">{exc.orderReference}</span>
                              </td>
                              <td className="py-3 font-semibold text-slate-800">
                                <span>{exc.customerName || "Customer"}</span>
                                <span className="block text-[10px] text-slate-400 font-mono">
                                  PIN: {exc.deliveryPinCode} ({exc.destinationCity || "Hub"})
                                </span>
                              </td>
                              <td className="py-3 font-medium text-slate-700">{exc.carrier}</td>
                              <td className="py-3">
                                <span className="font-bold text-rose-700 text-[11px] block">
                                  {exc.exceptionType ? exc.exceptionType.replace(/_/g, " ") : "NDR"}
                                </span>
                                {exc.coordinatorNotes && (
                                  <p className="text-[10px] text-slate-400 truncate max-w-xs">{exc.coordinatorNotes}</p>
                                )}
                              </td>
                              <td className="py-3">
                                <span
                                  className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                                    isRto
                                      ? "bg-rose-100 text-rose-800 border border-rose-200"
                                      : "bg-amber-100 text-amber-800 border border-amber-200"
                                  }`}
                                >
                                  {exc.actionTaken ? exc.actionTaken.replace(/_/g, " ") : "PENDING"}
                                </span>
                              </td>
                              <td className="py-3 pr-2 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {!isRto && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleQuickExceptionAction(exc, "REATTEMPT_SCHEDULED")}
                                        className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold text-[10px] border border-sky-200 cursor-pointer"
                                      >
                                        Re-attempt
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleQuickExceptionAction(exc, "RTO_APPROVED_BY_COORDINATOR")}
                                        className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-[10px] border border-rose-200 cursor-pointer"
                                      >
                                        Approve RTO
                                      </button>
                                    </>
                                  )}
                                  {isRto && (
                                    <span className="text-[10px] font-bold text-slate-400">
                                      Godown Return Logged
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sub-view 4: Freight Volumetric Audit with 5% Gate (Tier 2 Coordinator) */}
          {activeSubView === "freight_audit" && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-black text-slate-900 uppercase">
                      Freight Billing Pre-Audit (5% Variance Gate)
                    </h3>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      5.0% Variance Threshold Gate
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Audit carrier freight bills against actual volumetric warehouse logs before accounts payout. Discrepancies exceeding 5% variance require dispute sign-off.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowFreightAuditModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs shadow-xs flex items-center gap-2 cursor-pointer transition-all shrink-0"
                >
                  <Scale className="w-4 h-4" />
                  <span>+ Log Freight Invoice for Pre-Audit</span>
                </button>
              </div>

              {/* 5% Rule Banner */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-start gap-3 text-xs">
                <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-amber-950 block">Logistics Policy: 5% Variance Gate</span>
                  <p className="text-slate-600 mt-0.5">
                    Coordinators may only authorize freight invoices where the carrier's billed weight is within ±5.0% of our dock-measured volumetric tare. If billed weight exceeds 5%, an automated dispute flag is filed.
                  </p>
                </div>
              </div>

              {loadingFreight ? (
                <TableSkeleton rows={4} cols={5} />
              ) : freightAudits.length === 0 ? (
                <CrownZeroState
                  variant="financial_statements"
                  badge="Freight Ledger Balanced"
                  title="No Freight Bills Awaiting Audit"
                  description="All 3PL carrier invoices have been audited against actual volumetric logs. Discrepancies exceeding 5% variance are flagged for dispute."
                  actionText="+ Upload Carrier Freight Invoice"
                  onAction={() => setShowFreightAuditModal(true)}
                />
              ) : (
                <div className="rounded-3xl bg-white border border-slate-200/90 p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs font-bold text-slate-700">
                    <span>Carrier Invoices in Pre-Audit Queue ({freightAudits.length})</span>
                    <button
                      type="button"
                      onClick={fetchFreightAudits}
                      className="text-[11px] text-sky-700 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" /> Refresh
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-black">
                          <th className="pb-3 pl-2">Invoice # & AWB</th>
                          <th className="pb-3">3PL Carrier</th>
                          <th className="pb-3">Actual Wt vs Billed Wt</th>
                          <th className="pb-3">Variance %</th>
                          <th className="pb-3">Expected vs Billed (₹)</th>
                          <th className="pb-3">Audit Disposition</th>
                          <th className="pb-3 pr-2 text-right">Sign-Off</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {freightAudits.map((a) => {
                          const isApproved = a.auditStatus === "APPROVED_WITHIN_TOLERANCE";
                          const isDisputed = a.auditStatus === "DISPUTED_OVER_5_PERCENT";
                          const varianceVal = Number(a.variancePercent || 0);

                          return (
                            <tr key={a.id || a._id} className="hover:bg-slate-50/70">
                              <td className="py-3 pl-2">
                                <span className="font-mono font-black text-slate-900 block">{a.invoiceNumber}</span>
                                <span className="font-mono text-[10px] text-slate-500">{a.awbNumber}</span>
                              </td>
                              <td className="py-3 font-semibold text-slate-800">{a.carrier}</td>
                              <td className="py-3 font-mono text-[11px] text-slate-700">
                                <span>{a.actualWeightKg} kg</span>
                                <span className="text-slate-400 mx-1">→</span>
                                <strong className="text-slate-900">{a.billedWeightKg} kg</strong>
                              </td>
                              <td className="py-3">
                                <span
                                  className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-md ${
                                    Math.abs(varianceVal) <= 5.0
                                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                      : "bg-rose-100 text-rose-800 border border-rose-200"
                                  }`}
                                >
                                  {varianceVal > 0 ? `+${varianceVal}` : varianceVal}%
                                </span>
                              </td>
                              <td className="py-3 font-mono text-[11px]">
                                <span>₹{a.expectedAmount}</span>
                                <span className="text-slate-400 mx-1">/</span>
                                <strong className="text-slate-900">₹{a.billedAmount}</strong>
                              </td>
                              <td className="py-3">
                                <span
                                  className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                                    isApproved
                                      ? "bg-emerald-100 text-emerald-800"
                                      : isDisputed
                                      ? "bg-rose-100 text-rose-800"
                                      : "bg-amber-100 text-amber-800"
                                  }`}
                                >
                                  {a.auditStatus ? a.auditStatus.replace(/_/g, " ") : "PENDING"}
                                </span>
                              </td>
                              <td className="py-3 pr-2 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {!isApproved && !isDisputed && (
                                    <>
                                      {Math.abs(varianceVal) <= 5.0 ? (
                                        <button
                                          type="button"
                                          onClick={() => handleQuickFreightAudit(a, "APPROVE")}
                                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] cursor-pointer"
                                        >
                                          Approve
                                        </button>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => handleQuickFreightAudit(a, "DISPUTE")}
                                          className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-black text-[10px] cursor-pointer"
                                        >
                                          Dispute
                                        </button>
                                      )}
                                    </>
                                  )}
                                  {(isApproved || isDisputed) && (
                                    <span className="text-[10px] font-bold text-slate-400">
                                      Audited by {a.auditedByName || "Coordinator"}
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sub-view 5: Pick List Execution with Bin Cards (Tier 1 Assistant) */}
          {activeSubView === "picklist_execution" && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-slate-900 uppercase">
                      Sales Order Pick Lists & Warehouse Bin Checklist
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                      Tier 1 Picking Desk
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Execute approved customer pick lists by locating items across warehouse aisle bins. Mark items as "Picked" to update bin cards visually, then pack with weight markers.
                  </p>
                </div>

                <div className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 self-start sm:self-auto">
                  {picklists.filter((p) => p.status === "PICKED").length} / {picklists.length} Picklists Ready
                </div>
              </div>

              {loadingPicklists ? (
                <TableSkeleton rows={3} cols={4} />
              ) : picklists.length === 0 ? (
                <CrownZeroState
                  variant="warehouse"
                  badge="Picking Terminal Standby"
                  title="No Pending Pick Lists"
                  description="Zero sales orders are currently awaiting picking. Approved orders from the Sales & Billing department automatically populate here as actionable pick checklists."
                  actionText="Refresh Pick Lists"
                  onAction={() => {}}
                />
              ) : (
                <div className="space-y-4">
                  {picklists.map((pl) => {
                    const isAllPicked = pl.items.every((i) => i.status === "PICKED");
                    return (
                      <div
                        key={pl.id}
                        className="rounded-3xl bg-white border border-slate-200/90 p-5 shadow-xs space-y-4"
                      >
                        {/* Picklist Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-black text-sm text-slate-900">{pl.id}</span>
                              <span className="text-xs font-bold text-slate-800">
                                Client: <strong className="text-sky-700">{pl.customerName}</strong>
                              </span>
                              <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                Order: {pl.orderReference}
                              </span>
                              <span
                                className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                                  pl.status === "PACKED_AND_STAGED"
                                    ? "bg-purple-100 text-purple-800"
                                    : isAllPicked
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {pl.status.replace(/_/g, " ")}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Destination: {pl.destinationBranch} • Total Qty: {pl.totalQuantity} items • Order Date:{" "}
                              {pl.orderDate}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {pl.status !== "PACKED_AND_STAGED" && (
                              <button
                                type="button"
                                disabled={!isAllPicked}
                                onClick={() => handleOpenPackStageModal(pl)}
                                className={`px-4 py-2 rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                                  isAllPicked
                                    ? "bg-sky-600 hover:bg-sky-500 text-white cursor-pointer"
                                    : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                                }`}
                                title={
                                  !isAllPicked
                                    ? "Pick all items in checklist first"
                                    : "Proceed to Document Collation & Staging"
                                }
                              >
                                <PackageCheck className="w-3.5 h-3.5" />
                                <span>Pack & Stage Consignment</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Interactive Item Checklist with Visual Bin Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {pl.items.map((item) => {
                            const isItemPicked = item.status === "PICKED";
                            return (
                              <div
                                key={item.id}
                                onClick={() => handleTogglePickItem(pl.id, item.id)}
                                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                                  isItemPicked
                                    ? "bg-sky-50/70 border-sky-300 shadow-2xs"
                                    : "bg-white border-slate-200 hover:border-slate-300"
                                }`}
                              >
                                <div className="pt-0.5">
                                  {isItemPicked ? (
                                    <div className="w-5 h-5 rounded-lg bg-sky-600 text-white flex items-center justify-center shadow-2xs">
                                      <Check className="w-3.5 h-3.5" />
                                    </div>
                                  ) : (
                                    <div className="w-5 h-5 rounded-lg border-2 border-slate-300 hover:border-sky-500 bg-white" />
                                  )}
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-1 mb-0.5">
                                    <span className="font-mono text-[10px] text-slate-500">{item.sku}</span>
                                    <span
                                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                                        isItemPicked
                                          ? "bg-sky-100 text-sky-800 border-sky-300 font-black"
                                          : "bg-amber-50 text-amber-800 border-amber-200"
                                      }`}
                                    >
                                      {item.binLocation}
                                    </span>
                                  </div>
                                  <p
                                    className={`text-xs font-bold truncate ${
                                      isItemPicked ? "text-sky-950 line-through opacity-80" : "text-slate-900"
                                    }`}
                                  >
                                    {item.name}
                                  </p>
                                  <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
                                    <span>
                                      Qty Required:{" "}
                                      <strong className="font-mono text-slate-800">
                                        {item.quantityRequired} {item.uom}
                                      </strong>
                                    </span>
                                    <span className="text-[10px] font-bold text-sky-700">
                                      {isItemPicked ? "Picked ✓" : "Tap to Pick"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Sub-view 6: Dispatch Staging Bays */}
          {activeSubView === "staging_bays" && (
            <div className="space-y-5">
              <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-slate-900 uppercase">
                    Consignment Dispatch Staging Bays
                  </h3>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Framer State-Shift
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Packed customer consignments with verified paperwork staged across designated carrier bays awaiting loading onto freight vehicles.
                </p>
              </div>

              {stagedConsignments.length === 0 ? (
                <CrownZeroState
                  variant="warehouse"
                  badge="Staging Bays Clear"
                  title="Zero Packed Consignments in Staging"
                  description="Consignments appear here as soon as you execute pick lists, prompt weight markers, and verify statutory document collation."
                  actionText="View Active Pick Lists"
                  onAction={() => setActiveSubView("picklist_execution")}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { bayName: "Bay 1 (Local Courier - BlueDart / Delhivery)", badge: "Courier Parcels", color: "sky" },
                    { bayName: "Bay 2 (3PL Heavy Freight - V-Trans / TCI)", badge: "Heavy Freight", color: "indigo" },
                    { bayName: "Bay 3 (Dedicated Customer Fleet)", badge: "Direct Trucks", color: "purple" },
                  ].map((bay, idx) => {
                    const bayConsignments = stagedConsignments.filter(
                      (c) => c.notes?.includes(bay.bayName) || (idx === 0 && !c.notes?.includes("Bay"))
                    );

                    return (
                      <div
                        key={bay.bayName}
                        className="rounded-3xl bg-white border border-slate-200/90 p-5 shadow-xs space-y-3"
                      >
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <div>
                            <span className="text-xs font-black text-slate-900 block">
                              {bay.bayName.split(" ")[0]} {bay.bayName.split(" ")[1]}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold">{bay.badge}</span>
                          </div>
                          <span className="text-xs font-mono font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
                            {bayConsignments.length} Staged
                          </span>
                        </div>

                        {bayConsignments.length === 0 ? (
                          <div className="py-8 text-center text-slate-400 text-xs">
                            <Truck className="w-8 h-8 mx-auto text-slate-300 mb-1" />
                            <span>Bay currently vacant</span>
                          </div>
                        ) : (
                          <div className="space-y-2.5">
                            {bayConsignments.map((sc) => (
                              <motion.div
                                key={sc.id}
                                layout
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-3.5 rounded-2xl bg-sky-50/40 border border-sky-200/80 text-xs space-y-1.5"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-mono font-bold text-slate-900">{sc.orderReference}</span>
                                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                    Docs Attached ✓
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-600">
                                  Carrier: <strong>{sc.shippingProvider}</strong> • Truck: {sc.vehicleNumber}
                                </p>
                                <p className="text-[10px] text-slate-400">{sc.notes}</p>

                                <div className="pt-1.5 border-t border-sky-100 flex items-center justify-between gap-1 text-[10px]">
                                  <span className="text-slate-400">Shift Bay:</span>
                                  <div className="flex gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleShiftBay(sc.id, "Bay 1 (Local Courier)")}
                                      className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 border border-slate-200 font-bold cursor-pointer"
                                    >
                                      B-1
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleShiftBay(sc.id, "Bay 2 (3PL Heavy Freight)")}
                                      className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 border border-slate-200 font-bold cursor-pointer"
                                    >
                                      B-2
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleShiftBay(sc.id, "Bay 3 (Dedicated Fleet)")}
                                      className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 border border-slate-200 font-bold cursor-pointer"
                                    >
                                      B-3
                                    </button>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Sub-view 7: Document Collation Compliance Rule */}
          {activeSubView === "document_collation" && (
            <div className="rounded-3xl bg-white border border-slate-200/90 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-400/30 text-sky-700 flex items-center justify-center">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase">
                    Mandatory 4-Way Document Collation Policy
                  </h3>
                  <p className="text-xs text-slate-500">
                    Tier 1 Assistant strict rule: All four physical shipping documents must be collated and rubber-stamped prior to carrier handover.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    title: "1. GST Tax Invoice (Form GST INV-1)",
                    desc: "Triplicate copies: Original for Recipient, Duplicate for Transporter, Triplicate for Supplier.",
                    badge: "Statutory Law",
                  },
                  {
                    title: "2. Delivery Challan (Rule 55)",
                    desc: "Numbered challan signed by dock supervisor detailing serial numbers and package tare weights.",
                    badge: "Goods Transit",
                  },
                  {
                    title: "3. E-Way Bill (EWB-01)",
                    desc: "Active QR code with Part-B vehicle number matching the transporter's registered truck plate.",
                    badge: "E-Way Portal",
                  },
                  {
                    title: "4. Lorry Receipt (LR / Bilty)",
                    desc: "Consignment note issued by carrier confirming insurance, docket number, and gross tare weight.",
                    badge: "Transporter Carrier",
                  },
                ].map((doc, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-sky-50/50 border border-sky-200/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-sky-950">{doc.title}</span>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-sky-200 text-sky-900">
                        {doc.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">{doc.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          MODALS
         ========================================================================= */}
      {/* 1. Defect Flagging / Quarantine Modal */}
      {showQuarantineModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-amber-950 via-slate-900 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black">Flag Damaged Carton to Quarantine</h3>
                  <p className="text-[11px] text-slate-400">Log discrepancy into Quarantine Bay Q-1 / Q-2</p>
                </div>
              </div>
              <button
                onClick={() => setShowQuarantineModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFlagQuarantine} className="p-6 space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Carton / Barcode ID *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CTN-2026-9901"
                  value={quarantineForm.cartonId}
                  onChange={(e) => setQuarantineForm({ ...quarantineForm, cartonId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-medium focus:outline-hidden focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Item Description *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Stainless Steel Coils Grade 304"
                  value={quarantineForm.itemDescription}
                  onChange={(e) => setQuarantineForm({ ...quarantineForm, itemDescription: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Batch / Lot Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. LOT-TS-09A"
                    value={quarantineForm.batchLotNumber}
                    onChange={(e) => setQuarantineForm({ ...quarantineForm, batchLotNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Defective Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quarantineForm.quantity}
                    onChange={(e) => setQuarantineForm({ ...quarantineForm, quantity: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Discrepancy Type
                  </label>
                  <select
                    value={quarantineForm.discrepancyType}
                    onChange={(e) => setQuarantineForm({ ...quarantineForm, discrepancyType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden"
                  >
                    <option value="CRUSHED_CARTON">Crushed Carton</option>
                    <option value="BROKEN_INNER_PACK">Broken Inner Pack</option>
                    <option value="LEAKAGE">Liquid Leakage</option>
                    <option value="SEAL_TAMPERED">Seal Tampered</option>
                    <option value="TEMPERATURE_BREACH">Cold-Chain Temperature Breach</option>
                    <option value="MOISTURE_DAMAGE">Moisture Damage</option>
                    <option value="OTHER">Other Defect</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Quarantine Bay
                  </label>
                  <select
                    value={quarantineForm.quarantineBay}
                    onChange={(e) => setQuarantineForm({ ...quarantineForm, quarantineBay: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden"
                  >
                    <option value="Quarantine Bay Q-1 (Dock Hold)">Quarantine Bay Q-1 (Dock Hold)</option>
                    <option value="Quarantine Bay Q-2 (Cold-Chain Hold)">Quarantine Bay Q-2 (Cold-Chain Hold)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Inspection Notes & Physical Evidence
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g. Outer cardboard corner punctured during offloading. Inner vacuum bag compromised."
                  value={quarantineForm.notes}
                  onChange={(e) => setQuarantineForm({ ...quarantineForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowQuarantineModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Isolate to Quarantine</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Pack & Staging Modal with Enforced 4-Document Collation */}
      {showPackStageModal && selectedPicklistForPack && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-sky-950 via-slate-900 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-400/30 text-sky-400 flex items-center justify-center">
                  <PackageCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black">
                    Consignment Packaging & Document Collation
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Order Ref: {selectedPicklistForPack.orderReference} ({selectedPicklistForPack.customerName})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPackStageModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFinalizePackAndStage} className="p-6 space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-sky-50/50 border border-sky-200 space-y-2">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-sky-700" />
                  <span className="text-xs font-black uppercase text-sky-950">
                    Package Weight Markers (Kilograms)
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Tare Wt (Pallet)</label>
                    <input
                      type="number"
                      required
                      value={packStageForm.tareWeight}
                      onChange={(e) => setPackStageForm({ ...packStageForm, tareWeight: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-mono font-bold bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Net Cargo Wt</label>
                    <input
                      type="number"
                      required
                      value={packStageForm.netWeight}
                      onChange={(e) => setPackStageForm({ ...packStageForm, netWeight: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-mono font-bold bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Gross Weighbridge Wt</label>
                    <input
                      type="number"
                      required
                      value={packStageForm.grossWeight}
                      onChange={(e) => setPackStageForm({ ...packStageForm, grossWeight: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-mono font-black text-sky-800 bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Destination Staging Bay
                  </label>
                  <select
                    value={packStageForm.stagingBay}
                    onChange={(e) => setPackStageForm({ ...packStageForm, stagingBay: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden"
                  >
                    <option value="Bay 1 (Local Courier - BlueDart / Delhivery)">
                      Bay 1 (Local Courier - BlueDart / Delhivery)
                    </option>
                    <option value="Bay 2 (3PL Heavy Freight - V-Trans / TCI)">
                      Bay 2 (3PL Heavy Freight - V-Trans / TCI)
                    </option>
                    <option value="Bay 3 (Dedicated Customer Fleet)">Bay 3 (Dedicated Customer Fleet)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Carrier Vehicle Plate
                  </label>
                  <input
                    type="text"
                    required
                    value={packStageForm.vehicleNumber}
                    onChange={(e) => setPackStageForm({ ...packStageForm, vehicleNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              {/* MANDATORY DOCUMENT COLLATION CHECKBOXES */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <FileCheck2 className="w-4 h-4 text-sky-700" />
                    <span className="text-xs font-black uppercase text-slate-900">
                      Required Document Collation Check
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      areAllDocsAttached ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {areAllDocsAttached ? "All 4 Attached ✓" : "Mandatory Check"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  You must confirm that physical paperwork is printed and attached in the transit pouch before dispatch staging.
                </p>

                <div className="space-y-2 pt-1">
                  {[
                    { key: "taxInvoiceAttached", label: "1. GST Tax Invoice (Original + Duplicate for Transporter)" },
                    { key: "deliveryChallanAttached", label: "2. Delivery Challan (Signed & Stamped by Dock Clerk)" },
                    { key: "ewayBillAttached", label: "3. E-Way Bill (Part-B Updated with Vehicle Plate)" },
                    { key: "lrCopyAttached", label: "4. Lorry Receipt (LR / Consignment Note Transporter Copy)" },
                  ].map((docItem) => {
                    const isChecked = packStageForm.documents[docItem.key];
                    return (
                      <label
                        key={docItem.key}
                        className={`flex items-center gap-2.5 p-2 rounded-xl border cursor-pointer transition-colors ${
                          isChecked
                            ? "bg-white border-sky-300 text-sky-950 font-bold"
                            : "bg-white/60 border-slate-200 text-slate-700"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) =>
                            setPackStageForm({
                              ...packStageForm,
                              documents: {
                                ...packStageForm.documents,
                                [docItem.key]: e.target.checked,
                              },
                            })
                          }
                          className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                        />
                        <span className="text-xs">{docItem.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {!areAllDocsAttached && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Staging handover locked until all 4 statutory documents are checked and collated.</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPackStageModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!areAllDocsAttached}
                  className={`px-5 py-2.5 rounded-xl text-xs font-black shadow-xs flex items-center gap-2 transition-all ${
                    areAllDocsAttached
                      ? "bg-sky-600 hover:bg-sky-500 text-white cursor-pointer"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Confirm Collation & Move to Staging Bay</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Automatic AI OCR GRN Scanner Modal */}
      <GrnOcrScannerModal
        isOpen={showGrnModal}
        onClose={() => setShowGrnModal(false)}
        onConfirmGrn={handleConfirmGrnFromOcr}
        employee={employee}
      />

      {/* 4. Full Scanned OCR GRN Dossier Modal */}
      <GrnDetailsModal
        isOpen={!!selectedGrnDossier}
        onClose={() => setSelectedGrnDossier(null)}
        grn={selectedGrnDossier}
        company={company}
      />

      {/* 5. Create PO & ASN Modal (Tier 2 Coordinator) */}
      <CreatePoModal
        isOpen={showCreatePoModal}
        onClose={() => setShowCreatePoModal(false)}
        onSuccess={(newPo) => {
          setPurchaseOrders((prev) => [newPo, ...prev]);
        }}
        employee={employee}
      />

      {/* 6. Allocate Carrier Modal (Tier 2 Coordinator) */}
      <AllocateCarrierModal
        isOpen={showAllocateCarrierModal}
        onClose={() => setShowAllocateCarrierModal(false)}
        onSuccess={(newAllocation) => {
          setCarrierAllocations((prev) => [newAllocation, ...prev]);
        }}
        employee={employee}
        orders={stagedConsignments}
      />

      {/* 7. Logistics Exception Modal (NDR / RTO) */}
      <LogisticsExceptionModal
        isOpen={showExceptionModal}
        onClose={() => {
          setShowExceptionModal(false);
          setSelectedExceptionForEdit(null);
        }}
        onSuccess={(savedException) => {
          fetchExceptions();
        }}
        employee={employee}
        initialData={selectedExceptionForEdit}
      />

      {/* 8. Freight Pre-Audit Modal (5% Variance Rule) */}
      <FreightAuditModal
        isOpen={showFreightAuditModal}
        onClose={() => {
          setShowFreightAuditModal(false);
          setSelectedFreightAuditForEdit(null);
        }}
        onSuccess={(savedAudit) => {
          fetchFreightAudits();
        }}
        employee={employee}
        initialData={selectedFreightAuditForEdit}
      />
    </div>
  );
}
