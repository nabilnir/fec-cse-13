import { randomUUID } from "crypto";
import path from "path";
import { readJsonArray, writeJsonArray } from "@/lib/localData";

export type LocalSemesterRecord = {
  id: string;
  label: string;
  year: string;
  semNumber: number;
  createdAt: string;
  updatedAt: string;
};

type SemesterInput = {
  label: string;
  year: string;
  semNumber: number;
};

const FILE_PATH = path.join(process.cwd(), ".data", "semesters.json");

function normalizeSemester(value: unknown): LocalSemesterRecord | null {
  if (!value || typeof value !== "object") return null;
  const semester = value as Record<string, unknown>;
  if (typeof semester.label !== "string") return null;

  const now = new Date().toISOString();
  return {
    id: typeof semester.id === "string" ? semester.id : randomUUID(),
    label: semester.label,
    year: typeof semester.year === "string" ? semester.year : "1st Year",
    semNumber: typeof semester.semNumber === "number" ? semester.semNumber : 1,
    createdAt: typeof semester.createdAt === "string" ? semester.createdAt : now,
    updatedAt: typeof semester.updatedAt === "string" ? semester.updatedAt : now,
  };
}

export async function readLocalSemesters() {
  const semesters = await readJsonArray<unknown>(FILE_PATH, []);
  return semesters
    .map(normalizeSemester)
    .filter((semester): semester is LocalSemesterRecord => semester !== null)
    .sort((a, b) => a.semNumber - b.semNumber);
}

export async function upsertLocalSemester(input: SemesterInput) {
  const now = new Date().toISOString();
  const semesters = await readLocalSemesters();
  const index = semesters.findIndex((semester) => semester.label === input.label);

  if (index >= 0) {
    semesters[index] = {
      ...semesters[index],
      year: input.year,
      semNumber: input.semNumber,
      updatedAt: now,
    };
    await writeJsonArray(FILE_PATH, semesters);
    return semesters[index];
  }

  const semester = {
    id: randomUUID(),
    label: input.label,
    year: input.year,
    semNumber: input.semNumber,
    createdAt: now,
    updatedAt: now,
  };

  semesters.push(semester);
  semesters.sort((a, b) => a.semNumber - b.semNumber);
  await writeJsonArray(FILE_PATH, semesters);
  return semester;
}