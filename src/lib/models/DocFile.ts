/**
 * lib/models/DocFile.ts
 * Mongoose model for a DocFile document stored in MongoDB.
 */

import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDocFile extends Document {
  title: string;
  subject: string;        // e.g. "PSY. Midterm" -> maps to Folder name
  department: string;     // e.g. "CSE"
  year: string;           // e.g. "2nd Year"
  type: string;           // e.g. "Notes" | "Questions" | "Hand Note" | "Others Campus Note"
  uploadedBy: string;     // e.g. "Prof. Sarah Jenkins"
  uploadDate: string;     // YYYY-MM-DD
  driveId: string;        // Google Drive File ID
  color: string;          // e.g. "blue"
  size?: string;          // e.g. "2.4 MB"
  createdAt: Date;
  updatedAt: Date;
}

const DocFileSchema = new Schema<IDocFile>(
  {
    title:      { type: String, required: true, trim: true },
    subject:    { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    year:       { type: String, required: true, trim: true },
    type:       { type: String, required: true, trim: true },
    uploadedBy: { type: String, required: true, trim: true },
    uploadDate: { type: String, required: true, trim: true },
    driveId:    { type: String, required: true, trim: true },
    color:      { type: String, required: true, trim: true },
    size:       { type: String, trim: true },
  },
  { timestamps: true }
);

// Prevent model re-compilation on hot-reload in development
const DocFile: Model<IDocFile> =
  mongoose.models.DocFile ?? mongoose.model<IDocFile>("DocFile", DocFileSchema);

export default DocFile;
