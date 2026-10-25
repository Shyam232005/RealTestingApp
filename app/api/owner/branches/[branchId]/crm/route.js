import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import Owner from "@/models/Owner";
import Organization from "@/models/Organization";

async function getAuthenticatedOwner() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("crown_session")?.value;

  if (!sessionToken) {
    return { error: "Not authenticated. Please log in.", status: 401 };
  }

  let decoded;
  try {
    decoded = jwt.verify(sessionToken, process.env.JWT_SECRET);
  } catch (err) {
    return { error: "Invalid or expired session. Please log in again.", status: 401 };
  }

  if (decoded.normalizedRole !== "OWNER" && decoded.role !== "Owner" && decoded.role !== "OWNER") {
    return { error: "Access denied. Only business owners can perform this action.", status: 403 };
  }

  await connectDB();
  const owner = await Owner.findById(decoded.userId);
  if (!owner) {
    return { error: "Owner account not found.", status: 404 };
  }

  return { owner, decoded };
}

// GET /api/owner/branches/[branchId]/crm
export async function GET(request, { params }) {
  try {
    const auth = await getAuthenticatedOwner();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { branchId } = await params;
    const organization = await Organization.findOne({ ownerId: auth.owner._id });
    if (!organization) {
      return NextResponse.json({ error: "Organization not found." }, { status: 404 });
    }

    const branch = (organization.branchList || []).find(
      (b) => b.branchId === branchId
    );

    if (!branch) {
      return NextResponse.json({ error: "Branch not found." }, { status: 404 });
    }

    return NextResponse.json(
      {
        customers: branch.customers || [],
        offers: branch.offers || [],
        branchName: branch.name,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/owner/branches/[branchId]/crm error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/owner/branches/[branchId]/crm
export async function POST(request, { params }) {
  try {
    const auth = await getAuthenticatedOwner();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { branchId } = await params;
    const body = await request.json();
    const { action } = body;

    const organization = await Organization.findOne({ ownerId: auth.owner._id });
    if (!organization) {
      return NextResponse.json({ error: "Organization not found." }, { status: 404 });
    }

    const branchIndex = (organization.branchList || []).findIndex(
      (b) => b.branchId === branchId
    );

    if (branchIndex === -1) {
      return NextResponse.json({ error: "Branch not found." }, { status: 404 });
    }

    const branch = organization.branchList[branchIndex];

    // 1. Add Regular / VIP Customer to Branch CRM
    if (action === "add_customer") {
      const { name, phone, email, tier, notes, initialPurchase } = body;

      if (!name || name.trim().length < 2) {
        return NextResponse.json({ error: "Customer name is required." }, { status: 400 });
      }

      if (!phone || phone.trim().length < 8) {
        return NextResponse.json({ error: "Valid customer contact phone number is required." }, { status: 400 });
      }

      const newCustomer = {
        customerId: new mongoose.Types.ObjectId().toString(),
        name: name.trim(),
        phone: phone.trim(),
        email: email ? email.trim() : "",
        tier: ["Regular", "VIP", "Occasional"].includes(tier) ? tier : "Regular",
        totalPurchases: Math.max(0, Number(initialPurchase) || 0),
        lastVisit: new Date(),
        notes: notes ? notes.trim() : "",
        createdAt: new Date(),
      };

      if (!branch.customers) branch.customers = [];
      branch.customers.unshift(newCustomer);
      await Organization.collection.updateOne(
        { _id: organization._id },
        {
          $set: {
            [`branchList.${branchIndex}.customers`]: branch.customers,
            updatedAt: new Date(),
          },
        }
      );

      return NextResponse.json(
        {
          message: `Customer ${newCustomer.name} added to ${branch.name} CRM!`,
          customer: newCustomer,
          customers: branch.customers,
        },
        { status: 201 }
      );
    }

    // 2. Broadcast Offer / Urgent Special Promotion (Owner Only)
    if (action === "create_offer") {
      const { title, description, offerType, discountPercent, validHours, broadcastChannel } = body;

      if (!title || title.trim().length < 3) {
        return NextResponse.json({ error: "Offer title must be at least 3 characters." }, { status: 400 });
      }

      const hours = Number(validHours) || 48;
      const validUntilDate = new Date(Date.now() + hours * 60 * 60 * 1000);

      const newOffer = {
        offerId: new mongoose.Types.ObjectId().toString(),
        title: title.trim(),
        description: description ? description.trim() : "",
        offerType: offerType === "limited_time_special" ? "limited_time_special" : "regular_update",
        discountPercent: Math.min(100, Math.max(0, Number(discountPercent) || 0)),
        validUntil: validUntilDate,
        isActive: true,
        broadcastChannel: broadcastChannel ? broadcastChannel.trim() : "WhatsApp / SMS",
        createdAt: new Date(),
      };

      if (!branch.offers) branch.offers = [];
      branch.offers.unshift(newOffer);
      await Organization.collection.updateOne(
        { _id: organization._id },
        {
          $set: {
            [`branchList.${branchIndex}.offers`]: branch.offers,
            updatedAt: new Date(),
          },
        }
      );

      return NextResponse.json(
        {
          message:
            newOffer.offerType === "limited_time_special"
              ? `⚡ Urgent Special Flash Offer broadcasted to ${branch.name} customers!`
              : `Seasonal update/offer published for ${branch.name}!`,
          offer: newOffer,
          offers: branch.offers,
        },
        { status: 201 }
      );
    }

    // 3. Delete Offer
    if (action === "delete_offer") {
      const { offerId } = body;
      branch.offers = (branch.offers || []).filter((o) => o.offerId !== offerId);
      await Organization.collection.updateOne(
        { _id: organization._id },
        {
          $set: {
            [`branchList.${branchIndex}.offers`]: branch.offers,
            updatedAt: new Date(),
          },
        }
      );
      return NextResponse.json({ message: "Offer removed successfully.", offers: branch.offers }, { status: 200 });
    }

    // 4. Add / Update Stock Items for this Branch (Owner Only)
    if (action === "add_stock_item") {
      const { name, category, quantity, unitPrice, unit } = body;
      if (!name || name.trim().length < 2) {
        return NextResponse.json({ error: "Item name is required." }, { status: 400 });
      }

      const newItem = {
        itemId: new mongoose.Types.ObjectId().toString(),
        name: name.trim(),
        category: category ? category.trim() : "Finished Goods",
        sku: `SKU-${Date.now().toString().slice(-5)}`,
        quantity: Math.max(0, Number(quantity) || 0),
        unit: unit ? unit.trim() : "Pcs",
        unitPrice: Math.max(0, Number(unitPrice) || 0),
        stockStatus:
          Number(quantity) > 10 ? "in_stock" : Number(quantity) > 0 ? "low_stock" : "out_of_stock",
        lastUpdated: new Date(),
      };

      if (!branch.stockItems) branch.stockItems = [];
      branch.stockItems.unshift(newItem);
      await Organization.collection.updateOne(
        { _id: organization._id },
        {
          $set: {
            [`branchList.${branchIndex}.stockItems`]: branch.stockItems,
            updatedAt: new Date(),
          },
        }
      );

      return NextResponse.json(
        { message: `Stock item "${newItem.name}" added to ${branch.name}!`, stockItems: branch.stockItems },
        { status: 201 }
      );
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (error) {
    console.error("POST /api/owner/branches/[branchId]/crm error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
