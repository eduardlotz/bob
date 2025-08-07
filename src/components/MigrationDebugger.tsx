import React, { useState, useEffect } from "react";
import { useGameStore } from "@/store/gameStore";
import {
  getMigrationStatus,
  forceMigration,
  clearAllData,
} from "@/store/migration";
import { forceV9Migration } from "@/store/gameStore";
import { toast } from "sonner";

export const MigrationDebugger: React.FC = () => {
  const [migrationStatus, setMigrationStatus] = useState<any>(null);
  const [storeVersion, setStoreVersion] = useState<number>(0);
  const [lastSchemaUpdate, setLastSchemaUpdate] = useState<Date | null>(null);
  const { themes, currentTheme } = useGameStore();

  useEffect(() => {
    const status = getMigrationStatus();
    setMigrationStatus(status);

    const store = useGameStore.getState();
    setStoreVersion(store.version || 0);
    setLastSchemaUpdate(store.lastSchemaUpdate || null);
  }, []);

  const handleForceMigration = async () => {
    try {
      await forceMigration();
      toast.success("Forced migration completed");
      // Refresh status
      setMigrationStatus(getMigrationStatus());
    } catch (error) {
      toast.error("Migration failed");
      console.error(error);
    }
  };

  const handleForceV9Migration = () => {
    try {
      forceV9Migration();
      toast.success("V9 migration completed");
      // Refresh store version
      const store = useGameStore.getState();
      setStoreVersion(store.version || 0);
    } catch (error) {
      toast.error("V9 migration failed");
      console.error(error);
    }
  };

  const handleClearData = async () => {
    try {
      await clearAllData();
      toast.success("All data cleared");
      // Refresh status
      setMigrationStatus(getMigrationStatus());
    } catch (error) {
      toast.error("Failed to clear data");
      console.error(error);
    }
  };

  const handleTriggerSchemaMigration = () => {
    try {
      const store = useGameStore.getState();
      // Set lastSchemaUpdate to an old date to trigger migration
      useGameStore.setState({
        ...store,
        lastSchemaUpdate: new Date("2020-01-01"), // Old date to trigger migration
      });
      toast.success("Schema migration trigger set - reload to apply");
    } catch (error) {
      toast.error("Failed to set schema migration trigger");
      console.error(error);
    }
  };

  const checkThemeColors = () => {
    const themesWithIssues = themes.filter(
      (theme) => !theme.outlineColor || !theme.eyeColor
    );

    if (themesWithIssues.length > 0) {
      toast.error(
        `${themesWithIssues.length} themes missing outlineColor or eyeColor`
      );
      console.log("Themes with issues:", themesWithIssues);
    } else {
      toast.success("All themes have proper outlineColor and eyeColor");
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: "10px",
        right: "10px",
        background: "rgba(0,0,0,0.8)",
        color: "white",
        padding: "10px",
        borderRadius: "5px",
        fontSize: "12px",
        zIndex: 1000,
        pointerEvents: "auto",
        maxWidth: "300px",
      }}
    >
      <h4>Migration Debugger</h4>

      <div>
        <strong>Store Version:</strong> {storeVersion}
      </div>

      <div>
        <strong>Storage:</strong> {migrationStatus?.currentStorage || "unknown"}
      </div>

      <div>
        <strong>IndexedDB Available:</strong>{" "}
        {migrationStatus?.isAvailable ? "Yes" : "No"}
      </div>

      <div>
        <strong>Current Theme:</strong> {currentTheme?.id || "none"}
      </div>

      <div>
        <strong>Last Schema Update:</strong>{" "}
        {lastSchemaUpdate ? lastSchemaUpdate.toLocaleDateString() : "none"}
      </div>

      <div style={{ marginTop: "10px" }}>
        <button
          onClick={handleForceMigration}
          style={{ margin: "2px", padding: "4px 8px", fontSize: "10px" }}
        >
          Force Storage Migration
        </button>

        <button
          onClick={handleForceV9Migration}
          style={{ margin: "2px", padding: "4px 8px", fontSize: "10px" }}
        >
          Force V9 Migration
        </button>

        <button
          onClick={checkThemeColors}
          style={{ margin: "2px", padding: "4px 8px", fontSize: "10px" }}
        >
          Check Theme Colors
        </button>

        <button
          onClick={handleClearData}
          style={{
            margin: "2px",
            padding: "4px 8px",
            fontSize: "10px",
            background: "red",
          }}
        >
          Clear All Data
        </button>

        <button
          onClick={handleTriggerSchemaMigration}
          style={{
            margin: "2px",
            padding: "4px 8px",
            fontSize: "10px",
            background: "orange",
          }}
        >
          Trigger Schema Migration
        </button>
      </div>

      <div style={{ marginTop: "10px", fontSize: "10px" }}>
        <strong>Themes ({themes.length}):</strong>
        {themes.map((theme) => (
          <div key={theme.id} style={{ marginLeft: "10px" }}>
            {theme.id}: outline={theme.outlineColor || "MISSING"}, eye=
            {theme.eyeColor || "MISSING"}
          </div>
        ))}
      </div>
    </div>
  );
};
