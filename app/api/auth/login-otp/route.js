import { NextResponse } from "next/server";
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
    const { phone, otp, role } = body;

    // 1. Basic Validation
    if (!phone || !otp || !role) {
      return NextResponse.json(
        { error: "Mobile number, OTP, aur role zaroori hain." },
        { status: 400 }
      );
    }

    let user = null;
    const isOwner = role === "Owner" || role === "OWNER";
    const isEmployee = role === "Employee" || role === "EMPLOYEE";
    const isCA = role === "CA";
    const isCAStaff =
      role === "CA-Employee" || role === "CAStaff" || role === "CA_STAFF";

    // 2. Role ke hisaab se Mobile Number DB mein find karo
    if (isOwner) {
      user = await Owner.findOne({ phoneNumber: phone.trim() });
    } else if (isEmployee) {
      user = await Employee.findOne({ phoneNumber: phone.trim() });
    } else if (isCA) {
      user = await CA.findOne({ phoneNumber: phone.trim() });
    } else if (isCAStaff) {
      user = await CAStaff.findOne({ phoneNumber: phone.trim() });
    } else {
      return NextResponse.json(
        { error: "Invalid role selected." },
        { status: 400 }
      );
    }

    // 3. Agar mobile number registered nahi hai
    if (!user) {
      return NextResponse.json(
        {
          error:
            "Is mobile number se koi account nahi mila. Kripya naya account banayein.",
        },
        { status: 401 }
      );
    }

    // 4. MOCK OTP VALIDATION (Testing Mode)
    if (otp.length !== 6) {
      return NextResponse.json(
        { error: "Invalid OTP! Kripya sahi 6-digit OTP daalein." },
        { status: 401 }
      );
    }

    // 5. Generate Session Token (JWT)
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
      isSetupComplete: isOwner ? !!user.isSetupComplete : true,
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

    let redirectUrl = null;
    if (isOwner) {
      redirectUrl = user.isSetupComplete ? "/owner/dashboard" : "/owner/setup";
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

    // 6. Success! User details return karo
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phoneNumber,
      role: role,
      isSetupComplete: isOwner ? !!user.isSetupComplete : true,
    };

    return NextResponse.json(
      {
        message: "OTP Login successful!",
        user: userData,
        redirectUrl: redirectUrl,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("OTP Login API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
