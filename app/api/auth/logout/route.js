import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";
import Employee from "@/models/Employee";
import Attendance from "@/models/Attendance";
import { createOwnerNotification } from "@/lib/notifications";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("crown_session")?.value;

    // Auto punch-out employee if active before destroying session
    if (sessionToken && process.env.JWT_SECRET) {
      try {
        const decoded = jwt.verify(sessionToken, process.env.JWT_SECRET);
        if (
          decoded?.userId &&
          (decoded.normalizedRole === "EMPLOYEE" ||
            decoded.role === "Employee" ||
            decoded.role === "EMPLOYEE")
        ) {
          await connectDB();
          const employee = await Employee.findById(decoded.userId);
          if (employee) {
            // Find any active attendance with punchIn but no punchOut
            const activeAttendance = await Attendance.findOne({
              employeeId: employee._id,
              punchIn: { $exists: true, $ne: null },
              punchOut: null,
            }).sort({ punchIn: -1 });

            if (activeAttendance) {
              const punchOutTime = new Date();
              const sessionDiffMs =
                punchOutTime.getTime() - new Date(activeAttendance.punchIn).getTime();
              const sessionMinutes = Math.max(1, Math.round(sessionDiffMs / 60000));

              // Finalize active session
              if (
                Array.isArray(activeAttendance.sessions) &&
                activeAttendance.sessions.length > 0
              ) {
                const activeSession =
                  activeAttendance.sessions[activeAttendance.sessions.length - 1];
                if (!activeSession.punchOut) {
                  activeSession.punchOut = punchOutTime;
                  activeSession.durationMinutes = sessionMinutes;
                  activeSession.punchOutNotes = activeSession.punchOutNotes
                    ? `${activeSession.punchOutNotes} (Auto-punched out on logout)`
                    : "Auto-punched out on user logout";
                }
              }

              // Cumulative duration across all sessions today
              const totalMinutes =
                (activeAttendance.sessions || []).reduce(
                  (sum, s) => sum + (Number(s.durationMinutes) || 0),
                  0
                ) || ((activeAttendance.durationMinutes || 0) + sessionMinutes);

              activeAttendance.punchOut = punchOutTime;
              activeAttendance.durationMinutes = totalMinutes;
              activeAttendance.status = "COMPLETED";
              activeAttendance.punchOutNotes = activeAttendance.punchOutNotes
                ? `${activeAttendance.punchOutNotes} (Auto-punched out on logout)`
                : "Auto-punched out on user logout";

              await activeAttendance.save();

              // Notify business owner in real-time
              const ownerTargetId =
                activeAttendance.ownerId ||
                employee.companyId ||
                employee.ownerId;

              if (ownerTargetId) {
                const sessionHrs = Math.floor(sessionMinutes / 60);
                const sessionMins = sessionMinutes % 60;
                const durationText =
                  sessionHrs > 0 ? `${sessionHrs}h ${sessionMins}m` : `${sessionMins}m`;
                const branchLabel = employee.branchName || "Main HQ";

                await createOwnerNotification({
                  ownerId: ownerTargetId,
                  companyId: ownerTargetId,
                  employeeId: employee._id,
                  employeeName: employee.name,
                  type: "ATTENDANCE_PUNCH_OUT",
                  title: `${employee.name} auto-punched out on logout`,
                  message: `${employee.name} logged out without manual punch-out at ${branchLabel}. Shift was automatically concluded (${durationText}).`,
                  linkTab: "team",
                  metadata: {
                    attendanceId: activeAttendance._id,
                    durationMinutes: totalMinutes,
                    sessionMinutes,
                    autoPunchedOut: true,
                    branchId: activeAttendance.branchId,
                    department: employee.department,
                  },
                });
              }
            }
          }
        }
      } catch (authErr) {
        console.warn("Could not auto punch-out on logout:", authErr.message);
      }
    }

    // 1. Delete standard session cookies
    cookieStore.delete("crown_session");
    cookieStore.delete("fineops_role");
    cookieStore.delete("fineops_user_id");

    // 2. Clear all other cookies in the request
    const allCookies = cookieStore.getAll();
    for (const cookie of allCookies) {
      cookieStore.delete(cookie.name);
      cookieStore.set({
        name: cookie.name,
        value: "",
        path: "/",
        maxAge: 0,
        expires: new Date(0),
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
      });
    }

    // 3. Explicitly overwrite crown_session with maxAge: 0 and expired date
    cookieStore.set({
      name: "crown_session",
      value: "",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    cookieStore.set({
      name: "fineops_role",
      value: "",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });

    cookieStore.set({
      name: "fineops_user_id",
      value: "",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });

    const response = NextResponse.json(
      {
        success: true,
        message: "Logged out successfully. All browser session data cleared.",
      },
      { status: 200 }
    );

    // Standard W3C header instructing browser to wipe storage, cookies & cache
    response.headers.set("Clear-Site-Data", '"cache", "cookies", "storage"');
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");

    return response;
  } catch (error) {
    console.error("Logout API Error:", error);
    return NextResponse.json(
      { success: false, error: "Logout failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return POST();
}
