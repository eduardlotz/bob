import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createIndexedDBStorage } from "./indexedDB";
import {
  getMessageById,
  MessageConfig,
  MessageOptions,
} from "@/messages/config";
import { match } from "ts-pattern";

export interface ActiveMessage {
  config: MessageConfig;
  options: Required<MessageOptions>;
  startedAt: number;
  // runtime UI state
  currentLineIndex: number;
  revealedChars: number; // for typing
  isSkipping: boolean;
}

export interface MessagePreferences {
  [persistKey: string]: unknown;
}

export interface MessageRepeatFlags {
  // flags for oncePerPersist
  [messageId: string]: boolean;
}

export interface MessageStoreState {
  activeMessage: ActiveMessage | null;
  queue: string[]; // queue of message ids
  seenThisSession: Record<string, boolean>;
  repeatFlags: MessageRepeatFlags; // persisted "seen" flags
  preferences: MessagePreferences; // persisted user prefs
  typingSpeedDefaultMs: number;

  // Actions
  showMessage: (id: string, overrides?: Partial<MessageOptions>) => void;
  dismissMessage: () => void;
  dismissMessageById: (id: string) => void;
  resetMessage: (id: string) => void;
  setPreference: (key: string, value: unknown) => void;
  clearShownFlags: () => void; // dev tools: clear oncePerPersist/session flags
}

const DEFAULT_OPTIONS: Required<MessageOptions> = {
  typingSpeedMs: 50,
  baseDismissMs: 1400,
  contentLengthFactorMs: 44,
  tailEnabled: false,
};

const canShowMessage = (
  state: MessageStoreState,
  config: MessageConfig
): boolean => {
  return match(config.repeatRule)
    .with("always", () => true)
    .with("oncePerSession", () => state.seenThisSession[config.id] !== true)
    .with("oncePerPersist", () => state.repeatFlags[config.id] !== true)
    .exhaustive();
};

export const useMessageStore = create<MessageStoreState>()(
  persist(
    (set, get) => ({
      activeMessage: null,
      queue: [],
      seenThisSession: {},
      repeatFlags: {},
      preferences: {},
      typingSpeedDefaultMs: 50,

      showMessage: (id, overrides) => {
        const cfg = getMessageById(id);
        if (!cfg) {
          console.warn(`[messageStore] Unknown message id: ${id}`);
          return;
        }

        // Repeat rule check
        if (!canShowMessage(get(), cfg)) {
          return;
        }

        // Prevent duplicates in queue
        const alreadyQueued = get().queue.includes(id);
        const isActive = get().activeMessage?.config.id === id;
        if (alreadyQueued || isActive) return;

        // Merge options
        const mergedOptions: Required<MessageOptions> = {
          ...DEFAULT_OPTIONS,
          ...(cfg.options || {}),
          ...(overrides || {}),
        } as Required<MessageOptions>;

        // If no active message, set active immediately; else enqueue id
        const current = get().activeMessage;
        if (!current) {
          set({
            activeMessage: {
              config: cfg,
              options: mergedOptions,
              startedAt: Date.now(),
              currentLineIndex: 0,
              revealedChars: 0,
              isSkipping: false,
            },
            // mark seen in-session
            seenThisSession: { ...get().seenThisSession, [cfg.id]: true },
          });
          // persist if oncePerPersist
          if (cfg.repeatRule === "oncePerPersist") {
            set({ repeatFlags: { ...get().repeatFlags, [cfg.id]: true } });
          }
        } else {
          set({ queue: [...get().queue, id] });
        }
      },

      dismissMessage: () => {
        const nextId = get().queue[0];
        if (!nextId) {
          set({ activeMessage: null, queue: get().queue.slice(1) });
          return;
        }
        const cfg = getMessageById(nextId);
        if (!cfg) {
          console.warn(`[messageStore] Unknown message id in queue: ${nextId}`);
          set({ queue: get().queue.slice(1) });
          return;
        }
        const mergedOptions: Required<MessageOptions> = {
          ...DEFAULT_OPTIONS,
          ...(cfg.options || {}),
        } as Required<MessageOptions>;
        set({
          activeMessage: {
            config: cfg,
            options: mergedOptions,
            startedAt: Date.now(),
            currentLineIndex: 0,
            revealedChars: 0,
            isSkipping: false,
          },
          queue: get().queue.slice(1),
          seenThisSession: { ...get().seenThisSession, [cfg.id]: true },
          repeatFlags:
            cfg.repeatRule === "oncePerPersist"
              ? { ...get().repeatFlags, [cfg.id]: true }
              : get().repeatFlags,
        });
      },

      dismissMessageById: (id: string) => {
        const active = get().activeMessage;
        if (active?.config.id === id) {
          get().dismissMessage();
          return;
        }
        // remove from queue if present
        set({ queue: get().queue.filter((m) => m !== id) });
      },

      resetMessage: (id) => {
        set({
          seenThisSession: { ...get().seenThisSession, [id]: false },
          repeatFlags: { ...get().repeatFlags, [id]: false },
          queue: get().queue.filter((m) => m !== id),
          activeMessage:
            get().activeMessage?.config.id === id ? null : get().activeMessage,
        });
      },

      setPreference: (key, value) => {
        set({ preferences: { ...get().preferences, [key]: value } });
      },

      clearShownFlags: () => {
        set({ seenThisSession: {}, repeatFlags: {} });
      },
    }),
    {
      name: "message-store",
      version: 2,
      storage: createIndexedDBStorage<MessageStoreState>(),
      partialize: (s) =>
        ({
          repeatFlags: s.repeatFlags,
          preferences: s.preferences,
        } as unknown as MessageStoreState),
      onRehydrateStorage: (_state) => {
        // lazy load makes sure migration queue can run after message store ready
        import("./migration")
          .then((m) => m.queueStorageMigration())
          .catch(() => {});
      },
    }
  )
);
