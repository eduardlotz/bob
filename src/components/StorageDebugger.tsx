import React, { useState, useEffect } from "react";
import {
  getStorageType,
  isIndexedDBAvailable,
  forceLocalStorage,
  clearAllStores,
} from "../store/indexedDB";
import {
  getMigrationStatus,
  forceMigration,
  clearAllData,
} from "../store/migration";
import { toast } from "sonner";
import { useMessageStore } from "@/store/messageStore";
import {
  DebugBlock,
  DevActionButton,
  DevActionDescription,
} from "@/layout/atoms";

export const StorageDebugger: React.FC = () => {
  const { clearShownFlags } = useMessageStore();
  const [storageInfo, setStorageInfo] = useState({
    storageType: "unknown",
    indexedDBAvailable: false,
    migrationStatus: null as any,
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    updateStorageInfo();
  }, []);

  const updateStorageInfo = () => {
    setStorageInfo({
      storageType: getStorageType(),
      indexedDBAvailable: isIndexedDBAvailable(),
      migrationStatus: getMigrationStatus(),
    });
  };

  const handleForceLocalStorage = () => {
    forceLocalStorage();
    updateStorageInfo();
    toast.info("Switched to localStorage");
  };

  const handleForceMigration = async () => {
    setIsLoading(true);
    try {
      await forceMigration();
      updateStorageInfo();
      toast.success("Migration completed");
    } catch (error) {
      console.error("Migration failed:", error);
      toast.error("Migration failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAllData = async () => {
    setIsLoading(true);
    try {
      await clearAllData();
      updateStorageInfo();
      // toast.success("All data cleared");
      console.log("All data cleared");
    } catch (error) {
      console.error("Clear failed:", error);
      // toast.error("Failed to clear data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearStores = async () => {
    setIsLoading(true);
    try {
      await clearAllStores();
      updateStorageInfo();
      toast.success("Stores cleared");
    } catch (error) {
      console.error("Clear stores failed:", error);
      toast.error("Failed to clear stores");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DebugBlock>
      <h4 style={{ margin: "0 0 10px 0", fontSize: "14px" }}>
        Storage Debugger
      </h4>

      <div style={{ marginBottom: "10px" }}>
        <div>
          Storage Type:{" "}
          <span style={{ color: "#4CAF50" }}>{storageInfo.storageType}</span>
        </div>
        <div>
          IndexedDB Available:{" "}
          <span
            style={{
              color: storageInfo.indexedDBAvailable ? "#4CAF50" : "#f44336",
            }}
          >
            {storageInfo.indexedDBAvailable ? "Yes" : "No"}
          </span>
        </div>
        {storageInfo.migrationStatus && (
          <div>
            Migration Status:{" "}
            <span
              style={{
                color: storageInfo.migrationStatus.isMigrating
                  ? "#FF9800"
                  : "#4CAF50",
              }}
            >
              {storageInfo.migrationStatus.isMigrating ? "Migrating" : "Idle"}
            </span>
          </div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <DevActionButton
          onClick={handleForceLocalStorage}
          $variant="accent"
          disabled={isLoading}
        >
          Force localStorage
        </DevActionButton>
        <DevActionDescription>
          Switch to localStorage (useful when IndexedDB is unavailable or for
          debugging persistence).
        </DevActionDescription>

        <DevActionButton
          onClick={() => {
            if (confirm("Clear message 'already shown' flags?")) {
              clearShownFlags();
              toast.success("Message shown flags cleared");
            }
          }}
          disabled={isLoading}
        >
          Clear Message Flags
        </DevActionButton>
        <DevActionDescription>
          Reset once-per-session/persist message flags.
        </DevActionDescription>

        <DevActionButton
          onClick={handleForceMigration}
          $variant="primary"
          disabled={isLoading}
        >
          Force Migration
        </DevActionButton>
        <DevActionDescription>
          Execute storage migration manually. Use when schema changes are not
          auto-applied.
        </DevActionDescription>

        <DevActionButton
          onClick={handleClearAllData}
          $variant="danger"
          disabled={isLoading}
        >
          Clear All Data
        </DevActionButton>
        <DevActionDescription>
          Remove all application data across storages. This cannot be undone.
        </DevActionDescription>

        <DevActionButton onClick={handleClearStores} disabled={isLoading}>
          Clear Stores
        </DevActionButton>
        <DevActionDescription>
          Clear IndexedDB/localStorage stores only; leaves other browser data
          intact.
        </DevActionDescription>

        <DevActionButton onClick={updateStorageInfo}>
          Refresh Info
        </DevActionButton>
      </div>

      {/* Example of cohesive slider styling for dev tools if needed later */}
      {/*
      <DevSettingsGroup>
        <DevSliderRow>
          <DevSliderLabel>Example</DevSliderLabel>
          <DevSlider type="range" min={0} max={1} step={0.01} />
          <DevSliderValue>50%</DevSliderValue>
        </DevSliderRow>
      </DevSettingsGroup>
      */}

      {isLoading && (
        <div
          style={{
            marginTop: "10px",
            textAlign: "center",
            color: "#FF9800",
          }}
        >
          Loading...
        </div>
      )}
    </DebugBlock>
  );
};

export default StorageDebugger;
