/**
 * app/api/folders/route.ts
 * REST API for Folder documents in MongoDB.
 *
 * GET  /api/folders  — list all folders
 * POST /api/folders  — create or update a folder
 */

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Folder from "@/lib/models/Folder";

// ─── GET ──────────────────────────────────────────────────────────
export async function GET() {
  try {
    await connectToDatabase();
    const folders = await Folder.find({}).sort({ updatedAt: -1 }).lean();
    return NextResponse.json({ success: true, data: folders });
  } catch (error: unknown) {
    console.error("[GET /api/folders]", error);
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
    const { name, department, year, color } = body;

    if (!name || !department || !year || !color) {
      return NextResponse.json(
        { success: false, error: "name, department, year, and color are required" },
        { status: 400 }
      );
    }

    // Upsert based on folder name (case-insensitive or exact)
    const folder = await Folder.findOneAndUpdate(
      { name: name.trim() },
      { 
        $set: { 
          department, 
          year, 
          color 
        } 
      },
      { new: true, upsert: true, runValidators: true }
    );

    return NextResponse.json({ success: true, data: folder }, { status: 201 });
  } catch (error: unknown) {
    console.error("[POST /api/folders]", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
