/**
 * app/api/courses/route.ts
 * REST API for Course documents in MongoDB.
 *
 * GET  /api/courses                 — list all courses
 * GET  /api/courses?semesterLabel=  — list courses for a specific semester
 * POST /api/courses                 — create or update a course
 */

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Course from "@/lib/models/Course";
import { isMongoConnectionError } from "@/lib/localFolders";
import { readLocalCourses, upsertLocalCourse } from "@/lib/localCourses";

// ─── GET ──────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const semesterLabel = searchParams.get("semesterLabel");

  try {
    await connectToDatabase();

    const query = semesterLabel ? { semesterLabel } : {};
    const courses = await Course.find(query).sort({ code: 1 }).lean();

    return NextResponse.json({ success: true, data: courses });
  } catch (error: unknown) {
    if (isMongoConnectionError(error)) {
      const courses = await readLocalCourses();
      const filtered = semesterLabel ? courses.filter((course) => course.semesterLabel === semesterLabel) : courses;
      return NextResponse.json({ success: true, data: filtered });
    }

    console.error("[GET /api/courses]", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// ─── POST ─────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  let body: {
    code?: string;
    title?: string;
    department?: string;
    creditHours?: number;
    instructor?: string;
    semesterLabel?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { code, title, department, creditHours, instructor, semesterLabel } = body;

  if (!code || !title || !department || !semesterLabel) {
    return NextResponse.json(
      { success: false, error: "code, title, department, and semesterLabel are required" },
      { status: 400 }
    );
  }

  try {
    await connectToDatabase();

    // Upsert based on course code
    const course = await Course.findOneAndUpdate(
      { code },
      { $set: { title, department, creditHours: creditHours ?? 3, instructor, semesterLabel } },
      { new: true, upsert: true, runValidators: true }
    );

    return NextResponse.json({ success: true, data: course }, { status: 201 });
  } catch (error: unknown) {
    if (isMongoConnectionError(error)) {
      const course = await upsertLocalCourse({ code, title, department, creditHours, instructor, semesterLabel });
      return NextResponse.json({ success: true, data: course }, { status: 201 });
    }

    console.error("[POST /api/courses]", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
