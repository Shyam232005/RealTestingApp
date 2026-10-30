import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import CA from "@/models/CA";
import CAStaff from "@/models/CAStaff";
import Owner from "@/models/Owner";
import Organization from "@/models/Organization";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function GET(request) {
  try {
    await connectDB();

    // 1. Mandatory Session Token Verification (Strict DB Protection)
    const cookieStore = await cookies();
    const token = cookieStore.get("crown_session")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Authentication required. Please log in.", code: "AUTH_REQUIRED" },
        { status: 401 }
      );
    }

    let decoded = null;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (tokenErr) {
      return NextResponse.json(
        { success: false, error: "Session expired or invalid. Please log in again.", code: "AUTH_EXPIRED" },
        { status: 401 }
      );
    }

    const rawRole = (decoded.role || decoded.normalizedRole || "").toUpperCase();
    const isStaff = rawRole === "CA_STAFF" || rawRole === "CA-EMPLOYEE" || rawRole === "CASTAFF";
    const isSuperAdmin = decoded.isSuperAdmin || rawRole === "SUPERADMIN";

    let user = null;

    if (isStaff) {
      // Fetch Staff from MongoDB with linked CA Firm and assigned client MSMEs
      const staffMember = await CAStaff.findById(decoded.userId)
        .populate("caFirmId")
        .populate("assignedCompanies")
        .populate("assignedClients")
        .lean();

      if (!staffMember) {
        return NextResponse.json(
          { success: false, error: "CA Staff account not found in database.", code: "USER_NOT_FOUND" },
          { status: 404 }
        );
      }

      const assignedList = staffMember.assignedCompanies || staffMember.assignedClients || [];

      user = {
        id: staffMember._id.toString(),
        name: staffMember.name,
        email: staffMember.email,
        phoneNumber: staffMember.phoneNumber,
        role: "CA_STAFF",
        roleInFirm: staffMember.roleInFirm || "Article Assistant",
        caFirmId: staffMember.caFirmId?._id?.toString() || staffMember.caId?.toString(),
        firmName: staffMember.caFirmId?.firmName || staffMember.caFirmId?.name || "Crown Audit Associates",
        partnerName: staffMember.caFirmId?.partnerName || staffMember.caFirmId?.name || "Managing Partner",
        icaiNumber: staffMember.caFirmId?.icaiNumber || "ICAI-FRN-048912",
        digitalStampUrl: staffMember.caFirmId?.digitalStampUrl || "",
        assignedClients: assignedList.map((c) => ({
          id: c._id.toString(),
          name: c.name,
          email: c.email,
          phoneNumber: c.phoneNumber,
          inviteCode: c.inviteCode,
        })),
        isSetupComplete: true,
      };
    } else {
      // Fetch CA Partner from MongoDB with linked clients and staff
      let caDoc = null;

      if (!isSuperAdmin) {
        caDoc = await CA.findById(decoded.userId)
          .populate("clients")
          .populate("clientCompanies")
          .populate("staff")
          .lean();
      }

      // If superadmin testing CA portal, query or link to primary CA firm
      if (!caDoc && isSuperAdmin) {
        caDoc = await CA.findOne()
          .populate("clients")
          .populate("clientCompanies")
          .populate("staff")
          .lean();
      }

      if (!caDoc) {
        return NextResponse.json(
          { success: false, error: "Chartered Accountant practice not found in database.", code: "CA_NOT_FOUND" },
          { status: 404 }
        );
      }

      const clientList = caDoc.clients || caDoc.clientCompanies || [];
      const staffList = caDoc.staff || [];

      user = {
        id: caDoc._id.toString(),
        name: caDoc.partnerName || caDoc.name,
        partnerName: caDoc.partnerName || caDoc.name,
        firmName: caDoc.firmName || caDoc.name || "Singhal & Associates, Chartered Accountants",
        icaiNumber: caDoc.icaiNumber,
        officeAddress: caDoc.officeAddress || "",
        email: caDoc.email,
        phoneNumber: caDoc.phoneNumber,
        role: "CA_PARTNER",
        digitalStampUrl: caDoc.digitalStampUrl || "",
        caInviteCode: caDoc.caInviteCode || `CA-${caDoc._id.toString().slice(-6).toUpperCase()}`,
        staffInviteCode: caDoc.staffInviteCode || caDoc.inviteCode || `STF-${caDoc._id.toString().slice(-6).toUpperCase()}`,
        clients: clientList.map((c) => ({
          id: c._id.toString(),
          name: c.name,
          email: c.email,
          phoneNumber: c.phoneNumber,
          inviteCode: c.inviteCode,
          dataSharingStatus: c.dataSharingStatus || "CONNECTED",
        })),
        staff: staffList.map((s) => ({
          id: s._id.toString(),
          name: s.name,
          email: s.email,
          phoneNumber: s.phoneNumber,
          roleInFirm: s.roleInFirm || "Article Assistant",
          assignedCount: (s.assignedCompanies || s.assignedClients || []).length,
        })),
        isVerifiedICAI: caDoc.isVerifiedICAI ?? true,
        isSetupComplete: caDoc.isSetupComplete ?? false,
      };
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (err) {
    console.error("GET /api/ca/profile error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
