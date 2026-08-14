import { randomUUID } from "crypto";
import path from "path";
import { readJsonArray, writeJsonArray } from "@/lib/localData";
import { adjustLocalFolderFilesCount } from "@/lib/localFolders";

export type LocalFileRecord = {
  id: string;
  title: string;
  subject: string;
  department: string;
  year: string;
  type: string;
  uploadedBy: string;
  uploadDate: string;
  driveId: string;
  color: string;
  size?: string;
  folderId?: string | null;
  ownerId?: string | null; // Firebase user UID
  createdAt: string;
  updatedAt: string;
};

type FileInput = {
  title: string;
  subject: string;
  department: string;
  year: string;
  type: string;
  uploadedBy: string;
  driveId: string;
  color: string;
  size?: string;
  folderId?: string | null;
  ownerId?: string | null;
};

type FileUpdate = {
  id: string;
  title?: string;
  subject?: string;
  department?: string;
  year?: string;
  type?: string;
  driveId?: string;
  color?: string;
  size?: string;
  folderId?: string | null;
  ownerId?: string | null;
};

const FILE_PATH = path.join(process.cwd(), ".data", "files.json");

function normalizeFile(value: unknown): LocalFileRecord | null {
  if (!value || typeof value !== "object") return null;
  const file = value as Record<string, unknown>;
  if (typeof file.title !== "string" || typeof file.subject !== "string") return null;

  const now = new Date().toISOString();
  return {
    id: typeof file.id === "string" ? file.id : randomUUID(),
    title: file.title,
    subject: file.subject,
    department: typeof file.department === "string" ? file.department : "CSE",
    year: typeof file.year === "string" ? file.year : "2nd Year",
    type: typeof file.type === "string" ? file.type : "Notes",
    uploadedBy: typeof file.uploadedBy === "string" ? file.uploadedBy : "Anonymous Student",
    uploadDate: typeof file.uploadDate === "string" ? file.uploadDate : now.slice(0, 10),
    driveId: typeof file.driveId === "string" ? file.driveId : "",
    color: typeof file.color === "string" ? file.color : "blue",
    size: typeof file.size === "string" ? file.size : undefined,
    folderId: typeof file.folderId === "string" ? file.folderId : null,
    ownerId: typeof file.ownerId === "string" ? file.ownerId : null,
    createdAt: typeof file.createdAt === "string" ? file.createdAt : now,
    updatedAt: typeof file.updatedAt === "string" ? file.updatedAt : now,
  };
}

export async function readLocalFiles() {
  try {
    const { runLocalMigration } = require("./migration");
    await runLocalMigration();
  } catch (err) {
    console.error("Failed to run local migration in readLocalFiles:", err);
  }
  const files = await readJsonArray<unknown>(FILE_PATH, []);
  return files
    .map(normalizeFile)
    .filter((file): file is LocalFileRecord => file !== null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createLocalFile(input: FileInput) {
  const now = new Date().toISOString();
  const files = await readLocalFiles();
  const file = {
    id: randomUUID(),
    title: input.title,
    subject: input.subject.trim(),
    department: input.department,
    year: input.year,
    type: input.type,
    uploadedBy: input.uploadedBy,
    uploadDate: now.slice(0, 10),
    driveId: input.driveId,
    color: input.color,
    size: input.size || "1.0 MB",
    folderId: input.folderId ?? null,
    ownerId: input.ownerId ?? null,
    createdAt: now,
    updatedAt: now,
  };

  files.unshift(file);
  await writeJsonArray(FILE_PATH, files);

  // If a folderId is given, increment filesCount on that specific folder.
  // Otherwise search/fallback to folder by name.
  const { readLocalFolders } = require("./localFolders");
  const folders = await readLocalFolders();
  let targetFolder = null;

  if (input.folderId) {
    targetFolder = folders.find((f: any) => f.id === input.folderId);
  }
  if (!targetFolder) {
    targetFolder = folders.find(
      (f: any) =>
        f.name.toLowerCase() === input.subject.trim().toLowerCase() &&
        f.year === input.year &&
        f.department === input.department
    );
  }

  if (targetFolder) {
    await adjustLocalFolderFilesCount(
      {
        name: targetFolder.name,
        department: targetFolder.department,
        year: targetFolder.year,
        color: targetFolder.color,
        parentId: targetFolder.parentId ?? null,
        ownerId: targetFolder.ownerId ?? null,
      },
      1
    );
  } else {
    // create the folder if it does not exist
    await adjustLocalFolderFilesCount(
      {
        name: input.subject.trim(),
        department: input.department,
        year: input.year,
        color: input.color,
        parentId: null,
        ownerId: input.ownerId ?? null,
      },
      1
    );
  }

  return file;
}

export async function updateLocalFile(input: FileUpdate) {
  const now = new Date().toISOString();
  const files = await readLocalFiles();
  const index = files.findIndex((f) => f.id === input.id);
  if (index < 0) {
    return null;
  }

  const current = files[index];

  // Adjust folder filesCounts if note was moved to another folder
  if (input.folderId !== undefined && input.folderId !== current.folderId) {
    const { readLocalFolders } = require("./localFolders");
    const folders = await readLocalFolders();

    if (current.folderId) {
      const oldFolder = folders.find((f: any) => f.id === current.folderId);
      if (oldFolder) {
        await adjustLocalFolderFilesCount(
          {
            name: oldFolder.name,
            department: oldFolder.department,
            year: oldFolder.year,
            color: oldFolder.color,
            parentId: oldFolder.parentId ?? null,
            ownerId: oldFolder.ownerId ?? null,
          },
          -1
        );
      }
    }

    if (input.folderId) {
      const newFolder = folders.find((f: any) => f.id === input.folderId);
      if (newFolder) {
        await adjustLocalFolderFilesCount(
          {
            name: newFolder.name,
            department: newFolder.department,
            year: newFolder.year,
            color: newFolder.color,
            parentId: newFolder.parentId ?? null,
            ownerId: newFolder.ownerId ?? null,
          },
          1
        );
      }
    }
  }

  const updated = {
    ...current,
    title: input.title || current.title,
    subject: input.subject || current.subject,
    department: input.department ?? current.department,
    year: input.year ?? current.year,
    type: input.type ?? current.type,
    driveId: input.driveId ?? current.driveId,
    color: input.color ?? current.color,
    size: input.size ?? current.size,
    folderId: input.folderId !== undefined ? input.folderId : (current.folderId ?? null),
    ownerId: input.ownerId ?? current.ownerId ?? null,
    updatedAt: now,
  };

  files[index] = updated;
  await writeJsonArray(FILE_PATH, files);
  return updated;
}

export async function deleteLocalFile(id: string) {
  const files = await readLocalFiles();
  const fileIndex = files.findIndex((f) => f.id === id);
  if (fileIndex < 0) {
    return false;
  }

  const file = files[fileIndex];

  // Decrement folder filesCount
  if (file.folderId) {
    const { readLocalFolders } = require("./localFolders");
    const folders = await readLocalFolders();
    const folder = folders.find((f: any) => f.id === file.folderId);
    if (folder) {
      await adjustLocalFolderFilesCount(
        {
          name: folder.name,
          department: folder.department,
          year: folder.year,
          color: folder.color,
          parentId: folder.parentId ?? null,
          ownerId: folder.ownerId ?? null,
        },
        -1
      );
    }
  }

  files.splice(fileIndex, 1);
  await writeJsonArray(FILE_PATH, files);
  return true;
}