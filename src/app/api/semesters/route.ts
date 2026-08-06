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
import { isMongoConnectionError } from "@/lib/localFolders";
import { readLocalSemesters, upsertLocalSemester } from "@/lib/localSemesters";

// ─── GET ──────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const label = searchParams.get("label");

  try {
    await connectToDatabase();

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
    if (isMongoConnectionError(error)) {
      const semesters = await readLocalSemesters();

      if (label) {
        const semester = semesters.find((item) => item.label === label);
        if (!semester) {
          return NextResponse.json(
            { success: false, error: "Semester not found" },
            { status: 404 }
          );
        }
        return NextResponse.json({ success: true, data: semester });
      }

      return NextResponse.json({ success: true, data: semesters });
    }

    console.error("[GET /api/semesters]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ─── POST ─────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  let body: { label?: string; year?: string; semNumber?: number };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { label, year, semNumber } = body;

  if (!label || !year || !semNumber) {
    return NextResponse.json(
      { success: false, error: "label, year, and semNumber are required" },
      { status: 400 }
    );
  }

  try {
    await connectToDatabase();

    // Upsert: update if already exists, create if not
    const semester = await Semester.findOneAndUpdate(
      { label },
      { $set: { year, semNumber } },
      { new: true, upsert: true, runValidators: true }
    );

    return NextResponse.json({ success: true, data: semester }, { status: 201 });
  } catch (error: unknown) {
    if (isMongoConnectionError(error)) {
      const semester = await upsertLocalSemester({ label, year, semNumber });
      return NextResponse.json({ success: true, data: semester }, { status: 201 });
    }

    console.error("[POST /api/semesters]", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
