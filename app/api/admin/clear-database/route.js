import { NextResponse } from "next/server";
import { getAuthenticatedSuperAdmin } from "@/lib/adminAuth";
import connectDB from "@/lib/mongodb";
import mongoose from "mongoose";

// Required Super Password - strictly enforced with zero alternatives
const REQUIRED_SUPER_CLEAR_PASSWORD = "Shyam@Sangani#Clear@Databased#23072005@2026";

/**
 * POST /api/admin/clear-database
 * High-Security SuperAdmin endpoint to completely purge all database collections to 0 documents.
 * Protected by dual-layer security:
 * 1. Authenticated SuperAdmin session token (JWT signed)
 * 2. Exact match of the Master Root Clear Password (no alternatives)
 */
export async function POST(request) {
  try {
    // 1. Verify SuperAdmin Authentication
    const auth = await getAuthenticatedSuperAdmin();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // 2. Parse request payload
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload provided.", success: false },
        { status: 400 }
      );
    }

    const { superPassword } = body;

    // 3. Strict Master Password Verification - NO ALTERNATIVES ALLOWED
    if (!superPassword || typeof superPassword !== "string") {
      return NextResponse.json(
        {
          error: "Authorization failed: Super Clear Password is required to execute this operation.",
          success: false,
        },
        { status: 400 }
      );
    }

    if (superPassword.trim() !== REQUIRED_SUPER_CLEAR_PASSWORD) {
      return NextResponse.json(
        {
          error: "Access Denied: Invalid Super Database Clear Password. This operation is strictly locked.",
          success: false,
        },
        { status: 403 }
      );
    }

    // 4. Connect to MongoDB instance
    await connectDB();
    const db = mongoose.connection.db;

    // 5. Query all existing collections in the database
    const collections = await db.listCollections().toArray();

    const wipedSummary = [];
    let totalDeletedCount = 0;

    // 6. Purge every collection completely to 0 documents
    for (const col of collections) {
      const colName = col.name;
      // Skip internal MongoDB system collections
      if (colName.startsWith("system.")) continue;

      const collection = db.collection(colName);
      const docCountBefore = await collection.countDocuments();

      await collection.deleteMany({});

      const docCountAfter = await collection.countDocuments();

      wipedSummary.push({
        collection: colName,
        beforeCount: docCountBefore,
        afterCount: docCountAfter,
        status: docCountAfter === 0 ? "PURGED_TO_ZERO" : "ATTENTION_REQUIRED",
      });

      totalDeletedCount += docCountBefore;
    }

    // 7. Also verify all registered Mongoose models are purged
    const modelNames = mongoose.modelNames();
    for (const modelName of modelNames) {
      try {
        const model = mongoose.model(modelName);
        if (model && typeof model.deleteMany === "function") {
          await model.deleteMany({});
        }
      } catch {
        // Safe catch if model was already cleared above
      }
    }

    console.log(
      `[SUPERADMIN DB PURGE] Master database wipe successfully executed by ${auth.admin?.email || "SuperAdmin"}. Total records deleted: ${totalDeletedCount} across ${wipedSummary.length} collections.`
    );

    return NextResponse.json({
      success: true,
      message: "Entire database successfully purged to 0 across all collections.",
      wipedAt: new Date().toISOString(),
      authorizedBy: auth.admin?.name || "Shyam Sangani (SuperAdmin)",
      totalDeletedCount,
      collectionsWipedCount: wipedSummary.length,
      summary: wipedSummary,
    });
  } catch (error) {
    console.error("Super Clear Database Error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to execute database purge.",
        success: false,
      },
      { status: 500 }
    );
  }
}
