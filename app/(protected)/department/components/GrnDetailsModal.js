"use client";
import React, { useState } from "react";
import {
  X,
  Printer,
  FileCheck2,
  Building2,
  Truck,
  Calendar,
  Layers,
  Thermometer,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Boxes,
} from "lucide-react";

export default function GrnDetailsModal({
  isOpen,
  onClose,
  grn,
  company,
}) {
  const [activeTab, setActiveTab] = useState("items"); // items | metadata | vendor | logistics | financials | markers

  if (!isOpen || !grn) return null;

  const ocr = grn.ocrData || {};
  const meta = ocr.documentMetadata || {
    documentType: "Goods Receipt Note (GRN)",
    documentNumber: grn.id,
    documentDate: grn.date || "2026-10-28",
    deliveryDate: grn.date || "2026-10-28",
    referencePoNumber: grn.poRef || "PO-DIRECT",
    rmaNumber: "N/A",
  };
  const vendor = ocr.vendorInfo || {
    supplierName: grn.vendorName,
    supplierTaxId: "27AAACT2727Q1ZB",
    originAddress: "Vendor Industrial Dispatch Facility",
    destinationWarehouseId: grn.dockNumber || "Dock 1",
    buyerName: company?.name || "Crownops Enterprise Corp",
    buyerTaxId: "24AAACB1234F1Z5",
  };
  const items = ocr.lineItems || [
    {
      skuCode: "SKU-GEN-01",
      itemDescription: "Goods Admitted at Dock",
      quantityInvoiced: grn.receivedQty || 100,
      uom: "Units",
      batchLotNumber: "LOT-DOC-01",
      mfgDate: "2026-10-20",
      expiryDate: "N/A",
      serialNumbers: ["N/A"],
      hsnCode: "8471",
      unitPrice: 100,
      lineTotal: (grn.receivedQty || 100) * 100,
    },
  ];
  const transit = ocr.logisticsTransit || {
    transporterName: "V-Trans India Express",
    waybillNumber: "AWB-INW-8812",
    vehicleNumber: "MH-12-RN-8841",
    totalPackages: "10 Packages",
    grossWeight: "1,200 KG",
    netWeight: "1,100 KG",
    sealNumber: "SEAL-OK-9912",
  };
  const fin = ocr.financialsBilling || {
    currency: "INR (₹)",
    subtotal: 100000,
    discount: 0,
    taxAmounts: { cgst: 9000, sgst: 9000, igst: 0, totalTax: 18000 },
    freightCharges: 2500,
    grandTotal: 120500,
  };
  const markers = ocr.edgeCasesMarkers || {
    stampDetected: true,
    stampDetails: "QC Passed Stamp Verified",
    signatureDetected: true,
    signatureDetails: "Driver & Receiver Countersigned",
    temperatureReading: "Ambient Storage (24°C)",
    handwrittenNotesPresent: false,
    handwrittenNotesText: "None - Clean delivery.",
    humanReviewRequired: false,
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black">
                  Goods Receipt Note Dossier: {grn.id}
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Stock Admitted
                </span>
              </div>
              <p className="text-xs text-slate-400">
                PO Ref: {grn.poRef} • Vendor: {grn.vendorName} • Inspected by: {grn.inspectedBy}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 pt-3 pb-1 border-b border-slate-200 bg-slate-50 flex items-center gap-1.5 overflow-x-auto text-xs font-bold shrink-0">
          {[
            { id: "items", label: "Line Items & Stock", badge: `${items.length} SKUs` },
            { id: "metadata", label: "Document Metadata" },
            { id: "vendor", label: "Vendor & Destination" },
            { id: "logistics", label: "Logistics & Vehicle" },
            { id: "financials", label: "Billing & Taxes" },
            { id: "markers", label: "QC Stamps & Notes", alert: markers.humanReviewRequired },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-white text-slate-600 hover:bg-slate-200 border border-slate-200"
                }`}
              >
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="text-[10px] font-mono px-1.5 rounded bg-amber-500 text-slate-950 font-black">
                    {tab.badge}
                  </span>
                )}
                {tab.alert && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === "items" && (
            <div className="space-y-3">
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">SKU Code</th>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3">Qty</th>
                      <th className="py-2.5 px-3">UOM</th>
                      <th className="py-2.5 px-3">Batch / Lot</th>
                      <th className="py-2.5 px-3">HSN Code</th>
                      <th className="py-2.5 px-3 text-right">Unit Rate</th>
                      <th className="py-2.5 px-3 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((it, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{it.skuCode}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">{it.itemDescription}</td>
                        <td className="py-2.5 px-3 font-mono font-black text-amber-700">{it.quantityInvoiced}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-600">{it.uom}</td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-purple-700">{it.batchLotNumber}</td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">{it.hsnCode}</td>
                        <td className="py-2.5 px-3 font-mono text-right text-slate-700">₹{it.unitPrice}</td>
                        <td className="py-2.5 px-3 font-mono font-black text-right text-slate-900">
                          ₹{it.lineTotal?.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "metadata" && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Document Type</label>
                <p className="font-black text-slate-900 text-sm mt-0.5">{meta.documentType}</p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Document Number</label>
                <p className="font-mono font-bold text-slate-900 text-sm mt-0.5">{meta.documentNumber}</p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Document Date</label>
                <p className="font-mono font-semibold text-slate-800 text-sm mt-0.5">{meta.documentDate}</p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Delivery Date</label>
                <p className="font-mono font-semibold text-slate-800 text-sm mt-0.5">{meta.deliveryDate}</p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Reference PO</label>
                <p className="font-mono font-black text-amber-700 text-sm mt-0.5">{meta.referencePoNumber}</p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">RMA Number</label>
                <p className="font-mono text-slate-700 text-sm mt-0.5">{meta.rmaNumber || "N/A"}</p>
              </div>
            </div>
          )}

          {activeTab === "vendor" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Supplier / Consignor</span>
                <p className="text-sm font-black text-slate-900">{vendor.supplierName}</p>
                <p className="text-[11px] font-mono text-purple-700">GSTIN: {vendor.supplierTaxId}</p>
                <p className="text-slate-600 text-[11px] leading-relaxed pt-1">{vendor.originAddress}</p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Buyer / Destination Dock</span>
                <p className="text-sm font-black text-slate-900">{vendor.buyerName}</p>
                <p className="text-[11px] font-mono text-emerald-700">Buyer GSTIN: {vendor.buyerTaxId}</p>
                <p className="text-slate-600 text-[11px] leading-relaxed pt-1">Receiving Warehouse: {vendor.destinationWarehouseId}</p>
              </div>
            </div>
          )}

          {activeTab === "logistics" && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Transporter</label>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{transit.transporterName}</p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Waybill / AWB #</label>
                <p className="font-mono font-bold text-blue-700 text-sm mt-0.5">{transit.waybillNumber}</p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Vehicle / Truck #</label>
                <p className="font-mono font-black text-slate-900 text-sm mt-0.5">{transit.vehicleNumber}</p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Packages</label>
                <p className="font-bold text-slate-800 text-sm mt-0.5">{transit.totalPackages}</p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Gross / Net Weight</label>
                <p className="font-mono font-bold text-slate-800 text-sm mt-0.5">
                  {transit.grossWeight} / {transit.netWeight}
                </p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Seal Number</label>
                <p className="font-mono font-black text-emerald-700 text-sm mt-0.5">{transit.sealNumber}</p>
              </div>
            </div>
          )}

          {activeTab === "financials" && (
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-3">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-mono font-bold">₹{fin.subtotal?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Tax (CGST + SGST):</span>
                <span className="font-mono font-bold text-purple-700">+ ₹{fin.taxAmounts?.totalTax?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Freight & Handling:</span>
                <span className="font-mono font-bold">+ ₹{fin.freightCharges?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-black text-slate-900">
                <span>Grand Total:</span>
                <span className="font-mono text-base text-amber-600">₹{fin.grandTotal?.toLocaleString()}</span>
              </div>
            </div>
          )}

          {activeTab === "markers" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-500">QC Stamp & Signatures</span>
                <p className="font-bold text-slate-900">{markers.stampDetails}</p>
                <p className="text-[11px] text-slate-500">{markers.signatureDetails}</p>
              </div>
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-500">Arrival Temperature</span>
                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Thermometer className="w-4 h-4 text-blue-600" />
                  {markers.temperatureReading}
                </p>
              </div>
              <div className="sm:col-span-2 p-4 rounded-xl bg-white border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-500">Handwritten Notes</span>
                <p className="text-slate-800 text-xs">{markers.handwrittenNotesText}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-white cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Printer className="w-4 h-4" />
            Print GRN Slip
          </button>
        </div>
      </div>
    </div>
  );
}
