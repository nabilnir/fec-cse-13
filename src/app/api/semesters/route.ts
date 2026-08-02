/**
 * app/api/semesters/route.ts
 * REST API for Semester documents in MongoDB.
 *
 * GET  /api/semesters         — list all semesters
 * GET  /api/semesters?label=  — get one semester by label
 * POST /api/semesters         — create a new semester
 */

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Semester from "@/lib/models/Semester";

// ─── GET ──────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const label = searchParams.get("label");

    if (label) {
      const semester = await Semester.findOne({ label }).lean();
      if (!semester) {
        return NextResponse.json(
          { success: false, error: "Semester not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: semester });
    }

    const semesters = await Semester.find({}).sort({ semNumber: 1 }).lean();
    return NextResponse.json({ success: true, data: semesters });
  } catch (error) {
    console.error("[GET /api/semesters]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ─── POST ─────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { label, year, semNumber } = body;

    if (!label || !year || !semNumber) {
      return NextResponse.json(
        { success: false, error: "label, year, and semNumber are required" },
        { status: 400 }
      );
    }

    // Upsert: update if already exists, create if not
    const semester = await Semester.findOneAndUpdate(
      { label },
      { $set: { year, semNumber } },
      { new: true, upsert: true, runValidators: true }
    );

    return NextResponse.json({ success: true, data: semester }, { status: 201 });
  } catch (error: unknown) {
    console.error("[POST /api/semesters]", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
