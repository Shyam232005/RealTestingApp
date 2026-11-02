"use server";

import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import SalesOrder from "@/models/SalesOrder";
import DispatchLog from "@/models/DispatchLog";
import Task from "@/models/Task";
import { z } from "zod";

/**
 * Helper to serialize Mongoose documents to plain JSON for Server Action boundaries
 */
function serializeDoc(doc) {
  if (!doc) return null;
  const raw = doc.toObject ? doc.toObject() : doc;
  return JSON.parse(
    JSON.stringify(raw, (key, value) => {
      if (
        key === "_id" ||
        (value && typeof value === "object" && value._bsontype === "ObjectID")
      ) {
        return value.toString();
      }
      return value;
    })
  );
}

// Zod Schemas for input validation
const ApproveEstimateSchema = z.object({
  orderId: z.string().min(1, "Order ID or Reference is required"),
  coordinatorId: z.string().optional().default("coordinator_default"),
  coordinatorName: z.string().optional().default("Sales Coordinator"),
});

const DispatchLogInputSchema = z.object({
  orderId: z.string().min(1, "Sales Order Reference/ID is required"),
  orderReference: z.string().optional(),
  coordinatorId: z.string().optional(),
  coordinatorName: z.string().optional().default("Tier 2 Sales Coordinator"),
  dispatchStatus: z.enum(["PENDING_PICKUP", "DISPATCHED"]).default("PENDING_PICKUP"),
  shippingProvider: z.string().min(2, "Shipping provider name is required"),
  trackingNumber: z.string().optional().default(""),
  vehicleNumber: z.string().optional().default(""),
  dispatchNotes: z.string().optional().default(""),
  scheduledDispatchDate: z.string().or(z.date()),
});

const DelegatedTaskInputSchema = z.object({
  assignedBy: z.string().optional().default("coordinator_default"),
  assignedByName: z.string().optional().default("Tier 2 Sales Coordinator"),
  assignedTo: z.string().optional().default("tier1_assistant"),
  assignedToName: z.string().min(2, "Assigned employee name is required"),
  customerId: z.string().optional().default(""),
  customerName: z.string().optional().default(""),
  taskType: z.enum(["PAYMENT_FOLLOWUP", "DISPATCH"]),
  priority: z.enum(["HIGH", "NORMAL"]).default("NORMAL"),
  status: z.enum(["OPEN", "CLOSED"]).default("OPEN"),
  description: z.string().min(3, "Task description is required"),
  dueDate: z.string().or(z.date()),
});

/**
 * Server Action: Approve an estimate
 * Updates SalesOrder status to APPROVED and items to RESERVED_IN_INVENTORY.
 */
export async function approveEstimate(payload) {
  try {
    const validated = ApproveEstimateSchema.parse(payload);
    await connectDB();

    const { orderId, coordinatorId, coordinatorName } = validated;

    // Search by ObjectId or orderReference or orderNumber or estimateId
    let query = {};
    if (mongoose.Types.ObjectId.isValid(orderId)) {
      query = { _id: orderId };
    } else {
      query = {
        $or: [
          { orderReference: orderId },
          { orderNumber: orderId },
          { estimateId: orderId },
        ],
      };
    }

    let order = await SalesOrder.findOne(query);

    if (!order) {
      // If not yet persisted in MongoDB (e.g. offline-created), create an initial record
      order = new SalesOrder({
        orderReference: orderId,
        orderNumber: orderId,
        clientName: "Approved Commercial Client",
        totalAmount: 50000,
        status: "APPROVED",
        approvedByName: coordinatorName,
        paymentTerms: "NET_30",
        items: [
          {
            itemId: "SKU-AUTO-01",
            name: "Industrial Component Package",
            quantity: 1,
            unitPrice: 50000,
            total: 50000,
            allocationStatus: "RESERVED_IN_INVENTORY",
          },
        ],
      });
    } else {
      order.status = "APPROVED";
      order.approvedByName = coordinatorName;
      if (mongoose.Types.ObjectId.isValid(coordinatorId)) {
        order.approvedBy = coordinatorId;
      }

      // Update all line items to RESERVED_IN_INVENTORY
      if (Array.isArray(order.items) && order.items.length > 0) {
        order.items = order.items.map((item) => ({
          ...item.toObject ? item.toObject() : item,
          allocationStatus: "RESERVED_IN_INVENTORY",
        }));
      } else {
        order.items = [
          {
            itemId: "SKU-EST-ALLOCATED",
            name: "Commercial Quotation Items",
            quantity: 1,
            unitPrice: order.totalAmount || 0,
            total: order.totalAmount || 0,
            allocationStatus: "RESERVED_IN_INVENTORY",
          },
        ];
      }
    }

    await order.save();

    return {
      success: true,
      message: "Estimate approved and inventory stock successfully reserved.",
      order: serializeDoc(order),
    };
  } catch (error) {
    console.error("Error in approveEstimate server action:", error);
    return {
      success: false,
      error: error.message || "Failed to approve estimate",
    };
  }
}

