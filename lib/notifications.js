import connectDB from "@/lib/mongodb";
import Notification from "@/models/Notification";

/**
 * Creates an in-app notification for the owner.
 * Does not throw so that main employee actions (punch-in, submit, etc.) are not blocked.
 */
export async function createOwnerNotification({
  ownerId,
  companyId,
  employeeId,
  employeeName,
  type,
  title,
  message,
  linkTab = "team",
  metadata = {},
}) {
  try {
    if (!ownerId || !type || !title || !message) {
      console.warn("createOwnerNotification: Missing required fields");
      return null;
    }

    await connectDB();
    const notification = new Notification({
      recipientType: "OWNER",
      recipientId: ownerId,
      ownerId,
      companyId: companyId || ownerId,
      employeeId: employeeId || null,
      employeeName: employeeName || "",
      type,
      title: title.trim(),
      message: message.trim(),
      linkTab,
      metadata,
      isRead: false,
    });

    await notification.save();
    return notification;
  } catch (error) {
    console.error("Failed to create owner notification:", error);
    return null;
  }
}

/**
 * Creates an in-app notification for a specific employee in the hierarchy.
 */
export async function createEmployeeNotification({
  recipientId,
  companyId,
  senderId,
  senderName,
  type,
  title,
  message,
  linkTab = "desk",
  metadata = {},
}) {
  try {
    if (!recipientId || !type || !title || !message) {
      console.warn("createEmployeeNotification: Missing required fields");
      return null;
    }

    await connectDB();
    const notification = new Notification({
      recipientType: "EMPLOYEE",
      recipientId,
      companyId: companyId || null,
      employeeId: senderId || null,
      employeeName: senderName || "",
      type,
      title: title.trim(),
      message: message.trim(),
      linkTab,
      metadata,
      isRead: false,
    });

    await notification.save();
    return notification;
  } catch (error) {
    console.error("Failed to create employee notification:", error);
    return null;
  }
}
