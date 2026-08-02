/**
 * lib/models/Semester.ts
 * Mongoose model for a Semester document stored in MongoDB.
 */

import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISemester extends Document {
  label: string;          // e.g. "1st Year 1st Semester"
  year: string;           // e.g. "1st Year"
  semNumber: number;      // 1–8
  createdAt: Date;
  updatedAt: Date;
}

const SemesterSchema = new Schema<ISemester>(
  {
    label:     { type: String, required: true, unique: true, trim: true },
    year:      { type: String, required: true, trim: true },
    semNumber: { type: Number, required: true, min: 1, max: 8 },
  },
  { timestamps: true }
);

// Prevent model re-compilation on hot-reload in development
const Semester: Model<ISemester> =
  mongoose.models.Semester ??
  mongoose.model<ISemester>("Semester", SemesterSchema);

export default Semester;
