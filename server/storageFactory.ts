import { IStorage } from "./storage";
import { MemStorage } from "./storage";
import { DatabaseStorage } from "./databaseStorage";

// Create a singleton storage instance
let storageInstance: IStorage | null = null;

export function getStorage(): IStorage {
  if (!storageInstance) {
    // Check if we should use database storage
    const useDatabase = process.env.USE_DATABASE === "true" || process.env.DATABASE_URL;
    
    if (useDatabase) {
      console.log("Using database storage");
      storageInstance = new DatabaseStorage();
    } else {
      console.log("Using in-memory storage");
      storageInstance = new MemStorage();
    }
  }
  
  return storageInstance;
}

// Export the storage instance
export const storage = getStorage();

