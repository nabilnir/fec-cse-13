/**
 * lib/mongodb.ts
 * Singleton MongoDB connection using Mongoose.
 * Caches the connection in development to prevent hot-reload from
 * spawning multiple connections.
 */

import mongoose from "mongoose";
import dns from "dns/promises";

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable in .env.local"
  );
}

// Extend the NodeJS global type to cache the Mongoose connection
declare global {
  // eslint-disable-next-line no-var
  var _mongooseCache: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

const cached = globalThis._mongooseCache ?? { conn: null, promise: null };
globalThis._mongooseCache = cached;

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    // Try a normal connect first. If it fails due to SRV/DNS issues
    // (common on restricted networks), attempt a programmatic SRV
    // fallback: resolve the _mongodb._tcp SRV records and build a
    // mongodb:// host list to retry the connection.
    cached.promise = (async () => {
      try {
        return await mongoose.connect(MONGODB_URI, { bufferCommands: false });
      } catch (err: any) {
        const message = String(err?.message ?? err);
        // Only attempt fallback for SRV/DNS related failures
        if (/querySrv|ECONNREFUSED|ENOTFOUND|MongooseServerSelectionError|MongoNetworkError/i.test(message)) {
          try {
            // Parse mongodb+srv URI components
            const m = MONGODB_URI.match(/^mongodb\+srv:\/\/(?:(.+?)@)?([^\/]+)(\/.+?)?(\?.*)?$/);
            if (!m) throw err;
            const auth = m[1] ? `${m[1]}@` : "";
            const srvHost = m[2];
            const dbPath = m[3] ?? ""; // includes leading '/'
            const query = m[4] ?? "";

            // Resolve SRV records for the cluster
            const srvName = `_mongodb._tcp.${srvHost}`;
            const srvRecords = await dns.resolveSrv(srvName);
            const hosts: string[] = [];
            for (const r of srvRecords) {
              // r.name is the canonical host for the shard member
              // Use the SRV provided port
              hosts.push(`${r.name}:${r.port}`);
            }

            if (hosts.length === 0) throw err;

            const fallbackUri = `mongodb://${auth}${hosts.join(",")}${dbPath}${query}`;

            // Retry connecting with fallback URI
            return await mongoose.connect(fallbackUri, { bufferCommands: false });
          } catch (fallbackErr) {
            // rethrow the original error if fallback fails
            cached.promise = null;
            throw err;
          }
        }

        cached.promise = null;
        throw err;
      }
    })();
  }

  cached.conn = await cached.promise;

  // Run the data migration asynchronously once connected
  try {
    const { runMongoMigration } = require("./migration");
    void runMongoMigration();
  } catch (err) {
    console.error("Failed to start MongoDB auto-migration:", err);
  }

  return cached.conn;
}
