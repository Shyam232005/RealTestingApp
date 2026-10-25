import { NextResponse } from "next/server";
import { getAuthenticatedEmployee } from "@/lib/employeeAuth";
import Attendance from "@/models/Attendance";
import { createOwnerNotification } from "@/lib/notifications";

function getTodayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function GET() {
  try {
    const auth = await getAuthenticatedEmployee({ requireApproved: true });
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { employee } = auth;
    const todayStr = getTodayString();

    const todayRecord = await Attendance.findOne({
      employeeId: employee._id,
      date: todayStr,
    });

    const pastRecords = await Attendance.find({
      employeeId: employee._id,
    })
      .sort({ date: -1, punchIn: -1 })
      .limit(30)
      .lean();

    return NextResponse.json({
      success: true,
      today: todayRecord
        ? {
            id: todayRecord._id,
            date: todayRecord.date,
            punchIn: todayRecord.punchIn,
            punchOut: todayRecord.punchOut,
            durationMinutes: todayRecord.durationMinutes,
            status: todayRecord.status,
            shiftType: todayRecord.shiftType,
            punchInNotes: todayRecord.punchInNotes,
            punchOutNotes: todayRecord.punchOutNotes,
            isPunchedIn: !!todayRecord.punchIn && !todayRecord.punchOut,
            isCompleted: !!todayRecord.punchOut,
            sessions: todayRecord.sessions || [],
          }
        : null,
      history: pastRecords,
    });
  } catch (error) {
    console.error("Attendance GET Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load attendance" },
      { status: 500 }
    );
  }
}

