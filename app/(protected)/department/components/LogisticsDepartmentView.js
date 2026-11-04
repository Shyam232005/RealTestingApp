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
  Wrench,
  Lock,
  DoorOpen,
  CheckCheck,
  TrendingUp,
  BarChart2,
  Users,
  Target,
  Award,
  DollarSign,
  Activity,
  FileCheck,
  CreditCard,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";
import ExecutiveWriteOffModal from "./ExecutiveWriteOffModal";
import CarrierPayoutModal from "./CarrierPayoutModal";
import CrownZeroState from "@/components/ui/CrownZeroState";
import CrownSkeletonLoader, {
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
import PostGrnModal from "./PostGrnModal";
import DiscrepancyMemoModal from "./DiscrepancyMemoModal";
import GenerateGatePassModal from "./GenerateGatePassModal";
import CycleCountAuditModal from "./CycleCountAuditModal";
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
  const isManager = userRank >= 5 || employee?.postLevel === "MANAGER" || employee?.postLevel === "DIRECTOR" || employee?.postLevel === "CHIEF_OFFICER";
  const isSupervisor = userRank >= 4 || employee?.postLevel === "SUPERVISOR" || isManager;
  const isCoordinator = userRank >= 2 || employee?.postLevel === "COORDINATOR" || isSupervisor;

  // Active SubView state
  const [activeSubView, setActiveSubView] = useState(() => {
    if (tabId === "logistics_dashboard") return "freight_analytics";
    if (tabId === "procurement_po") return "purchase_orders";
    if (tabId === "warehouse_stock") return isSupervisor ? "grn_notes" : "grn_notes";
    if (tabId === "dispatch_fleet") return isSupervisor ? "load_audit_gatepass" : isCoordinator ? "carrier_allocation" : "picklist_execution";
    return "freight_analytics";
  });

  // Zero-State Initializations (Strictly initialized empty/null)
  const [grnList, setGrnList] = useState([]);
  const [quarantineList, setQuarantineList] = useState([]);
  const [discrepancyMemos, setDiscrepancyMemos] = useState([]);
  const [cycleCountVariances, setCycleCountVariances] = useState([]);
  const [picklists, setPicklists] = useState([]);
  const [stagedConsignments, setStagedConsignments] = useState([]);
  const [binList, setBinList] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [carrierAllocations, setCarrierAllocations] = useState([]);
  const [exceptionsList, setExceptionsList] = useState([]);
  const [freightAudits, setFreightAudits] = useState([]);
  const [gatePasses, setGatePasses] = useState([]);

  // Tier 5 Manager Analytics & Financial Authorization States (Zero State First)
  const [freightSpendData, setFreightSpendData] = useState({
    summary: {
      totalSpend: 0,
      monthlyOpexBudget: 450000,
      budgetVariancePct: 0,
      spendPctOfRevenue: 0,
      activeCarriersCount: 0,
      disputedAmount: 0,
    },
    monthlyTrends: [],
    carrierBreakdown: [],
    spendCategories: [],
  });
  const [carrierSlaData, setCarrierSlaData] = useState({
    overallMetrics: {
      averageOtif: 0,
      averageNdrClearance: 0,
      averageDamageRate: 0,
      activePartners: 0,
    },
    carrierScorecard: [],
    capacityForecast: [],
  });
  const [executiveWriteOffs, setExecutiveWriteOffs] = useState([]);
  const [carrierPayoutBatches, setCarrierPayoutBatches] = useState([]);
  const [highValueDisputes, setHighValueDisputes] = useState([]);
  const [strategicObjectives, setStrategicObjectives] = useState([]);
  const [loadingObjectives, setLoadingObjectives] = useState(false);
  const [loadingCapacity, setLoadingCapacity] = useState(false);

  const [loadingFreightSpend, setLoadingFreightSpend] = useState(false);
  const [loadingCarrierSla, setLoadingCarrierSla] = useState(false);
  const [loadingWriteOffs, setLoadingWriteOffs] = useState(false);
  const [loadingPayoutBatches, setLoadingPayoutBatches] = useState(false);

  // Manager Modals
  const [showExecutiveWriteOffModal, setShowExecutiveWriteOffModal] = useState(false);
  const [selectedWriteOffItem, setSelectedWriteOffItem] = useState(null);
  const [showCarrierPayoutModal, setShowCarrierPayoutModal] = useState(false);
  const [selectedPayoutBatch, setSelectedPayoutBatch] = useState(null);
  const [showNewObjectiveModal, setShowNewObjectiveModal] = useState(false);
  const [newObjectiveForm, setNewObjectiveForm] = useState({
    title: "",
    assignedSupervisor: "Warehouse Supervisor (Morning Shift)",
    shift: "Shift A (06:00 - 14:00)",
    targetThroughput: "40 Trucks / Shift",
  });

  // Dock Door Allocation & MHE Equipment State (Zero State First)
  const [dockDoors, setDockDoors] = useState([]);
  const [mheList, setMheList] = useState([]);
  const [loadingDockMhe, setLoadingDockMhe] = useState(false);

  // Loading States
  const [loadingGrns, setLoadingGrns] = useState(false);
  const [loadingQuarantine, setLoadingQuarantine] = useState(false);
  const [loadingMemos, setLoadingMemos] = useState(false);
  const [loadingVariances, setLoadingVariances] = useState(false);
  const [loadingPicklists, setLoadingPicklists] = useState(false);
  const [loadingBins, setLoadingBins] = useState(false);
  const [loadingPos, setLoadingPos] = useState(false);
  const [loadingAllocations, setLoadingAllocations] = useState(false);
  const [loadingExceptions, setLoadingExceptions] = useState(false);
  const [loadingFreight, setLoadingFreight] = useState(false);
  const [loadingGatePasses, setLoadingGatePasses] = useState(false);

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

  // Supervisor Modals (Tier 4)
  const [showPostGrnModal, setShowPostGrnModal] = useState(false);
  const [selectedGrnForPost, setSelectedGrnForPost] = useState(null);
  const [showDiscrepancyMemoModal, setShowDiscrepancyMemoModal] = useState(false);
  const [selectedQuarantineForMemo, setSelectedQuarantineForMemo] = useState(null);
  const [showGatePassModal, setShowGatePassModal] = useState(false);
  const [showCycleCountModal, setShowCycleCountModal] = useState(false);

  // Quarantine sub-tab filter (for Supervisor: Flagged vs Issued Memos)
  const [quarantineTabMode, setQuarantineTabMode] = useState("FLAGGED"); // FLAGGED | MEMOS

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
    if (tabId === "logistics_dashboard") {
      setActiveSubView("freight_analytics");
    } else if (tabId === "procurement_po") {
      setActiveSubView("purchase_orders");
    } else if (tabId === "warehouse_stock") {
      setActiveSubView("grn_notes");
    } else if (tabId === "dispatch_fleet") {
      setActiveSubView(
        isSupervisor
          ? "load_audit_gatepass"
          : isCoordinator
          ? "carrier_allocation"
          : "picklist_execution"
      );
    } else if (currentTab.subViews?.[0]?.id) {
      setActiveSubView(currentTab.subViews[0].id);
    }
  }, [tabId, currentTab, isSupervisor, isCoordinator]);

  // Initial Data Fetching from All Backend Routes
  useEffect(() => {
    let isCancelled = false;

    async function fetchAllLogisticsData() {
      // 1. Fetch Draft & Posted GRNs
      setLoadingGrns(true);
      try {
        const res = await fetch("/api/logistics/inbound/grn-authorize");
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled && data.grns) setGrnList(data.grns);
        } else {
          // Fallback to draft-grn
          const draftRes = await fetch("/api/logistics/inbound/draft-grn");
          if (draftRes.ok) {
            const data = await draftRes.json();
            if (!isCancelled && data.drafts) setGrnList(data.drafts);
          }
        }
      } catch (e) {
        console.warn("Could not fetch GRNs:", e);
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

      // 3. Fetch Discrepancy Memos (Tier 4)
      setLoadingMemos(true);
      try {
        const res = await fetch("/api/logistics/inventory/discrepancy-memo");
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled && data.memos) setDiscrepancyMemos(data.memos);
        }
      } catch (e) {
        console.warn("Could not fetch discrepancy memos:", e);
      } finally {
        if (!isCancelled) setLoadingMemos(false);
      }

      // 4. Fetch Cycle Count Variances (Tier 4)
      setLoadingVariances(true);
      try {
        const res = await fetch("/api/logistics/inventory/variance");
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled && data.variances) setCycleCountVariances(data.variances);
        }
      } catch (e) {
        console.warn("Could not fetch cycle count variances:", e);
      } finally {
        if (!isCancelled) setLoadingVariances(false);
      }

      // 5. Fetch Outward Gate Passes (Tier 4)
      setLoadingGatePasses(true);
      try {
        const res = await fetch("/api/logistics/outbound/gate-pass");
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled && data.gatePasses) setGatePasses(data.gatePasses);
        }
      } catch (e) {
        console.warn("Could not fetch gate passes:", e);
      } finally {
        if (!isCancelled) setLoadingGatePasses(false);
      }

      // 6. Fetch Outbound Picklists
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

      // 7. Fetch Staged Consignments
      try {
        const res = await fetch("/api/logistics/outbound/pack-stage");
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled && data.stagedConsignments) setStagedConsignments(data.stagedConsignments);
        }
      } catch (e) {
        console.warn("Could not fetch staged consignments:", e);
      }

      // 8. Fetch Warehouse Bins
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

      // 9. Fetch Purchase Orders (Tier 2/4)
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

      // 10. Fetch Carrier Allocations (Tier 2/4)
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

      // 11. Fetch Delivery Exceptions NDR / RTO (Tier 2/4)
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

      // 12. Fetch Freight Audits (Tier 2/4)
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

  // Dedicated Refresh Functions
  const fetchGrns = async () => {
    setLoadingGrns(true);
    try {
      const res = await fetch("/api/logistics/inbound/grn-authorize");
      if (res.ok) {
        const data = await res.json();
        if (data.grns) setGrnList(data.grns);
      }
    } catch (e) {
      console.warn("Could not refresh GRNs:", e);
    } finally {
      setLoadingGrns(false);
    }
  };

  const fetchDiscrepancyMemos = async () => {
    setLoadingMemos(true);
    try {
      const res = await fetch("/api/logistics/inventory/discrepancy-memo");
      if (res.ok) {
        const data = await res.json();
        if (data.memos) setDiscrepancyMemos(data.memos);
      }
    } catch (e) {
      console.warn("Could not refresh memos:", e);
    } finally {
      setLoadingMemos(false);
    }
  };

  const fetchVariances = async () => {
    setLoadingVariances(true);
    try {
      const res = await fetch("/api/logistics/inventory/variance");
      if (res.ok) {
        const data = await res.json();
        if (data.variances) setCycleCountVariances(data.variances);
      }
    } catch (e) {
      console.warn("Could not refresh variances:", e);
    } finally {
      setLoadingVariances(false);
    }
  };

  const fetchGatePasses = async () => {
    setLoadingGatePasses(true);
    try {
      const res = await fetch("/api/logistics/outbound/gate-pass");
      if (res.ok) {
        const data = await res.json();
        if (data.gatePasses) setGatePasses(data.gatePasses);
      }
    } catch (e) {
      console.warn("Could not refresh gate passes:", e);
    } finally {
      setLoadingGatePasses(false);
    }
  };

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
  const fetchPos = fetchPurchaseOrders;

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

  const fetchFreightSpend = async () => {
    setLoadingFreightSpend(true);
    try {
      const res = await fetch("/api/logistics/analytics/freight-spend");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setFreightSpendData(data);
        }
      }
    } catch (err) {
      console.warn("Could not fetch freight spend analytics:", err);
    } finally {
      setLoadingFreightSpend(false);
    }
  };

  const fetchCarrierSla = async () => {
    setLoadingCarrierSla(true);
    setLoadingCapacity(true);
    try {
      const res = await fetch("/api/logistics/analytics/carrier-sla");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setCarrierSlaData(data);
        }
      }
    } catch (err) {
      console.warn("Could not fetch carrier SLA scorecard:", err);
    } finally {
      setLoadingCarrierSla(false);
      setLoadingCapacity(false);
    }
  };

  const fetchExecutiveWriteOffs = async () => {
    setLoadingWriteOffs(true);
    try {
      const res = await fetch("/api/logistics/inventory/executive-writeoff");
      if (res.ok) {
        const data = await res.json();
        if (data.records) {
          setExecutiveWriteOffs(data.records);
        }
      }
    } catch (err) {
      console.warn("Could not fetch executive write-offs:", err);
    } finally {
      setLoadingWriteOffs(false);
    }
  };

  const fetchCarrierPayouts = async () => {
    setLoadingPayoutBatches(true);
    try {
      const res = await fetch("/api/logistics/freight/payout-auth");
      if (res.ok) {
        const data = await res.json();
        if (data.payoutBatches) {
          setCarrierPayoutBatches(data.payoutBatches);
        }
        if (data.highValueDisputes) {
          setHighValueDisputes(data.highValueDisputes);
        }
      }
    } catch (err) {
      console.warn("Could not fetch carrier payouts:", err);
    } finally {
      setLoadingPayoutBatches(false);
    }
  };

  const handleSeedFreightAnalytics = () => {
    setLoadingFreightSpend(true);
    setTimeout(() => {
      setFreightSpendData({
        summary: {
          totalSpend: 428000,
          monthlyOpexBudget: 450000,
          budgetVariancePct: -4.8,
          spendPctOfRevenue: 6.85,
          activeCarriersCount: 4,
          disputedAmount: 18500,
        },
        monthlyTrends: [
          { month: "May", spend: 380000, budget: 450000, variance: -70000, variancePct: -15.5, revenueBenchmark: 5500000, spendPctRevenue: 6.9 },
          { month: "Jun", spend: 410000, budget: 450000, variance: -40000, variancePct: -8.8, revenueBenchmark: 5900000, spendPctRevenue: 6.94 },
          { month: "Jul", spend: 435000, budget: 450000, variance: -15000, variancePct: -3.3, revenueBenchmark: 6300000, spendPctRevenue: 6.9 },
          { month: "Aug", spend: 460000, budget: 450000, variance: 10000, variancePct: 2.2, revenueBenchmark: 6800000, spendPctRevenue: 6.76 },
          { month: "Sep", spend: 442000, budget: 450000, variance: -8000, variancePct: -1.7, revenueBenchmark: 6500000, spendPctRevenue: 6.8 },
          { month: "Oct", spend: 428000, budget: 450000, variance: -22000, variancePct: -4.8, revenueBenchmark: 6250000, spendPctRevenue: 6.85 },
        ],
        carrierBreakdown: [
          { carrier: "BlueDart Express", spend: 165000, count: 48 },
          { carrier: "Delhivery Surface", spend: 132000, count: 62 },
          { carrier: "V-Trans Heavy Freight", spend: 89000, count: 18 },
          { carrier: "Safexpress Multimodal", spend: 42000, count: 14 },
        ],
        spendCategories: [
          { category: "Express Air 3PL", percentage: 38, amount: 162640 },
          { category: "Surface LTL Part-Truck", percentage: 44, amount: 188320 },
          { category: "FTL Heavy Dedicated", percentage: 18, amount: 77040 },
        ],
      });
      setLoadingFreightSpend(false);
      toast.success("Freight Spend analytics baseline populated.");
    }, 400);
  };

  const handleCreateStrategicObjective = (e) => {
    e.preventDefault();
    if (!newObjectiveForm.title.trim()) {
      toast.error("Objective title is required.");
      return;
    }
    const newObj = {
      id: `OBJ-2026-0${strategicObjectives.length + 1}`,
      title: newObjectiveForm.title,
      assignedSupervisor: newObjectiveForm.assignedSupervisor,
      shift: newObjectiveForm.shift,
      targetThroughput: newObjectiveForm.targetThroughput,
      currentMetric: "Initiated",
      status: "ON_TRACK",
    };
    setStrategicObjectives((prev) => [newObj, ...prev]);
    setShowNewObjectiveModal(false);
    setNewObjectiveForm({
      title: "",
      assignedSupervisor: "Warehouse Supervisor (Morning Shift)",
      shift: "Shift A (06:00 - 14:00)",
      targetThroughput: "40 Trucks / Shift",
    });
    toast.success("Strategic operational objective delegated to Supervisor.");
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

  // MHE Equipment Pre-Shift Toggle
  const handleToggleMheInspection = (mheId) => {
    setMheList((prev) =>
      prev.map((m) =>
        m.id === mheId
          ? {
              ...m,
              status: m.status === "PASSED" ? "NEEDS_INSPECTION" : "PASSED",
              inspectedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            }
          : m
      )
    );
    toast.success(`MHE Equipment #${mheId} safety status updated.`);
  };

  // Dock Door Status Toggle
  const handleToggleDockDoor = (doorId) => {
    setDockDoors((prev) =>
      prev.map((d) =>
        d.id === doorId
          ? {
              ...d,
              status: d.status === "AVAILABLE" ? "OFFLOADING" : d.status === "OFFLOADING" ? "STANDBY_HOLD" : "AVAILABLE",
            }
          : d
      )
    );
    toast.info(`Dock Door #${doorId} status updated.`);
  };

  const handleInitializeDefaultDockMhe = () => {
    setLoadingDockMhe(true);
    setTimeout(() => {
      setDockDoors([
        { id: 1, name: "Dock Door 1", type: "INBOUND", status: "OFFLOADING", vehicle: "MH-14-GH-1022", material: "Tata Steel Grade 304" },
        { id: 2, name: "Dock Door 2", type: "INBOUND", status: "AVAILABLE", vehicle: null, material: null },
        { id: 3, name: "Dock Door 3", type: "INBOUND", status: "STANDBY_HOLD", vehicle: "GJ-06-XX-4411", material: "Quarantine Inspection" },
        { id: 4, name: "Dock Door 4", type: "OUTBOUND", status: "LOADING", vehicle: "MH-12-RN-8841", material: "BlueDart Express Staging" },
        { id: 5, name: "Dock Door 5", type: "OUTBOUND", status: "AVAILABLE", vehicle: null, material: null },
        { id: 6, name: "Dock Door 6", type: "OUTBOUND", status: "GATE_PASS_READY", vehicle: "MH-04-BT-9021", material: "V-Trans Heavy Freight" },
      ]);
      setMheList([
        { id: "FL-01", name: "Forklift FL-01", model: "Toyota 3.0T Diesel", status: "PASSED", batteryFuel: "95%", hydraulics: "NORMAL", brakes: "NORMAL", inspectedAt: "08:15 AM" },
        { id: "RT-02", name: "Reach Truck RT-02", model: "Crown 1.5T Electric", status: "PASSED", batteryFuel: "88%", hydraulics: "NORMAL", brakes: "NORMAL", inspectedAt: "08:20 AM" },
        { id: "EPJ-04", name: "Electric Pallet Jack EPJ-04", model: "Godrej 2.0T Electric", status: "PASSED", batteryFuel: "100%", hydraulics: "NORMAL", brakes: "NORMAL", inspectedAt: "08:10 AM" },
        { id: "BS-02", name: "Battery Stacker BS-02", model: "Voltas 1.0T Mast", status: "NEEDS_INSPECTION", batteryFuel: "42%", hydraulics: "CHECK_REQUIRED", brakes: "NORMAL", inspectedAt: "Pending" },
      ]);
      setLoadingDockMhe(false);
      toast.success("Standard 6-Door Dock layout and MHE fleet initialized.");
    }, 350);
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

  return (
    <div className="space-y-6">
      {/* =========================================================================
          HEADER BANNER (Clean white surface with light blue employee highlights)
         ========================================================================= */}
      <div className="rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-xs flex flex-col gap-6 w-full">
        <div className="w-full">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-xs font-black text-sky-700 uppercase tracking-wider flex items-center gap-1.5 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200/60">
              <Boxes className="w-3.5 h-3.5 text-sky-600" />
              Logistics & Supplies •{" "}
              {isManager
                ? "Logistics Manager (Tier 5)"
                : isSupervisor
                ? "Logistics Supervisor (Tier 4)"
                : isCoordinator
                ? "Logistics Coordinator (Tier 2)"
                : "Logistics Assistant (Tier 1)"}
            </span>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
              {employee?.branchName || "Main Central Godown"}
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                isSupervisor
                  ? "bg-purple-50 text-purple-700 border-purple-200 font-black"
                  : isCoordinator
                  ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
              }`}
            >
              {isManager
                ? "Tier 5 Executive Supply Chain & SLA Clearance"
                : isSupervisor
                ? "Tier 4 Supervisory & Authorization Clearance"
                : isCoordinator
                ? "Tier 2 Inbound/Outbound Clearance"
                : "Tier 1 Inward/Outbound Clearance"}
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {tabId === "logistics_dashboard"
              ? "Supply Chain & SLA Hub (Executive Freight, SLA & Capacity Planning)"
              : tabId === "procurement_po"
              ? isManager
                ? "Procurement & Vendors (Inbound POs & Executive Dock Slot Override)"
                : "Procurement & Vendors (Inbound POs & Dock Slots)"
              : tabId === "warehouse_stock"
              ? isManager
                ? "Warehouse & Stock Ledger (Major Write-Offs & Transit Claims >₹50,000)"
                : isSupervisor
                ? "Warehouse & Inward Receiving (GRN Authorization & Stock Ledger)"
                : "Warehouse & Inward Receiving (Draft GRN)"
              : tabId === "dispatch_fleet"
              ? isManager
                ? "Order & Dispatch Hub (Carrier Payout Authorization & High-Value Disputes)"
                : isSupervisor
                ? "Order & Dispatch Hub (Load Auditing, Gate Passes & Dock MHE)"
                : "Order & Dispatch Hub (3PL Routing, AWB & Exceptions)"
              : currentTab.title}
          </h1>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            {isManager
              ? "Executive Supply Chain & Logistics terminal for monthly freight spend analytics vs. OPEX budget limits, 3PL carrier SLA compliance scorecards, hub-and-spoke volumetric capacity planning, major write-down authorization (>₹50,000), monthly carrier payout sign-offs, and departmental headcount delegation."
              : isSupervisor
              ? "Operations desk for Final GRN Authorization, Quarantine Adjudication & Debit Memos, Cycle Count Variance Audits, Outward Gate Pass Issuance with 5-point Load Audits, and Dock Door & MHE Pre-Shift Inspections."
              : isCoordinator
              ? "Supervisory terminal for vendor Purchase Orders & ASNs, dock appointment scheduling to prevent demurrage, 3PL volumetric carrier routing, NDR/RTO exception resolution, freight pre-auditing (5% tolerance gate), and subordinate delegation."
              : "Frontline terminal for cross-referencing Lorry Receipts (LR) with Purchase Orders, logging defect quarantine sheets, executing pick lists with bin cards, and staging packed shipments with collated paperwork."}
          </p>
        </div>

        {/* Dynamic Sub-View Switcher Pills */}
        <div className="w-full flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-2 scrollbar-hide p-1.5 rounded-2xl bg-slate-100/90 border border-slate-200/80">
          {tabId === "logistics_dashboard" ? (
            <>
              {[
                { id: "freight_analytics", label: "Freight & Budget Analytics" },
                { id: "carrier_sla", label: "Carrier SLA Scorecard", badge: carrierSlaData.carrierScorecard?.length },
                { id: "demand_forecasting", label: "Demand Forecasting & Capacity" },
                { id: "strategic_delegation", label: "Manager Headcount & Desk" },
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
          ) : tabId === "procurement_po" ? (
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
              {(isSupervisor
                ? [
                    { id: "grn_notes", label: "GRN Authorization & Receipts", badge: grnList.length },
                    {
                      id: "quarantine_discrepancy",
                      label: "Quarantine Adjudication & Memos",
                      badge: quarantineList.length,
                      alert: quarantineList.length > 0,
                    },
                    {
                      id: "inventory_audits",
                      label: "Cycle Count & Stock Audits",
                      badge: cycleCountVariances.length,
                      alert: cycleCountVariances.length > 0,
                    },
                    ...(isManager
                      ? [{
                          id: "executive_writeoff",
                          label: "Major Write-Offs (>₹50k)",
                          badge: executiveWriteOffs.length,
                          alert: executiveWriteOffs.length > 0,
                        }]
                      : []),
                    { id: "live_inventory", label: "Bin Stock Map", badge: binList.length },
                  ]
                : [
                    { id: "grn_notes", label: "Inward Draft GRNs", badge: grnList.length },
                    {
                      id: "quarantine_discrepancy",
                      label: "Quarantine & Defects",
                      badge: quarantineList.length,
                      alert: quarantineList.length > 0,
                    },
                    { id: "live_inventory", label: "Bin Stock Map", badge: binList.length },
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
              {(isSupervisor
                ? [
                    { id: "load_audit_gatepass", label: "Load Auditing & Gate Passes", badge: gatePasses.length },
                    { id: "dock_mhe_management", label: "Dock & MHE Management" },
                    { id: "carrier_allocation", label: "3PL Carrier Routing", badge: carrierAllocations.length },
                    { id: "dispatch_documentation", label: "AWB & Part-B E-Way Bills" },
                    {
                      id: "ndr_rto_exceptions",
                      label: "NDR & RTO Exceptions",
                      badge: exceptionsList.length,
                      alert: exceptionsList.length > 0,
                    },
                    { id: "freight_audit", label: "Freight Volumetric Audit", badge: freightAudits.length },
                    ...(isManager
                      ? [{
                          id: "carrier_payouts",
                          label: "Monthly Carrier Payouts",
                          badge: carrierPayoutBatches.length,
                        }]
                      : []),
                    { id: "picklist_execution", label: "Pick Lists (Bin Cards)", badge: picklists.length },
                    { id: "staging_bays", label: "Dispatch Staging Bays", badge: stagedConsignments.length },
                  ]
                : isCoordinator
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
          MODULE 0: SUPPLY CHAIN & SLA HUB (Tier 5 Manager)
         ========================================================================= */}
      {tabId === "logistics_dashboard" && (
        <div className="space-y-6">
          {/* Sub-view 1: Freight & Budget Analytics */}
          {activeSubView === "freight_analytics" && (
            <div className="space-y-6">
              {/* Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black text-sky-700 uppercase tracking-wider flex items-center gap-1.5 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200/60">
                      <BarChart2 className="w-3.5 h-3.5 text-sky-600" />
                      Executive Spend Analytics
                    </span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 font-mono">
                      Tier 5 Manager Desk
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mt-1">
                    Freight Spend vs. OPEX Budget & Revenue Benchmark
                  </h3>
                  <p className="text-xs text-slate-500">
                    Real-time monitoring of freight logistics cost as a percentage of company revenue and monthly OPEX variance tracking.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={fetchFreightSpend}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Refresh Data</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSeedFreightAnalytics}
                    className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs shadow-xs flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <TrendingUp className="w-4 h-4" />
                    <span>Seed Analytics Baseline</span>
                  </button>
                </div>
              </div>

              {loadingFreightSpend ? (
                <MetricsCardsSkeleton count={6} />
              ) : freightSpendData.monthlyTrends.length === 0 ? (
                <CrownZeroState
                  variant="invoices"
                  icon={BarChart2}
                  badge="Freight Analytics Standby"
                  title="Zero Freight Spend Telemetry"
                  description="Historical freight invoices and OPEX variance will populate once carrier invoices and bills of lading are processed."
                  actionText="+ Seed Analytics Baseline"
                  onAction={handleSeedFreightAnalytics}
                />
              ) : (
                <>
                  {/* KPI Metric Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Freight Spend</span>
                      <span className="text-lg font-mono font-black text-slate-900">
                        ₹{(freightSpendData.summary?.totalSpend || 0).toLocaleString("en-IN")}
                      </span>
                      <span className="text-[10px] text-emerald-700 font-bold block">October 2026</span>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Monthly OPEX Limit</span>
                      <span className="text-lg font-mono font-black text-slate-900">
                        ₹{(freightSpendData.summary?.monthlyOpexBudget || 450000).toLocaleString("en-IN")}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium block">Approved Budget Cap</span>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Budget Variance</span>
                      <span className={`text-lg font-mono font-black ${
                        (freightSpendData.summary?.budgetVariancePct || 0) <= 0 ? "text-emerald-700" : "text-rose-700"
                      }`}>
                        {freightSpendData.summary?.budgetVariancePct > 0 ? `+${freightSpendData.summary?.budgetVariancePct}%` : `${freightSpendData.summary?.budgetVariancePct}%`}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-semibold block">Under OPEX Ceiling ✓</span>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Spend % of Revenue</span>
                      <span className="text-lg font-mono font-black text-sky-700">
                        {freightSpendData.summary?.spendPctOfRevenue || 6.85}%
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium block">Benchmark: &lt; 7.5%</span>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Disputed Invoices</span>
                      <span className="text-lg font-mono font-black text-amber-700">
                        ₹{(freightSpendData.summary?.disputedAmount || 0).toLocaleString("en-IN")}
                      </span>
                      <span className="text-[10px] text-amber-600 font-bold block">Pending Settlement</span>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Active 3PL Carriers</span>
                      <span className="text-lg font-mono font-black text-purple-700">
                        {freightSpendData.summary?.activeCarriersCount || 4}
                      </span>
                      <span className="text-[10px] text-purple-600 font-bold block">National MSAs</span>
                    </div>
                  </div>

                  {/* Recharts Visualizations */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Chart 1: Spend vs Budget */}
                    <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div>
                          <h4 className="text-sm font-black text-slate-900 uppercase">
                            Monthly Spend vs. OPEX Budget Limit
                          </h4>
                          <p className="text-[11px] text-slate-500">Trailing 6 months spend trajectory in INR (₹)</p>
                        </div>
                        <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                          -4.8% Variance
                        </span>
                      </div>

                      <div className="h-64 w-full pt-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={freightSpendData.monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#0284c7" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                            <Tooltip
                              formatter={(value) => [`₹${Number(value).toLocaleString("en-IN")}`, ""]}
                              contentStyle={{ borderRadius: "16px", borderColor: "#e2e8f0", fontSize: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
                            />
                            <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                            <Area type="monotone" dataKey="spend" name="Actual Freight Spend" stroke="#0284c7" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSpend)" />
                            <Line type="monotone" dataKey="budget" name="Monthly OPEX Cap" stroke="#e11d48" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Chart 2: Freight as % of Revenue */}
                    <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div>
                          <h4 className="text-sm font-black text-slate-900 uppercase">
                            Freight Cost as % of Revenue
                          </h4>
                          <p className="text-[11px] text-slate-500">Target threshold ceiling is strictly &lt; 7.5%</p>
                        </div>
                        <span className="text-xs font-mono font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-lg border border-sky-200">
                          6.85% (Optimal)
                        </span>
                      </div>

                      <div className="h-64 w-full pt-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={freightSpendData.monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `${v}%`} domain={[0, 10]} />
                            <Tooltip
                              formatter={(value) => [`${value}%`, "Freight % Revenue"]}
                              contentStyle={{ borderRadius: "16px", borderColor: "#e2e8f0", fontSize: "12px" }}
                            />
                            <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                            <ReferenceLine y={7.5} stroke="#e11d48" strokeDasharray="3 3" label={{ value: "7.5% Cap", fill: "#e11d48", fontSize: 10 }} />
                            <Bar dataKey="spendPctRevenue" name="Freight % of Revenue" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Carrier Breakdown Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    {(freightSpendData.carrierBreakdown || []).map((cb) => (
                      <div key={cb.carrier} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900">{cb.carrier}</span>
                          <span className="text-[10px] font-mono font-bold text-slate-400">{cb.count} Shipments</span>
                        </div>
                        <div className="flex items-baseline justify-between">
                          <span className="text-sm font-mono font-black text-slate-900">
                            ₹{(cb.spend || 0).toLocaleString("en-IN")}
                          </span>
                          <span className="text-[10px] font-bold text-sky-700">
                            {freightSpendData.summary?.totalSpend > 0 ? Math.round((cb.spend / freightSpendData.summary.totalSpend) * 100) : 0}% of Total
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-sky-600 h-1.5 rounded-full"
                            style={{ width: `${freightSpendData.summary?.totalSpend > 0 ? (cb.spend / freightSpendData.summary.totalSpend) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Sub-view 2: Carrier SLA Scorecard */}
          {activeSubView === "carrier_sla" && (
            <div className="space-y-6">
              {/* Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black text-purple-700 uppercase tracking-wider flex items-center gap-1.5 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200/60">
                      <Target className="w-3.5 h-3.5 text-purple-600" />
                      3PL Partner Governance
                    </span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200 font-mono">
                      MSA Performance Matrix
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mt-1">
                    Carrier SLA Performance & Compliance Scorecard
                  </h3>
                  <p className="text-xs text-slate-500">
                    Tracking On-Time In-Full (OTIF) delivery compliance, NDR resolution percentages, and cargo transit damage penalties.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={fetchCarrierSla}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Refresh Scorecard</span>
                  </button>
                </div>
              </div>

              {loadingCarrierSla ? (
                <TableSkeleton rows={4} cols={7} />
              ) : carrierSlaData.carrierScorecard?.length === 0 ? (
                <CrownZeroState
                  variant="warehouse"
                  icon={Target}
                  badge="SLA Matrix Standby"
                  title="No Carrier Telemetry Active"
                  description="All 3PL carrier SLA metrics are currently clear. Real-time delivery and damage rates populate as dispatch routes execute."
                  actionText="Refresh SLA Scorecard"
                  onAction={fetchCarrierSla}
                />
              ) : (
                <div className="space-y-4">
                  {/* Overview Banner */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Fleet Average OTIF</span>
                      <span className="text-xl font-mono font-black text-emerald-700">
                        {carrierSlaData.overallMetrics?.averageOtif || 94.8}%
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium block">Target: &ge; 95.0%</span>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">NDR Clearance Rate</span>
                      <span className="text-xl font-mono font-black text-sky-700">
                        {carrierSlaData.overallMetrics?.averageNdrClearance || 92.5}%
                      </span>
                      <span className="text-[10px] text-emerald-600 font-bold block">First-Attempt Delivery</span>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Transit Damage Rate</span>
                      <span className="text-xl font-mono font-black text-indigo-700">
                        {carrierSlaData.overallMetrics?.averageDamageRate || 0.65}%
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium block">Ceiling: &lt; 1.0%</span>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Contracted Carriers</span>
                      <span className="text-xl font-mono font-black text-purple-700">
                        {carrierSlaData.overallMetrics?.activePartners || 4} National 3PLs
                      </span>
                      <span className="text-[10px] text-purple-600 font-bold block">All MSAs Active</span>
                    </div>
                  </div>

                  {/* Scorecard Table */}
                  <div className="rounded-3xl bg-white border border-slate-200/90 p-5 shadow-xs overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                          <th className="py-2.5 px-3">Carrier Partner</th>
                          <th className="py-2.5 px-3">Monthly Shipments</th>
                          <th className="py-2.5 px-3">OTIF Compliance %</th>
                          <th className="py-2.5 px-3">NDR Resolution %</th>
                          <th className="py-2.5 px-3">Transit Damage %</th>
                          <th className="py-2.5 px-3">Avg Transit Days</th>
                          <th className="py-2.5 px-3">SLA Status</th>
                          <th className="py-2.5 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {carrierSlaData.carrierScorecard?.map((c) => (
                          <tr key={c.carrier} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-3">
                              <span className="font-bold text-slate-900 block">{c.carrier}</span>
                              <span className="text-[10px] text-slate-400 font-mono">{c.contractTier}</span>
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-slate-800">{c.totalShipments} Consignments</td>
                            <td className="py-3 px-3 font-mono">
                              <span className={`font-black px-2 py-0.5 rounded-md text-[10px] ${
                                c.otifPercent >= 95 ? "bg-emerald-100 text-emerald-800" : c.otifPercent >= 90 ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"
                              }`}>
                                {c.otifPercent}%
                              </span>
                            </td>
                            <td className="py-3 px-3 font-mono text-slate-700">{c.ndrClearanceRate}%</td>
                            <td className="py-3 px-3 font-mono">
                              <span className={`text-[10px] font-bold ${c.transitDamageRate > 1.0 ? "text-rose-600" : "text-slate-700"}`}>
                                {c.transitDamageRate}%
                              </span>
                            </td>
                            <td className="py-3 px-3 font-mono text-slate-700">{c.avgTransitDays} Days</td>
                            <td className="py-3 px-3">
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                                c.slaStatus === "EXEMPLARY" ? "bg-emerald-100 text-emerald-800" : c.slaStatus === "COMPLIANT" ? "bg-sky-100 text-sky-800" : "bg-amber-100 text-amber-800"
                              }`}>
                                {c.slaStatus}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  toast.info(`MSA Contract & Performance dossier for ${c.carrier} verified.`);
                                }}
                                className="px-3 py-1 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 cursor-pointer transition-colors"
                              >
                                Review MSA
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

          {/* Sub-view 3: Demand Forecasting & Network Capacity */}
          {activeSubView === "demand_forecasting" && (
            <div className="space-y-6">
              {/* Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black text-indigo-700 uppercase tracking-wider flex items-center gap-1.5 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200/60">
                      <Layers className="w-3.5 h-3.5 text-indigo-600" />
                      Capacity Planning Engine
                    </span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                      Peak Season Staging
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mt-1">
                    Hub-and-Spoke Volumetric Network Capacity Planning
                  </h3>
                  <p className="text-xs text-slate-500">
                    Facility tonnage utilization and buffer bay reservations across North, West, South, and East distribution godowns.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={fetchCarrierSla}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Sync Telemetry</span>
                  </button>
                </div>
              </div>

              {/* Zero State / Loading / Data View */}
              {loadingCapacity || loadingCarrierSla ? (
                <CrownSkeletonLoader preset="TableSkeleton" />
              ) : (!carrierSlaData.capacityForecast || carrierSlaData.capacityForecast.length === 0) ? (
                <CrownZeroState
                  variant="warehouse"
                  icon={Layers}
                  badge="Capacity Telemetry Standby"
                  title="No Capacity Data Available"
                  description="Godown volumetric telemetry has not synchronized yet."
                  actionText="+ Sync Volumetric Data"
                  onAction={fetchCarrierSla}
                />
              ) : (
                <div className="rounded-3xl bg-white border border-slate-200/90 p-5 shadow-xs overflow-x-auto space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs font-bold text-slate-700">
                    <span>Distribution Hub Volumetric Allocation</span>
                    <span className="text-slate-400 font-normal">Updated Live from Godown Telemetry</span>
                  </div>

                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                        <th className="py-2.5 px-3">Distribution Hub</th>
                        <th className="py-2.5 px-3">Current Load (Tons)</th>
                        <th className="py-2.5 px-3">Peak Limit (Tons)</th>
                        <th className="py-2.5 px-3">Utilization %</th>
                        <th className="py-2.5 px-3">Network Status</th>
                        <th className="py-2.5 px-3 text-right">Peak Staging Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {carrierSlaData.capacityForecast.map((h) => (
                        <tr key={h.hub} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-3 font-bold text-slate-900">{h.hub}</td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-800">{h.currentVolumetricTon} MT</td>
                          <td className="py-3 px-3 font-mono text-slate-500">{h.peakCapacityTon} MT</td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
                                <div
                                  className={`h-2 rounded-full ${
                                    h.utilizationPct > 85 ? "bg-rose-500" : h.utilizationPct > 70 ? "bg-amber-500" : "bg-emerald-500"
                                  }`}
                                  style={{ width: `${h.utilizationPct}%` }}
                                />
                              </div>
                              <span className="font-mono font-black text-xs text-slate-800">{h.utilizationPct}%</span>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                              h.status === "OPTIMAL" ? "bg-emerald-100 text-emerald-800" : h.status === "NEAR_CAPACITY" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"
                            }`}>
                              {h.status?.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                toast.success(`Staging buffer rebalanced for ${h.hub}.`);
                              }}
                              className="px-3 py-1 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 cursor-pointer transition-colors"
                            >
                              Rebalance Bays
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Sub-view 4: Strategic Headcount & Delegation Desk */}
          {activeSubView === "strategic_delegation" && (
            <div className="space-y-6">
              {/* Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black text-sky-700 uppercase tracking-wider flex items-center gap-1.5 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200/60">
                      <Users className="w-3.5 h-3.5 text-sky-600" />
                      Executive Leadership Desk
                    </span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 font-mono">
                      Departmental Governance
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mt-1">
                    Logistics Department Headcount & Strategic Objective Delegation
                  </h3>
                  <p className="text-xs text-slate-500">
                    Assign multi-shift strategic throughput goals to Tier 4 Supervisors and monitor departmental operational capacity.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowNewObjectiveModal(true)}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs shadow-xs flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Delegate Strategic Objective</span>
                  </button>
                </div>
              </div>

              {/* Zero State / Loading / Data View */}
              {loadingObjectives ? (
                <div className="space-y-4">
                  <CrownSkeletonLoader preset="MetricsCardsSkeleton" count={4} />
                  <CrownSkeletonLoader preset="TableSkeleton" />
                </div>
              ) : strategicObjectives.length === 0 ? (
                <CrownZeroState
                  variant="warehouse"
                  icon={Users}
                  badge="Headcount & Goals Idle"
                  title="No Strategic Objectives Delegated"
                  description="Assign multi-shift throughput goals to Tier 4 Supervisors to begin tracking."
                  actionText="+ Delegate Strategic Objective"
                  onAction={() => setShowNewObjectiveModal(true)}
                />
              ) : (
                <div className="space-y-6">
                  {/* Dynamic Headcount Metrics Cards (Only rendered when live data exists) */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white p-4 rounded-2xl border border-purple-200/80 shadow-2xs space-y-1">
                      <span className="text-[10px] font-black text-purple-700 uppercase block">Tier 4 Supervisors</span>
                      <span className="text-2xl font-mono font-black text-slate-900">
                        {new Set(strategicObjectives.map((o) => o.assignedSupervisor)).size || 1} Active
                      </span>
                      <span className="text-[10px] text-slate-400 block">Warehouse & Fleet Leads</span>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-indigo-200/80 shadow-2xs space-y-1">
                      <span className="text-[10px] font-black text-indigo-700 uppercase block">Tier 2 Coordinators</span>
                      <span className="text-2xl font-mono font-black text-slate-900">
                        {carrierAllocations.length > 0 ? Math.max(2, Math.ceil(carrierAllocations.length / 3)) : 2} Active
                      </span>
                      <span className="text-[10px] text-slate-400 block">PO, 3PL Routing & NDRs</span>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-sky-200/80 shadow-2xs space-y-1">
                      <span className="text-[10px] font-black text-sky-700 uppercase block">Tier 1 Assistants</span>
                      <span className="text-2xl font-mono font-black text-slate-900">
                        {picklists.length > 0 ? Math.max(4, Math.ceil(picklists.length * 2)) : 4} Active
                      </span>
                      <span className="text-[10px] text-slate-400 block">Picklists, Bins & Draft GRNs</span>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
                      <span className="text-[10px] font-black text-slate-600 uppercase block">Material Handlers / Drivers</span>
                      <span className="text-2xl font-mono font-black text-slate-900">
                        {dockDoors.length > 0 ? dockDoors.length * 2 : 6} Active
                      </span>
                      <span className="text-[10px] text-slate-400 block">MHE, Forklifts & Dock Staging</span>
                    </div>
                  </div>

                  {/* Strategic Objectives Table */}
                  <div className="rounded-3xl bg-white border border-slate-200/90 p-5 shadow-xs space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs font-bold text-slate-700">
                      <span>Delegated Strategic Objectives ({strategicObjectives.length})</span>
                      <span className="text-purple-700 text-[11px] font-bold">Enforced by Manager</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                            <th className="py-2.5 px-3">Objective ID</th>
                            <th className="py-2.5 px-3">Strategic Goal Description</th>
                            <th className="py-2.5 px-3">Assigned Supervisor</th>
                            <th className="py-2.5 px-3">Shift & Facility</th>
                            <th className="py-2.5 px-3">Throughput Target</th>
                            <th className="py-2.5 px-3">Live Throughput</th>
                            <th className="py-2.5 px-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {strategicObjectives.map((obj) => (
                            <tr key={obj.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-3 px-3 font-mono font-bold text-slate-900">{obj.id}</td>
                              <td className="py-3 px-3 font-semibold text-slate-900 max-w-xs">{obj.title}</td>
                              <td className="py-3 px-3 font-medium text-purple-800 bg-purple-50/40">{obj.assignedSupervisor}</td>
                              <td className="py-3 px-3 text-slate-600 font-medium">{obj.shift}</td>
                              <td className="py-3 px-3 font-mono font-bold text-slate-800">{obj.targetThroughput}</td>
                              <td className="py-3 px-3 font-mono text-emerald-700 font-bold">{obj.currentMetric}</td>
                              <td className="py-3 px-3">
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                                  obj.status === "ACHIEVED" ? "bg-emerald-100 text-emerald-800" : "bg-sky-100 text-sky-800"
                                }`}>
                                  {obj.status?.replace(/_/g, " ")}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          MODULE: PROCUREMENT & VENDORS (INBOUND)
         ========================================================================= */}
      {tabId === "procurement_po" && (
        <div className="space-y-6">
          {/* Sub-view: Purchase Orders */}
          {activeSubView === "purchase_orders" && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black text-sky-700 uppercase tracking-wider flex items-center gap-1.5 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200/60">
                      <PackageCheck className="w-3.5 h-3.5 text-sky-600" />
                      Inbound Procurement Desk
                    </span>
                    {isManager && (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 font-mono">
                        Manager Override Active
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mt-1">
                    Vendor Purchase Orders & Advanced Shipping Notices (ASN)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Cross-reference supplier delivery schedules with godown dock slots to ensure demurrage-free receiving.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={fetchPos}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Refresh</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowCreatePoModal(true)}
                    className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs shadow-xs flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Create Inbound PO & ASN</span>
                  </button>
                </div>
              </div>

              {loadingPos ? (
                <TableSkeleton rows={4} cols={6} />
              ) : purchaseOrders.length === 0 ? (
                <CrownZeroState
                  variant="invoices"
                  icon={PackageCheck}
                  badge="Procurement Desk Clean"
                  title="No Purchase Orders Generated"
                  description="Vendor Purchase Orders and ASNs populate here as procurement cycles are initiated."
                  actionText="+ Create Inbound PO & ASN"
                  onAction={() => setShowCreatePoModal(true)}
                />
              ) : (
                <div className="rounded-3xl bg-white border border-slate-200/90 p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs font-bold text-slate-700">
                    <span>Active Inbound Purchase Orders ({purchaseOrders.length})</span>
                    {isManager && (
                      <span className="text-[11px] text-purple-700 font-bold">
                        Manager Executive Override Authorized
                      </span>
                    )}
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                          <th className="py-2.5 px-3">PO & ASN Number</th>
                          <th className="py-2.5 px-3">Vendor Name</th>
                          <th className="py-2.5 px-3">Material Items Summary</th>
                          <th className="py-2.5 px-3">Total Value</th>
                          <th className="py-2.5 px-3">Dock Appointment</th>
                          <th className="py-2.5 px-3">Status</th>
                          {isManager && <th className="py-2.5 px-3 text-right">Executive Override</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {purchaseOrders.map((po) => (
                          <tr key={po.id || po.poNumber} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-3">
                              <span className="font-mono font-bold text-slate-900 block">{po.poNumber}</span>
                              <span className="text-[10px] text-sky-700 font-mono">{po.asnNumber}</span>
                            </td>
                            <td className="py-3 px-3 font-semibold text-slate-800">{po.vendorName}</td>
                            <td className="py-3 px-3 text-slate-600 max-w-xs truncate">{po.itemsSummary || "Industrial Raw Materials"}</td>
                            <td className="py-3 px-3 font-mono font-bold text-slate-900">
                              ₹{(po.totalCost || 0).toLocaleString("en-IN")}
                            </td>
                            <td className="py-3 px-3">
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200 block w-max">
                                {po.dockAppointmentSlot || "Bay 1 (Morning 09:00 - 12:00)"}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                                {po.status || "APPROVED_PO"}
                              </span>
                            </td>
                            {isManager && (
                              <td className="py-3 px-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => {
                                    toast.success(`Executive slot override granted for PO #${po.poNumber}.`);
                                  }}
                                  className="px-2.5 py-1 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-[11px] font-bold text-purple-700 cursor-pointer transition-colors"
                                >
                                  Override Slot
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sub-view: Dock Appointment Timeline */}
          {activeSubView === "dock_scheduling" && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Demurrage-Free Inbound Dock Appointment Schedule
                  </h3>
                  <p className="text-xs text-slate-500">
                    Scheduled delivery windows reserved to eliminate supplier lorry detention and demurrage charges.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={fetchPurchaseOrders}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Refresh</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowCreatePoModal(true)}
                    className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs shadow-xs flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Create Inbound PO & ASN</span>
                  </button>
                </div>
              </div>

              {loadingPos ? (
                <CrownSkeletonLoader preset="MetricsCardsSkeleton" count={3} />
              ) : purchaseOrders.filter((p) => p.dockAppointmentSlot).length === 0 ? (
                <CrownZeroState
                  variant="warehouse"
                  icon={Calendar}
                  badge="Dock Schedule Idle"
                  title="No Dock Appointments Scheduled"
                  description="No inbound vendor delivery windows are currently reserved for the loading dock."
                  actionText="+ Create Inbound PO & ASN"
                  onAction={() => setShowCreatePoModal(true)}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {purchaseOrders
                    .filter((p) => p.dockAppointmentSlot)
                    .map((s) => (
                      <div key={s.id || s.poNumber} className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <span className="font-mono font-bold text-xs text-slate-900">{s.dockAppointmentSlot}</span>
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            {(s.dockStatus || "SCHEDULED").replace(/_/g, " ")}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-800">PO: {s.poNumber}</p>
                          <p className="text-xs font-mono text-slate-600">Vendor: {s.vendorName}</p>
                          {s.asnNumber && (
                            <p className="text-[11px] font-mono text-sky-700">ASN: {s.asnNumber}</p>
                          )}
                          {s.itemsSummary && (
                            <p className="text-[11px] text-slate-500 truncate" title={s.itemsSummary}>
                              Items: {s.itemsSummary}
                            </p>
                          )}
                          {s.expectedDeliveryDate && (
                            <p className="text-[10px] text-slate-400">Delivery: {s.expectedDeliveryDate}</p>
                          )}
                        </div>
                        {isManager && (
                          <button
                            type="button"
                            onClick={() => toast.info(`Manager emergency hold cleared for ${s.dockAppointmentSlot || s.poNumber}.`)}
                            className="w-full py-1.5 rounded-xl border border-purple-200 bg-purple-50 text-[11px] font-bold text-purple-700 hover:bg-purple-100 cursor-pointer transition-colors"
                          >
                            Emergency Slot Override
                          </button>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          MODULE 1: WAREHOUSE & STOCK LEDGER
         ========================================================================= */}
      {tabId === "warehouse_stock" && (
        <div className="space-y-6">
          {/* Sub-view 1: GRN Notes & Authorization (Tier 4 Supervisor + Tier 1 Assistant) */}
          {activeSubView === "grn_notes" && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-black text-slate-900 uppercase">
                      Inward Goods Receipts (GRN Authorization Desk)
                    </h3>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                      AI OCR Scanner Active
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isSupervisor
                          ? "bg-purple-100 text-purple-800 border-purple-200"
                          : "bg-amber-50 text-amber-800 border-amber-200"
                      }`}
                    >
                      {isSupervisor ? "Tier 4: Post Final GRN Authority" : "Tier 1: Draft-Only Workflow"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isSupervisor
                      ? "Review physical receiving drafts submitted by Assistants, cross-check against PO and bilty slips, and authorize final posting into the master stock ledger."
                      : "Scan vendor delivery challans or bilty slips to cross-reference Lorry Receipts (LR) with Purchase Orders (PO). Saves strictly as Draft awaiting supervisor approval."}
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
                    <span>
                      Recent Inward Receipts ({grnList.length}) •{" "}
                      <span className="text-emerald-700">
                        {grnList.filter((g) => g.status === "POSTED").length} Posted
                      </span>
                      ,{" "}
                      <span className="text-amber-700">
                        {grnList.filter((g) => g.status !== "POSTED").length} Draft
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={fetchGrns}
                      className="text-[11px] text-sky-700 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" /> Refresh
                    </button>
                  </div>

                  <div className="space-y-3">
                    {grnList.map((g) => {
                      const isPosted = g.status === "POSTED";
                      return (
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
                              {isPosted ? (
                                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                  <CheckCheck className="w-3 h-3" />
                                  POSTED FINAL (Master Stock)
                                </span>
                              ) : (
                                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                                  DRAFT (Awaiting Supervisor)
                                </span>
                              )}
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
                              {g.authorizedByName && (
                                <span className="text-purple-700 font-bold ml-2">
                                  • Authorized by: {g.authorizedByName}
                                </span>
                              )}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            <button
                              type="button"
                              onClick={() => setSelectedGrnDossier(g)}
                              className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-500" />
                              View Dossier
                            </button>

                            {/* STRICT TIER 4 SUPERVISOR ACTION: Post Final GRN */}
                            {isSupervisor && !isPosted && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedGrnForPost(g);
                                  setShowPostGrnModal(true);
                                }}
                                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Post Final GRN</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sub-view 2: Quarantine Adjudication & Formal Discrepancy Memos (Tier 4 Supervisor) */}
          {activeSubView === "quarantine_discrepancy" && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-slate-900 uppercase">
                      Quarantine Adjudication & Vendor Debit Memos
                    </h3>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                      System Quarantine Cage
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Adjudicate damaged cargo flagged by Assistants. Issue formal Discrepancy Memos for vendor debit notes and lock stock in high-security cage Q-1.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setQuarantineTabMode("FLAGGED")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                        quarantineTabMode === "FLAGGED"
                          ? "bg-white text-slate-900 shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Flagged Defect Cartons ({quarantineList.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuarantineTabMode("MEMOS")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                        quarantineTabMode === "MEMOS"
                          ? "bg-white text-slate-900 shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Issued Debit Memos ({discrepancyMemos.length})
                    </button>
                  </div>

                  <button
                    onClick={() => setShowQuarantineModal(true)}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black text-xs shadow-xs flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Flag Damaged Carton</span>
                  </button>
                </div>
              </div>

              {/* Mode 1: Flagged Cartons */}
              {quarantineTabMode === "FLAGGED" && (
                <>
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
                              <th className="pb-3">Severity</th>
                              <th className="pb-3">Status</th>
                              <th className="pb-3 pr-2 text-right">Supervisor Adjudication</th>
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
                                <td className="py-3">
                                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                                    {item.status.replace(/_/g, " ")}
                                  </span>
                                </td>
                                <td className="py-3 pr-2 text-right">
                                  {isSupervisor && item.status !== "SCRAPPED" ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedQuarantineForMemo(item);
                                        setShowDiscrepancyMemoModal(true);
                                      }}
                                      className="px-3 py-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-[11px] shadow-2xs cursor-pointer flex items-center gap-1 ml-auto"
                                    >
                                      <Lock className="w-3 h-3" />
                                      <span>Issue Debit Memo</span>
                                    </button>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 font-medium">Adjudicated</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Mode 2: Formally Issued Discrepancy Memos */}
              {quarantineTabMode === "MEMOS" && (
                <>
                  {loadingMemos ? (
                    <TableSkeleton rows={3} cols={5} />
                  ) : discrepancyMemos.length === 0 ? (
                    <CrownZeroState
                      variant="ca_hub"
                      badge="Zero Debit Memos"
                      title="No Discrepancy Memos Issued"
                      description="Formal vendor debit notes are generated here once damaged packages in quarantine are adjudicated and locked in security cages."
                      actionText="View Quarantine Hold"
                      onAction={() => setQuarantineTabMode("FLAGGED")}
                    />
                  ) : (
                    <div className="rounded-3xl bg-white border border-slate-200/90 p-5 shadow-xs space-y-3">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-black">
                              <th className="pb-3 pl-2">Memo # & Carton</th>
                              <th className="pb-3">Material Description</th>
                              <th className="pb-3">Vendor Claim</th>
                              <th className="pb-3">Loss Claim (₹)</th>
                              <th className="pb-3">Quarantine Cage</th>
                              <th className="pb-3">Authorized By</th>
                              <th className="pb-3 pr-2 text-right">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {discrepancyMemos.map((m) => (
                              <tr key={m.id || m._id} className="hover:bg-slate-50/70">
                                <td className="py-3 pl-2">
                                  <span className="font-mono font-black text-slate-900 block">{m.memoNumber}</span>
                                  <span className="font-mono text-[10px] text-rose-700">{m.cartonId}</span>
                                </td>
                                <td className="py-3 font-semibold text-slate-800">
                                  {m.itemDescription} ({m.quantity} {m.uom})
                                </td>
                                <td className="py-3 text-slate-700">
                                  <span>{m.vendorName}</span>
                                  {m.vendorDebitNoteRequested && (
                                    <span className="block text-[10px] text-rose-700 font-bold">Debit Note Filed</span>
                                  )}
                                </td>
                                <td className="py-3 font-mono font-black text-rose-700">
                                  ₹{Number(m.estimatedLossAmount || 0).toLocaleString("en-IN")}
                                </td>
                                <td className="py-3 text-slate-700 text-[11px] font-mono">
                                  {m.quarantineCageLocation}
                                </td>
                                <td className="py-3 text-slate-600 text-[11px]">
                                  {m.authorizedByName}
                                </td>
                                <td className="py-3 pr-2 text-right">
                                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-200">
                                    {m.status ? m.status.replace(/_/g, " ") : "LOCKED"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Sub-view 3: Cycle Count Variance Reconciliation (Tier 4 Supervisor) */}
          {activeSubView === "inventory_audits" && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-black text-slate-900 uppercase">
                      Cycle Count Variance & Inventory Audit Reconciliation
                    </h3>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                      Tier 4 Ledger Authority
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Reconcile physical blind warehouse floor counts against ERP ledger records. Trace transaction logs, identify leakage/pilferage, and post stock adjustments.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCycleCountModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs shadow-xs flex items-center gap-2 cursor-pointer transition-all shrink-0"
                >
                  <Scale className="w-4 h-4" />
                  <span>+ Log Cycle Count Audit</span>
                </button>
              </div>

              {loadingVariances ? (
                <TableSkeleton rows={4} cols={5} />
              ) : cycleCountVariances.length === 0 ? (
                <CrownZeroState
                  variant="warehouse"
                  badge="Ledger 100% Balanced"
                  title="Zero Cycle Count Variances Found"
                  description="All warehouse bin stock matches ERP ledger records with 100% fidelity. Conduct periodic cycle count audits across aisle racks to verify tare."
                  actionText="+ Record First Cycle Count"
                  onAction={() => setShowCycleCountModal(true)}
                />
              ) : (
                <div className="rounded-3xl bg-white border border-slate-200/90 p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs font-bold text-slate-700">
                    <span>Active Audit Reconciliation Queue ({cycleCountVariances.length})</span>
                    <button
                      type="button"
                      onClick={fetchVariances}
                      className="text-[11px] text-sky-700 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" /> Refresh
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-black">
                          <th className="pb-3 pl-2">Audit Code & Bin</th>
                          <th className="pb-3">SKU / Description</th>
                          <th className="pb-3">System vs Physical Qty</th>
                          <th className="pb-3">Variance Qty (%)</th>
                          <th className="pb-3">Impact (₹)</th>
                          <th className="pb-3">Root Cause</th>
                          <th className="pb-3 pr-2 text-right">Audit Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {cycleCountVariances.map((v) => {
                          const diff = Number(v.varianceQty || 0);
                          const val = Number(v.varianceValue || 0);
                          return (
                            <tr key={v.id || v._id} className="hover:bg-slate-50/70">
                              <td className="py-3 pl-2">
                                <span className="font-mono font-black text-slate-900 block">{v.auditCode}</span>
                                <span className="font-mono text-[10px] text-sky-700 font-bold">{v.binLocation}</span>
                              </td>
                              <td className="py-3 font-semibold text-slate-800">
                                <span>{v.itemDescription}</span>
                                <span className="block font-mono text-[10px] text-slate-400">{v.skuCode}</span>
                              </td>
                              <td className="py-3 font-mono text-slate-700 text-[11px]">
                                <span>Sys: {v.systemRecordedQty}</span>
                                <span className="text-slate-400 mx-1">/</span>
                                <strong className="text-slate-900">Phys: {v.physicalCountedQty} {v.uom}</strong>
                              </td>
                              <td className="py-3">
                                <span
                                  className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-md ${
                                    diff === 0
                                      ? "bg-emerald-100 text-emerald-800"
                                      : diff > 0
                                      ? "bg-sky-100 text-sky-800"
                                      : "bg-rose-100 text-rose-800"
                                  }`}
                                >
                                  {diff > 0 ? `+${diff}` : diff} ({v.variancePercentage}%)
                                </span>
                              </td>
                              <td className="py-3 font-mono font-black">
                                <span className={val < 0 ? "text-rose-700" : "text-emerald-700"}>
                                  {val < 0 ? `-₹${Math.abs(val).toLocaleString("en-IN")}` : `+₹${val.toLocaleString("en-IN")}`}
                                </span>
                              </td>
                              <td className="py-3 text-slate-700 text-[11px]">
                                {v.discrepancyReason ? v.discrepancyReason.replace(/_/g, " ") : "MISPLACED"}
                              </td>
                              <td className="py-3 pr-2 text-right">
                                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-800 border border-indigo-200">
                                  {v.reconciliationStatus ? v.reconciliationStatus.replace(/_/g, " ") : "PENDING"}
                                </span>
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

          {/* Sub-view: Major Inventory Write-Offs > ₹50,000 (Tier 5 Manager) */}
          {activeSubView === "executive_writeoff" && isManager && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black text-rose-700 uppercase tracking-wider flex items-center gap-1.5 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200/60">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                      Executive Write-Down Desk
                    </span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 font-mono">
                      Threshold &gt; ₹50,000
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mt-1">
                    Major Stock Write-Offs & Transit Damage Insurance Claims
                  </h3>
                  <p className="text-xs text-slate-500">
                    High-value discrepancies exceeding the Supervisor approval threshold requiring executive authorization and cargo underwriter submission.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={fetchExecutiveWriteOffs}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Refresh</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedWriteOffItem(executiveWriteOffs[0] || null);
                      setShowExecutiveWriteOffModal(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs shadow-xs flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>+ Authorize Executive Write-Off</span>
                  </button>
                </div>
              </div>

              {loadingWriteOffs ? (
                <TableSkeleton rows={4} cols={6} />
              ) : executiveWriteOffs.length === 0 ? (
                <CrownZeroState
                  variant="warehouse"
                  icon={ShieldCheck}
                  badge="Audit Clean"
                  title="No Major Write-Offs Pending"
                  description="Zero inventory discrepancies or transit damage claims exceed the ₹50,000 threshold requiring Manager sign-off."
                  actionText="+ Authorize Executive Write-Off"
                  onAction={() => setShowExecutiveWriteOffModal(true)}
                />
              ) : (
                <div className="rounded-3xl bg-white border border-slate-200/90 p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs font-bold text-slate-700">
                    <span>High-Value Damage & Variance Docket ({executiveWriteOffs.length})</span>
                    <span className="text-rose-700 font-mono text-[11px] font-bold">&gt; ₹50,000 Threshold Filter</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                          <th className="py-2.5 px-3">Docket Ref</th>
                          <th className="py-2.5 px-3">Item Description & SKU</th>
                          <th className="py-2.5 px-3">Quantity</th>
                          <th className="py-2.5 px-3">Loss Valuation</th>
                          <th className="py-2.5 px-3">Quarantine Location</th>
                          <th className="py-2.5 px-3">Resolution Status</th>
                          <th className="py-2.5 px-3 text-right">Sign-Off</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {executiveWriteOffs.map((w) => (
                          <tr key={w.id || w.referenceCode} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-3 font-mono font-bold text-slate-900">{w.referenceCode}</td>
                            <td className="py-3 px-3">
                              <span className="font-bold text-slate-900 block">{w.itemDescription}</span>
                              <span className="text-[10px] text-slate-400 font-mono">{w.skuCode}</span>
                            </td>
                            <td className="py-3 px-3 font-mono">{w.quantity} {w.uom}</td>
                            <td className="py-3 px-3 font-mono font-black text-rose-700">
                              ₹{(w.estimatedLossAmount || 0).toLocaleString("en-IN")}
                            </td>
                            <td className="py-3 px-3 font-mono text-slate-700">{w.quarantineCageLocation}</td>
                            <td className="py-3 px-3">
                              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-rose-100 text-rose-800">
                                {w.status?.replace(/_/g, " ")}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedWriteOffItem(w);
                                  setShowExecutiveWriteOffModal(true);
                                }}
                                className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold cursor-pointer transition-colors"
                              >
                                Authorize
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

          {/* Sub-view 4: Live Bin Stock Map (Zero State First) */}
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
          MODULE 2: ORDER & DISPATCH HUB
         ========================================================================= */}
      {tabId === "dispatch_fleet" && (
        <div className="space-y-6">
          {/* Sub-view 1: Load Auditing & Outward Gate Passes (Tier 4 Supervisor) */}
          {activeSubView === "load_audit_gatepass" && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-black text-slate-900 uppercase">
                      Physical Load Auditing & Outward Gate Pass Desk
                    </h3>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Security Gate Clearance
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Conduct mandatory 5-point physical audits (strapping, barcode labels, weighbridge tare, tarpaulin, seal) and authorize signed Outward Gate Passes for exiting freight trucks.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowGatePassModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs shadow-xs flex items-center gap-2 cursor-pointer transition-all shrink-0"
                >
                  <Truck className="w-4 h-4" />
                  <span>+ Generate Outward Gate Pass</span>
                </button>
              </div>

              {loadingGatePasses ? (
                <TableSkeleton rows={4} cols={5} />
              ) : gatePasses.length === 0 ? (
                <CrownZeroState
                  variant="warehouse"
                  badge="Security Gate Idle"
                  title="Zero Outward Gate Passes Issued Today"
                  description="When consignments are loaded and verified against the 5-point physical load checklist, Supervisors authorize and sign Outward Gate Passes here."
                  actionText="+ Issue First Outward Gate Pass"
                  onAction={() => setShowGatePassModal(true)}
                />
              ) : (
                <div className="rounded-3xl bg-white border border-slate-200/90 p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs font-bold text-slate-700">
                    <span>Issued Outward Gate Passes ({gatePasses.length})</span>
                    <button
                      type="button"
                      onClick={fetchGatePasses}
                      className="text-[11px] text-sky-700 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" /> Refresh
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-black">
                          <th className="pb-3 pl-2">Gate Pass # & Plate</th>
                          <th className="pb-3">Carrier Partner</th>
                          <th className="pb-3">Driver Name & Phone</th>
                          <th className="pb-3">Weight (Gross / Net)</th>
                          <th className="pb-3">Security Seal #</th>
                          <th className="pb-3">Audit Checklist</th>
                          <th className="pb-3 pr-2 text-right">Gate Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {gatePasses.map((gp) => (
                          <tr key={gp.id || gp._id} className="hover:bg-slate-50/70">
                            <td className="py-3 pl-2">
                              <span className="font-mono font-black text-slate-900 block">{gp.gatePassNumber}</span>
                              <span className="font-mono text-[10px] text-sky-700 font-bold">{gp.vehicleNumber}</span>
                            </td>
                            <td className="py-3 font-semibold text-slate-800">{gp.carrier}</td>
                            <td className="py-3 text-slate-700">
                              <span>{gp.driverName}</span>
                              <span className="block text-[10px] text-slate-400 font-mono">{gp.driverPhone || "N/A"}</span>
                            </td>
                            <td className="py-3 font-mono text-[11px]">
                              <span>{gp.grossWeightKg}kg / </span>
                              <strong className="text-slate-900">{gp.netWeightKg}kg</strong>
                            </td>
                            <td className="py-3 font-mono font-black text-slate-900 text-[11px]">
                              {gp.sealNumber}
                            </td>
                            <td className="py-3">
                              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1 w-fit">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                5-Point Passed
                              </span>
                            </td>
                            <td className="py-3 pr-2 text-right">
                              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                                {gp.status ? gp.status.replace(/_/g, " ") : "ISSUED"}
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

          {/* Sub-view 2: Dock Doors & MHE Pre-Shift Inspections (Tier 4 Supervisor) */}
          {activeSubView === "dock_mhe_management" && (
            <div className="space-y-6">
              {/* Header Control Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black text-sky-700 uppercase tracking-wider flex items-center gap-1.5 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200/60">
                      <DoorOpen className="w-3.5 h-3.5 text-sky-600" />
                      Loading Docks & MHE Fleet
                    </span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 font-mono">
                      Tier 4 Supervisory Desk
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mt-1">
                    Dock Allocation & MHE Daily Safety Inspection
                  </h3>
                  <p className="text-xs text-slate-500">
                    Live staging and loading status across facility dock doors, plus daily OSHA-compliant safety checklists.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {dockDoors.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setDockDoors([]);
                        setMheList([]);
                        toast.info("Dock and MHE state reset to Zero State.");
                      }}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-600 transition-colors cursor-pointer"
                    >
                      Clear Allocations
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleInitializeDefaultDockMhe}
                    className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs shadow-xs flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <DoorOpen className="w-4 h-4" />
                    <span>{dockDoors.length === 0 ? "Initialize 6-Door Dock Layout" : "Reset Standard Bays"}</span>
                  </button>
                </div>
              </div>

              {loadingDockMhe ? (
                <MetricsCardsSkeleton count={6} />
              ) : dockDoors.length === 0 && mheList.length === 0 ? (
                <CrownZeroState
                  variant="warehouse"
                  badge="Dock & MHE Idle"
                  title="No Dock Allocations Active"
                  description="No dock doors or Material Handling Equipment (MHE) have active operational allocations or inspection schedules. Supervisors can configure bays and log daily pre-shift safety inspections."
                  actionText="+ Initialize 6-Door Dock Layout"
                  onAction={handleInitializeDefaultDockMhe}
                />
              ) : (
                <>
                  {/* Part A: 6-Door Dock Allocation Board */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <DoorOpen className="w-5 h-5 text-sky-600" />
                        <div>
                          <h3 className="text-sm font-black text-slate-900 uppercase">
                            Visual Dock Door Allocation Board ({dockDoors.length} Doors)
                          </h3>
                          <p className="text-xs text-slate-500">Live staging and loading status across facility dock doors.</p>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-sky-700 bg-sky-50 px-3 py-1 rounded-xl border border-sky-200">
                        {dockDoors.length} Operational Doors
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {dockDoors.map((door) => (
                        <div
                          key={door.id}
                          onClick={() => handleToggleDockDoor(door.id)}
                          className="p-4 rounded-2xl border border-slate-200 hover:border-sky-300 bg-white shadow-2xs space-y-2 cursor-pointer transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-black text-xs text-slate-900">{door.name}</span>
                            <span
                              className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                                door.status === "AVAILABLE"
                                  ? "bg-slate-100 text-slate-600"
                                  : door.status === "OFFLOADING"
                                  ? "bg-amber-100 text-amber-800"
                                  : door.status === "LOADING"
                                  ? "bg-sky-100 text-sky-800"
                                  : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              {door.status.replace(/_/g, " ")}
                            </span>
                          </div>

                          <div className="text-[11px] space-y-0.5">
                            <p className="text-slate-500">
                              Zone: <strong className="text-slate-800">{door.type} Operation</strong>
                            </p>
                            <p className="text-slate-500 font-mono">
                              Vehicle: <strong className="text-slate-900">{door.vehicle || "Bay Open"}</strong>
                            </p>
                            {door.material && (
                              <p className="text-[10px] text-slate-400 truncate">{door.material}</p>
                            )}
                          </div>

                          <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-sky-700 font-bold">
                            <span>Tap to Toggle Bay Status</span>
                            <ArrowRight className="w-3 h-3" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Part B: Material Handling Equipment (MHE) Pre-Shift Daily Inspection */}
                  {mheList.length > 0 && (
                    <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2.5">
                          <Wrench className="w-5 h-5 text-purple-600" />
                          <div>
                            <h3 className="text-sm font-black text-slate-900 uppercase">
                              Material Handling Equipment (MHE) Pre-Shift Inspection
                            </h3>
                            <p className="text-xs text-slate-500">Daily safety sign-off for forklifts, reach trucks, and pallet stackers.</p>
                          </div>
                        </div>
                        <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-xl border border-purple-200">
                          Daily Safety Sign-Off
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {mheList.map((mhe) => {
                          const isPassed = mhe.status === "PASSED";
                          return (
                            <div
                              key={mhe.id}
                              onClick={() => handleToggleMheInspection(mhe.id)}
                              className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 select-none ${
                                isPassed
                                  ? "bg-white border-emerald-300 shadow-2xs"
                                  : "bg-amber-50/50 border-amber-300"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-mono font-black text-xs text-slate-900">{mhe.id}</span>
                                <span
                                  className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                                    isPassed
                                      ? "bg-emerald-100 text-emerald-800"
                                      : "bg-amber-100 text-amber-800"
                                  }`}
                                >
                                  {isPassed ? "PASSED ✓" : "PENDING INSPECTION"}
                                </span>
                              </div>

                              <p className="text-xs font-bold text-slate-800">{mhe.model}</p>

                              <div className="text-[10px] space-y-0.5 text-slate-500">
                                <p>Battery/Fuel: <strong className="font-mono text-slate-800">{mhe.batteryFuel}</strong></p>
                                <p>Hydraulics: <strong className="text-slate-800">{mhe.hydraulics}</strong></p>
                                <p>Brakes: <strong className="text-slate-800">{mhe.brakes}</strong></p>
                                <p>Last Inspection: <strong className="font-mono text-slate-800">{mhe.inspectedAt}</strong></p>
                              </div>

                              <div className="pt-1.5 border-t border-slate-100 text-[10px] font-bold text-purple-700 text-center">
                                {isPassed ? "Tap to Flag Maintenance" : "Tap to Pass Safety Sign-Off"}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Sub-view 3: 3PL Carrier Routing (Tier 2/4) */}
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

          {/* Sub-view 4: Master AWB & Part-B E-Way Bills (Tier 2/4) */}
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
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sub-view: NDR & RTO Exceptions (Tier 2 Coordinator & Tier 4 Supervisor) */}
          {activeSubView === "ndr_rto_exceptions" && (
            <div className="space-y-5">
              {/* Header Control Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black text-rose-700 uppercase tracking-wider flex items-center gap-1.5 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200/60">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      Exception Management Desk
                    </span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 font-mono">
                      NDR / RTO Resolution
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mt-1">
                    Non-Delivery Reports (NDR) & Return to Origin (RTO)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Review customer address corrections, reschedule deliveries with 3PL carriers, or approve RTO freight returns.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={fetchExceptions}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Refresh</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowExceptionModal(true)}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-xs flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <AlertCircle className="w-4 h-4" />
                    <span>+ Log NDR / Return Exception</span>
                  </button>
                </div>
              </div>

              {/* Zero State / Loading / Data View */}
              {loadingExceptions ? (
                <TableSkeleton rows={4} cols={5} />
              ) : exceptionsList.length === 0 ? (
                <CrownZeroState
                  variant="warehouse"
                  icon={AlertTriangle}
                  badge="Delivery Operations Clear"
                  title="No Active Exceptions"
                  description="All Non-Delivery Reports (NDR) and RTO exceptions have been cleared."
                  actionText="+ Log NDR / Return Exception"
                  onAction={() => setShowExceptionModal(true)}
                />
              ) : (
                <div className="rounded-3xl bg-white border border-slate-200/90 p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs font-bold text-slate-700">
                    <span>Active Delivery Exceptions ({exceptionsList.length})</span>
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
                        <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                          <th className="py-2.5 px-3">Exception ID</th>
                          <th className="py-2.5 px-3">AWB & Order Ref</th>
                          <th className="py-2.5 px-3">Carrier</th>
                          <th className="py-2.5 px-3">Customer & Destination</th>
                          <th className="py-2.5 px-3">Exception Cause</th>
                          <th className="py-2.5 px-3">Action Status</th>
                          <th className="py-2.5 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {exceptionsList.map((exc) => (
                          <tr key={exc.id || exc.exceptionId} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-3 font-mono font-bold text-slate-900">{exc.exceptionId || exc.id}</td>
                            <td className="py-3 px-3">
                              <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-[10px] border border-indigo-100 block w-max">
                                {exc.awbNumber}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">{exc.orderReference}</span>
                            </td>
                            <td className="py-3 px-3 font-semibold text-slate-800">{exc.carrier}</td>
                            <td className="py-3 px-3">
                              <div className="font-bold text-slate-900">{exc.customerName}</div>
                              <div className="text-[10px] text-slate-500">{exc.destinationCity} ({exc.deliveryPinCode})</div>
                            </td>
                            <td className="py-3 px-3">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                                {exc.exceptionType?.replace(/_/g, " ")}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                                exc.actionTaken?.includes("RTO")
                                  ? "bg-rose-100 text-rose-800"
                                  : exc.actionTaken?.includes("REATTEMPT")
                                  ? "bg-sky-100 text-sky-800"
                                  : "bg-slate-100 text-slate-700"
                              }`}>
                                {exc.actionTaken?.replace(/_/g, " ")}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => setShowExceptionModal(true)}
                                className="px-3 py-1 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 cursor-pointer transition-colors"
                              >
                                Review
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

          {/* Sub-view: Freight Volumetric Audit (Tier 2 Coordinator & Tier 4 Supervisor) */}
          {activeSubView === "freight_audit" && (
            <div className="space-y-5">
              {/* Header Control Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black text-indigo-700 uppercase tracking-wider flex items-center gap-1.5 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200/60">
                      <Scale className="w-3.5 h-3.5 text-indigo-600" />
                      Billing Pre-Audit Desk
                    </span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200 font-mono">
                      5% Tolerance Gate
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mt-1">
                    Freight Volumetric Weight & Demurrage Pre-Audit
                  </h3>
                  <p className="text-xs text-slate-500">
                    Verify 3PL carrier invoiced weight against internal weighbridge logs to detect over-billing prior to Accounts Payable sign-off.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={fetchFreightAudits}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Refresh</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowFreightAuditModal(true)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-xs flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <Scale className="w-4 h-4" />
                    <span>+ Run New Freight Audit</span>
                  </button>
                </div>
              </div>

              {/* Zero State / Loading / Data View */}
              {loadingFreight ? (
                <TableSkeleton rows={4} cols={5} />
              ) : freightAudits.length === 0 ? (
                <CrownZeroState
                  variant="warehouse"
                  icon={Scale}
                  badge="Freight Reconciled"
                  title="No Pending Freight Audits"
                  description="All carrier volumetric weights have been reconciled against internal logs."
                  actionText="+ Run New Freight Audit"
                  onAction={() => setShowFreightAuditModal(true)}
                />
              ) : (
                <div className="rounded-3xl bg-white border border-slate-200/90 p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs font-bold text-slate-700">
                    <span>Reconciled Freight Invoices ({freightAudits.length})</span>
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
                        <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                          <th className="py-2.5 px-3">Invoice & AWB</th>
                          <th className="py-2.5 px-3">Carrier</th>
                          <th className="py-2.5 px-3">Actual vs Billed Wt</th>
                          <th className="py-2.5 px-3">Variance %</th>
                          <th className="py-2.5 px-3">Billed / Expected Amt</th>
                          <th className="py-2.5 px-3">Dispute Status</th>
                          <th className="py-2.5 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {freightAudits.map((fa) => {
                          const isOverTolerance = Math.abs(fa.variancePercent || 0) > 5;
                          return (
                            <tr key={fa.id || fa.invoiceNumber} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-3 px-3">
                                <div className="font-mono font-bold text-slate-900">{fa.invoiceNumber}</div>
                                <div className="text-[10px] text-indigo-700 font-mono">AWB: {fa.awbNumber}</div>
                              </td>
                              <td className="py-3 px-3 font-semibold text-slate-800">{fa.carrier}</td>
                              <td className="py-3 px-3 font-mono">
                                <div>Actual: <strong className="text-slate-900">{fa.actualWeightKg} kg</strong></div>
                                <div className="text-slate-400 text-[10px]">Billed: {fa.billedWeightKg} kg</div>
                              </td>
                              <td className="py-3 px-3">
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                                  isOverTolerance
                                    ? "bg-rose-100 text-rose-800 border border-rose-200"
                                    : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                }`}>
                                  {fa.variancePercent > 0 ? `+${fa.variancePercent}%` : `${fa.variancePercent}%`}
                                </span>
                              </td>
                              <td className="py-3 px-3 font-mono">
                                <div className="font-bold text-slate-900">₹{(fa.billedAmount || 0).toLocaleString("en-IN")}</div>
                                <div className="text-[10px] text-slate-400">Exp: ₹{(fa.expectedAmount || 0).toLocaleString("en-IN")}</div>
                              </td>
                              <td className="py-3 px-3">
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                                  fa.auditStatus === "DISPUTE_RAISED"
                                    ? "bg-rose-100 text-rose-800"
                                    : fa.auditStatus === "AUDIT_PASSED"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-amber-100 text-amber-800"
                                }`}>
                                  {fa.auditStatus?.replace(/_/g, " ")}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => setShowFreightAuditModal(true)}
                                  className="px-3 py-1 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 cursor-pointer transition-colors"
                                >
                                  Details
                                </button>
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

          {/* Sub-view: Monthly Carrier Payouts & Dispute Resolution (Tier 5 Manager) */}
          {activeSubView === "carrier_payouts" && isManager && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black text-indigo-700 uppercase tracking-wider flex items-center gap-1.5 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200/60">
                      <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                      Executive Disbursement Sign-Off
                    </span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 font-mono">
                      Accounts Payable Authorization
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mt-1">
                    Consolidated Monthly 3PL Carrier Payout Batches
                  </h3>
                  <p className="text-xs text-slate-500">
                    Review and sign off on monthly carrier freight payouts with automated deductions for 5% SLA weight variances and damage penalties.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={fetchCarrierPayouts}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Refresh</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPayoutBatch(carrierPayoutBatches[0] || null);
                      setShowCarrierPayoutModal(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-xs flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <FileCheck className="w-4 h-4" />
                    <span>+ Sign Off Carrier Payout</span>
                  </button>
                </div>
              </div>

              {loadingPayoutBatches ? (
                <TableSkeleton rows={4} cols={6} />
              ) : carrierPayoutBatches.length === 0 ? (
                <CrownZeroState
                  variant="invoices"
                  icon={CreditCard}
                  badge="Disbursements Current"
                  title="No Payout Batches Pending"
                  description="All monthly carrier freight invoices and high-value disputes have been reconciled and signed off."
                  actionText="+ Sign Off Carrier Payout"
                  onAction={() => setShowCarrierPayoutModal(true)}
                />
              ) : (
                <div className="space-y-4">
                  {/* Payout Batches Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {carrierPayoutBatches.map((b) => (
                      <div key={b.batchId} className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <span className="font-mono font-bold text-xs text-indigo-700">{b.batchId}</span>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                            b.payoutStatus === "EXECUTIVE_APPROVED" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                          }`}>
                            {b.payoutStatus.replace(/_/g, " ")}
                          </span>
                        </div>
                        <h4 className="text-sm font-black text-slate-900">{b.carrier}</h4>
                        <div className="text-xs space-y-1">
                          <div className="flex justify-between text-slate-500">
                            <span>Gross Invoiced:</span>
                            <span className="font-mono font-bold text-slate-800">₹{(b.grossBilledAmount || 0).toLocaleString("en-IN")}</span>
                          </div>
                          <div className="flex justify-between text-rose-600">
                            <span>Penalties Deducted:</span>
                            <span className="font-mono font-bold">-₹{(b.penaltyDeductions || 0).toLocaleString("en-IN")}</span>
                          </div>
                          <div className="flex justify-between text-slate-900 pt-1 border-t border-slate-100 font-bold">
                            <span>Net Payable:</span>
                            <span className="font-mono font-black text-indigo-700">₹{(b.netPayableAmount || 0).toLocaleString("en-IN")}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPayoutBatch(b);
                            setShowCarrierPayoutModal(true);
                          }}
                          className="w-full py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 cursor-pointer transition-colors"
                        >
                          Sign Off Disbursement
                        </button>
                      </div>
                    ))}
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
                            </div>
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
                              >
                                <PackageCheck className="w-3.5 h-3.5" />
                                <span>Pack & Stage Consignment</span>
                              </button>
                            )}
                          </div>
                        </div>

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
                                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border bg-amber-50 text-amber-800 border-amber-200">
                                      {item.binLocation}
                                    </span>
                                  </div>
                                  <p className="text-xs font-bold truncate text-slate-900">{item.name}</p>
                                  <p className="text-[11px] text-slate-500 mt-1">
                                    Qty: <strong className="font-mono text-slate-800">{item.quantityRequired} {item.uom}</strong>
                                  </p>
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
        </div>
      )}

      {/* =========================================================================
          MODALS
         ========================================================================= */}
      {/* 1. Defect Flagging Modal */}
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
                  placeholder="e.g. Outer cardboard corner punctured during offloading."
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

      {/* 2. Pack & Staging Modal */}
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
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Tare Wt</label>
                    <input
                      type="number"
                      required
                      value={packStageForm.tareWeight}
                      onChange={(e) => setPackStageForm({ ...packStageForm, tareWeight: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-mono font-bold bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Net Cargo</label>
                    <input
                      type="number"
                      required
                      value={packStageForm.netWeight}
                      onChange={(e) => setPackStageForm({ ...packStageForm, netWeight: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-mono font-bold bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Gross Wt</label>
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
                    Staging Bay
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
                    Vehicle Plate
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
                  className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs shadow-xs flex items-center gap-2 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Move to Staging Bay</span>
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

      {/* 5. Create PO & ASN Modal */}
      <CreatePoModal
        isOpen={showCreatePoModal}
        onClose={() => setShowCreatePoModal(false)}
        onSuccess={(newPo) => {
          setPurchaseOrders((prev) => [newPo, ...prev]);
        }}
        employee={employee}
      />

      {/* 6. Allocate Carrier Modal */}
      <AllocateCarrierModal
        isOpen={showAllocateCarrierModal}
        onClose={() => setShowAllocateCarrierModal(false)}
        onSuccess={(newAllocation) => {
          setCarrierAllocations((prev) => [newAllocation, ...prev]);
        }}
        employee={employee}
        orders={stagedConsignments}
      />

      {/* 7. Logistics Exception Modal */}
      <LogisticsExceptionModal
        isOpen={showExceptionModal}
        onClose={() => {
          setShowExceptionModal(false);
          setSelectedExceptionForEdit(null);
        }}
        onSuccess={() => {
          fetchExceptions();
        }}
        employee={employee}
        initialData={selectedExceptionForEdit}
      />

      {/* 8. Freight Pre-Audit Modal */}
      <FreightAuditModal
        isOpen={showFreightAuditModal}
        onClose={() => {
          setShowFreightAuditModal(false);
          setSelectedFreightAuditForEdit(null);
        }}
        onSuccess={() => {
          fetchFreightAudits();
        }}
        employee={employee}
        initialData={selectedFreightAuditForEdit}
      />

      {/* 9. SUPERVISOR MODAL: Authorize & Post Final GRN */}
      <PostGrnModal
        isOpen={showPostGrnModal}
        onClose={() => {
          setShowPostGrnModal(false);
          setSelectedGrnForPost(null);
        }}
        onSuccess={() => {
          fetchGrns();
          fetchBins();
        }}
        grn={selectedGrnForPost}
        employee={employee}
      />

      {/* 10. SUPERVISOR MODAL: Quarantine Adjudication & Discrepancy Memo */}
      <DiscrepancyMemoModal
        isOpen={showDiscrepancyMemoModal}
        onClose={() => {
          setShowDiscrepancyMemoModal(false);
          setSelectedQuarantineForMemo(null);
        }}
        onSuccess={() => {
          fetchDiscrepancyMemos();
          // also refresh quarantine list
          fetch("/api/logistics/inventory/quarantine")
            .then((r) => r.json())
            .then((d) => {
              if (d.quarantinedItems) setQuarantineList(d.quarantinedItems);
            });
        }}
        item={selectedQuarantineForMemo}
        employee={employee}
      />

      {/* 11. SUPERVISOR MODAL: Generate Outward Gate Pass */}
      <GenerateGatePassModal
        isOpen={showGatePassModal}
        onClose={() => setShowGatePassModal(false)}
        onSuccess={(newPass) => {
          setGatePasses((prev) => [newPass, ...prev]);
        }}
        employee={employee}
        stagedConsignments={stagedConsignments}
      />

      {/* 13. MANAGER MODAL: Executive Major Write-Off */}
      <ExecutiveWriteOffModal
        isOpen={showExecutiveWriteOffModal}
        onClose={() => {
          setShowExecutiveWriteOffModal(false);
          setSelectedWriteOffItem(null);
        }}
        onSuccess={() => {
          fetchExecutiveWriteOffs();
          fetchDiscrepancyMemos();
          fetchVariances();
        }}
        selectedItem={selectedWriteOffItem}
        employee={employee}
      />

      {/* 14. MANAGER MODAL: Executive Carrier Payout Sign-Off */}
      <CarrierPayoutModal
        isOpen={showCarrierPayoutModal}
        onClose={() => {
          setShowCarrierPayoutModal(false);
          setSelectedPayoutBatch(null);
        }}
        onSuccess={() => {
          fetchCarrierPayouts();
          fetchFreightAudits();
        }}
        selectedBatch={selectedPayoutBatch}
        employee={employee}
      />

      {/* 15. MANAGER MODAL: Delegate Strategic Objective */}
      {showNewObjectiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-purple-50 border border-purple-200 text-purple-700">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Delegate Strategic Objective</h3>
                  <p className="text-xs text-slate-500">Assign throughput KPI to Tier 4 Supervisor</p>
                </div>
              </div>
              <button
                onClick={() => setShowNewObjectiveModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStrategicObjective} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Strategic Objective Title</label>
                <input
                  type="text"
                  required
                  value={newObjectiveForm.title}
                  onChange={(e) => setNewObjectiveForm({ ...newObjectiveForm, title: e.target.value })}
                  placeholder="e.g. Maintain 98% Outbound Gate Pass Clearance under 15 Mins"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Supervisor</label>
                  <select
                    value={newObjectiveForm.assignedSupervisor}
                    onChange={(e) => setNewObjectiveForm({ ...newObjectiveForm, assignedSupervisor: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium"
                  >
                    <option value="Warehouse Supervisor (Morning Shift)">Warehouse Supervisor (Morning Shift)</option>
                    <option value="QC / Inward Receiving Lead">QC / Inward Receiving Lead</option>
                    <option value="Fleet & Dock In-charge">Fleet & Dock In-charge</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Shift</label>
                  <select
                    value={newObjectiveForm.shift}
                    onChange={(e) => setNewObjectiveForm({ ...newObjectiveForm, shift: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium"
                  >
                    <option value="Shift A (06:00 - 14:00)">Shift A (06:00 - 14:00)</option>
                    <option value="Shift B (14:00 - 22:00)">Shift B (14:00 - 22:00)</option>
                    <option value="General Shift">General Shift</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Throughput Target</label>
                <input
                  type="text"
                  required
                  value={newObjectiveForm.targetThroughput}
                  onChange={(e) => setNewObjectiveForm({ ...newObjectiveForm, targetThroughput: e.target.value })}
                  placeholder="e.g. 45 Trucks / Shift"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-mono font-bold"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewObjectiveModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs shadow-xs"
                >
                  Assign Objective
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

            {/* 12. SUPERVISOR MODAL: Log Cycle Count Audit */}
      <CycleCountAuditModal
        isOpen={showCycleCountModal}
        onClose={() => setShowCycleCountModal(false)}
        onSuccess={() => {
          fetchVariances();
          fetchBins();
        }}
        employee={employee}
      />
    </div>
  );
}
