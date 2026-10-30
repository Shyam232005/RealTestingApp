import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import CA from "@/models/CA";
import CAStaff from "@/models/CAStaff";
import Owner from "@/models/Owner";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function POST(request) {
  try {
    await connectDB();
    const cookieStore = await cookies();
    const token = cookieStore.get("crown_session")?.value;

    if (!token) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return NextResponse.json({ error: "Invalid session." }, { status: 401 });
    }

    const ca = await CA.findById(decoded.userId) || (decoded.isSuperAdmin ? await CA.findOne() : null);
    if (!ca) {
      return NextResponse.json({ error: "Only CA Partner can allocate client files." }, { status: 403 });
    }

    const { staffId, clientId } = await request.json();
    if (!staffId || !clientId) {
      return NextResponse.json({ error: "staffId and clientId are required." }, { status: 400 });
    }

    const staff = await CAStaff.findById(staffId);
    if (!staff) {
      return NextResponse.json({ error: "Staff member not found." }, { status: 404 });
    }

    const client = await Owner.findById(clientId);
    if (!client) {
      return NextResponse.json({ error: "Client company not found." }, { status: 404 });
    }

    if (!staff.assignedCompanies) staff.assignedCompanies = [];
    if (!staff.assignedCompanies.some((id) => id.toString() === clientId.toString())) {
      staff.assignedCompanies.push(clientId);
    }

    if (!staff.assignedClients) staff.assignedClients = [];
    if (!staff.assignedClients.some((id) => id.toString() === clientId.toString())) {
      staff.assignedClients.push(clientId);
    }

    await staff.save();

    return NextResponse.json({
      success: true,
      message: `Assigned ${client.name} to ${staff.name}!`,
      staff: {
        id: staff._id.toString(),
        name: staff.name,
        assignedCount: staff.assignedCompanies.length,
      },
    });
  } catch (error) {
    console.error("POST /api/ca/staff/assign-client error:", error);
    return NextResponse.json({ error: error.message || "Failed to assign client." }, { status: 500 });
  }
}
