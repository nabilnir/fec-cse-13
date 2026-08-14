import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

export interface LocalFolderRecord {
  id: string;
  name: string;
  department: string;
  year: string;
  color: string;
  filesCount: number;
  parentId?: string | null;
  ownerId?: string | null; // Firebase user UID
  createdAt: string;
  updatedAt: string;
}

type FolderInput = {
  name: string;
  department: string;
  year: string;
  color: string;
  parentId?: string | null;
  ownerId?: string | null;
};

type FolderUpdate = {
  id: string;
  name?: string;
  department?: string;
  year?: string;
  color?: string;
  parentId?: string | null;
  ownerId?: string | null;
};

const LOCAL_DATA_FILE = path.join(process.cwd(), ".data", "folders.json");

function createSeedFolder(
  name: string,
  department: string,
  year: string,
  color: string
): LocalFolderRecord {
  const now = new Date().toISOString();

  return {
    id: randomUUID(),
    name,
    department,
    year,
    color,
    filesCount: 0,
    parentId: null,
    ownerId: null,
    createdAt: now,
    updatedAt: now,
  };
}

const DEFAULT_FOLDERS: LocalFolderRecord[] = [
  createSeedFolder("PSY. Midterm", "CSE", "2nd Year", "blue"),
  createSeedFolder("Creative Writing Essay Inspo.", "Mechanical", "3rd Year", "yellow"),
  createSeedFolder("IND Group Project Folder", "Civil", "3rd Year", "grey"),
  createSeedFolder("Class Notes for CRT", "EEE", "2nd Year", "red"),
  createSeedFolder("Data Structures & Algorithms", "CSE", "2nd Year", "blue"),
  createSeedFolder("Thermodynamics & Heat Transfer", "Mechanical", "2nd Year", "green"),
  createSeedFolder("Basic Electrical Eng. Slides", "EEE", "1st Year", "yellow"),
  createSeedFolder("Structural Mechanics Lab", "Civil", "2nd Year", "red"),
];

function isNotFoundError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "ENOENT"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeFolderRecord(folder: unknown): LocalFolderRecord | null {
  if (!isRecord(folder) || typeof folder.name !== "string") {
    return null;
  }

  const now = new Date().toISOString();

  return {
    id: typeof folder.id === "string" ? folder.id : randomUUID(),
    name: folder.name,
    department: typeof folder.department === "string" ? folder.department : "CSE",
    year: typeof folder.year === "string" ? folder.year : "2nd Year",
    color: typeof folder.color === "string" ? folder.color : "blue",
    filesCount: typeof folder.filesCount === "number" ? folder.filesCount : 0,
    parentId: typeof folder.parentId === "string" ? folder.parentId : null,
    ownerId: typeof folder.ownerId === "string" ? folder.ownerId : null,
    createdAt: typeof folder.createdAt === "string" ? folder.createdAt : now,
    updatedAt: typeof folder.updatedAt === "string" ? folder.updatedAt : now,
  };
}

async function writeFoldersToDisk(folders: LocalFolderRecord[]) {
  await mkdir(path.dirname(LOCAL_DATA_FILE), { recursive: true });
  await writeFile(LOCAL_DATA_FILE, JSON.stringify(folders, null, 2), "utf8");
}

async function readFoldersFromDisk(): Promise<LocalFolderRecord[]> {
  try {
    const raw = await readFile(LOCAL_DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map(normalizeFolderRecord)
      .filter((folder): folder is LocalFolderRecord => folder !== null)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  } catch (error) {
    if (isNotFoundError(error)) {
      await writeFoldersToDisk(DEFAULT_FOLDERS);
      return [...DEFAULT_FOLDERS];
    }

    throw error;
  }
}

export function isMongoConnectionError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = `${error.name} ${error.message} ${String((error as { cause?: unknown }).cause ?? "")}`;
  return /ECONNREFUSED|querySrv|MongooseServerSelectionError|MongoNetworkError|Server selection timed out|ENOTFOUND/i.test(message);
}

export async function readLocalFolders() {
  try {
    const { runLocalMigration } = require("./migration");
    await runLocalMigration();
  } catch (err) {
    console.error("Failed to run local migration in readLocalFolders:", err);
  }
  return readFoldersFromDisk();
}

/**
 * Detects if setting parentId of folderId to parentId would cause a circular reference.
 */
export function checkLocalFolderCycle(
  folderId: string,
  parentId: string | null,
  folders: LocalFolderRecord[]
): boolean {
  if (!parentId) return false;
  if (folderId === parentId) return true;

  let currentId: string | null = parentId;
  const visited = new Set<string>();

  while (currentId) {
    if (visited.has(currentId)) return true;
    visited.add(currentId);

    if (currentId === folderId) return true;

    const folder = folders.find((f) => f.id === currentId);
    if (!folder) break;
    currentId = folder.parentId ?? null;
  }

  return false;
}

/**
 * Returns all descendant IDs of a folder, including the folder ID itself.
 */