/**
 * Server Action: Create a DispatchLog
 */
export async function createDispatchLog(payload) {
  try {
    const validated = DispatchLogInputSchema.parse(payload);
    await connectDB();

    // Check if order exists to resolve proper ObjectId
    let orderObjectId = null;
    let orderRefString = validated.orderReference || validated.orderId;

    if (mongoose.Types.ObjectId.isValid(validated.orderId)) {
      orderObjectId = validated.orderId;
    } else {
      const order = await SalesOrder.findOne({
        $or: [
          { orderReference: validated.orderId },
          { orderNumber: validated.orderId },
        ],
      });
      if (order) {
        orderObjectId = order._id;
        orderRefString = order.orderReference || order.orderNumber;
      } else {
        // Create an ObjectId placeholder if order was offline
        orderObjectId = new mongoose.Types.ObjectId();
      }
    }

    const newLog = new DispatchLog({
      orderId: orderObjectId,
      orderReference: orderRefString,
      coordinatorName: validated.coordinatorName,
      dispatchStatus: validated.dispatchStatus,
      shippingProvider: validated.shippingProvider,
      trackingNumber: validated.trackingNumber,
      vehicleNumber: validated.vehicleNumber,
      dispatchNotes: validated.dispatchNotes,
      scheduledDispatchDate: new Date(validated.scheduledDispatchDate),
    });

    await newLog.save();

    return {
      success: true,
      message: "Dispatch log created and fulfillment route scheduled.",
      dispatchLog: serializeDoc(newLog),
    };
  } catch (error) {
    console.error("Error in createDispatchLog server action:", error);
    return {
      success: false,
      error: error.message || "Failed to create dispatch log",
    };
  }
}

/**
 * Server Action: Create a Delegated Task
 */
export async function createDelegatedTask(payload) {
  try {
    const validated = DelegatedTaskInputSchema.parse(payload);
    await connectDB();

    const newTask = new Task({
      assignedByName: validated.assignedByName,
      assignedToName: validated.assignedToName,
      customerId: validated.customerId,
      customerName: validated.customerName,
      taskType: validated.taskType,
      priority: validated.priority,
      status: validated.status,
      description: validated.description,
      dueDate: new Date(validated.dueDate),
    });

    if (mongoose.Types.ObjectId.isValid(validated.assignedBy)) {
      newTask.assignedBy = validated.assignedBy;
    }
    if (mongoose.Types.ObjectId.isValid(validated.assignedTo)) {
      newTask.assignedTo = validated.assignedTo;
    }

    await newTask.save();

    return {
      success: true,
      message: "Task delegated successfully to Sales Assistant.",
      task: serializeDoc(newTask),
    };
  } catch (error) {
    console.error("Error in createDelegatedTask server action:", error);
    return {
      success: false,
      error: error.message || "Failed to create delegated task",
    };
  }
}

/**
 * Server Action: Fetch Coordinator Snapshot
 * Hydrates Dexie stores with remote MongoDB documents
 */
export async function fetchCoordinatorSnapshot() {
  try {
    await connectDB();

    const [salesOrders, dispatchLogs, tasks, leads, deals] = await Promise.all([
      SalesOrder.find({}).sort({ createdAt: -1 }).limit(100).lean(),
      DispatchLog.find({}).sort({ scheduledDispatchDate: 1 }).limit(100).lean(),
      Task.find({}).sort({ dueDate: 1 }).limit(100).lean(),
      mongoose.models.Lead
        ? mongoose.models.Lead.find({}).sort({ createdAt: -1 }).limit(50).lean()
        : [],
      mongoose.models.Deal
        ? mongoose.models.Deal.find({}).sort({ createdAt: -1 }).limit(50).lean()
        : [],
    ]);

    return {
      success: true,
      salesOrders: salesOrders.map((so) => serializeDoc(so)),
      dispatchLogs: dispatchLogs.map((dl) => serializeDoc(dl)),
      tasks: tasks.map((t) => serializeDoc(t)),
      leads: leads.map((l) => serializeDoc(l)),
      deals: deals.map((d) => serializeDoc(d)),
    };
  } catch (error) {
    console.error("Error in fetchCoordinatorSnapshot:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch snapshot",
      salesOrders: [],
      dispatchLogs: [],
      tasks: [],
      leads: [],
      deals: [],
    };
  }
}
