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
  parent?: mongoose.Types.ObjectId | null; // optional parent folder
  ownerId?: string | null; // Firebase user UID
  createdAt: Date;
  updatedAt: Date;
}

const FolderSchema = new Schema<IFolder>(
  {
    name:       { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    year:       { type: String, required: true, trim: true },
    color:      { type: String, required: true, default: "blue", trim: true },
    filesCount: { type: Number, required: true, default: 0 },
    parent:     { type: Schema.Types.ObjectId, ref: "Folder", default: null },
    ownerId:    { type: String, default: null },
  },
  { timestamps: true }
);

// Ensure uniqueness per (name, year, department, parent) so same-name folders
// may exist across different semesters or parent folders.
FolderSchema.index({ name: 1, year: 1, department: 1, parent: 1 }, { unique: true, sparse: true });

// Create indexes for efficient hierarchical query lookups
FolderSchema.index({ parent: 1 });
FolderSchema.index({ ownerId: 1 });

// Prevent model re-compilation on hot-reload in development
const Folder: Model<IFolder> =
  mongoose.models.Folder ?? mongoose.model<IFolder>("Folder", FolderSchema);

export default Folder;