export function getDescendantFolderIds(folderId: string, folders: LocalFolderRecord[]): string[] {
  const ids = [folderId];
  let checkList = [folderId];

  while (checkList.length > 0) {
    const nextCheck: string[] = [];
    for (const id of checkList) {
      const children = folders.filter((f) => f.parentId === id);
      for (const child of children) {
        if (!ids.includes(child.id)) {
          ids.push(child.id);
          nextCheck.push(child.id);
        }
      }
    }
    checkList = nextCheck;
  }

  return ids;
}

export async function upsertLocalFolder(input: FolderInput) {
  const now = new Date().toISOString();
  const folders = await readFoldersFromDisk();
  const folderName = input.name.trim();
  const existingIndex = folders.findIndex(
    (folder) =>
      folder.name.toLowerCase() === folderName.toLowerCase() &&
      folder.year === input.year &&
      folder.department === input.department &&
      (folder.parentId ?? null) === (input.parentId ?? null)
  );

  if (existingIndex >= 0) {
    folders[existingIndex] = {
      ...folders[existingIndex],
      name: folderName,
      department: input.department,
      year: input.year,
      color: input.color,
      parentId: input.parentId ?? null,
      ownerId: input.ownerId ?? folders[existingIndex].ownerId ?? null,
      updatedAt: now,
    };

    await writeFoldersToDisk(folders);
    return folders[existingIndex];
  }

  const folder = {
    id: randomUUID(),
    name: folderName,
    department: input.department,
    year: input.year,
    color: input.color,
    parentId: input.parentId ?? null,
    ownerId: input.ownerId ?? null,
    filesCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  folders.unshift(folder);
  await writeFoldersToDisk(folders);
  return folder;
}

export async function updateLocalFolder(input: FolderUpdate) {
  const now = new Date().toISOString();
  const folders = await readFoldersFromDisk();
  const index = folders.findIndex((folder) => folder.id === input.id);

  if (index < 0) {
    return null;
  }

  const current = folders[index];
  
  // If moving, validate that no circular paths are created
  if (input.parentId !== undefined && input.parentId !== current.parentId) {
    const isCycle = checkLocalFolderCycle(current.id, input.parentId, folders);
    if (isCycle) {
      throw new Error("Circular dependency detected: Cannot move a folder into itself or its descendants.");
    }
  }

  const updated = {
    ...current,
    name: input.name?.trim() || current.name,
    department: input.department ?? current.department,
    year: input.year ?? current.year,
    color: input.color ?? current.color,
    parentId: input.parentId !== undefined ? input.parentId : (current.parentId ?? null),
    ownerId: input.ownerId ?? current.ownerId ?? null,
    updatedAt: now,
  };

  folders[index] = updated;
  await writeFoldersToDisk(folders);
  return updated;
}

export async function deleteLocalFolder(id: string) {
  const folders = await readFoldersFromDisk();
  const folderExists = folders.some((f) => f.id === id);
  if (!folderExists) {
    return false;
  }

  // Get all descendant folders to delete recursively
  const idsToDelete = getDescendantFolderIds(id, folders);
  const nextFolders = folders.filter((folder) => !idsToDelete.includes(folder.id));
  await writeFoldersToDisk(nextFolders);

  // Clean up any files linked to these deleted folders
  const FILE_PATH = path.join(process.cwd(), ".data", "files.json");
  try {
    const { readJsonArray, writeJsonArray } = require("./localData");
    const files = await readJsonArray(FILE_PATH, []);
    const remainingFiles = files.filter((file: any) => !idsToDelete.includes(file.folderId));
    await writeJsonArray(FILE_PATH, remainingFiles);
  } catch (err) {
    console.error("Failed to delete local files in deleted folders:", err);
  }

  return true;
}

export async function adjustLocalFolderFilesCount(input: FolderInput, delta = 1) {
  const now = new Date().toISOString();
  const folders = await readFoldersFromDisk();
  const folderName = input.name.trim();
  const existingIndex = folders.findIndex(
    (folder) =>
      folder.name.toLowerCase() === folderName.toLowerCase() &&
      folder.year === input.year &&
      folder.department === input.department &&
      (folder.parentId ?? null) === (input.parentId ?? null)
  );

  if (existingIndex >= 0) {
    folders[existingIndex] = {
      ...folders[existingIndex],
      name: folderName,
      department: input.department,
      year: input.year,
      color: input.color,
      parentId: input.parentId ?? null,
      ownerId: input.ownerId ?? folders[existingIndex].ownerId ?? null,
      filesCount: Math.max(0, folders[existingIndex].filesCount + delta),
      updatedAt: now,
    };

    await writeFoldersToDisk(folders);
    return folders[existingIndex];
  }

  const folder = {
    id: randomUUID(),
    name: folderName,
    department: input.department,
    year: input.year,
    color: input.color,
    parentId: input.parentId ?? null,
    ownerId: input.ownerId ?? null,
    filesCount: Math.max(0, delta),
    createdAt: now,
    updatedAt: now,
  };

  folders.unshift(folder);
  await writeFoldersToDisk(folders);
  return folder;
}