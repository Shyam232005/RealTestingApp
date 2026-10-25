import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";
import Employee from "@/models/Employee";
import Owner from "@/models/Owner";
import Organization from "@/models/Organization";

export async function getAuthenticatedEmployee({ requireApproved = true } = {}) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("crown_session")?.value;

  if (!sessionToken) {
    return { error: "Not authenticated. Please log in.", status: 401 };
  }

  let decoded;
  try {
    decoded = jwt.verify(sessionToken, process.env.JWT_SECRET);
  } catch (err) {
    return { error: "Invalid or expired session. Please log in again.", status: 401 };
  }

  if (
    decoded.normalizedRole !== "EMPLOYEE" &&
    decoded.role !== "Employee" &&
    decoded.role !== "EMPLOYEE"
  ) {
    return { error: "Access denied. Employee session required.", status: 403 };
  }

  await connectDB();
  const employee = await Employee.findById(decoded.userId);
  if (!employee) {
    return { error: "Employee record not found or account removed.", status: 404 };
  }

  if (requireApproved && employee.approvalStatus !== "APPROVED") {
    return {
      error: "Employee account is not approved yet.",
      status: 403,
      approvalStatus: employee.approvalStatus,
      employee,
    };
  }

  const owner = await Owner.findById(employee.companyId || employee.ownerId);
  const organization = owner
    ? await Organization.findOne({ ownerId: owner._id })
    : null;

  return { employee, owner, organization, decoded };
}
