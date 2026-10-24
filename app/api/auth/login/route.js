import { NextResponse } from "next/server";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import Owner from "@/models/Owner";
import Employee from "@/models/Employee";
import CA from "@/models/CA";
import CAStaff from "@/models/CAStaff";

// MongoDB Connection Helper
const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGODB_URI);
};

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { email, password, role } = body;

    // 1. Check basic validation
    if (!email || !password) {
      return NextResponse.json({ error: "Email/Phone and password are required." }, { status: 400 });
    }

    // 2. Super-Admin Dynamic Authentication Verification
    const adminEmail = (process.env.ADMIN_EMAIL || "shyamsangani23@gmail.com").toLowerCase().trim();
    const adminPhone = (process.env.ADMIN_PHONE || "9723386344").trim();
    const cleanIdentifier = email.trim().toLowerCase();

    if (cleanIdentifier === adminEmail || cleanIdentifier === adminPhone.toLowerCase()) {
      const adminHash = process.env.ADMIN_PASSWORD_HASH;
      if (!adminHash) {
        console.error("ADMIN_PASSWORD_HASH is missing in environment variables.");
        return NextResponse.json({ error: "Admin configuration error." }, { status: 500 });
      }

      const isPasswordMatch = await bcrypt.compare(password, adminHash);
      if (!isPasswordMatch) {
        return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
      }

      const payload = {
        userId: "super-admin-root",
        email: adminEmail,
        role: "Admin",
        isSuperAdmin: true,
        name: "Super Admin",
        companyId: null
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "7d"
      });

      const cookieStore = await cookies();
      cookieStore.set({
        name: "crown_session",
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 7,
        path: "/"
      });

      return NextResponse.json({
        message: "Super Admin authenticated successfully.",
        redirectUrl: "/console",
        user: {
          id: "super-admin-root",
          name: "Super Admin",
          email: adminEmail,
          role: "Admin",
          isSuperAdmin: true
        }
      }, { status: 200 });
    }

    if (!role) {
      return NextResponse.json({ error: "Role selection is required." }, { status: 400 });
    }

    let user = null;

    // 3. Role ke hisaab se database mein find karo
    const identifierQuery = {
      $or: [
        { email: cleanIdentifier },
        { email: email.trim() },
        { phoneNumber: email.trim() }
      ]
    };

    const isOwner = role === "Owner" || role === "OWNER";
    const isEmployee = role === "Employee" || role === "EMPLOYEE";
    const isCA = role === "CA";
    const isCAStaff = role === "CA-Employee" || role === "CAStaff" || role === "CA_STAFF";

    if (isOwner) {
      user = await Owner.findOne(identifierQuery);
    } else if (isEmployee) {
      user = await Employee.findOne(identifierQuery);
    } else if (isCA) {
      user = await CA.findOne(identifierQuery);
    } else if (isCAStaff) {
      user = await CAStaff.findOne(identifierQuery);
    } else {
      return NextResponse.json({ error: "Invalid role selected." }, { status: 400 });
    }

    // 3. Agar account nahi mila
    if (!user) {
      return NextResponse.json({ error: "Is email se koi account nahi mila." }, { status: 401 });
    }

    // 4. Password Check karo (bcrypt compare)
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    
    if (!isPasswordMatch) {
      return NextResponse.json({ error: "Galat password! Kripya sahi password daalein." }, { status: 401 });
    }

    // 5. Generate Secure Session Token (JWT) with 4-Tier Operational Context
    const normalizedRole = isOwner ? "OWNER" : isEmployee ? "EMPLOYEE" : isCA ? "CA" : "CA_STAFF";
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
      assignedCompanies = (user.assignedCompanies || user.assignedClients || []).map(id => id.toString());
    }

    const payload = {
      userId: user._id.toString(),
      role: role,
      normalizedRole: normalizedRole,
      companyId: companyId ? companyId.toString() : null,
      caFirmId: caFirmId ? caFirmId.toString() : null,
      assignedCompanies: assignedCompanies
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '7d' // Token valid for 1 week
    });

    // 6. Set HTTP-only cookie (Next.js 15 requires awaiting cookies())
    const cookieStore = await cookies();
    cookieStore.set({
      name: 'crown_session',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    // 7. Success! User details return karo frontend state ke liye
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: role
    };

    return NextResponse.json({ 
      message: "Login successful!", 
      user: userData 
    }, { status: 200 });

  } catch (error) {
    console.error("Login API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}