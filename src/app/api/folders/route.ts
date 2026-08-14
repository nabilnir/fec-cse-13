import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import Folder from "@/lib/models/Folder";
import type { IFolder } from "@/lib/models/Folder";
import DocFile from "@/lib/models/DocFile";
import { verifyAuth } from "@/lib/auth";
import {
  deleteLocalFolder,
  isMongoConnectionError,
  readLocalFolders,
  updateLocalFolder,
  upsertLocalFolder,
  checkLocalFolderCycle,
  getDescendantFolderIds,
} from "@/lib/localFolders";

type FolderLike = {
  _id?: unknown;
  id?: unknown;
  name: string;
  department: string;
  year: string;
  color: string;
  parent?: unknown;
  ownerId?: string | null;
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
    parentId: folder.parent ? String(folder.parent) : null,
    ownerId: folder.ownerId ? String(folder.ownerId) : null,
    filesCount: folder.filesCount ?? 0,
    createdAt: folder.createdAt,
    updatedAt: folder.updatedAt,
  };
}

// ─── BREADCRUMBS HELPERS ──────────────────────────────────────────
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

// ─── CYCLE DETECTION HELPERS ──────────────────────────────────────
async function checkMongoFolderCycle(folderId: string, parentId: string | null): Promise<boolean> {
  if (!parentId) return false;
  if (folderId === parentId) return true;

  let currentId: string | null = parentId;
  const visited = new Set<string>();

  while (currentId) {
    if (visited.has(currentId)) return true;
    visited.add(currentId);

    if (currentId === folderId) return true;

    if (!mongoose.Types.ObjectId.isValid(currentId)) break;
    const folder = await Folder.findById(currentId).lean() as (IFolder & { _id: mongoose.Types.ObjectId }) | null;
    if (!folder) break;
    currentId = folder.parent ? String(folder.parent) : null;
  }

  return false;
}

// ─── RECURSIVE DELETE HELPERS ─────────────────────────────────────
async function getMongoDescendantIds(folderId: string): Promise<string[]> {
  const ids: string[] = [folderId];
  let checkList: string[] = [folderId];

  while (checkList.length > 0) {
    const nextCheck: string[] = [];
    for (const id of checkList) {
      if (!mongoose.Types.ObjectId.isValid(id)) continue;
      const children = await Folder.find({ parent: id }).lean();
      for (const child of children) {
        const childIdStr = String(child._id);
        if (!ids.includes(childIdStr)) {
          ids.push(childIdStr);
          nextCheck.push(childIdStr);
        }
      }
    }
    checkList = nextCheck;
  }

  return ids;
}

