// Simple test file for migration system
// This can be run in the browser console for testing

import {
  queueStorageMigration,
  executeQueuedMigrations,
  getMigrationStatus,
  isMigrationNeeded,
  triggerManualMigration,
  clearAllData,
} from "./migration";

import {
  executeMigrationsWhenReady,
  getMigrationExecutionStatus,
  resetMigrationExecution,
} from "./migrationExecutor";

// Test functions that can be called from browser console
export const testMigrationSystem = async () => {
  console.log("=== Testing Migration System ===");

  try {
    // Check if migration is needed
    const needsMigration = await isMigrationNeeded();
    console.log("Migration needed:", needsMigration);

    // Get current status
    const status = getMigrationStatus();
    console.log("Migration status:", status);

    // Queue migration
    queueStorageMigration();
    console.log("Migration queued");

    // Check status again
    const statusAfterQueue = getMigrationStatus();
    console.log("Status after queue:", statusAfterQueue);

    // Execute migrations
    await executeQueuedMigrations();
    console.log("Migrations executed");

    // Check final status
    const finalStatus = getMigrationStatus();
    console.log("Final status:", finalStatus);
  } catch (error) {
    console.error("Test failed:", error);
  }
};

export const testMigrationExecutor = async () => {
  console.log("=== Testing Migration Executor ===");

  try {
    // Reset execution state
    resetMigrationExecution();
    console.log("Execution state reset");

    // Check initial status
    const initialStatus = getMigrationExecutionStatus();
    console.log("Initial execution status:", initialStatus);

    // Execute migrations
    await executeMigrationsWhenReady();
    console.log("Migrations executed via executor");

    // Check final status
    const finalStatus = getMigrationExecutionStatus();
    console.log("Final execution status:", finalStatus);
  } catch (error) {
    console.error("Executor test failed:", error);
  }
};

export const testManualMigration = async () => {
  console.log("=== Testing Manual Migration ===");

  try {
    await triggerManualMigration();
    console.log("Manual migration completed");
  } catch (error) {
    console.error("Manual migration failed:", error);
  }
};

export const testClearData = async () => {
  console.log("=== Testing Clear Data ===");

  try {
    await clearAllData();
    console.log("Data cleared successfully");
  } catch (error) {
    console.error("Clear data failed:", error);
  }
};

// Export all test functions for easy access
export const migrationTests = {
  testMigrationSystem,
  testMigrationExecutor,
  testManualMigration,
  testClearData,
};

// Make tests available globally for console testing
if (typeof window !== "undefined") {
  (window as any).migrationTests = migrationTests;
}
