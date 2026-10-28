/**
 * Pure-JavaScript Semantic Embedding & Cosine Similarity Engine
 * Optimized for Indian business documents (English, Hindi, Gujarati, Hinglish terminology).
 * Produces deterministic 64-dimensional normalized vector embeddings.
 */

// Hierarchical domain synonym dictionary for Indian MSME business documents.
// High-priority concepts (specific document identifiers, tax codes, logistics instruments)
// take precedence over generic entity modifiers.
const SPECIFIC_DOMAINS = {
  gst: ["gst", "gstin", "tin", "gstno", "gst_no", "tin_no", "party_gst", "vendor_gst", "tax_id", "tax_number", "જીએસટી", "जीएसटी"],
  bilty: ["bilty", "lr", "lr_no", "lr_number", "gr", "gr_no", "lorry_receipt", "waybill", "awb", "transport_bilty", "બિલ્ટી", "बिल्टी"],
  location: ["warehouse", "godown", "depot", "dock", "bay", "branch", "location", "destination", "storage", "ગોડાઉન", "गोदाम"],
  challan: ["challan", "delivery_challan", "dc", "dispatch_slip", "gate_pass", "inward_slip", "ચલણ", "चालान"],
  invoice: ["invoice", "tax_invoice", "bill", "bill_no", "bill_number", "inv", "kachcha_bill", "pakka_bill", "બીલ", "बिल"],
  po: ["po", "po_number", "purchase_order", "po_ref", "order_no", "order_ref", "ખરીદ_ઓર્ડર"],
  hsn: ["hsn", "hsn_code", "sac", "sac_code", "tariff_code", "commodity_code"],
  vehicle: ["vehicle", "truck", "lorry", "truck_no", "vehicle_no", "gadi_no", "गाड़ी_नंबर", "ગાડી_નંબર"],
  temperature: ["temperature", "temp", "cold_chain", "chiller", "cooling", " ડિગ્રી", "डिग्री"],
  stamp_qc: ["stamp", "qc_stamp", "qc_pass", "verified_stamp", "qa_ok", "stamp_detected"],
  signature: ["signature", "signed", "signatory", "auth_sign", "receiver_sign"],
  date: ["date", "bill_date", "doc_date", "invoice_date", "delivery_date", "तारीख", "તારીખ"],
  batch: ["batch", "lot", "lot_no", "batch_no", "serial", "serial_no", "બેચ", "बैच"],
  quantity: ["qty", "quantity", "units", "pieces", "nos", "weight", "pcs", "packets", "boxes", "જથ્થો", "मात्रा"],
};

const GENERIC_DOMAINS = {
  vendor: ["vendor", "supplier", "party", "consignor", "seller", "manufacturer", "વેપારી", "सप्लायर", "पार्टी"],
  buyer: ["buyer", "customer", "consignee", "client", "purchaser", "billed_to", "ગ્રાહક", "ग्राहक"],
  amount: ["amount", "total", "rate", "price", "subtotal", "grand_total", "line_total", "रुपये", "રૂપિયા"],
  tax: ["tax", "cgst", "sgst", "igst", "cess", "vat", "excise", "વેરો", "कर"],
};

// Generic modifiers and stop tokens in Indian business keys
const MODIFIER_TOKENS = new Set([
  "no", "num", "number", "code", "id", "ref", "details", "slip", "name",
  "party", "vendor", "supplier", "buyer", "customer", "client"
]);

const VECTOR_DIM = 64;

/**
 * Normalizes input string to canonical token sequence
 */
function tokenize(text) {
  if (!text || typeof text !== "string") return [];
  return text
    .toLowerCase()
    .replace(/[^\w\s\u0900-\u097F\u0A80-\u0AFF]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Stable token hash function mapped into [0 .. VECTOR_DIM - 1]
 */
function hashToken(token) {
  let hash = 5381;
  for (let i = 0; i < token.length; i++) {
    hash = (hash * 33) ^ token.charCodeAt(i);
  }
  return Math.abs(hash) % VECTOR_DIM;
}

/**
 * Generates a 64-dimensional float vector embedding for any text or rawKey.
 * Identifies primary business domains and assigns strong anchoring clusters
 * so that synonyms ("Party GSTIN" <-> "GST No", "Bilty No" <-> "LR Number")
 * consistently achieve >= 0.88 cosine similarity.
 */
export function generateSemanticEmbedding(text) {
  const vec = new Array(VECTOR_DIM).fill(0);
  const tokens = tokenize(text);

  if (tokens.length === 0) return vec;

  // Detect if any specific domain matches
  let matchedSpecificDomain = null;
  for (const token of tokens) {
    for (const [domKey, synonyms] of Object.entries(SPECIFIC_DOMAINS)) {
      if (synonyms.includes(token)) {
        matchedSpecificDomain = domKey;
        break;
      }
    }
    if (matchedSpecificDomain) break;
  }

  // Detect generic domain if no specific domain found
  let matchedGenericDomain = null;
  if (!matchedSpecificDomain) {
    for (const token of tokens) {
      for (const [domKey, synonyms] of Object.entries(GENERIC_DOMAINS)) {
        if (synonyms.includes(token)) {
          matchedGenericDomain = domKey;
          break;
        }
      }
      if (matchedGenericDomain) break;
    }
  }

  const primaryDomain = matchedSpecificDomain || matchedGenericDomain;

  // 1. Anchor vector with primary domain cluster (heavy weight for clustering)
  if (primaryDomain) {
    const clusterPos1 = hashToken(`domain_${primaryDomain}_primary`);
    const clusterPos2 = hashToken(`domain_${primaryDomain}_secondary`);
    vec[clusterPos1] += 6.5;
    vec[clusterPos2] += 4.5;
  }

  // 2. Token projections
  tokens.forEach((t, idx) => {
    // If a primary specific domain is matched, de-weight generic modifiers
    const isModifier = MODIFIER_TOKENS.has(t) && matchedSpecificDomain;
    const tokenWeight = isModifier ? 0.3 : 1.0;

    const pos = hashToken(t);
    vec[pos] += tokenWeight;

    // Bi-gram if next token exists
    if (idx < tokens.length - 1) {
      const biPos = hashToken(`${t}_${tokens[idx + 1]}`);
      vec[biPos] += tokenWeight * 0.5;
    }
  });

  // 3. Sub-word tri-grams for typo resilience
  const flat = tokens.join("_");
  for (let i = 0; i < flat.length - 2; i++) {
    const trigram = flat.slice(i, i + 3);
    const triPos = hashToken(trigram);
    vec[triPos] += 0.15;
  }

  // 4. L2 Normalization so Euclidean magnitude = 1.0
  let norm = 0;
  for (let i = 0; i < VECTOR_DIM; i++) {
    norm += vec[i] * vec[i];
  }
  norm = Math.sqrt(norm);

  if (norm > 0) {
    for (let i = 0; i < VECTOR_DIM; i++) {
      vec[i] = Number((vec[i] / norm).toFixed(6));
    }
  }

  return vec;
}

/**
 * Computes exact Cosine Similarity between two embedding vectors
 * @returns {number} Float between 0.0 and 1.0
 */
export function computeCosineSimilarity(vecA, vecB) {
  if (!Array.isArray(vecA) || !Array.isArray(vecB) || vecA.length !== vecB.length) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  const sim = dotProduct / denominator;
  return Math.max(0, Math.min(1, Number(sim.toFixed(4))));
}