// ─── GET ──────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const parentId = searchParams.get("parentId"); // e.g. "null" or some ObjectId
  const search = searchParams.get("search");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") || "100", 10)));

  try {
    await connectToDatabase();

    let query: any = {};
    if (search) {
      query.name = { $regex: search, $options: "i" };
    } else if (parentId !== null) {
      query.parent = parentId === "null" || !parentId ? null : new mongoose.Types.ObjectId(parentId);
    }

    const total = await Folder.countDocuments(query);
    const folders = await Folder.find(query)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Always return breadcrumbs when a valid parentId is provided
    let breadcrumbs: any[] = [];
    if (parentId && parentId !== "null" && mongoose.Types.ObjectId.isValid(parentId)) {
      breadcrumbs = await getMongoBreadcrumbs(parentId);
    }

    return NextResponse.json({
      success: true,
      data: folders.map((folder) => normalizeFolder(folder as FolderLike)),
      breadcrumbs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: unknown) {
    if (isMongoConnectionError(error)) {
      const folders = await readLocalFolders();
      
      let filtered = folders;
      if (search) {
        filtered = folders.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()));
      } else if (parentId !== null) {
        const targetParent = parentId === "null" || !parentId ? null : parentId;
        filtered = folders.filter((f) => f.parentId === targetParent);
      }

      const total = filtered.length;
      const paginated = filtered.slice((page - 1) * limit, page * limit);

      let breadcrumbs: any[] = [];
      if (parentId && parentId !== "null") {
        breadcrumbs = getLocalBreadcrumbs(parentId, folders);
      }

      return NextResponse.json({
        success: true,
        data: paginated,
        breadcrumbs,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
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
  // Verify user authorization server-side
  const user = await verifyAuth(request);
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    name?: string;
    department?: string;
    year?: string;
    color?: string;
    parentId?: string | null;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { name, department, year, color, parentId } = body;

  if (!name || !department || !year || !color) {
    return NextResponse.json(
      { success: false, error: "name, department, year, and color are required" },
      { status: 400 }
    );
  }

  try {
    await connectToDatabase();

    const parentRef = parentId && mongoose.Types.ObjectId.isValid(parentId) 
      ? new mongoose.Types.ObjectId(parentId) 
      : null;

    // Check for duplicate folder names within the same parent
    const duplicate = await Folder.findOne({
      name: name.trim(),
      year,
      department,
      parent: parentRef,
    });

    if (duplicate) {
      return NextResponse.json(
        { success: false, error: "A folder with this name already exists in this directory" },
        { status: 400 }
      );
    }

    const folder = await Folder.create({
      name: name.trim(),
      department,
      year,
      color,
      parent: parentRef,
      ownerId: user.uid,
    });

    return NextResponse.json(
      { success: true, data: normalizeFolder(folder.toObject() as FolderLike) },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (isMongoConnectionError(error)) {
      try {
        const folder = await upsertLocalFolder({
          name,
          department,
          year,
          color,
          parentId: parentId ?? null,
          ownerId: user.uid,
        });
        return NextResponse.json({ success: true, data: folder }, { status: 201 });
      } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 400 });
      }
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
  const user = await verifyAuth(request);
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    id?: string;
    name?: string;
    department?: string;
    year?: string;
    color?: string;
    parentId?: string | null;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { id, name, department, year, color, parentId } = body;

  if (!id) {
    return NextResponse.json(
      { success: false, error: "id is required" },
      { status: 400 }
    );
  }

  try {
    await connectToDatabase();

    const folder = await Folder.findById(id);
    if (!folder) {
      return NextResponse.json(
        { success: false, error: "Folder not found" },
        { status: 404 }
      );
    }

    // Verify ownership (except for legacy public folders)
    if (folder.ownerId && folder.ownerId !== user.uid) {
      return NextResponse.json({ success: false, error: "Forbidden: You do not own this folder" }, { status: 403 });
    }

    // If updating parentId, check for cycles
    if (parentId !== undefined && parentId !== (folder.parent ? String(folder.parent) : null)) {
      const isCycle = await checkMongoFolderCycle(id, parentId);
      if (isCycle) {
        return NextResponse.json(
          { success: false, error: "Cannot move a folder into itself or its descendants" },
          { status: 400 }
        );
      }
    }

    const parentRef = parentId === null 
      ? null 
      : parentId && mongoose.Types.ObjectId.isValid(parentId)
        ? new mongoose.Types.ObjectId(parentId)
        : folder.parent;

    if (name) folder.name = name.trim();
    if (department) folder.department = department;
    if (year) folder.year = year;
    if (color) folder.color = color;
    if (parentId !== undefined) folder.parent = parentRef;

    await folder.save();

    return NextResponse.json({ success: true, data: normalizeFolder(folder.toObject() as FolderLike) });
  } catch (error: unknown) {
    if (isMongoConnectionError(error)) {
      try {
        const folder = await updateLocalFolder({
          id,
          name,
          department,
          year,
          color,
          parentId: parentId !== undefined ? parentId : undefined,
          ownerId: user.uid,
        });

        if (!folder) {
          return NextResponse.json(
            { success: false, error: "Folder not found" },
            { status: 404 }
          );
        }

        return NextResponse.json({ success: true, data: folder });
      } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 400 });
      }
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

    const folder = await Folder.findById(id);
    if (!folder) {
      return NextResponse.json(
        { success: false, error: "Folder not found" },
        { status: 404 }
      );
    }

    // Verify ownership (except for legacy public folders)
    if (folder.ownerId && folder.ownerId !== user.uid) {
      return NextResponse.json({ success: false, error: "Forbidden: You do not own this folder" }, { status: 403 });
    }

    const idsToDelete = await getMongoDescendantIds(id);

    // Use MongoDB transaction where supported, with simple delete fallback
    let session = null;
    try {
      session = await mongoose.startSession();
      session.startTransaction();
      await Folder.deleteMany({ _id: { $in: idsToDelete } }).session(session);
      await DocFile.deleteMany({ folderId: { $in: idsToDelete } }).session(session);
      await session.commitTransaction();
    } catch (txnError) {
      if (session) await session.abortTransaction();
      console.warn("[DELETE /api/folders] Transaction failed. Falling back to non-transaction deletes.", txnError);
      await Folder.deleteMany({ _id: { $in: idsToDelete } });
      await DocFile.deleteMany({ folderId: { $in: idsToDelete } });
    } finally {
      if (session) session.endSession();
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
