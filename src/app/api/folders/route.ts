/**
 * app/api/folders/route.ts
 * REST API for Folder documents in MongoDB, with a local file fallback when
 * the database is unavailable.
 *
 * GET  /api/folders  — list all folders
 * POST /api/folders  — create or update a folder
 */

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Folder from "@/lib/models/Folder";
import {
  deleteLocalFolder,
  isMongoConnectionError,
  readLocalFolders,
  updateLocalFolder,
  upsertLocalFolder,
} from "@/lib/localFolders";

type FolderLike = {
  _id?: unknown;
  id?: unknown;
  name: string;
  department: string;
  year: string;
  color: string;
  filesCount?: number;
  createdAt?: unknown;
  updatedAt?: unknown;
};

function normalizeFolder(folder: FolderLike) {
  return {
    id: String(folder.id ?? folder._id),
    name: folder.name,
    department: folder.department,
    year: folder.year,
    color: folder.color,
    filesCount: folder.filesCount ?? 0,
    createdAt: folder.createdAt,
    updatedAt: folder.updatedAt,
  };
}

// ─── GET ──────────────────────────────────────────────────────────
export async function GET() {
  try {
    await connectToDatabase();
    const folders = await Folder.find({}).sort({ updatedAt: -1 }).lean();
    return NextResponse.json({
      success: true,
      data: folders.map((folder) => normalizeFolder(folder as FolderLike)),
    });
  } catch (error: unknown) {
    if (isMongoConnectionError(error)) {
      const folders = await readLocalFolders();
      return NextResponse.json({ success: true, data: folders });
    }

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
  let body: {
    name?: string;
    department?: string;
    year?: string;
    color?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { name, department, year, color } = body;

  if (!name || !department || !year || !color) {
    return NextResponse.json(
      { success: false, error: "name, department, year, and color are required" },
      { status: 400 }
    );
  }

  try {
    await connectToDatabase();

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

    return NextResponse.json(
      { success: true, data: normalizeFolder(folder.toObject() as FolderLike) },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (isMongoConnectionError(error)) {
      const folder = await upsertLocalFolder({
        name,
        department,
        year,
        color,
      });

      return NextResponse.json({ success: true, data: folder }, { status: 201 });
    }

    console.error("[POST /api/folders]", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// ─── PATCH ────────────────────────────────────────────────────────
export async function PATCH(request: NextRequest) {
  let body: {
    id?: string;
    name?: string;
    department?: string;
    year?: string;
    color?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { id, name, department, year, color } = body;

  if (!id) {
    return NextResponse.json(
      { success: false, error: "id is required" },
      { status: 400 }
    );
  }

  try {
    await connectToDatabase();

    const folder = await Folder.findByIdAndUpdate(
      id,
      {
        ...(name ? { name: name.trim() } : {}),
        ...(department ? { department } : {}),
        ...(year ? { year } : {}),
        ...(color ? { color } : {}),
      },
      { new: true, runValidators: true }
    );

    if (!folder) {
      return NextResponse.json(
        { success: false, error: "Folder not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: normalizeFolder(folder.toObject() as FolderLike) });
  } catch (error: unknown) {
    if (isMongoConnectionError(error)) {
      const folder = await updateLocalFolder({
        id,
        name,
        department,
        year,
        color,
      });

      if (!folder) {
        return NextResponse.json(
          { success: false, error: "Folder not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data: folder });
    }

    console.error("[PATCH /api/folders]", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// ─── DELETE ───────────────────────────────────────────────────────
export async function DELETE(request: NextRequest) {
  let body: { id?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { id } = body;

  if (!id) {
    return NextResponse.json(
      { success: false, error: "id is required" },
      { status: 400 }
    );
  }

  try {
    await connectToDatabase();
    const folder = await Folder.findByIdAndDelete(id);

    if (!folder) {
      return NextResponse.json(
        { success: false, error: "Folder not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (isMongoConnectionError(error)) {
      const deleted = await deleteLocalFolder(id);

      if (!deleted) {
        return NextResponse.json(
          { success: false, error: "Folder not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true });
    }

    console.error("[DELETE /api/folders]", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
