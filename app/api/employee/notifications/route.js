import { NextResponse } from "next/server";
import { getAuthenticatedEmployee } from "@/lib/employeeAuth";
import Notification from "@/models/Notification";

// GET /api/employee/notifications - Get employee's notifications and unread count
export async function GET(request) {
  try {
    const auth = await getAuthenticatedEmployee({ requireApproved: true });
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { employee } = auth;
    const { searchParams } = new URL(request.url);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "30", 10)));

    const [notifications, unreadCount] = await Promise.all([
      Notification.find({
        recipientType: "EMPLOYEE",
        recipientId: employee._id,
      })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean(),

      Notification.countDocuments({
        recipientType: "EMPLOYEE",
        recipientId: employee._id,
        isRead: false,
      }),
    ]);

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("GET /api/employee/notifications error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load notifications" },
      { status: 500 }
    );
  }
}

// PATCH /api/employee/notifications - Mark notification(s) as read
export async function PATCH(request) {
  try {
    const auth = await getAuthenticatedEmployee({ requireApproved: true });
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { employee } = auth;
    const body = await request.json().catch(() => ({}));
    const { notificationId, markAllRead } = body;

    if (markAllRead) {
      await Notification.updateMany(
        {
          recipientType: "EMPLOYEE",
          recipientId: employee._id,
          isRead: false,
        },
        { $set: { isRead: true } }
      );

      return NextResponse.json({
        success: true,
        message: "All notifications marked as read.",
      });
    }

    if (notificationId) {
      const updated = await Notification.findOneAndUpdate(
        {
          _id: notificationId,
          recipientType: "EMPLOYEE",
          recipientId: employee._id,
        },
        { $set: { isRead: true } },
        { new: true }
      );

      return NextResponse.json({
        success: true,
        notification: updated,
      });
    }

    return NextResponse.json({ error: "Missing notificationId or markAllRead" }, { status: 400 });
  } catch (error) {
    console.error("PATCH /api/employee/notifications error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update notification" },
      { status: 500 }
    );
  }
}
