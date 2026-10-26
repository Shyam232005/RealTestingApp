import { NextResponse } from "next/server";
import { getAuthenticatedOwner } from "@/lib/ownerAuth";
import Submission from "@/models/Submission";

// GET /api/owner/submissions/files - Dedicated repository of all work files attached by employees
export async function GET(request) {
  try {
    const auth = await getAuthenticatedOwner();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { owner } = auth;
    const { searchParams } = new URL(request.url);
    const branchFilter = searchParams.get("branchId");
    const deptFilter = searchParams.get("department");
    const employeeFilter = searchParams.get("employeeId");
    const search = searchParams.get("search")?.toLowerCase().trim();

    const query = {
      companyId: owner._id,
      "files.0": { $exists: true }, // At least one attached file
    };

    if (branchFilter && branchFilter !== "all") {
      query.branchId = branchFilter;
    }
    if (deptFilter && deptFilter !== "ALL" && deptFilter !== "all") {
      query.department = deptFilter.toUpperCase();
    }
    if (employeeFilter && employeeFilter !== "ALL") {
      query.employeeId = employeeFilter;
    }

    const submissions = await Submission.find(query)
      .sort({ createdAt: -1 })
      .lean();

    // Flatten files with parent submission and employee metadata
    const filesList = [];
    let pdfCount = 0;
    let imageCount = 0;
    let spreadsheetCount = 0;
    let otherCount = 0;

    for (const sub of submissions) {
      if (!Array.isArray(sub.files)) continue;

      sub.files.forEach((file, idx) => {
        const fileName = file.fileName || "Attachment";
        const fileType = file.fileType || "";

        // Apply text search filter if provided
        if (search) {
          const matchName = fileName.toLowerCase().includes(search);
          const matchEmp = (sub.employeeName || "").toLowerCase().includes(search);
          const matchTitle = (sub.title || "").toLowerCase().includes(search);
          if (!matchName && !matchEmp && !matchTitle) return;
        }

        const isImage = fileType.startsWith("image/") || /\.(png|jpe?g|webp|gif|svg)$/i.test(fileName);
        const isPdf = fileType.includes("pdf") || /\.pdf$/i.test(fileName);
        const isSheet =
          fileType.includes("sheet") ||
          fileType.includes("excel") ||
          fileType.includes("csv") ||
          /\.(xlsx?|csv)$/i.test(fileName);

        if (isImage) imageCount++;
        else if (isPdf) pdfCount++;
        else if (isSheet) spreadsheetCount++;
        else otherCount++;

        filesList.push({
          fileId: `${sub._id}_${idx}`,
          submissionId: sub._id,
          submissionTitle: sub.title,
          submissionDate: sub.date,
          employeeId: sub.employeeId,
          employeeName: sub.employeeName || "Employee",
          department: sub.department || "OPERATIONS",
          branchId: sub.branchId || "branch-1",
          branchName: sub.branchName || "Main HQ",
          fileName: fileName,
          fileType: fileType,
          fileSize: file.fileSize || 0,
          fileData: file.fileData || "",
          category: isImage ? "IMAGE" : isPdf ? "PDF" : isSheet ? "SPREADSHEET" : "DOCUMENT",
          uploadedAt: file.uploadedAt || sub.createdAt,
        });
      });
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalFiles: filesList.length,
        submissionsWithFilesCount: submissions.length,
        pdfCount,
        imageCount,
        spreadsheetCount,
        otherCount,
      },
      files: filesList,
    });
  } catch (error) {
    console.error("GET /api/owner/submissions/files error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load submitted files" },
      { status: 500 }
    );
  }
}
