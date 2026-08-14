import { randomUUID } from "crypto";
import path from "path";
import { readJsonArray, writeJsonArray } from "@/lib/localData";

export type LocalCourseRecord = {
  id: string;
  code: string;
  title: string;
  department: string;
  creditHours: number;
  instructor?: string;
  semesterLabel: string;
  createdAt: string;
  updatedAt: string;
};

type CourseInput = {
  code: string;
  title: string;
  department: string;
  creditHours?: number;
  instructor?: string;
  semesterLabel: string;
};

const FILE_PATH = path.join(process.cwd(), ".data", "courses.json");

function normalizeCourse(value: unknown): LocalCourseRecord | null {
  if (!value || typeof value !== "object") return null;
  const course = value as Record<string, unknown>;
  if (typeof course.code !== "string" || typeof course.title !== "string") return null;

  const now = new Date().toISOString();
  return {
    id: typeof course.id === "string" ? course.id : randomUUID(),
    code: course.code,
    title: course.title,
    department: typeof course.department === "string" ? course.department : "CSE",
    creditHours: typeof course.creditHours === "number" ? course.creditHours : 3,
    instructor: typeof course.instructor === "string" ? course.instructor : undefined,
    semesterLabel: typeof course.semesterLabel === "string" ? course.semesterLabel : "",
    createdAt: typeof course.createdAt === "string" ? course.createdAt : now,
    updatedAt: typeof course.updatedAt === "string" ? course.updatedAt : now,
  };
}

export async function readLocalCourses() {
  const courses = await readJsonArray<unknown>(FILE_PATH, []);
  return courses
    .map(normalizeCourse)
    .filter((course): course is LocalCourseRecord => course !== null)
    .sort((a, b) => a.code.localeCompare(b.code));
}

export async function upsertLocalCourse(input: CourseInput) {
  const now = new Date().toISOString();
  const courses = await readLocalCourses();
  const index = courses.findIndex((course) => course.code === input.code && course.title === input.title);

  if (index >= 0) {
    courses[index] = {
      ...courses[index],
      title: input.title,
      department: input.department,
      creditHours: input.creditHours ?? 3,
      instructor: input.instructor,
      semesterLabel: input.semesterLabel,
      updatedAt: now,
    };
    await writeJsonArray(FILE_PATH, courses);
    return courses[index];
  }

  const course = {
    id: randomUUID(),
    code: input.code,
    title: input.title,
    department: input.department,
    creditHours: input.creditHours ?? 3,
    instructor: input.instructor,
    semesterLabel: input.semesterLabel,
    createdAt: now,
    updatedAt: now,
  };

  courses.push(course);
  courses.sort((a, b) => a.code.localeCompare(b.code));
  await writeJsonArray(FILE_PATH, courses);
  return course;
}