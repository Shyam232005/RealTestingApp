import { NextResponse } from "next/server";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import connectDB from "@/lib/mongodb";
import Owner from "@/models/Owner";
import Employee from "@/models/Employee";
import CA from "@/models/CA";
import CAStaff from "@/models/CAStaff";
import SuperAdmin from "@/models/SuperAdmin";

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { email, password, role } = body;

    // 1. Check basic validation
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email/Phone and password are required." },
        { status: 400 }
      );
    }

    // 2. Super-Admin Dynamic Authentication Verification
    const adminEmail = "shyamsangani23@gmail.com";
    const adminPhone = "9723386344";
    const cleanIdentifier = email.trim().toLowerCase();

    if (
      cleanIdentifier === adminEmail ||
      cleanIdentifier === adminPhone.toLowerCase()
    ) {
      const SUPERADMIN_HASH =
        "$2b$10$vbpnXpghv5GImJwN5HUvnuK.UPjJUJpK/PTRHTvadPZEcO8K4v5bO";
      const targetHash = process.env.ADMIN_PASSWORD_HASH || SUPERADMIN_HASH;

      const isPasswordMatch =
        (await bcrypt.compare(password, targetHash)) ||
        password === "Shyam@Sangani23#2005";

      if (!isPasswordMatch) {
        return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
      }

      // Ensure SuperAdmin document in MongoDB is seeded/synced
      try {
        await SuperAdmin.findOneAndUpdate(
          { email: adminEmail },
          {
            name: "Shyam Sangani",
            email: adminEmail,
            phoneNumber: adminPhone,
            password: SUPERADMIN_HASH,
            role: "SUPERADMIN",
            isSuperAdmin: true,
            lastLoginAt: new Date(),
          },
          { upsert: true, new: true }
        );
      } catch (dbErr) {
        console.warn("Could not upsert SuperAdmin document:", dbErr.message);
      }

      const payload = {
        userId: "super-admin-root",
        email: adminEmail,
        phoneNumber: adminPhone,
        name: "Shyam Sangani",
        role: "SUPERADMIN",
        normalizedRole: "SUPERADMIN",
        isSuperAdmin: true,
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

      cookieStore.set({
        name: "fineops_role",
        value: "SUPERADMIN",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });

      cookieStore.set({
        name: "fineops_user_id",
        value: "super-admin-root",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });

      return NextResponse.json(
        {
          success: true,
          message: "Welcome SuperAdmin Shyam Sangani. Access Granted.",
          redirectUrl: "/admin",
          user: payload,
        },
        { status: 200 }
      );
    }

    if (!role) {
      return NextResponse.json(
        { error: "Role selection is required." },
        { status: 400 }
      );
    }

    let user = null;

    // 3. Role ke hisaab se database mein find karo
    const identifierQuery = {
      $or: [
        { email: cleanIdentifier },
        { email: email.trim() },
        { phoneNumber: email.trim() },
      ],
    };

    const isOwner = role === "Owner" || role === "OWNER";
    const isEmployee = role === "Employee" || role === "EMPLOYEE";
    const isCA = role === "CA";
    const isCAStaff =
      role === "CA-Employee" || role === "CAStaff" || role === "CA_STAFF";

    if (isOwner) {
      user = await Owner.findOne(identifierQuery);
    } else if (isEmployee) {
      user = await Employee.findOne(identifierQuery);
    } else if (isCA) {
      user = await CA.findOne(identifierQuery);
    } else if (isCAStaff) {
      user = await CAStaff.findOne(identifierQuery);
    } else {
      return NextResponse.json(
        { error: "Invalid role selected." },
        { status: 400 }
      );
    }

    // 4. Agar account nahi mila
    if (!user) {
      return NextResponse.json(
        { error: "Is email se koi account nahi mila." },
        { status: 401 }
      );
    }

    // 5. Password Check karo (bcrypt compare)
    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      return NextResponse.json(
        { error: "Galat password! Kripya sahi password daalein." },
        { status: 401 }
      );
    }

    // 6. Generate Secure Session Token (JWT) with 4-Tier Operational Context
    const normalizedRole = isOwner
      ? "OWNER"
      : isEmployee
      ? "EMPLOYEE"
      : isCA
      ? "CA"
      : "CA_STAFF";
    let companyId = null;
    let caFirmId = null;
    let assignedCompanies = [];

    if (isOwner) {
      companyId = user._id;
      caFirmId = user.linkedCA || null;
    } else if (isEmployee) {
      companyId = user.companyId || user.ownerId;
    } else if (isCA) {
      caFirmId = user._id;
    } else if (isCAStaff) {
      caFirmId = user.caFirmId || user.caId;
      assignedCompanies = (
        user.assignedCompanies ||
        user.assignedClients ||
        []
      ).map((id) => id.toString());
    }

    const payload = {
      userId: user._id.toString(),
      role: role,
      normalizedRole: normalizedRole,
      companyId: companyId ? companyId.toString() : null,
      caFirmId: caFirmId ? caFirmId.toString() : null,
      assignedCompanies: assignedCompanies,
      isSetupComplete: (isOwner || isCA) ? !!user.isSetupComplete : true,
      subscriptionStatus: isOwner ? (user.subscription?.status || "trialing") : "active",
      planName: isOwner ? (user.subscription?.planName || "Free Trial") : "Enterprise",
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "7d", // Token valid for 1 week
    });

    // 7. Set HTTP-only cookie
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

    // 8. Determine Next Destination
    let redirectUrl = null;
    if (isOwner) {
      redirectUrl = user.isSetupComplete ? "/owner/dashboard" : "/owner/setup";
    } else if (isCA) {
      redirectUrl = user.isSetupComplete ? "/ca" : "/ca/setup";
    } else if (isCAStaff) {
      redirectUrl = "/staff";
    } else if (isEmployee) {
      if (user.approvalStatus === "REJECTED") {
        return NextResponse.json(
          { error: "Your employee registration was rejected by the business owner. Please register again." },
          { status: 403 }
        );
      }
      if (!user.approvalStatus || user.approvalStatus === "PENDING_PROFILE") {
        redirectUrl = "/department/onboarding";
      } else if (user.approvalStatus === "PENDING_APPROVAL") {
        redirectUrl = "/department/pending-approval";
      } else if (user.approvalStatus === "APPROVED") {
        const dept = (user.department || "operations").toLowerCase();
        redirectUrl = `/department/${dept}`;
      } else {
        redirectUrl = "/department/onboarding";
      }
    }

    // 9. Success! User details return karo frontend state ke liye
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: role,
      isSetupComplete: (isOwner || isCA) ? !!user.isSetupComplete : true,
    };

    return NextResponse.json(
      {
        message: "Login successful!",
        user: userData,
        redirectUrl: redirectUrl,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login API Error:", error);
    if (error.name === "MongooseServerSelectionError") {
      return NextResponse.json(
        { error: "Database connection failed. Please ensure the MongoDB service is running." },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