// Punch In (supports instant re-punch in if previously punched out)
export async function POST(request) {
  try {
    const auth = await getAuthenticatedEmployee({ requireApproved: true });
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { employee, owner } = auth;
    const todayStr = getTodayString();

    const body = await request.json().catch(() => ({}));
    const { shiftType, punchInNotes } = body;
    const chosenShift = shiftType || "GENERAL";
    const chosenNotes = (punchInNotes || "").trim();

    // Check if attendance document already exists for today
    const existing = await Attendance.findOne({
      employeeId: employee._id,
      date: todayStr,
    });

    if (existing) {
      // If currently active (not punched out), don't allow duplicate active punch-in
      if (!existing.punchOut) {
        return NextResponse.json(
          { error: "You are already actively punched in for this shift.", attendance: existing },
          { status: 400 }
        );
      }

      // User has punched out previously today: Allow instant punch in again!
      const now = new Date();
      const sessionCount = (existing.sessions?.length || 1) + 1;

      existing.punchIn = now;
      existing.punchOut = null;
      existing.shiftType = chosenShift;
      existing.punchInNotes = chosenNotes;
      existing.punchOutNotes = "";
      existing.status = "PRESENT";

      if (!Array.isArray(existing.sessions)) {
        existing.sessions = [];
      }
      existing.sessions.push({
        sessionIndex: sessionCount,
        punchIn: now,
        punchOut: null,
        durationMinutes: 0,
        shiftType: chosenShift,
        punchInNotes: chosenNotes,
        punchOutNotes: "",
      });

      await existing.save();

      // Notify owner in real-time
      const shiftLabel = chosenShift.toLowerCase();
      const branchLabel = employee.branchName || "Main HQ";
      await createOwnerNotification({
        ownerId: owner._id,
        companyId: owner._id,
        employeeId: employee._id,
        employeeName: employee.name,
        type: "ATTENDANCE_PUNCH_IN",
        title: `${employee.name} punched in again`,
        message: `${employee.name} (${employee.postTitle || employee.postLevel}) punched in again for ${shiftLabel} shift (Session #${sessionCount}) at ${branchLabel}.`,
        linkTab: "team",
        metadata: {
          attendanceId: existing._id,
          shiftType: chosenShift,
          branchId: existing.branchId,
          department: employee.department,
          sessionIndex: sessionCount,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Punched in successfully! Shift session #${sessionCount} started.`,
        attendance: {
          id: existing._id,
          date: existing.date,
          punchIn: existing.punchIn,
          punchOut: existing.punchOut,
          durationMinutes: existing.durationMinutes,
          status: existing.status,
          shiftType: existing.shiftType,
          punchInNotes: existing.punchInNotes,
          punchOutNotes: existing.punchOutNotes,
          isPunchedIn: true,
          isCompleted: false,
          sessions: existing.sessions,
        },
      });
    }

    // First punch in of the day
    const now = new Date();
    const newAttendance = new Attendance({
      employeeId: employee._id,
      ownerId: owner._id,
      companyId: owner._id,
      branchId: employee.branchId || "branch-1",
      branchName: employee.branchName || "Main HQ",
      department: employee.department || "OPERATIONS",
      postLevel: employee.postLevel || "ASSISTANT",
      date: todayStr,
      punchIn: now,
      punchOut: null,
      durationMinutes: 0,
      status: "PRESENT",
      shiftType: chosenShift,
      punchInNotes: chosenNotes,
      punchOutNotes: "",
      sessions: [
        {
          sessionIndex: 1,
          punchIn: now,
          punchOut: null,
          durationMinutes: 0,
          shiftType: chosenShift,
          punchInNotes: chosenNotes,
          punchOutNotes: "",
        },
      ],
    });

    await newAttendance.save();

    // Notify business owner in real-time
    const shiftLabel = chosenShift.toLowerCase();
    const branchLabel = employee.branchName || "Main HQ";
    await createOwnerNotification({
      ownerId: owner._id,
      companyId: owner._id,
      employeeId: employee._id,
      employeeName: employee.name,
      type: "ATTENDANCE_PUNCH_IN",
      title: `${employee.name} punched in`,
      message: `${employee.name} (${employee.postTitle || employee.postLevel}) punched in for ${shiftLabel} shift at ${branchLabel}.`,
      linkTab: "team",
      metadata: {
        attendanceId: newAttendance._id,
        shiftType: newAttendance.shiftType,
        branchId: newAttendance.branchId,
        department: employee.department,
        sessionIndex: 1,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Punch-in successful! Your shift has started.",
      attendance: {
        id: newAttendance._id,
        date: newAttendance.date,
        punchIn: newAttendance.punchIn,
        punchOut: newAttendance.punchOut,
        durationMinutes: newAttendance.durationMinutes,
        status: newAttendance.status,
        shiftType: newAttendance.shiftType,
        punchInNotes: newAttendance.punchInNotes,
        punchOutNotes: newAttendance.punchOutNotes,
        isPunchedIn: true,
        isCompleted: false,
        sessions: newAttendance.sessions,
      },
    });
  } catch (error) {
    console.error("Punch In Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to record punch-in" },
      { status: 500 }
    );
  }
}

// Punch Out
export async function PUT(request) {
  try {
    const auth = await getAuthenticatedEmployee({ requireApproved: true });
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { employee } = auth;
    const todayStr = getTodayString();

    const record = await Attendance.findOne({
      employeeId: employee._id,
      date: todayStr,
    });

    if (!record) {
      return NextResponse.json(
        { error: "No punch-in found for today. You cannot punch out without punching in first." },
        { status: 400 }
      );
    }

    if (record.punchOut) {
      return NextResponse.json(
        { error: "You have already completed your punch-out for this session." },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { punchOutNotes } = body;

    const punchOutTime = new Date();
    const sessionDiffMs = punchOutTime.getTime() - new Date(record.punchIn).getTime();
    const sessionMinutes = Math.max(1, Math.round(sessionDiffMs / 60000));

    // Update active session
    if (Array.isArray(record.sessions) && record.sessions.length > 0) {
      const activeSession = record.sessions[record.sessions.length - 1];
      if (!activeSession.punchOut) {
        activeSession.punchOut = punchOutTime;
        activeSession.durationMinutes = sessionMinutes;
        if (punchOutNotes) {
          activeSession.punchOutNotes = punchOutNotes.trim();
        }
      }
    }

    // Cumulative duration across all sessions today
    const totalMinutes =
      (record.sessions || []).reduce((sum, s) => sum + (Number(s.durationMinutes) || 0), 0) ||
      ((record.durationMinutes || 0) + sessionMinutes);

    record.punchOut = punchOutTime;
    record.durationMinutes = totalMinutes;
    record.status = "COMPLETED";
    if (punchOutNotes) {
      record.punchOutNotes = punchOutNotes.trim();
    }

    await record.save();

    // Notify business owner in real-time
    const sessionHrs = Math.floor(sessionMinutes / 60);
    const sessionMins = sessionMinutes % 60;
    const sessionDurationText = sessionHrs > 0 ? `${sessionHrs}h ${sessionMins}m` : `${sessionMins}m`;

    const totalHrs = Math.floor(totalMinutes / 60);
    const totalMins = totalMinutes % 60;
    const totalDurationText = totalHrs > 0 ? `${totalHrs}h ${totalMins}m` : `${totalMins}m`;
    const branchLabel = employee.branchName || "Main HQ";

    await createOwnerNotification({
      ownerId: record.ownerId,
      companyId: record.companyId || record.ownerId,
      employeeId: employee._id,
      employeeName: employee.name,
      type: "ATTENDANCE_PUNCH_OUT",
      title: `${employee.name} punched out`,
      message: `${employee.name} completed shift session at ${branchLabel} (${sessionDurationText} session, ${totalDurationText} total today).`,
      linkTab: "team",
      metadata: {
        attendanceId: record._id,
        durationMinutes: totalMinutes,
        sessionMinutes,
        branchId: record.branchId,
        department: employee.department,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Punch-out recorded successfully! Shift logged for the owner.",
      attendance: {
        id: record._id,
        date: record.date,
        punchIn: record.punchIn,
        punchOut: record.punchOut,
        durationMinutes: record.durationMinutes,
        status: record.status,
        shiftType: record.shiftType,
        punchInNotes: record.punchInNotes,
        punchOutNotes: record.punchOutNotes,
        isPunchedIn: false,
        isCompleted: true,
        sessions: record.sessions,
      },
    });
  } catch (error) {
    console.error("Punch Out Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to record punch-out" },
      { status: 500 }
    );
  }
}
