import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";
import Owner from "@/models/Owner";
import Organization from "@/models/Organization";

export async function getAuthenticatedOwner() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("crown_session")?.value;

  if (!sessionToken) {
    return { error: "Not authenticated. Owner session required.", status: 401 };
  }

  let decoded;
  try {
    decoded = jwt.verify(sessionToken, process.env.JWT_SECRET);
  } catch (err) {
    return { error: "Invalid or expired session. Please log in again.", status: 401 };
  }

  if (
    decoded.normalizedRole !== "OWNER" &&
    decoded.role !== "Owner" &&
    decoded.role !== "OWNER"
  ) {
    return { error: "Access denied. Owner account required.", status: 403 };
  }

  await connectDB();
  const owner = await Owner.findById(decoded.userId);
  if (!owner) {
    return { error: "Owner organization record not found.", status: 404 };
  }

  const organization = await Organization.findOne({ ownerId: owner._id });

  return { owner, organization };
}
