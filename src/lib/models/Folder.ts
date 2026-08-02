/**
 * lib/models/Folder.ts
 * Mongoose model for a Folder document stored in MongoDB.
 */

import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFolder extends Document {
  name: string;           // e.g. "PSY. Midterm"
  department: string;     // e.g. "CSE"
  year: string;           // e.g. "2nd Year"
  color: string;          // e.g. "blue"
  filesCount: number;     // e.g. 14
  createdAt: Date;
  updatedAt: Date;
}

const FolderSchema = new Schema<IFolder>(
  {
    name:       { type: String, required: true, unique: true, trim: true },
    department: { type: String, required: true, trim: true },
    year:       { type: String, required: true, trim: true },
    color:      { type: String, required: true, default: "blue", trim: true },
    filesCount: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

// Prevent model re-compilation on hot-reload in development
const Folder: Model<IFolder> =
  mongoose.models.Folder ?? mongoose.model<IFolder>("Folder", FolderSchema);

export default Folder;
