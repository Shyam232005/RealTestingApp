import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import connectDB from "@/lib/mongodb";
import Owner from "@/models/Owner";
import Employee from "@/models/Employee";
import CA from "@/models/CA";
import CAStaff from "@/models/CAStaff";

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();

    const {
      role,
      name,
      phoneNumber,
      email,
      password,
      icaiNumber,
      inviteCode,
      planName,
      joinedViaCode,
      cycle,
      paymentStatus,
    } = body;

    if (!name || !phoneNumber || !email || !password || !role) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    // Security Directive: Strictly reject Super-Admin reserved credentials
    const adminEmail = (
      process.env.ADMIN_EMAIL || "shyamsangani23@gmail.com"
    )
      .toLowerCase()
      .trim();
    const adminPhone = (process.env.ADMIN_PHONE || "9723386344").trim();
    if (
      email.toLowerCase().trim() === adminEmail ||
      phoneNumber.trim() === adminPhone
    ) {
      return NextResponse.json(
        { error: "Credentials reserved! Belongs to Developers only!" },
        { status: 400 }
      );
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let newUser = null;
    let companyId = null; // Unified ID for the transaction engine
    let successMessage = "";

    // 1. REGISTER OWNER
    if (role === "Owner") {
      const existingOwner = await Owner.findOne({
        $or: [{ email }, { phoneNumber }],
      });
      if (existingOwner)
        return NextResponse.json(
          { error: "Owner already exists." },
          { status: 400 }
        );

      let rawPlan = planName ? planName.trim() : "Free Trial";
      let actualPlan = "Free Trial";
      if (rawPlan.includes("Manufacturing")) actualPlan = "Manufacturing & Growth";
      else if (rawPlan.includes("Enterprise")) actualPlan = "Enterprise Multi-Unit";
      else if (rawPlan.includes("Starter") || rawPlan.includes("MSME"))
        actualPlan = "MSME Starter";
      else if (rawPlan.toLowerCase().includes("professional"))
        actualPlan = "MSME Starter";
      else if (
        [
          "MSME Starter",
          "Manufacturing & Growth",
          "Enterprise Multi-Unit",
        ].includes(rawPlan)
      ) {
        actualPlan = rawPlan;
      }

      // Check if user is a paid subscriber (plan is paid tier or paymentStatus is paid)
      const isPaidUser =
        actualPlan !== "Free Trial" || paymentStatus === "paid";
      if (isPaidUser && actualPlan === "Free Trial") {
        actualPlan = "MSME Starter";
      }

      const rawCycle = cycle ? cycle.toString().toLowerCase().trim() : "";
      const isMonthly = rawCycle.includes("month");
      const normalizedCycle = isPaidUser
        ? isMonthly
          ? "monthly"
          : "annual"
        : "trial";

      const now = new Date();
      let calculatedEndDate;
      let subStatus;

      if (isPaidUser) {
        calculatedEndDate = new Date(now);
        if (normalizedCycle === "monthly") {
          calculatedEndDate.setMonth(calculatedEndDate.getMonth() + 1);
        } else {
          calculatedEndDate.setFullYear(calculatedEndDate.getFullYear() + 1);
        }
        subStatus = "active";
      } else {
        // Strict 30-day trial from createdAt timestamp
        calculatedEndDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        subStatus = "trialing";
      }

      // Auto-generate unique inviteCode for the Owner
      const generatedCode = `BIZ-${Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase()}`;

      newUser = new Owner({
        name,
        phoneNumber,
        email,
        password: hashedPassword,
        inviteCode: generatedCode,
        isSetupComplete: false,
        organizationId: null,
        subscriptionExpiry: calculatedEndDate,
        subscription: {
          planName: actualPlan,
          cycle: normalizedCycle,
          status: subStatus,
          startDate: now,
          endDate: calculatedEndDate,
        },
      });
      await newUser.save();
      companyId = newUser._id;
      successMessage = "Workspace created successfully!";
    }

    // 2. REGISTER EMPLOYEE (LINK TO OWNER VIA INVITE CODE)
    else if (role === "Employee") {
      const codeToQuery = inviteCode ? inviteCode.trim() : "";
      if (!codeToQuery)
        return NextResponse.json(
          { error: "Invalid Invite Code" },
          { status: 400 }
        );

      const owner = await Owner.findOne({ inviteCode: codeToQuery });
      if (!owner)
        return NextResponse.json(
          { error: "Invalid Invite Code" },
          { status: 400 }
        );

      const existingEmp = await Employee.findOne({
        $or: [{ email }, { phoneNumber }],
      });
      if (existingEmp)
        return NextResponse.json(
          { error: "Employee already exists." },
          { status: 400 }
        );

      newUser = new Employee({
        name,
        phoneNumber,
        email,
        password: hashedPassword,
        companyId: owner._id,
        ownerId: owner._id,
        approvalStatus: "PENDING_PROFILE",
        isApproved: false,
      });
      await newUser.save();

      if (!owner.employees) owner.employees = [];
      owner.employees.push(newUser._id);
      await owner.save();
      companyId = owner._id;
      successMessage = "Staff joined successfully!";
    }

    // 3. REGISTER CA FIRM
    else if (role === "CA") {
      const existingCA = await CA.findOne({
        $or: [{ email }, { phoneNumber }, { icaiNumber }],
      });
      if (existingCA)
        return NextResponse.json(
          { error: "CA Firm already exists." },
          { status: 400 }
        );

      const codeToLink = (joinedViaCode || inviteCode || "").trim();
      const caInvite = `CA-${Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase()}`;
      const staffInvite = `STF-${Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase()}`;

      newUser = new CA({
        name,
        phoneNumber,
        email,
        password: hashedPassword,
        icaiNumber,
        joinedViaCode: codeToLink,
        caInviteCode: caInvite,
        staffInviteCode: staffInvite,
        inviteCode: staffInvite,
        clientCompanies: [],
        clients: [],
      });
      await newUser.save();

      if (codeToLink) {
        const owner = await Owner.findOne({ inviteCode: codeToLink });
        if (owner) {
          owner.linkedCA = newUser._id;
          owner.dataSharingStatus = "CONNECTED";
          if (!owner.linkedCAs) owner.linkedCAs = [];
          if (!owner.linkedCaFirm) owner.linkedCaFirm = [];
          owner.linkedCAs.push(newUser._id);
          owner.linkedCaFirm.push(newUser._id);
          await owner.save();

          newUser.clientCompanies.push(owner._id);
          newUser.clients.push(owner._id);
          await newUser.save();
        }
      }
      companyId = newUser._id;
      successMessage = "CA Firm registered successfully!";
    }

    // 4. REGISTER CA-EMPLOYEE / CA_STAFF
    else if (
      role === "CA-Employee" ||
      role === "CA_STAFF" ||
      role === "CAStaff"
    ) {
      const codeToQuery = (
        body.staffInviteCode ||
        inviteCode ||
        joinedViaCode ||
        ""
      ).trim();
      if (!codeToQuery)
        return NextResponse.json(
          { error: "Invalid Code" },
          { status: 400 }
        );

      const caFirm = await CA.findOne({
        $or: [
          { staffInviteCode: codeToQuery },
          { inviteCode: codeToQuery },
          { caInviteCode: codeToQuery },
        ],
      });
      if (!caFirm)
        return NextResponse.json(
          { error: "Invalid Code" },
          { status: 400 }
        );

      const existingStaff = await CAStaff.findOne({
        $or: [{ email }, { phoneNumber }],
      });
      if (existingStaff)
        return NextResponse.json(
          { error: "Staff already exists." },
          { status: 400 }
        );

      newUser = new CAStaff({
        name,
        phoneNumber,
        email,
        password: hashedPassword,
        caFirmId: caFirm._id,
        caId: caFirm._id,
        role: "CA_STAFF",
        assignedCompanies: [],
        assignedClients: [],
      });
      await newUser.save();

      if (!caFirm.staff) caFirm.staff = [];
      caFirm.staff.push(newUser._id);
      await caFirm.save();

      companyId = caFirm._id;
      successMessage = "Audit Staff joined successfully!";
    } else {
      return NextResponse.json(
        { error: "Invalid role specified." },
        { status: 400 }
      );
    }

    // 5. Generate Secure Session Token (Auto-Login on Registration)
    const normalizedRole =
      role === "Owner" || role === "OWNER"
        ? "OWNER"
        : role === "Employee" || role === "EMPLOYEE"
        ? "EMPLOYEE"
        : role === "CA"
        ? "CA"
        : "CA_STAFF";

    const payload = {
      userId: newUser._id.toString(),
      role: role,
      normalizedRole: normalizedRole,
      companyId: (
        companyId ||
        newUser.companyId ||
        (normalizedRole === "OWNER" ? newUser._id : null)
      )?.toString() || null,
      caFirmId: (
        newUser.caFirmId ||
        newUser.caId ||
        (normalizedRole === "CA" ? newUser._id : null)
      )?.toString() || null,
      assignedCompanies: (
        newUser.assignedCompanies ||
        newUser.assignedClients ||
        []
      ).map((id) => id.toString()),
      isSetupComplete: normalizedRole === "OWNER" ? false : true,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    const cookieStore = await cookies();
    cookieStore.set({
      name: "crown_session",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return NextResponse.json(
      {
        success: true,
        message: successMessage || "Account created.",
        redirectUrl:
          normalizedRole === "OWNER"
            ? "/owner/setup"
            : normalizedRole === "EMPLOYEE"
            ? "/department/onboarding"
            : "/billing",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration Error:", error);
    return NextResponse.json(
      { error: error.message || "Server Error" },
      { status: 500 }
    );
  }
}
