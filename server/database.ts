import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../shared/schema";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Create the PostgreSQL client
const sql = postgres(process.env.DATABASE_URL);

// Create the Drizzle database instance
export const db = drizzle(sql, { schema });

// Export all schema types for convenience
export * from "../shared/schema";

