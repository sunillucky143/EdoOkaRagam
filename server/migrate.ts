import { db } from "./database";
import { sql } from "drizzle-orm";

async function migrate() {
  try {
    console.log("Starting database migration...");
    
    // Enable required extensions
    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);
    console.log("✓ UUID extensions enabled");
    
    // Create tables (Drizzle will handle this automatically when we push)
    console.log("✓ Database migration completed successfully");
    
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrate().then(() => {
    console.log("Migration completed");
    process.exit(0);
  });
}

export { migrate };


