import {
  persistenceManager,
  getStorageType,
  isIndexedDBAvailable,
} from "./indexedDB";
import { toast } from "sonner";

// Migration utility to move data from localStorage to IndexedDB
export class StoreMigration {
  private static instance: StoreMigration;
  private isMigrating = false;

  private constructor() {}

  static getInstance(): StoreMigration {
    if (!StoreMigration.instance) {
      StoreMigration.instance = new StoreMigration();
    }
    return StoreMigration.instance;
  }

  // Check if migration is needed
  async checkMigrationNeeded(): Promise<boolean> {
    if (!isIndexedDBAvailable()) {
      return false;
    }

    const storageType = getStorageType();
    return storageType === "localstorage";
  }

  // Migrate all stores from localStorage to IndexedDB
  async migrateAllStores(): Promise<void> {
    if (this.isMigrating) {
      console.log("Migration already in progress");
      return;
    }

    this.isMigrating = true;

    try {
      const stores = ["game-store", "quest-store", "route-store", "app-store"];

      let migratedCount = 0;

      for (const storeName of stores) {
        const migrated = await this.migrateStore(storeName);
        if (migrated) {
          migratedCount++;
        }
      }

      if (migratedCount > 0) {
        toast.success(
          `Successfully migrated ${migratedCount} stores to IndexedDB`
        );
        console.log(`Migration completed: ${migratedCount} stores migrated`);
      } else {
        console.log("No stores needed migration");
      }
    } catch (error) {
      console.error("Migration failed:", error);
      toast.error("Failed to migrate stores to IndexedDB");
    } finally {
      this.isMigrating = false;
    }
  }

  // Migrate a single store
  private async migrateStore(storeName: string): Promise<boolean> {
    try {
      // Check if data exists in localStorage
      const localStorageKey = `vorgarten-${storeName}`;
      const localStorageData = localStorage.getItem(localStorageKey);

      if (!localStorageData) {
        return false;
      }

      // Parse the data
      const parsedData = JSON.parse(localStorageData);

      // Save to IndexedDB
      await persistenceManager.save(storeName, parsedData, 1);

      // Remove from localStorage
      localStorage.removeItem(localStorageKey);

      console.log(`Migrated ${storeName} from localStorage to IndexedDB`);
      return true;
    } catch (error) {
      console.error(`Failed to migrate ${storeName}:`, error);
      return false;
    }
  }

  // Get migration status
  getMigrationStatus(): {
    isAvailable: boolean;
    currentStorage: "indexeddb" | "localstorage";
    isMigrating: boolean;
  } {
    return {
      isAvailable: isIndexedDBAvailable(),
      currentStorage: getStorageType(),
      isMigrating: this.isMigrating,
    };
  }

  // Force migration
  async forceMigration(): Promise<void> {
    console.log("Forcing migration to IndexedDB");
    await this.migrateAllStores();
  }

  // Clear all data (for testing)
  async clearAllData(): Promise<void> {
    try {
      await persistenceManager.clear();

      // Also clear localStorage
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith("vorgarten-")) {
          localStorage.removeItem(key);
        }
      });

      toast.success("All store data cleared");
    } catch (error) {
      console.error("Failed to clear data:", error);
      toast.error("Failed to clear data");
    }
  }
}

// Export singleton instance
export const storeMigration = StoreMigration.getInstance();

// Utility functions
export const checkAndMigrate = async (): Promise<void> => {
  const migration = StoreMigration.getInstance();
  const needsMigration = await migration.checkMigrationNeeded();

  if (needsMigration) {
    console.log("Migration needed, starting automatic migration...");
    await migration.migrateAllStores();
  }
};

export const getMigrationStatus = () => {
  return StoreMigration.getInstance().getMigrationStatus();
};

export const forceMigration = async () => {
  await StoreMigration.getInstance().forceMigration();
};

export const clearAllData = async () => {
  await StoreMigration.getInstance().clearAllData();
};
