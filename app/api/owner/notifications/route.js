import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";
import Owner from "@/models/Owner";
import Notification from "@/models/Notification";

async function getAuthenticatedOwner() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("crown_session")?.value;

  if (!sessionToken) {
    return { error: "Not authenticated", status: 401 };
  }

  let decoded;
  try {
    decoded = jwt.verify(sessionToken, process.env.JWT_SECRET);
  } catch {
    return { error: "Invalid session", status: 401 };
  }

  if (
    decoded.normalizedRole !== "OWNER" &&
    decoded.role !== "Owner" &&
    decoded.role !== "OWNER"
  ) {
    return { error: "Access denied", status: 403 };
  }

  await connectDB();
  const owner = await Owner.findById(decoded.userId);
  if (!owner) {
    return { error: "Owner not found", status: 404 };
  }

  return { owner };
}

// GET /api/owner/notifications - List owner notifications with unread count
export async function GET(request) {
  try {
    const auth = await getAuthenticatedOwner();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { owner } = auth;
    const { searchParams } = new URL(request.url);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));

    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ ownerId: owner._id })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean(),
      Notification.countDocuments({
        ownerId: owner._id,
        isRead: false,
      }),
    ]);

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("GET /api/owner/notifications error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

// PATCH /api/owner/notifications - Mark notification(s) as read
export async function PATCH(request) {
  try {
    const auth = await getAuthenticatedOwner();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { owner } = auth;
    const body = await request.json().catch(() => ({}));
    const { notificationId, markAll } = body;

    if (markAll) {
      await Notification.updateMany(
        { ownerId: owner._id, isRead: false },
        { isRead: true, readAt: new Date() }
      );
    } else if (notificationId) {
      await Notification.findOneAndUpdate(
        { _id: notificationId, ownerId: owner._id },
        { isRead: true, readAt: new Date() }
      );
    } else {
      return NextResponse.json(
        { error: "Provide notificationId or markAll: true" },
        { status: 400 }
      );
    }

    const unreadCount = await Notification.countDocuments({
      ownerId: owner._id,
      isRead: false,
    });

    return NextResponse.json({
      success: true,
      unreadCount,
    });
  } catch (error) {
    console.error("PATCH /api/owner/notifications error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update notification" },
      { status: 500 }
    );
  }
}
