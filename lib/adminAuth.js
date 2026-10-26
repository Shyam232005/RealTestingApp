import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";
import SuperAdmin from "@/models/SuperAdmin";

export async function getAuthenticatedSuperAdmin() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("crown_session")?.value;

  if (!sessionToken) {
    return { error: "Not authenticated. SuperAdmin session required.", status: 401 };
  }

  let decoded;
  try {
    decoded = jwt.verify(sessionToken, process.env.JWT_SECRET);
  } catch (err) {
    return { error: "Invalid or expired session. Please log in again.", status: 401 };
  }

  if (
    decoded.role !== "SUPERADMIN" &&
    decoded.role !== "Admin" &&
    decoded.role !== "SuperAdmin" &&
    !decoded.isSuperAdmin
  ) {
    return { error: "Access denied. SuperAdmin privileges required.", status: 403 };
  }

  return { admin: decoded };
}
