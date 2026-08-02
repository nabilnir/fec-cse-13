/**
 * app/api/files/route.ts
 * REST API for DocFile documents in MongoDB.
 *
 * GET  /api/files  — list all files
 * POST /api/files  — create/upload a file
 */

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import DocFile from "@/lib/models/DocFile";
import Folder from "@/lib/models/Folder";

// ─── GET ──────────────────────────────────────────────────────────
export async function GET() {
  try {
    await connectToDatabase();
    const files = await DocFile.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: files });
  } catch (error: unknown) {
    console.error("[GET /api/files]", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// ─── POST ─────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const {
      title,
      subject,
      department,
      year,
      type,
      uploadedBy,
      driveId,
      color,
      size,
    } = body;

    if (!title || !subject || !department || !year || !type || !uploadedBy || !driveId || !color) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 1. Create the DocFile document
    const fileDate = new Date().toISOString().split("T")[0];
    const newFile = await DocFile.create({
      title,
      subject: subject.trim(),
      department,
      year,
      type,
      uploadedBy,
      uploadDate: fileDate,
      driveId,
      color,
      size: size || "1.0 MB",
    });

    // 2. Update Folder count or create Folder if it doesn't exist
    const subjectName = subject.trim();
    const folderExists = await Folder.findOne({ name: subjectName });

    if (folderExists) {
      await Folder.updateOne(
        { name: subjectName },
        { $inc: { filesCount: 1 } }
      );
    } else {
      await Folder.create({
        name: subjectName,
        department,
        year,
        color,
        filesCount: 1,
      });
    }

    return NextResponse.json({ success: true, data: newFile }, { status: 201 });
  } catch (error: unknown) {
    console.error("[POST /api/files]", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
