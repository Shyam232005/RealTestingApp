import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import CA from "@/models/CA";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { z } from "zod";

const caSetupSchema = z.object({
  firmName: z
    .string()
    .min(3, { message: "CA Firm Name must be at least 3 characters." }),
  partnerName: z
    .string()
    .min(3, { message: "Partner Name must be at least 3 characters." }),
  icaiNumber: z
    .string()
    .min(5, { message: "Please provide a valid ICAI Registration / Membership Number." }),
  officeAddress: z
    .string()
    .min(10, { message: "Office address must be at least 10 characters long." }),
  digitalStampUrl: z
    .string()
    .min(10, { message: "Please upload or generate your Digital Audit Stamp (PNG/SVG)." }),
});

export async function GET() {
  try {
    await connectDB();

    const cookieStore = await cookies();
    const token = cookieStore.get("crown_session")?.value;

    let ca = null;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded?.userId) {
          ca = await CA.findById(decoded.userId).lean();
        }
      } catch {
        // invalid token fallback
      }
    }

    if (!ca) {
      ca = await CA.findOne().sort({ updatedAt: -1 }).lean();
    }

    return NextResponse.json({
      success: true,
      ca: {
        firmName: ca?.firmName || "",
        partnerName: ca?.partnerName || ca?.name || "",
        icaiNumber: ca?.icaiNumber || "",
        officeAddress: ca?.officeAddress || "",
        digitalStampUrl: ca?.digitalStampUrl || "",
        isSetupComplete: !!ca?.isSetupComplete,
      },
    });
  } catch (err) {
    console.error("GET /api/ca/setup error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch CA setup details." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const validation = caSetupSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          errors: validation.error.format(),
          message: "Validation failed. Please check form inputs.",
        },
        { status: 400 }
      );
    }

    const { firmName, partnerName, icaiNumber, officeAddress, digitalStampUrl } = validation.data;

    await connectDB();

    // Check session to accurately link to the logged-in CA account
    const cookieStore = await cookies();
    const token = cookieStore.get("crown_session")?.value;
    let decodedUser = null;

    if (token) {
      try {
        decodedUser = jwt.verify(token, process.env.JWT_SECRET);
      } catch {
        // Invalid or expired token
      }
    }

    let ca = null;
    if (decodedUser?.userId) {
      ca = await CA.findById(decodedUser.userId);
    }

    if (!ca) {
      ca = await CA.findOne({ icaiNumber: icaiNumber.trim().toUpperCase() });
    }

    if (!ca) {
      ca = await CA.findOne().sort({ updatedAt: -1 });
    }

    if (ca) {
      ca.firmName = firmName.trim();
      ca.partnerName = partnerName.trim();
      ca.name = partnerName.trim();
      ca.icaiNumber = icaiNumber.trim().toUpperCase();
      ca.officeAddress = officeAddress.trim();
      ca.digitalStampUrl = digitalStampUrl;
      ca.isSetupComplete = true;
      ca.isVerifiedICAI = true;
      await ca.save();
    } else {
      ca = await CA.create({
        name: partnerName.trim(),
        partnerName: partnerName.trim(),
        firmName: firmName.trim(),
        icaiNumber: icaiNumber.trim().toUpperCase(),
        officeAddress: officeAddress.trim(),
        digitalStampUrl,
        phoneNumber: "+919800000000",
        email: `partner@${firmName.toLowerCase().replace(/[^a-z0-9]/g, "") || "ca"}.in`,
        password: "hashed_dummy_password",
        role: "CA_PARTNER",
        isSetupComplete: true,
        isVerifiedICAI: true,
      });
    }

    // Re-issue updated JWT session with isSetupComplete: true
    const updatedPayload = {
      userId: ca._id.toString(),
      role: "CA",
      normalizedRole: "CA",
      companyId: ca._id.toString(),
      caFirmId: ca._id.toString(),
      assignedCompanies: (ca.clientCompanies || ca.clients || []).map((id) => id.toString()),
      isSetupComplete: true,
      subscriptionStatus: "active",
      planName: "Enterprise CA Portal",
    };

    const updatedToken = jwt.sign(updatedPayload, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    cookieStore.set({
      name: "crown_session",
      value: updatedToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return NextResponse.json({
      success: true,
      message: "CA Partner onboarding setup completed successfully. Welcome to your Audit Portal.",
      redirectUrl: "/ca",
      ca: {
        id: ca._id,
        firmName: ca.firmName,
        partnerName: ca.partnerName,
        icaiNumber: ca.icaiNumber,
        officeAddress: ca.officeAddress,
        digitalStampUrl: ca.digitalStampUrl,
        role: "CA_PARTNER",
        isSetupComplete: true,
      },
    });
  } catch (err) {
    console.error("POST /api/ca/setup error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to complete CA setup." },
      { status: 500 }
    );
  }
}
