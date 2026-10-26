import { NextResponse } from "next/server";
import { getAuthenticatedSuperAdmin } from "@/lib/adminAuth";
import connectDB from "@/lib/mongodb";
import Owner from "@/models/Owner";
import Employee from "@/models/Employee";
import Organization from "@/models/Organization";
import CA from "@/models/CA";
import Attendance from "@/models/Attendance";
import Submission from "@/models/Submission";
import Leave from "@/models/Leave";
import TaskAssignment from "@/models/TaskAssignment";
import mongoose from "mongoose";

export async function GET() {
  try {
    const auth = await getAuthenticatedSuperAdmin();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    await connectDB();

    // Parallel metric counts
    const [
      totalOwners,
      totalEmployees,
      totalCAs,
      totalOrgs,
      totalAttendances,
      liveOnDuty,
      totalSubmissions,
      totalLeaves,
      totalTasks,
      recentOwners,
      recentEmployees,
      recentSubmissions,
    ] = await Promise.all([
      Owner.countDocuments(),
      Employee.countDocuments(),
      CA.countDocuments(),
      Organization.countDocuments(),
      Attendance.countDocuments(),
      Attendance.countDocuments({
        punchIn: { $exists: true, $ne: null },
        punchOut: null,
      }),
      Submission.countDocuments(),
      Leave.countDocuments(),
      TaskAssignment.countDocuments(),
      Owner.find().sort({ createdAt: -1 }).limit(5).lean(),
      Employee.find().sort({ createdAt: -1 }).limit(5).lean(),
      Submission.find().sort({ createdAt: -1 }).limit(5).lean(),
    ]);

    // Department breakdown of employees
    const [opsCount, salesCount, logCount, finCount] = await Promise.all([
      Employee.countDocuments({ department: "OPERATIONS" }),
      Employee.countDocuments({ department: "SALES" }),
      Employee.countDocuments({ department: "LOGISTICS" }),
      Employee.countDocuments({ department: "FINANCIAL" }),
    ]);

    // Submissions with attachments count
    const submissionsWithFiles = await Submission.countDocuments({
      "files.0": { $exists: true },
    });

    // DB Connection Status
    const dbState = mongoose.connection.readyState;
    const dbStateMap = {
      0: "Disconnected",
      1: "Connected",
      2: "Connecting",
      3: "Disconnecting",
    };

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers: totalOwners + totalEmployees + totalCAs,
        totalOwners,
        totalEmployees,
        totalCAs,
        totalOrganizations: totalOrgs,
        liveOnDutyStaff: liveOnDuty,
        totalAttendancePunches: totalAttendances,
        totalSubmissions,
        submissionsWithFiles,
        totalLeaves,
        totalTasks,
        departmentDistribution: {
          OPERATIONS: opsCount,
          SALES: salesCount,
          LOGISTICS: logCount,
          FINANCIAL: finCount,
        },
      },
      collections: {
        owners: totalOwners,
        employees: totalEmployees,
        cas: totalCAs,
        organizations: totalOrgs,
        attendances: totalAttendances,
        submissions: totalSubmissions,
        leaves: totalLeaves,
        taskAssignments: totalTasks,
      },
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        dbStatus: dbStateMap[dbState] || "Unknown",
        dbName: mongoose.connection.name || "production",
        uptimeSeconds: process.uptime(),
        memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      },
      recentActivity: {
        owners: recentOwners.map((o) => ({
          id: o._id,
          name: o.name,
          email: o.email,
          phone: o.phoneNumber,
          plan: o.planName || "Trial",
          createdAt: o.createdAt,
        })),
        employees: recentEmployees.map((e) => ({
          id: e._id,
          name: e.name,
          department: e.department,
          post: e.postTitle || e.postLevel,
          phone: e.phoneNumber,
          createdAt: e.createdAt,
        })),
        submissions: recentSubmissions.map((s) => ({
          id: s._id,
          employeeName: s.employeeName,
          department: s.department,
          filesCount: s.files?.length || 0,
          date: s.date,
          createdAt: s.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error("SuperAdmin Metrics Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch admin metrics" },
      { status: 500 }
    );
  }
}
