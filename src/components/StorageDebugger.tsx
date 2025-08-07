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

export const StorageDebugger: React.FC = () => {
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
      toast.success("All data cleared");
    } catch (error) {
      console.error("Clear failed:", error);
      toast.error("Failed to clear data");
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
    <div
      className="storage-debugger"
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        background: "rgba(0, 0, 0, 0.8)",
        color: "white",
        padding: "15px",
        borderRadius: "8px",
        fontSize: "12px",
        fontFamily: "monospace",
        zIndex: 1000,
        maxWidth: "300px",
      }}
    >
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

      <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
        <button
          onClick={handleForceLocalStorage}
          disabled={isLoading}
          style={{
            padding: "5px 10px",
            fontSize: "10px",
            background: "#2196F3",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Force localStorage
        </button>

        <button
          onClick={handleForceMigration}
          disabled={isLoading}
          style={{
            padding: "5px 10px",
            fontSize: "10px",
            background: "#FF9800",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Force Migration
        </button>

        <button
          onClick={handleClearAllData}
          disabled={isLoading}
          style={{
            padding: "5px 10px",
            fontSize: "10px",
            background: "#f44336",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Clear All Data
        </button>

        <button
          onClick={handleClearStores}
          disabled={isLoading}
          style={{
            padding: "5px 10px",
            fontSize: "10px",
            background: "#9C27B0",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Clear Stores
        </button>

        <button
          onClick={updateStorageInfo}
          disabled={isLoading}
          style={{
            padding: "5px 10px",
            fontSize: "10px",
            background: "#607D8B",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Refresh Info
        </button>
      </div>

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
    </div>
  );
};

export default StorageDebugger;
