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
  createdAt: string;
  updatedAt: string;
}

type FolderInput = {
  name: string;
  department: string;
  year: string;
  color: string;
};

type FolderUpdate = {
  id: string;
  name?: string;
  department?: string;
  year?: string;
  color?: string;
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
  return readFoldersFromDisk();
}

export async function upsertLocalFolder(input: FolderInput) {
  const now = new Date().toISOString();
  const folders = await readFoldersFromDisk();
  const folderName = input.name.trim();
  const existingIndex = folders.findIndex(
    (folder) => folder.name.toLowerCase() === folderName.toLowerCase()
  );

  if (existingIndex >= 0) {
    folders[existingIndex] = {
      ...folders[existingIndex],
      name: folderName,
      department: input.department,
      year: input.year,
      color: input.color,
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
  const updated = {
    ...current,
    name: input.name?.trim() || current.name,
    department: input.department ?? current.department,
    year: input.year ?? current.year,
    color: input.color ?? current.color,
    updatedAt: now,
  };

  folders[index] = updated;
  await writeFoldersToDisk(folders);
  return updated;
}

export async function deleteLocalFolder(id: string) {
  const folders = await readFoldersFromDisk();
  const nextFolders = folders.filter((folder) => folder.id !== id);

  if (nextFolders.length === folders.length) {
    return false;
  }

  await writeFoldersToDisk(nextFolders);
  return true;
}

export async function adjustLocalFolderFilesCount(input: FolderInput, delta = 1) {
  const now = new Date().toISOString();
  const folders = await readFoldersFromDisk();
  const folderName = input.name.trim();
  const existingIndex = folders.findIndex(
    (folder) => folder.name.toLowerCase() === folderName.toLowerCase()
  );

  if (existingIndex >= 0) {
    folders[existingIndex] = {
      ...folders[existingIndex],
      name: folderName,
      department: input.department,
      year: input.year,
      color: input.color,
      filesCount: folders[existingIndex].filesCount + delta,
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
    filesCount: delta,
    createdAt: now,
    updatedAt: now,
  };

  folders.unshift(folder);
  await writeFoldersToDisk(folders);
  return folder;
}