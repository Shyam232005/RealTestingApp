import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";
import Owner from "@/models/Owner";
import Leave from "@/models/Leave";

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

// PATCH /api/owner/leaves/[id] - Owner approves or rejects a leave request
export async function PATCH(request, { params }) {
  try {
    const auth = await getAuthenticatedOwner();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { owner } = auth;
    const resolvedParams = await params;
    const leaveId = resolvedParams.id;

    if (!leaveId) {
      return NextResponse.json({ error: "Leave ID is required." }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const { action, reviewNotes } = body;

    if (!["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be APPROVE or REJECT." },
        { status: 400 }
      );
    }

    const leave = await Leave.findOne({
      _id: leaveId,
      ownerId: owner._id,
    });

    if (!leave) {
      return NextResponse.json(
        { error: "Leave request not found or not authorized." },
        { status: 404 }
      );
    }

    const newStatus = action === "APPROVE" ? "APPROVED" : "REJECTED";
    leave.status = newStatus;
    leave.reviewedBy = owner._id;
    leave.reviewedAt = new Date();
    if (reviewNotes) {
      leave.reviewNotes = reviewNotes.trim();
    }

    await leave.save();

    return NextResponse.json({
      success: true,
      message: `Leave request for ${leave.employeeName || "employee"} has been ${newStatus.toLowerCase()}.`,
      leave,
    });
  } catch (error) {
    console.error("PATCH /api/owner/leaves/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update leave request" },
      { status: 500 }
    );
  }
}
