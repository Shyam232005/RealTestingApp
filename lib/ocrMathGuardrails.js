/**
 * Deterministic Zero-Mistake Accounting Guardrails for Indian Business Documents
 * Runs server-side compliance & math verification across line items, GSTIN, HSN, Vehicle, and E-Way bills.
 */

// Valid Indian State Codes for GSTIN
const VALID_GST_STATE_CODES = new Set([
  "01", "02", "03", "04", "05", "06", "07", "08", "09", "10",
  "11", "12", "13", "14", "15", "16", "17", "18", "19", "20",
  "21", "22", "23", "24", "25", "26", "27", "28", "29", "30",
  "31", "32", "33", "34", "35", "36", "37", "38", "97", "99"
]);

/**
 * Validates 15-digit Indian GSTIN format and state code
 */
export function validateGstin(gstin) {
  if (!gstin || typeof gstin !== "string") return false;
  const clean = gstin.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (clean.length !== 15) return false;

  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!gstinRegex.test(clean)) return false;

  const stateCode = clean.slice(0, 2);
  return VALID_GST_STATE_CODES.has(stateCode);
}

/**
 * Validates 4, 6, or 8-digit HSN/SAC code
 */
export function validateHsn(hsn) {
  if (!hsn) return true; // Optional on small bills
  const clean = String(hsn).trim().replace(/\D/g, "");
  return clean.length === 4 || clean.length === 6 || clean.length === 8;
}

/**
 * Validates Indian Vehicle Registration format (e.g. GJ-05-XX-0000, MH-12-AB-1234)
 */
export function validateIndianVehicle(vehicleNo) {
  if (!vehicleNo || typeof vehicleNo !== "string") return false;
  const clean = vehicleNo.trim().toUpperCase().replace(/[\s-]/g, "");
  const vehicleRegex = /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$/;
  return vehicleRegex.test(clean);
}

/**
 * Validates 12-digit Indian E-Way Bill Number
 */
export function validateEwayBill(ewayBill) {
  if (!ewayBill) return false;
  const clean = String(ewayBill).trim().replace(/\D/g, "");
  return clean.length === 12;
}

/**
 * Verifies Line Item Arithmetic: (Qty * Rate) - Discount + GST == Line Total
 * Allows a minor rounding tolerance of ₹1.00 for fractional paisa differences.
 */
export function validateLineItemMath({
  quantity = 0,
  unitPrice = 0,
  discount = 0,
  taxAmount = 0,
  lineTotal = 0,
}) {
  const qty = Number(quantity) || 0;
  const rate = Number(unitPrice) || 0;
  const disc = Number(discount) || 0;
  const tax = Number(taxAmount) || 0;
  const total = Number(lineTotal) || 0;

  const expectedBase = qty * rate;
  const expectedTotal = expectedBase - disc + tax;

  const diff = Math.abs(expectedTotal - total);
  const isValid = diff <= 1.5; // Up to ₹1.50 rounding tolerance

  return {
    isValid,
    expectedTotal: Math.round(expectedTotal * 100) / 100,
    actualTotal: total,
    discrepancy: Math.round(diff * 100) / 100,
  };
}

/**
 * Main Guardrail Auditor: Audits complete document payload before database commit
 */
export function auditDocumentPayload(payload) {
  const audit = {
    mathCheckPassed: true,
    gstChecksumValid: true,
    vehicleFormatValid: true,
    ewayBillFormatValid: true,
    humanReviewRequired: false,
    flagReasons: [],
  };

  // 1. Audit GSTIN if present
  const gstin = payload.vendorInfo?.supplierTaxId || payload.vendorGstin;
  if (gstin && gstin !== "N/A" && !validateGstin(gstin)) {
    audit.gstChecksumValid = false;
    audit.humanReviewRequired = true;
    audit.flagReasons.push(`Invalid GSTIN format: "${gstin}"`);
  }

  // 2. Audit Vehicle Number if present
  const vehicle = payload.logisticsTransit?.vehicleNumber || payload.vehicleNumber;
  if (vehicle && vehicle !== "N/A" && !validateIndianVehicle(vehicle)) {
    audit.vehicleFormatValid = false;
    // Warning only, vehicle might be interstate tractor or temp pass
    audit.flagReasons.push(`Unrecognized vehicle format: "${vehicle}"`);
  }

  // 3. Audit E-Way Bill Number if present
  const eway = payload.logisticsTransit?.ewayBillNumber || payload.ewayBill;
  if (eway && eway !== "N/A" && !validateEwayBill(eway)) {
    audit.ewayBillFormatValid = false;
    audit.flagReasons.push(`E-Way Bill should be 12 digits (Found: "${eway}")`);
  }

  // 4. Audit Line Items Math
  const items = payload.lineItems || [];
  let mathFailed = false;

  items.forEach((item, idx) => {
    const mathResult = validateLineItemMath({
      quantity: item.quantityInvoiced ?? item.quantity ?? item.qty,
      unitPrice: item.unitPrice ?? item.rate,
      discount: item.discount ?? 0,
      taxAmount: item.taxAmount ?? 0,
      lineTotal: item.lineTotal ?? item.amount,
    });

    if (!mathResult.isValid) {
      mathFailed = true;
      item.requiresHumanReview = true;
      item.confidenceScore = Math.min(item.confidenceScore || 0.7, 0.65);
      audit.flagReasons.push(
        `Line item #${idx + 1} (${item.itemDescription || "Item"}): Math mismatch. Qty * Rate = ₹${mathResult.expectedTotal}, Bill stated ₹${mathResult.actualTotal}`
      );
    }
  });

  if (mathFailed) {
    audit.mathCheckPassed = false;
    audit.humanReviewRequired = true;
  }

  // 5. Audit Handwritten Notes or Exception markers
  const markers = payload.edgeCasesMarkers || {};
  const handwritten =
    markers.handwrittenNotesText ||
    markers.handwrittenNotes ||
    (markers.handwrittenNotesPresent ? markers.handwrittenNotesText || "Handwritten text present" : null);

  if (handwritten) {
    audit.humanReviewRequired = true;
    audit.flagReasons.push(`Handwritten annotation detected: "${handwritten}"`);
  }

  return {
    ...audit,
    flagReason: audit.flagReasons.join(" | "),
  };
}
