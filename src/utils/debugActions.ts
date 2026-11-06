import { useCoreStore } from "@/store/core/store";
import { useQuestStore } from "@/store/core/quests/store";
import { useCameraStore } from "@/store/core/camera";
import { useMessageStore } from "@/store/messageStore";
import { useBooksStore } from "@/store/books";
import { useLibraryStore } from "@/store/exploration";
import { useSocialsStore } from "@/store/socials";
import { useBobEditor } from "@/store/bobEditor";

export function resetDebugQuests() {
  useQuestStore.getState().resetAllQuests();
}

export function unlockDebugEverything() {
  useCoreStore.getState().buyAllUpgrades();
  useQuestStore.getState().unlockAllQuests();
}

export function resetDebugEverything() {
  useCoreStore.getState().resetGame();
  resetDebugQuests();
  useBooksStore.getState().clearFocus();
  useLibraryStore.getState().reset();
  useSocialsStore.getState().clearFocus();
  useBobEditor.setState({ open: false, draft: null, dragging: null, screenOffset: { x: 0, y: 0 } });
  useMessageStore.getState().clearShownFlags();
  useMessageStore.getState().clearAllMessages();
  return { photosCleared: useCameraStore.getState().clearAll() };
}
