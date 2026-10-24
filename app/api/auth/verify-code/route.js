import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Owner from "@/models/Owner";
import CA from "@/models/CA";

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGODB_URI);
};

export async function POST(request) {
  try {
    await connectDB();
    const { code, type } = await request.json(); // type 'biz' ya 'ca' hoga

    if (!code) {
      return NextResponse.json({ error: "Please enter an invite code." }, { status: 400 });
    }

    if (type === "biz") {
      const owner = await Owner.findOne({ inviteCode: code });
      if (!owner) return NextResponse.json({ error: "Invalid Business Invite Code" }, { status: 404 });
      
      return NextResponse.json({ message: "Code verified", entityName: owner.companyName }, { status: 200 });
    } 
    else if (type === "ca") {
      const caFirm = await CA.findOne({
        $or: [
          { staffInviteCode: code },
          { caInviteCode: code },
          { inviteCode: code }
        ]
      });
      if (!caFirm) return NextResponse.json({ error: "Invalid CA Firm Invite Code" }, { status: 404 });
      
      const isStaffCode = caFirm.staffInviteCode === code;
      return NextResponse.json({ 
        message: "Code verified", 
        entityName: caFirm.firmName,
        codeType: isStaffCode ? "STAFF" : "CLIENT"
      }, { status: 200 });
    }

    return NextResponse.json({ error: "Invalid verification type" }, { status: 400 });

  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}