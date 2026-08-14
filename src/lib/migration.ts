import mongoose from "mongoose";
import Folder from "@/lib/models/Folder";
import DocFile from "@/lib/models/DocFile";
import { readJsonArray, writeJsonArray } from "@/lib/localData";
import path from "path";
import { randomUUID } from "crypto";

let isMongoMigrationDone = false;
let isLocalMigrationDone = false;

/**
 * Automatically migrates existing MongoDB files and folders.
 * Links files to folders by name (subject -> folder.name) and sets default fields.
 */
export async function runMongoMigration() {
  if (isMongoMigrationDone) return;
  try {
    console.log("[Migration] Checking MongoDB migration...");
    
    // 1. Ensure all folders have a parent and ownerId
    const unmigratedFolders = await Folder.find({
      $or: [
        { parent: { $exists: false } },
        { ownerId: { $exists: false } }
      ]
    });

    if (unmigratedFolders.length > 0) {
      console.log(`[Migration] Migrating ${unmigratedFolders.length} folders...`);
      for (const folder of unmigratedFolders) {
        if (folder.parent === undefined) folder.parent = null;
        if (folder.ownerId === undefined) folder.ownerId = null;
        await folder.save();
      }
    }

    // 2. Ensure all files have folderId and ownerId
    const unmigratedFiles = await DocFile.find({
      $or: [
        { folderId: { $exists: false } },
        { folderId: null },
        { ownerId: { $exists: false } }
      ]
    });

    if (unmigratedFiles.length > 0) {
      console.log(`[Migration] Migrating ${unmigratedFiles.length} files...`);
      for (const file of unmigratedFiles) {
        if (file.ownerId === undefined) file.ownerId = null;
        
        if (!file.folderId) {
          // Find matching folder
          let folder = await Folder.findOne({
            name: file.subject.trim(),
            year: file.year,
            department: file.department,
          });

          if (!folder) {
            // Create root folder if none exists
            console.log(`[Migration] Creating root folder "${file.subject}" for file "${file.title}"`);
            folder = await Folder.create({
              name: file.subject.trim(),
              year: file.year,
              department: file.department,
              color: file.color || "blue",
              parent: null,
              ownerId: null,
              filesCount: 0
            });
          }

          file.folderId = folder._id as mongoose.Types.ObjectId;
        }

        await file.save();
      }
    }

    // 3. Recalculate filesCount for all folders
    const allFolders = await Folder.find({});
    for (const folder of allFolders) {
      const count = await DocFile.countDocuments({ folderId: folder._id });
      if (folder.filesCount !== count) {
        folder.filesCount = count;
        await folder.save();
      }
    }

    isMongoMigrationDone = true;
    console.log("[Migration] MongoDB migration completed successfully!");
  } catch (error) {
    console.error("[Migration] Error running MongoDB migration:", error);
  }
}

/**
 * Automatically migrates local JSON folders and files.
 * Links files to folders by name (subject -> folder.name) and sets default fields.
 */
export async function runLocalMigration() {
  if (isLocalMigrationDone) return;
  try {
    const FOLDER_PATH = path.join(process.cwd(), ".data", "folders.json");
    const FILE_PATH = path.join(process.cwd(), ".data", "files.json");

    console.log("[Migration] Checking Local JSON migration...");

    const folders = await readJsonArray<any>(FOLDER_PATH, []);
    const files = await readJsonArray<any>(FILE_PATH, []);

    let modifiedFolders = false;
    let modifiedFiles = false;

    // 1. Migrate folders (parentId, ownerId)
    for (const folder of folders) {
      if (folder.parentId === undefined) {
        folder.parentId = null;
        modifiedFolders = true;
      }
      if (folder.ownerId === undefined) {
        folder.ownerId = null;
        modifiedFolders = true;
      }
    }

    // 2. Migrate files (folderId, ownerId)
    for (const file of files) {
      if (file.ownerId === undefined) {
        file.ownerId = null;
        modifiedFiles = true;
      }

      if (!file.folderId) {
        // Find matching folder
        let folder = folders.find(
          (f) =>
            f.name.toLowerCase() === file.subject.trim().toLowerCase() &&
            f.year === file.year &&
            f.department === file.department
        );

        if (!folder) {
          console.log(`[Migration] Local creating root folder "${file.subject}" for file "${file.title}"`);
          folder = {
            id: randomUUID(),
            name: file.subject.trim(),
            year: file.year,
            department: file.department,
            color: file.color || "blue",
            parentId: null,
            ownerId: null,
            filesCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          folders.push(folder);
          modifiedFolders = true;
        }

        file.folderId = folder.id;
        modifiedFiles = true;
      }
    }

    // 3. Recount local folder filesCount
    for (const folder of folders) {
      const count = files.filter((file) => file.folderId === folder.id).length;
      if (folder.filesCount !== count) {
        folder.filesCount = count;
        modifiedFolders = true;
      }
    }

    if (modifiedFolders) {
      await writeJsonArray(FOLDER_PATH, folders);
    }
    if (modifiedFiles) {
      await writeJsonArray(FILE_PATH, files);
    }

    isLocalMigrationDone = true;
    console.log("[Migration] Local JSON migration completed successfully!");
  } catch (error) {
    console.error("[Migration] Error running local JSON migration:", error);
  }
}
