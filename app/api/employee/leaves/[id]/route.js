import { NextResponse } from "next/server";
import { getAuthenticatedEmployee } from "@/lib/employeeAuth";
import Leave from "@/models/Leave";

export async function DELETE(request, { params }) {
  try {
    const auth = await getAuthenticatedEmployee({ requireApproved: true });
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { employee } = auth;
    const { id } = await params;

    const leave = await Leave.findOne({
      _id: id,
      employeeId: employee._id,
    });

    if (!leave) {
      return NextResponse.json({ error: "Leave request not found." }, { status: 404 });
    }

    if (leave.status !== "PENDING") {
      return NextResponse.json(
        { error: `Cannot cancel a leave request that is already ${leave.status.toLowerCase()}.` },
        { status: 400 }
      );
    }

    leave.status = "CANCELLED";
    await leave.save();

    return NextResponse.json({
      success: true,
      message: "Leave application cancelled successfully.",
    });
  } catch (error) {
    console.error("Leave Cancel Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to cancel leave" },
      { status: 500 }
    );
  }
}
