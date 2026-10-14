import { NextResponse } from "next/server";
import Contact from "@/models/Contact"
import connectDB from "@/lib/mongodb"
import { success } from "zod";

export async function POST(req) {
    const body = await req.json()
    if (body) {
        await connectDB()
        const res = await Contact.create(body)
        if(!res){
            return NextResponse.json({success:false,msg:"Failed to submit form"})
        }
        return NextResponse.json({ success: true }, { status: 200 })
    }
}