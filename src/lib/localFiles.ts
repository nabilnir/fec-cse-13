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
    createdAt: typeof file.createdAt === "string" ? file.createdAt : now,
    updatedAt: typeof file.updatedAt === "string" ? file.updatedAt : now,
  };
}

export async function readLocalFiles() {
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
    createdAt: now,
    updatedAt: now,
  };

  files.unshift(file);
  await writeJsonArray(FILE_PATH, files);
  await adjustLocalFolderFilesCount(
    {
      name: input.subject,
      department: input.department,
      year: input.year,
      color: input.color,
    },
    1
  );

  return file;
}