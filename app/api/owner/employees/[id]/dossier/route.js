import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";
import Owner from "@/models/Owner";
import Employee from "@/models/Employee";
import Attendance from "@/models/Attendance";
import Submission from "@/models/Submission";
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

// GET /api/owner/employees/[id]/dossier - Complete activity and history for an employee
export async function GET(request, { params }) {
  try {
    const auth = await getAuthenticatedOwner();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { owner } = auth;
    const resolvedParams = await params;
    const employeeId = resolvedParams.id;

    if (!employeeId) {
      return NextResponse.json({ error: "Employee ID is required." }, { status: 400 });
    }

    const employee = await Employee.findOne({
      _id: employeeId,
      companyId: owner._id,
    }).lean();

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found under your organization." },
        { status: 404 }
      );
    }

    const [submissions, attendanceHistory, leaves] = await Promise.all([
      Submission.find({ employeeId: employee._id })
        .sort({ date: -1, createdAt: -1 })
        .limit(50)
        .lean(),
      Attendance.find({ employeeId: employee._id })
        .sort({ date: -1, punchIn: -1 })
        .limit(60)
        .lean(),
      Leave.find({ employeeId: employee._id })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),
    ]);

    return NextResponse.json({
      success: true,
      employee: {
        id: employee._id.toString(),
        name: employee.name,
        email: employee.email,
        phoneNumber: employee.phoneNumber || "",
        department: employee.department,
        postLevel: employee.postLevel,
        postTitle: employee.postTitle || (employee.postLevel || "").replace(/_/g, " "),
        workDescription: employee.workDescription,
        branchId: employee.branchId,
        branchName: employee.branchName,
        approvalStatus: employee.approvalStatus,
        createdAt: employee.createdAt,
        approvedAt: employee.approvedAt,
      },
      submissions,
      attendanceHistory,
      leaves,
    });
  } catch (error) {
    console.error("GET /api/owner/employees/[id]/dossier error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch employee dossier" },
      { status: 500 }
    );
  }
}
