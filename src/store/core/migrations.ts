import {
  GAME_STORE_VERSION,
  initialGameState,
  initialRoutes,
  initialThemes,
} from "..";
import { THEME_IDS } from "../config/themes";

export function migrateCoreStore(persisted: any, fromVersion: number) {
  if (!persisted || typeof persisted !== "object") {
    return initialGameState;
  }

  let state = { ...persisted };

  if (fromVersion < GAME_STORE_VERSION.V0) {
    return initialGameState;
  }

  if (fromVersion < GAME_STORE_VERSION.V1) {
    const themeId = state.currentTheme?.id ?? THEME_IDS.DEFAULT;
    state.routes = initialRoutes;
    state.themes = initialThemes;
    state.currentTheme =
      initialThemes.find((t) => t.id === themeId) ?? initialThemes[0];
  }

  if (fromVersion < GAME_STORE_VERSION.V2) {
    state.decorations = state.decorations ?? [];
    state.graphicPreferences = {
      qualityMode: "auto",
      effectsEnabled: true,
    };
  }

  if (fromVersion < GAME_STORE_VERSION.V3) {
    const themeId = state.currentTheme?.id ?? THEME_IDS.DEFAULT;
    state.themes = initialThemes;
    state.currentTheme =
      initialThemes.find((t) => t.id === themeId) ?? initialThemes[0];
  }

  if (fromVersion < GAME_STORE_VERSION.V4) {
    state.routes = initialRoutes;
  }

  return {
    ...state,
    version: GAME_STORE_VERSION.LATEST,
  };
}
