import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getAuthenticatedSuperAdmin } from "@/lib/adminAuth";
import connectDB from "@/lib/mongodb";
import Owner from "@/models/Owner";
import Employee from "@/models/Employee";
import Organization from "@/models/Organization";
import CA from "@/models/CA";
import CAStaff from "@/models/CAStaff";
import CATask from "@/models/CATask";
import Attendance from "@/models/Attendance";
import Submission from "@/models/Submission";
import TaskAssignment from "@/models/TaskAssignment";
import Leave from "@/models/Leave";
import { buildFullPlanDetails } from "@/lib/subscriptionHelper";
import { createEmployeeNotification } from "@/lib/notifications";

// GET /api/admin/users/[id] - Fetch comprehensive user profile details
export async function GET(request, { params }) {
  try {
    const auth = await getAuthenticatedSuperAdmin();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    await connectDB();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const requestedType = searchParams.get("type"); // OWNER | EMPLOYEE | CA | CA_STAFF

    // 1. Try finding Owner
    if (!requestedType || requestedType === "OWNER") {
      const owner = await Owner.findById(id).select("-password").lean();
      if (owner) {
        const orgFilter = {
          $or: [
            { ownerId: owner._id },
            ...(owner.organizationId
              ? [{ _id: { $in: Array.isArray(owner.organizationId) ? owner.organizationId : [owner.organizationId] } }]
              : []),
          ],
        };

        const [org, linkedCA, employees, totalAttendances, totalSubmissions, totalTasks, totalLeaves] =
          await Promise.all([
            Organization.findOne(orgFilter).lean(),
            owner.linkedCA ? CA.findById(owner.linkedCA).select("-password").lean() : null,
            Employee.find(
              { companyId: owner._id },
              "name email phoneNumber department postLevel postTitle branchName approvalStatus isRegistered createdAt"
            )
              .sort({ createdAt: -1 })
              .lean(),
            Attendance.countDocuments({ companyId: owner._id }),
            Submission.countDocuments({ companyId: owner._id }),
            TaskAssignment.countDocuments({ companyId: owner._id }),
            Leave.countDocuments({ companyId: owner._id }),
          ]);

        const todayStr = new Date().toISOString().slice(0, 10);
        const liveOnDutyCount = await Attendance.countDocuments({
          companyId: owner._id,
          date: todayStr,
          punchIn: { $exists: true, $ne: null },
          punchOut: null,
        });

        const deptBreakdown = {
          OPERATIONS: 0,
          SALES: 0,
          LOGISTICS: 0,
          FINANCIAL: 0,
          RETAIL: 0,
        };
        employees.forEach((emp) => {
          const d = (emp.department || "OPERATIONS").toUpperCase();
          if (deptBreakdown[d] !== undefined) deptBreakdown[d]++;
        });

        const planDetails = buildFullPlanDetails(owner, org, employees.length);

        return NextResponse.json({
          success: true,
          userType: "OWNER",
          user: {
            _id: owner._id,
            name: owner.name,
            email: owner.email,
            phoneNumber: owner.phoneNumber,
            role: "Owner",
            userType: "OWNER",
            isActive: owner.isActive !== false,
            isSetupComplete: !!owner.isSetupComplete,
            inviteCode: owner.inviteCode || "N/A",
            createdAt: owner.createdAt,
            dataSharingStatus: owner.dataSharingStatus || "NONE",
            planName: planDetails.planName,
            planDetails,
            subscription: {
              planName: planDetails.planName,
              cycle: planDetails.cycle,
              status: planDetails.status,
              startDate: planDetails.startDate,
              endDate: planDetails.endDate,
              daysRemaining: planDetails.daysRemaining,
              isExpiringSoon: planDetails.isExpiringSoon,
              isExpired: planDetails.isExpired,
              hasUsedTrial: planDetails.hasUsedTrial,
              paymentCustomerId: owner.subscription?.paymentCustomerId || null,
              paymentSubscriptionId: owner.subscription?.paymentSubscriptionId || null,
              paymentStatus: planDetails.paymentStatus,
            },
            organization: org
              ? {
                  _id: org._id,
                  name: org.RegisterName || org.name || `${owner.name}'s Organization`,
                  gst: org.GST || "N/A",
                  location: org.location || "Headquarters",
                  industry: org.industry || "General Industry",
                  totalBranches: Array.isArray(org.branchList) ? org.branchList.length : org.branches || 1,
                  branchList: org.branchList || [],
                  bankName: org.BankName || "N/A",
                  ifsc: org.IFSC || "N/A",
                  accNo: org.AccNo || "N/A",
                  stockCatalogCount: org.stockCatalog?.length || 0,
                }
              : null,
            linkedCA: linkedCA
              ? {
                  _id: linkedCA._id,
                  name: linkedCA.name,
                  email: linkedCA.email,
                  phoneNumber: linkedCA.phoneNumber,
                  firmName: linkedCA.firmName || "N/A",
                  icaiNumber: linkedCA.icaiNumber || "N/A",
                  dataSharingStatus: owner.dataSharingStatus || "CONNECTED",
                }
              : null,
            team: {
              totalEmployees: employees.length,
              liveOnDutyCount,
              deptBreakdown,
              members: employees,
            },
            stats: {
              totalAttendances,
              totalSubmissions,
              totalTasks,
              totalLeaves,
            },
          },
        });
      }
    }

    // 2. Try finding Employee
    if (!requestedType || requestedType === "EMPLOYEE") {
      const employee = await Employee.findById(id).select("-password").lean();
      if (employee) {
        const ownerId = employee.companyId || employee.ownerId;
        const [owner, org, totalAttendances, totalSubmissions, totalTasks, totalLeaves, recentPunches, recentSubs, recentTasks, recentLeaves] =
          await Promise.all([
            ownerId ? Owner.findById(ownerId, "name email phoneNumber planName").lean() : null,
            ownerId ? Organization.findOne({ ownerId }, "RegisterName location GST branchList").lean() : null,
            Attendance.countDocuments({ employeeId: employee._id }),
            Submission.countDocuments({ employeeId: employee._id }),
            TaskAssignment.countDocuments({ assignedTo: employee._id }),
            Leave.countDocuments({ employeeId: employee._id }),
            Attendance.find({ employeeId: employee._id }).sort({ date: -1, createdAt: -1 }).limit(7).lean(),
            Submission.find({ employeeId: employee._id }).sort({ createdAt: -1 }).limit(10).lean(),
            TaskAssignment.find({ assignedTo: employee._id }).sort({ createdAt: -1 }).limit(10).lean(),
            Leave.find({ employeeId: employee._id }).sort({ createdAt: -1 }).limit(7).lean(),
          ]);

        const todayStr = new Date().toISOString().slice(0, 10);
        const todayAttendance = recentPunches.find((p) => p.date === todayStr);
        let isCurrentlyPunchedIn = false;
        let todayPunchInTime = null;
        let todayPunchOutTime = null;
        let todayDurationMinutes = 0;

        if (todayAttendance) {
          if (Array.isArray(todayAttendance.sessions) && todayAttendance.sessions.length > 0) {
            const activeSession = todayAttendance.sessions.find((s) => s.punchIn && !s.punchOut);
            isCurrentlyPunchedIn = !!activeSession;
            const firstSession = todayAttendance.sessions[0];
            const lastSession = todayAttendance.sessions[todayAttendance.sessions.length - 1];
            todayPunchInTime = firstSession?.punchIn || null;
            todayPunchOutTime = lastSession?.punchOut || null;
            todayDurationMinutes = todayAttendance.sessions.reduce(
              (acc, s) => acc + (s.durationMinutes || 0),
              0
            );
          } else {
            isCurrentlyPunchedIn = !!todayAttendance.punchIn && !todayAttendance.punchOut;
            todayPunchInTime = todayAttendance.punchIn || null;
            todayPunchOutTime = todayAttendance.punchOut || null;
            todayDurationMinutes = todayAttendance.durationMinutes || 0;
          }
        }

        return NextResponse.json({
          success: true,
          userType: "EMPLOYEE",
          user: {
            _id: employee._id,
            name: employee.name,
            email: employee.email,
            phoneNumber: employee.phoneNumber,
            role: "Employee",
            userType: "EMPLOYEE",
            department: employee.department || "OPERATIONS",
            postLevel: employee.postLevel || "ASSISTANT",
            postTitle: employee.postTitle || employee.postLevel,
            branchId: employee.branchId || "branch-1",
            branchName: employee.branchName || "Main HQ",
            approvalStatus: employee.approvalStatus || "APPROVED",
            isRegistered: !!employee.isRegistered,
            createdAt: employee.createdAt,
            company: {
              id: owner?._id,
              name: org?.RegisterName || owner?.name || "Crown Enterprise",
              ownerName: owner?.name || "N/A",
              email: owner?.email,
              phone: owner?.phoneNumber,
              location: org?.location || "Headquarters",
              gst: org?.GST || "N/A",
            },
            attendanceSummary: {
              totalPunches: totalAttendances,
              isCurrentlyPunchedIn,
              todayPunchInTime,
              todayPunchOutTime,
              todayDurationMinutes,
              recentLogs: recentPunches,
            },
            submissionsSummary: {
              totalSubmissions,
              recentSubmissions: recentSubs,
            },
            tasksSummary: {
              totalTasks,
              recentTasks,
            },
            leavesSummary: {
              totalLeaves,
              recentLeaves,
            },
          },
        });
      }
    }

    // 3. Try finding CA Partner
    if (!requestedType || requestedType === "CA") {
      const ca = await CA.findById(id).select("-password").lean();
      if (ca) {
        const [connectedOwners, staffMembers, tasks] = await Promise.all([
          Owner.find(
            { linkedCA: ca._id },
            "name email phoneNumber isProfileComplete dataSharingStatus createdAt"
          ).lean(),
          CAStaff.find({ $or: [{ caFirmId: ca._id }, { caId: ca._id }] }).lean(),
          CATask.find({ caFirmId: ca._id }).sort({ createdAt: -1 }).limit(10).lean(),
        ]);

        const ownerIds = connectedOwners.map((o) => o._id);
        const orgs = await Organization.find(
          { ownerId: { $in: ownerIds } },
          "ownerId RegisterName location GST branches"
        ).lean();

        const orgMap = {};
        orgs.forEach((o) => {
          orgMap[o.ownerId.toString()] = o;
        });

        const clientsEnriched = connectedOwners.map((o) => {
          const comp = orgMap[o._id.toString()];
          return {
            ownerId: o._id,
            name: o.name,
            email: o.email,
            phone: o.phoneNumber,
            companyName: comp?.RegisterName || `${o.name}'s Business`,
            location: comp?.location || "N/A",
            gst: comp?.GST || "N/A",
            dataSharingStatus: o.dataSharingStatus || "CONNECTED",
            joinedAt: o.createdAt,
          };
        });

        return NextResponse.json({
          success: true,
          userType: "CA",
          user: {
            _id: ca._id,
            name: ca.name,
            email: ca.email,
            phoneNumber: ca.phoneNumber,
            role: "CA",
            userType: "CA",
            firmName: ca.firmName || `${ca.name} & Associates`,
            partnerName: ca.partnerName || ca.name,
            icaiNumber: ca.icaiNumber || "N/A",
            officeAddress: ca.officeAddress || "N/A",
            digitalStampUrl: ca.digitalStampUrl || "",
            staffInviteCode: ca.staffInviteCode || ca.inviteCode,
            caInviteCode: ca.caInviteCode,
            isActive: ca.isActive !== false,
            createdAt: ca.createdAt,
            connectedClients: clientsEnriched,
            totalClientsCount: clientsEnriched.length,
            staffTeam: staffMembers.map((s) => ({
              _id: s._id,
              name: s.name,
              email: s.email,
              phone: s.phoneNumber,
              roleInFirm: s.roleInFirm,
            })),
            staffCount: staffMembers.length,
            recentTasks: tasks,
          },
        });
      }
    }

    // 4. Try finding CA Staff & Article Assistant
    if (!requestedType || requestedType === "CA_STAFF" || requestedType === "STAFF") {
      const staff = await CAStaff.findById(id)
        .populate("caFirmId", "name firmName partnerName icaiNumber digitalStampUrl staffInviteCode")
        .populate("assignedCompanies", "name email phoneNumber inviteCode")
        .populate("assignedClients", "name email phoneNumber inviteCode")
        .select("-password")
        .lean();

      if (staff) {
        const tasks = await CATask.find({ staffId: staff._id }).sort({ createdAt: -1 }).lean();
        const vouchersChecked = tasks.reduce((sum, t) => sum + (t.vouchersChecked || 0), 0);
        const discrepanciesCount = tasks.reduce((sum, t) => sum + (t.discrepanciesCount || 0), 0);
        const assignedList = staff.assignedCompanies || staff.assignedClients || [];

        return NextResponse.json({
          success: true,
          userType: "CA_STAFF",
          user: {
            _id: staff._id,
            name: staff.name,
            email: staff.email,
            phoneNumber: staff.phoneNumber,
            role: "CA_STAFF",
            userType: "CA_STAFF",
            roleInFirm: staff.roleInFirm || "Article Assistant",
            isActive: staff.isActive !== false,
            createdAt: staff.createdAt,
            firm: staff.caFirmId
              ? {
                  _id: staff.caFirmId._id,
                  name: staff.caFirmId.name,
                  firmName: staff.caFirmId.firmName || staff.caFirmId.name,
                  partnerName: staff.caFirmId.partnerName || staff.caFirmId.name,
                  icaiNumber: staff.caFirmId.icaiNumber,
                  digitalStampUrl: staff.caFirmId.digitalStampUrl,
                }
              : null,
            assignedClients: assignedList.map((c) => ({
              _id: c._id,
              name: c.name,
              email: c.email,
              phone: c.phoneNumber,
              inviteCode: c.inviteCode,
            })),
            assignedClientsCount: assignedList.length,
            tasksSummary: {
              totalTasks: tasks.length,
              vouchersChecked,
              discrepanciesCount,
              activeTasks: tasks.filter((t) => t.status === "ASSIGNED" || t.status === "IN_PROGRESS"),
              completedTasks: tasks.filter((t) => t.status === "WORK_COMPLETED" || t.status === "REVIEWED_APPROVED"),
              recentList: tasks.slice(0, 5),
            },
          },
        });
      }
    }

    return NextResponse.json({ error: "User profile record not found." }, { status: 404 });
  } catch (error) {
    console.error("SuperAdmin User GET Profile Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch user profile details" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/users/[id] - Edit user details or reset password
export async function PUT(request, { params }) {
  try {
    const auth = await getAuthenticatedSuperAdmin();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    await connectDB();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const {
      userType, // OWNER | EMPLOYEE | CA | CA_STAFF
      name,
      email,
      phoneNumber,
      newPassword,
      // Employee specific
      department,
      postLevel,
      postTitle,
      branchName,
      approvalStatus,
      // Owner specific
      planName,
      // CA Staff specific
      roleInFirm,
    } = body;

    let targetDoc = null;

    if (userType === "OWNER") {
      targetDoc = await Owner.findById(id);
    } else if (userType === "EMPLOYEE") {
      targetDoc = await Employee.findById(id);
    } else if (userType === "CA") {
      targetDoc = await CA.findById(id);
    } else if (userType === "CA_STAFF") {
      targetDoc = await CAStaff.findById(id);
    } else {
      targetDoc =
        (await Employee.findById(id)) ||
        (await Owner.findById(id)) ||
        (await CA.findById(id)) ||
        (await CAStaff.findById(id));
    }

    if (!targetDoc) {
      return NextResponse.json({ error: "User record not found." }, { status: 404 });
    }

    // Update common fields
    if (name && name.trim()) targetDoc.name = name.trim();
    if (email && email.trim()) targetDoc.email = email.toLowerCase().trim();
    if (phoneNumber && phoneNumber.trim()) targetDoc.phoneNumber = phoneNumber.trim();

    // Reset password if provided
    if (newPassword && newPassword.trim()) {
      const salt = await bcrypt.genSalt(10);
      targetDoc.password = await bcrypt.hash(newPassword.trim(), salt);
    }

    // Employee updates
    if (targetDoc.constructor.modelName === "Employee") {
      const prevDept = targetDoc.department;
      const prevPost = targetDoc.postTitle || targetDoc.postLevel;

      if (department) targetDoc.department = department.toUpperCase();
      if (postLevel) targetDoc.postLevel = postLevel;
      if (postTitle) targetDoc.postTitle = postTitle.trim();
      if (branchName) targetDoc.branchName = branchName.trim();
      if (approvalStatus) targetDoc.approvalStatus = approvalStatus;

      const isDeptChanged = department && targetDoc.department !== prevDept;
      const isPostChanged =
        (postLevel && postLevel !== targetDoc.postLevel) ||
        (postTitle && postTitle.trim() !== prevPost);

      if (isDeptChanged || isPostChanged) {
        await createEmployeeNotification({
          recipientId: targetDoc._id,
          companyId: targetDoc.companyId,
          senderId: null,
          senderName: "Platform Administration",
          type: "DEPARTMENT_TRANSFER",
          title: isDeptChanged
            ? `Department Transfer: Moved to ${targetDoc.department}`
            : `Position Updated to ${targetDoc.postTitle || targetDoc.postLevel}`,
          message: `Your department assignment has been updated to ${targetDoc.department} as ${targetDoc.postTitle || targetDoc.postLevel?.replace(/_/g, " ")}.`,
          linkTab: "profile",
          metadata: {
            previousDepartment: prevDept,
            newDepartment: targetDoc.department,
            transferredAt: new Date().toISOString(),
          },
        });
      }
    }

    // Owner updates
    if (targetDoc.constructor.modelName === "Owner") {
      if (planName) {
        targetDoc.planName = planName;
        await Organization.updateOne(
          { ownerId: targetDoc._id },
          { $set: { plan: planName, planName: planName } }
        );
      }
    }

    // CA Staff updates
    if (targetDoc.constructor.modelName === "CAStaff") {
      if (roleInFirm) {
        targetDoc.roleInFirm = roleInFirm;
      }
    }

    await targetDoc.save();

    return NextResponse.json({
      success: true,
      message: `User ${targetDoc.name} updated successfully!`,
      user: {
        _id: targetDoc._id,
        name: targetDoc.name,
        email: targetDoc.email,
        phoneNumber: targetDoc.phoneNumber,
        userType: targetDoc.constructor.modelName.toUpperCase(),
      },
    });
  } catch (error) {
    console.error("SuperAdmin User PUT Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update user" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id] - Permanently delete any user from database
export async function DELETE(request, { params }) {
  try {
    const auth = await getAuthenticatedSuperAdmin();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    await connectDB();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userType = searchParams.get("type"); // OWNER | EMPLOYEE | CA | CA_STAFF

    let deletedName = "User";

    // 1. Try deleting as Employee
    if (!userType || userType === "EMPLOYEE") {
      const emp = await Employee.findById(id);
      if (emp) {
        deletedName = emp.name;
        await Employee.findByIdAndDelete(id);
        await Attendance.deleteMany({ employeeId: id });
        await Leave.deleteMany({ employeeId: id });
        await TaskAssignment.deleteMany({ assignedTo: id });

        return NextResponse.json({
          success: true,
          message: `Employee ${deletedName} deleted permanently from database.`,
          deletedId: id,
        });
      }
    }

    // 2. Try deleting as Owner
    if (!userType || userType === "OWNER") {
      const owner = await Owner.findById(id);
      if (owner) {
        deletedName = owner.name;
        await Owner.findByIdAndDelete(id);
        await Organization.deleteMany({ ownerId: id });
        await Employee.deleteMany({ companyId: id });
        await Attendance.deleteMany({ companyId: id });
        await Submission.deleteMany({ companyId: id });

        return NextResponse.json({
          success: true,
          message: `Owner ${deletedName} and associated organization deleted permanently.`,
          deletedId: id,
        });
      }
    }

    // 3. Try deleting as CA
    if (!userType || userType === "CA") {
      const ca = await CA.findById(id);
      if (ca) {
        deletedName = ca.name;
        await CA.findByIdAndDelete(id);
        // Unlink or clean staff
        await CAStaff.deleteMany({ caFirmId: id });
        await CATask.deleteMany({ caFirmId: id });

        return NextResponse.json({
          success: true,
          message: `Chartered Accountant ${deletedName} and associated audit records deleted permanently.`,
          deletedId: id,
        });
      }
    }

    // 4. Try deleting as CA Staff
    if (!userType || userType === "CA_STAFF") {
      const staff = await CAStaff.findById(id);
      if (staff) {
        deletedName = staff.name;
        await CAStaff.findByIdAndDelete(id);
        await CA.updateMany({}, { $pull: { staff: staff._id } });
        await CATask.deleteMany({ staffId: staff._id });

        return NextResponse.json({
          success: true,
          message: `Audit Staff member ${deletedName} deleted permanently.`,
          deletedId: id,
        });
      }
    }

    return NextResponse.json({ error: "User not found in any collection." }, { status: 404 });
  } catch (error) {
    console.error("SuperAdmin User DELETE Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete user" },
      { status: 500 }
    );
  }
}
