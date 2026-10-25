import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";
import Owner from "@/models/Owner";
import Organization from "@/models/Organization";
import Employee from "@/models/Employee";
import Attendance from "@/models/Attendance";
import Submission from "@/models/Submission";
import Leave from "@/models/Leave";

function getTodayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

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

  const organization = await Organization.findOne({ ownerId: owner._id });

  return { owner, organization };
}

// GET /api/owner/employees - Complete staff roster with live duty status & today's work
export async function GET(request) {
  try {
    const auth = await getAuthenticatedOwner();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { owner, organization } = auth;
    const { searchParams } = new URL(request.url);
    const branchFilter = searchParams.get("branchId") || "all";
    const deptFilter = searchParams.get("department") || "all";

    const query = {
      companyId: owner._id,
      approvalStatus: "APPROVED",
    };

    if (branchFilter && branchFilter !== "all") {
      query.branchId = branchFilter;
    }

    if (deptFilter && deptFilter !== "all") {
      query.department = deptFilter.toUpperCase();
    }

    const employees = await Employee.find(query).sort({ department: 1, name: 1 }).lean();
    const todayStr = getTodayString();
    const branchList = Array.isArray(organization?.branchList) ? organization.branchList : [];

    let onDutyCount = 0;
    let completedShiftCount = 0;
    let offDutyCount = 0;
    let onLeaveCount = 0;
    let reportsTodayCount = 0;
    let totalPendingLeaves = 0;

    const staffRoster = await Promise.all(
      employees.map(async (emp) => {
        // 1. Check Today's Attendance
        const todayAttendance = await Attendance.findOne({
          employeeId: emp._id,
          date: todayStr,
        }).lean();

        // 2. Check Active Leave Today
        const activeLeaveToday = await Leave.findOne({
          employeeId: emp._id,
          status: "APPROVED",
          startDate: { $lte: todayStr },
          endDate: { $gte: todayStr },
        }).lean();

        // 3. Check Pending Leaves
        const pendingLeaves = await Leave.find({
          employeeId: emp._id,
          status: "PENDING",
        })
          .sort({ createdAt: -1 })
          .lean();

        // 4. Check Today's Latest Submission
        const todaySubmission = await Submission.findOne({
          employeeId: emp._id,
          date: todayStr,
        })
          .sort({ createdAt: -1 })
          .lean();

        // Compute Duty Status
        let dutyStatus = "OFF_DUTY";
        if (activeLeaveToday) {
          dutyStatus = "ON_LEAVE";
          onLeaveCount++;
        } else if (todayAttendance?.punchIn && !todayAttendance?.punchOut) {
          dutyStatus = "ON_DUTY";
          onDutyCount++;
        } else if (todayAttendance?.punchOut) {
          dutyStatus = "COMPLETED";
          completedShiftCount++;
        } else {
          dutyStatus = "OFF_DUTY";
          offDutyCount++;
        }

        if (todaySubmission) {
          reportsTodayCount++;
        }

        totalPendingLeaves += pendingLeaves.length;

        // Match branch display name
        const matchedBranch = branchList.find((b) => b.branchId === emp.branchId);
        const displayBranchName =
          matchedBranch?.name || emp.branchName || "Main HQ";

        return {
          id: emp._id.toString(),
          _id: emp._id.toString(),
          name: emp.name,
          email: emp.email,
          phoneNumber: emp.phoneNumber || "",
          department: emp.department || "OPERATIONS",
          postLevel: emp.postLevel || "ASSISTANT",
          postTitle: emp.postTitle || (emp.postLevel || "ASSISTANT").replace(/_/g, " "),
          workDescription: emp.workDescription || "General departmental duties.",
          branchId: emp.branchId || "branch-1",
          branchName: displayBranchName,
          joinedAt: emp.approvedAt || emp.createdAt,
          dutyStatus, // "ON_DUTY" | "COMPLETED" | "OFF_DUTY" | "ON_LEAVE"
          attendance: todayAttendance
            ? {
                id: todayAttendance._id,
                date: todayAttendance.date,
                punchIn: todayAttendance.punchIn,
                punchOut: todayAttendance.punchOut,
                durationMinutes: todayAttendance.durationMinutes || 0,
                shiftType: todayAttendance.shiftType || "GENERAL",
                punchInNotes: todayAttendance.punchInNotes || "",
                punchOutNotes: todayAttendance.punchOutNotes || "",
                isPunchedIn: !!todayAttendance.punchIn && !todayAttendance.punchOut,
              }
            : null,
          submission: todaySubmission
            ? {
                id: todaySubmission._id,
                title: todaySubmission.title,
                tasksCompleted: todaySubmission.tasksCompleted || [],
                blockers: todaySubmission.blockers || "",
                summary: todaySubmission.summary || "",
                submittedAt: todaySubmission.createdAt,
              }
            : null,
          activeLeave: activeLeaveToday
            ? {
                id: activeLeaveToday._id,
                leaveType: activeLeaveToday.leaveType,
                startDate: activeLeaveToday.startDate,
                endDate: activeLeaveToday.endDate,
                totalDays: activeLeaveToday.totalDays,
                reason: activeLeaveToday.reason,
              }
            : null,
          pendingLeaves: pendingLeaves.map((pl) => ({
            id: pl._id,
            leaveType: pl.leaveType,
            startDate: pl.startDate,
            endDate: pl.endDate,
            totalDays: pl.totalDays,
            reason: pl.reason,
            createdAt: pl.createdAt,
          })),
        };
      })
    );

    return NextResponse.json({
      success: true,
      employees: staffRoster,
      stats: {
        totalStaff: staffRoster.length,
        onDutyCount,
        completedShiftCount,
        offDutyCount,
        onLeaveCount,
        reportsTodayCount,
        pendingLeavesCount: totalPendingLeaves,
      },
      today: todayStr,
    });
  } catch (error) {
    console.error("GET /api/owner/employees error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch employees roster" },
      { status: 500 }
    );
  }
}
