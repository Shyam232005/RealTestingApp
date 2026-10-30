import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import CA from "@/models/CA";
import Owner from "@/models/Owner";
import Organization from "@/models/Organization";
import ApprovalRequest from "@/models/ApprovalRequest";
import Notification from "@/models/Notification";
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
      return NextResponse.json({ error: "CA account not found." }, { status: 404 });
    }

    const { inviteCode } = await request.json();
    if (!inviteCode || !inviteCode.trim()) {
      return NextResponse.json({ error: "Owner Business Invite Code is required." }, { status: 400 });
    }

    const cleanCode = inviteCode.trim().toUpperCase();
    const owner = await Owner.findOne({ inviteCode: cleanCode });
    if (!owner) {
      return NextResponse.json({ error: "No business found with invite code: " + cleanCode }, { status: 404 });
    }

    // Link Owner to CA
    owner.linkedCA = ca._id;
    if (!owner.linkedCaFirm) owner.linkedCaFirm = [];
    if (!owner.linkedCaFirm.some((id) => id.toString() === ca._id.toString())) {
      owner.linkedCaFirm.push(ca._id);
    }
    if (!owner.linkedCAs) owner.linkedCAs = [];
    if (!owner.linkedCAs.some((id) => id.toString() === ca._id.toString())) {
      owner.linkedCAs.push(ca._id);
    }
    owner.dataSharingStatus = "PENDING";
    await owner.save();

    // Link CA to Owner
    if (!ca.clients) ca.clients = [];
    if (!ca.clients.some((id) => id.toString() === owner._id.toString())) {
      ca.clients.push(owner._id);
    }
    if (!ca.clientCompanies) ca.clientCompanies = [];
    if (!ca.clientCompanies.some((id) => id.toString() === owner._id.toString())) {
      ca.clientCompanies.push(owner._id);
    }
    await ca.save();

    let org = null;
    const orgIdFromOwner = Array.isArray(owner.organizationId) ? owner.organizationId[0] : owner.organizationId;
    if (orgIdFromOwner) {
      org = await Organization.findById(orgIdFromOwner);
    }
    if (!org) {
      org = await Organization.findOne({ ownerId: owner._id });
    }
    if (!org) {
      org = await Organization.create({
        ownerId: owner._id,
        name: (owner.name || "MSME") + " Operations",
        legalEntityName: (owner.name || "MSME") + " Enterprises Pvt Ltd",
        gstin: "24AAACA9912Q1ZX",
        industry: "Manufacturing & Retail",
      });
      owner.organizationId = [org._id];
      await owner.save();
    }

    // Automatically create a pending CA_DATA_ACCESS ApprovalRequest so owner sees it in CA-Hub tab immediately
    let approvalReq = await ApprovalRequest.findOne({
      ownerId: owner._id,
      caId: ca._id,
      type: "CA_DATA_ACCESS",
    });

    if (!approvalReq) {
      approvalReq = await ApprovalRequest.create({
        ownerId: owner._id,
        organizationId: org._id,
        type: "CA_DATA_ACCESS",
        status: "PENDING",
        caId: ca._id,
        caName: ca.partnerName || ca.name,
        caFirm: ca.firmName || ca.name || "Chartered Accountants",
        icaiNumber: ca.icaiNumber,
        caEmail: ca.email,
        requestedAccounts: [
          "General Ledger & Bank Statements",
          "GST Invoices & Purchase Registers (GSTR-2B)",
          "TDS 26AS Deductions & Form 16A",
          "Warehouse Inventory & Stock Valuation",
        ],
        requestReason: "Statutory Tax Audit FY 2025-26 under Sec 44AB and Dual-Entry Ledger Verification.",
      });

      try {
        await Notification.create({
          recipientType: "OWNER",
          recipientId: owner._id,
          ownerId: owner._id,
          companyId: owner._id,
          type: "SYSTEM",
          title: "CA Linked & Requested Access",
          message: `${ca.partnerName || ca.name} (${ca.firmName || "Chartered Accountants"}) connected to your workspace and requested financial ledger access.`,
          isRead: false,
          metadata: {
            requestId: approvalReq._id,
            caId: ca._id,
            caName: ca.partnerName || ca.name,
            caFirm: ca.firmName || ca.name,
          },
        });
      } catch (notifErr) {
        console.warn("Notification error:", notifErr.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully linked ${org?.legalEntityName || owner.name} to ${ca.firmName || ca.name}!`,
      client: {
        id: owner._id.toString(),
        name: org?.legalEntityName || owner.name,
        email: owner.email,
        phoneNumber: owner.phoneNumber,
        inviteCode: owner.inviteCode,
        dataSharingStatus: owner.dataSharingStatus,
      },
      request: {
        ...approvalReq.toObject(),
        companyId: owner._id.toString(),
        ownerId: owner._id.toString(),
        organizationId: org._id.toString(),
        clientName: org?.legalEntityName || owner.name,
      },
    });
  } catch (error) {
    console.error("POST /api/ca/link-client error:", error);
    return NextResponse.json({ error: error.message || "Failed to link client." }, { status: 500 });
  }
}
