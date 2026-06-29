/**
 * lib/models/Semester.ts
 * Mongoose model for a Semester document stored in MongoDB.
 */

import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISemester extends Document {
  label: string;          // e.g. "1st Year 1st Semester"
  year: string;           // e.g. "1st Year"
  semNumber: number;      // 1–8
  courses: ICourse[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ICourse {
  code: string;           // e.g. "CS-101"
  title: string;          // e.g. "Introduction to Programming"
  department: string;     // e.g. "CSE"
  creditHours: number;    // e.g. 3
  instructor?: string;
}

const CourseSchema = new Schema<ICourse>(
  {
    code:        { type: String, required: true, trim: true },
    title:       { type: String, required: true, trim: true },
    department:  { type: String, required: true, trim: true },
    creditHours: { type: Number, required: true, default: 3 },
    instructor:  { type: String, trim: true },
  },
  { _id: false }
);

const SemesterSchema = new Schema<ISemester>(
  {
    label:     { type: String, required: true, unique: true, trim: true },
    year:      { type: String, required: true, trim: true },
    semNumber: { type: Number, required: true, min: 1, max: 8 },
    courses:   { type: [CourseSchema], default: [] },
  },
  { timestamps: true }
);

// Prevent model re-compilation on hot-reload in development
const Semester: Model<ISemester> =
  mongoose.models.Semester ??
  mongoose.model<ISemester>("Semester", SemesterSchema);

export default Semester;
