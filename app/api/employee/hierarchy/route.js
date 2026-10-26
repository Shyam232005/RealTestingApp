import { NextResponse } from "next/server";
import { getAuthenticatedEmployee } from "@/lib/employeeAuth";
import {
  getHierarchyRank,
  isUpperRole,
  resolveReportingSupervisor,
  getSubordinates,
} from "@/lib/hierarchy";

// GET /api/employee/hierarchy - Get reporting structure, rank, and subordinates
export async function GET() {
  try {
    const auth = await getAuthenticatedEmployee({ requireApproved: true });
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { employee, owner } = auth;
    const myRank = getHierarchyRank(employee.postLevel);
    const isUpper = isUpperRole(employee.postLevel);

    const [reportingResult, subordinates] = await Promise.all([
      resolveReportingSupervisor(employee),
      getSubordinates(employee),
    ]);

    const reportingTo =
      reportingResult.type === "EMPLOYEE_SUPERVISOR" && reportingResult.supervisor
        ? {
            type: "EMPLOYEE_SUPERVISOR",
            id: reportingResult.supervisor._id.toString(),
            name: reportingResult.supervisor.name,
            postTitle:
              reportingResult.supervisor.postTitle ||
              reportingResult.supervisor.postLevel?.replace(/_/g, " "),
            postLevel: reportingResult.supervisor.postLevel,
            department: reportingResult.supervisor.department,
          }
        : {
            type: "OWNER",
            id: owner._id.toString(),
            name: owner.name || "Business Owner",
            postTitle: "Business Owner / Enterprise Head",
            postLevel: "OWNER",
            department: employee.department,
          };

    return NextResponse.json({
      success: true,
      myRank,
      isUpperRole: isUpper,
      reportingTo,
      subordinates,
    });
  } catch (error) {
    console.error("GET /api/employee/hierarchy error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load hierarchy data" },
      { status: 500 }
    );
  }
}
