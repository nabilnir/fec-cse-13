/**
 * lib/models/Course.ts
 * Mongoose model for a Course document stored in MongoDB.
 */

import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICourse extends Document {
  code: string;           // e.g. "CS-101"
  title: string;          // e.g. "Introduction to Programming"
  department: string;     // e.g. "CSE"
  creditHours: number;    // e.g. 3
  instructor?: string;
  semesterLabel: string;  // e.g. "1st Year 1st Semester"
  createdAt: Date;
  updatedAt: Date;
}

const CourseSchema = new Schema<ICourse>(
  {
    code:          { type: String, required: true, trim: true, unique: true },
    title:         { type: String, required: true, trim: true },
    department:    { type: String, required: true, trim: true },
    creditHours:   { type: Number, required: true, default: 3 },
    instructor:    { type: String, trim: true },
    semesterLabel: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

// Prevent model re-compilation on hot-reload in development
const Course: Model<ICourse> =
  mongoose.models.Course ?? mongoose.model<ICourse>("Course", CourseSchema);

export default Course;
