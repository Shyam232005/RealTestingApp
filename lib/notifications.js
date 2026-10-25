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
