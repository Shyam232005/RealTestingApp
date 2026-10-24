import { NextResponse } from "next/server";
import mongoose from "mongoose";
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
    const { phone, otp, role } = body;

    // 1. Basic Validation
    if (!phone || !otp || !role) {
      return NextResponse.json({ error: "Mobile number, OTP, aur role zaroori hain." }, { status: 400 });
    }

    let user = null;

    // 2. Role ke hisaab se Mobile Number DB mein find karo
    if (role === "Owner") {
      user = await Owner.findOne({ phoneNumber: phone });
    } else if (role === "Employee") {
      user = await Employee.findOne({ phoneNumber: phone });
    } else if (role === "CA") {
      user = await CA.findOne({ phoneNumber: phone });
    } else if (role === "CA-Employee") {
      user = await CAStaff.findOne({ phoneNumber: phone });
    } else {
      return NextResponse.json({ error: "Invalid role selected." }, { status: 400 });
    }

    // 3. Agar mobile number registered nahi hai
    if (!user) {
      return NextResponse.json({ error: "Is mobile number se koi account nahi mila. Kripya naya account banayein." }, { status: 401 });
    }

    // 4. MOCK OTP VALIDATION (Testing Mode)
    // Production me yahan DB ya Redis se OTP match hoga. Abhi ke liye hum length check kar rahe hain.
    if (otp.length !== 6) {
      return NextResponse.json({ error: "Invalid OTP! Kripya sahi 6-digit OTP daalein." }, { status: 401 });
    }

    // 5. Success! User details return karo
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phoneNumber,
      role: role
    };

    return NextResponse.json({ 
      message: "OTP Login successful!", 
      user: userData 
    }, { status: 200 });

  } catch (error) {
    console.error("OTP Login API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}