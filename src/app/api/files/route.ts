import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import DocFile from "@/lib/models/DocFile";
import Folder from "@/lib/models/Folder";
import type { IFolder } from "@/lib/models/Folder";
import { verifyAuth } from "@/lib/auth";
import { isMongoConnectionError } from "@/lib/localFolders";
import {
  readLocalFiles,
  createLocalFile,
  updateLocalFile,
  deleteLocalFile,
} from "@/lib/localFiles";

function normalizeFile(file: any) {
  return {
    id: String(file._id ?? file.id),
    title: file.title,
    subject: file.subject,
    department: file.department,
    year: file.year,
    type: file.type,
    uploadedBy: file.uploadedBy,
    uploadDate: file.uploadDate,
    driveId: file.driveId,
    color: file.color,
    size: file.size,
    folderId: file.folderId ? String(file.folderId) : null,
    ownerId: file.ownerId ? String(file.ownerId) : null,
    createdAt: file.createdAt,
    updatedAt: file.updatedAt,
  };
}

// Helper to get breadcrumbs for files in search results
async function getMongoBreadcrumbs(folderId: string): Promise<{ id: string; name: string }[]> {
  const crumbs: { id: string; name: string }[] = [];
  let currentId: string | null = folderId;
  const visited = new Set<string>();

  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);
    if (!mongoose.Types.ObjectId.isValid(currentId)) break;
    const folder = await Folder.findById(currentId).lean() as (IFolder & { _id: mongoose.Types.ObjectId }) | null;
    if (!folder) break;
    crumbs.unshift({
      id: String(folder._id),
      name: folder.name,
    });
    currentId = folder.parent ? String(folder.parent) : null;
  }

  return crumbs;
}

// Helper for local file breadcrumbs lookup
function getLocalBreadcrumbs(folderId: string, folders: any[]): { id: string; name: string }[] {
  const crumbs: { id: string; name: string }[] = [];
  let currentId: string | null = folderId;
  const visited = new Set<string>();

  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);
    const folder = folders.find((f) => f.id === currentId);
    if (!folder) break;
    crumbs.unshift({
      id: folder.id,
      name: folder.name,
    });
    currentId = folder.parentId ?? null;
  }

  return crumbs;
}

