import mongoose from "mongoose";

const OcrFieldDictionarySchema = new mongoose.Schema(
  {
    // Unique slug / identifier for the field (e.g. "supplier_gstin", "bilty_lr_no", "batch_lot_number")
    fieldId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },

    // Standardized English canonical title (e.g. "Supplier GSTIN", "Lorry Receipt (Bilty) Number")
    canonicalName: {
      type: String,
      required: true,
      trim: true,
    },

    // Category grouping
    category: {
      type: String,
      enum: ["header", "party", "line_item", "tax_gst", "logistics", "flags", "custom"],
      default: "custom",
      index: true,
    },

    // Expected data type
    dataType: {
      type: String,
      enum: ["string", "number", "date", "boolean", "array"],
      default: "string",
    },

    // Self-learned terminology variations & regional aliases (English, Hindi, Gujarati, Hinglish)
    knownAliases: {
      type: [String],
      default: [],
      index: true,
    },

    // Dense semantic vector embedding for similarity matching
    semanticEmbedding: {
      type: [Number],
      default: [],
    },

    // Number of times this field was recognized across bills
    occurrences: {
      type: Number,
      default: 1,
      min: 1,
    },

    // Tenant / Company ownership (null = universal platform field, ObjectId = company-specific field)
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
      default: null,
      index: true,
    },

    learnedAt: {
      type: Date,
      default: Date.now,
    },

    lastSeenAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Helper static method: find matching alias or compute semantic match
OcrFieldDictionarySchema.statics.findByAlias = function (queryKey, companyId = null) {
  const clean = queryKey.trim().toLowerCase();
  const filter = {
    $or: [
      { fieldId: clean },
      { canonicalName: new RegExp(`^${clean}$`, "i") },
      { knownAliases: { $elemMatch: { $regex: new RegExp(`^${clean}$`, "i") } } },
    ],
  };

  if (companyId) {
    filter.$and = [{ $or: [{ companyId: null }, { companyId }] }];
  }

  return this.findOne(filter);
};

export default mongoose.models.OcrFieldDictionary ||
  mongoose.model("OcrFieldDictionary", OcrFieldDictionarySchema);
