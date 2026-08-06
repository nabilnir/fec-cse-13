import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

function isNotFoundError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "ENOENT"
  );
}

export async function readJsonArray<T>(filePath: string, fallback: T[] = []) {
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) {
      return [...fallback];
    }

    return parsed as T[];
  } catch (error) {
    if (isNotFoundError(error)) {
      await writeJsonArray(filePath, fallback);
      return [...fallback];
    }

    throw error;
  }
}

export async function writeJsonArray<T>(filePath: string, items: T[]) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(items, null, 2), "utf8");
}