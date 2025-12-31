import { useMessageStore } from "./messageStore";
import {
  executeQueuedMigrations,
  hasFinalResetRun,
  hasFinalResetRunAsync,
  queueFinalResetMigration,
} from "./migration";

let hasExecutedMigrations = false;
let retryCount = 0;
const MAX_RETRIES = 10;
const RETRY_DELAY_MS = 250;

export const executeMigrationsWhenReady = async (): Promise<void> => {
  if (hasExecutedMigrations) {
    return;
  }

  try {
    // delay to ensure all stores are fully initialized
    await new Promise((resolve) => setTimeout(resolve, 100));

    const { useGameStore } = await import("./gameStore");
    const { useQuestStore } = await import("./questStore");

    const areStoresReady = () => {
      try {
        const gameState = useGameStore.getState();
        const questState = useQuestStore.getState();
        return (
          !!gameState &&
          typeof gameState.version !== "undefined" &&
          !!questState &&
          Array.isArray(questState.quests)
        );
      } catch {
        return false;
      }
    };

    let attempts = 0;
    while (!areStoresReady()) {
      attempts++;
      if (attempts >= MAX_RETRIES) {
        console.warn("Max retries reached, giving up on migration execution");
        return;
      }
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
    }

    console.log("Stores are ready, executing queued migrations...");
    await executeQueuedMigrations();

    const ran = hasFinalResetRun();
    const ranMeta = await hasFinalResetRunAsync();
    if (!ran && !ranMeta) {
      console.log("Queuing final reset migration (first-run only)...");
      queueFinalResetMigration(false);
      await executeQueuedMigrations();
    }

    hasExecutedMigrations = true;
    console.log("Queued migrations completed");
  } catch (error) {
    console.error("Failed to execute queued migrations:", error);
  }
};

// testing utility to reset migrations
export const resetMigrationExecution = (): void => {
  hasExecutedMigrations = false;
  retryCount = 0;
};