// ─── GET ──────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const folderId = searchParams.get("folderId"); // e.g. "null" or some ObjectId
  const search = searchParams.get("search");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") || "100", 10)));

  try {
    await connectToDatabase();

    let query: any = {};
    if (search) {
      // Search matches title, subject, or uploader
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { subject: { $regex: search, $options: "i" } },
        { uploadedBy: { $regex: search, $options: "i" } },
      ];
    } else if (folderId !== null) {
      query.folderId = folderId === "null" || !folderId ? null : new mongoose.Types.ObjectId(folderId);
    }

    const total = await DocFile.countDocuments(query);
    const files = await DocFile.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Map files and fetch parent breadcrumbs context for search results
    const normalized = await Promise.all(
      files.map(async (file: any) => {
        const item = normalizeFile(file);
        let breadcrumbs: any[] = [];
        if (file.folderId) {
          try {
            breadcrumbs = await getMongoBreadcrumbs(String(file.folderId));
          } catch (e) {
            console.error("Failed to get breadcrumbs for file:", file._id, e);
          }
        }
        return {
          ...item,
          breadcrumbs,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: normalized,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: unknown) {
    if (isMongoConnectionError(error)) {
      const files = await readLocalFiles();

      let filtered = files;
      if (search) {
        filtered = files.filter(
          (f) =>
            f.title.toLowerCase().includes(search.toLowerCase()) ||
            f.subject.toLowerCase().includes(search.toLowerCase()) ||
            f.uploadedBy.toLowerCase().includes(search.toLowerCase())
        );
      } else if (folderId !== null) {
        const targetFolder = folderId === "null" || !folderId ? null : folderId;
        filtered = files.filter((f) => f.folderId === targetFolder);
      }

      const total = filtered.length;
      const paginated = filtered.slice((page - 1) * limit, page * limit);

      // Attach local breadcrumbs context
      const { readLocalFolders } = require("@/lib/localFolders");
      const folders = await readLocalFolders();

      const normalized = paginated.map((file) => {
        let breadcrumbs: any[] = [];
        if (file.folderId) {
          breadcrumbs = getLocalBreadcrumbs(file.folderId, folders);
        }
        return {
          ...file,
          breadcrumbs,
        };
      });

      return NextResponse.json({
        success: true,
        data: normalized,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    }

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
  const user = await verifyAuth(request);
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    title?: string;
    subject?: string;
    department?: string;
    year?: string;
    type?: string;
    uploadedBy?: string;
    driveId?: string;
    color?: string;
    size?: string;
    folderId?: string | null;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

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
    folderId,
  } = body;

  if (!title || !subject || !department || !year || !type || !uploadedBy || !driveId || !color) {
    return NextResponse.json(
      { success: false, error: "Missing required fields" },
      { status: 400 }
    );
  }

  try {
    await connectToDatabase();

    const targetFolderId = folderId && mongoose.Types.ObjectId.isValid(folderId) 
      ? new mongoose.Types.ObjectId(folderId) 
      : null;

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
      folderId: targetFolderId,
      ownerId: user.uid,
      size: size || "1.0 MB",
    });

    // 2. Increment folder filesCount
    let f = null;
    if (targetFolderId) {
      f = await Folder.findById(targetFolderId);
    }
    if (!f) {
      // Fallback matching by name+year+department
      f = await Folder.findOne({ name: subject.trim(), year, department });
    }

    if (f) {
      await Folder.updateOne({ _id: f._id }, { $inc: { filesCount: 1 } });
    } else {
      // Create folder if it doesn't exist
      await Folder.create({
        name: subject.trim(),
        department,
        year,
        color,
        filesCount: 1,
        parent: null,
        ownerId: user.uid,
      });
    }

    return NextResponse.json({ success: true, data: normalizeFile(newFile.toObject()) }, { status: 201 });
  } catch (error: unknown) {
    if (isMongoConnectionError(error)) {
      const newFile = await createLocalFile({
        title,
        subject,
        department,
        year,
        type,
        uploadedBy,
        driveId,
        color,
        size,
        folderId: folderId ?? null,
        ownerId: user.uid,
      });

      return NextResponse.json({ success: true, data: newFile }, { status: 201 });
    }

    console.error("[POST /api/files]", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// ─── PATCH ────────────────────────────────────────────────────────
export async function PATCH(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    id?: string;
    title?: string;
    subject?: string;
    department?: string;
    year?: string;
    type?: string;
    driveId?: string;
    color?: string;
    size?: string;
    folderId?: string | null;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { id, title, subject, department, year, type, driveId, color, size, folderId } = body;

  if (!id) {
    return NextResponse.json(
      { success: false, error: "id is required" },
      { status: 400 }
    );
  }

  try {
    await connectToDatabase();

    const file = await DocFile.findById(id);
    if (!file) {
      return NextResponse.json({ success: false, error: "File not found" }, { status: 404 });
    }

    // Verify ownership (except for legacy public files)
    if (file.ownerId && file.ownerId !== user.uid) {
      return NextResponse.json({ success: false, error: "Forbidden: You do not own this note" }, { status: 403 });
    }

    // Handle filesCount adjustments in folders if moving folders
    const targetFolderId = folderId === null 
      ? null 
      : folderId && mongoose.Types.ObjectId.isValid(folderId)
        ? new mongoose.Types.ObjectId(folderId)
        : file.folderId;

    if (folderId !== undefined && String(file.folderId) !== String(targetFolderId)) {
      if (file.folderId) {
        await Folder.updateOne({ _id: file.folderId }, { $inc: { filesCount: -1 } });
      }
      if (targetFolderId) {
        await Folder.updateOne({ _id: targetFolderId }, { $inc: { filesCount: 1 } });
      }
    }

    if (title) file.title = title;
    if (subject) file.subject = subject.trim();
    if (department) file.department = department;
    if (year) file.year = year;
    if (type) file.type = type;
    if (driveId) file.driveId = driveId;
    if (color) file.color = color;
    if (size) file.size = size;
    if (folderId !== undefined) file.folderId = targetFolderId;

    await file.save();

    return NextResponse.json({ success: true, data: normalizeFile(file.toObject()) });
  } catch (error: unknown) {
    if (isMongoConnectionError(error)) {
      const updated = await updateLocalFile({
        id,
        title,
        subject,
        department,
        year,
        type,
        driveId,
        color,
        size,
        folderId: folderId !== undefined ? folderId : undefined,
        ownerId: user.uid,
      });

      if (!updated) {
        return NextResponse.json({ success: false, error: "File not found" }, { status: 404 });
      }

      return NextResponse.json({ success: true, data: updated });
    }

    console.error("[PATCH /api/files]", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// ─── DELETE ───────────────────────────────────────────────────────
export async function DELETE(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

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

    const file = await DocFile.findById(id);
    if (!file) {
      return NextResponse.json({ success: false, error: "File not found" }, { status: 404 });
    }

    // Verify ownership (except for legacy public files)
    if (file.ownerId && file.ownerId !== user.uid) {
      return NextResponse.json({ success: false, error: "Forbidden: You do not own this note" }, { status: 403 });
    }

    // Decrement filesCount
    if (file.folderId) {
      await Folder.updateOne({ _id: file.folderId }, { $inc: { filesCount: -1 } });
    }

    await DocFile.findByIdAndDelete(id);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (isMongoConnectionError(error)) {
      const deleted = await deleteLocalFile(id);

      if (!deleted) {
        return NextResponse.json({ success: false, error: "File not found" }, { status: 404 });
      }

      return NextResponse.json({ success: true });
    }

    console.error("[DELETE /api/files]", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
