import { create } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";
import { createIndexedDBStorage } from "./indexedDB";
import {
  ArchivedMessage,
  getMessageById,
  MessageConfig,
  MessageOptions,
} from "@/messages/config";
import { match } from "ts-pattern";

export interface ActiveMessage {
  readonly config: MessageConfig;
  readonly options: Required<MessageOptions>;
  readonly startedAt: number;
  currentLineIndex: number;
  revealedChars: number;
  isSkipping: boolean;
  readonly minimumDisplayUntil: number;
  hasBeenFullyRevealed: boolean;
  userHasInteracted: boolean;
  isAnimating: boolean;
  error?: string;
}

export interface MessagePreferences {
  readonly [persistKey: string]: unknown;
}

export interface MessageRepeatFlags {
  readonly [messageId: string]: boolean;
}

export interface QueueItem {
  readonly id: string;
  readonly priority: number;
  readonly queuedAt: number;
  readonly retryCount?: number;
}

export interface MessageStoreState {
  // core state
  readonly activeMessage: ActiveMessage | null;
  readonly queue: readonly QueueItem[];
  readonly seenThisSession: Readonly<Record<string, boolean>>;
  readonly repeatFlags: MessageRepeatFlags;
  readonly preferences: MessagePreferences;
  readonly typingSpeedDefaultMs: number;
  readonly systemPaused: boolean;
  archive: ArchivedMessage[];

  // debug state
  readonly messageHistory: readonly string[];
  readonly lastError: string | null;
  readonly isHydrated: boolean;

  // core actions
  showMessage: (
    id: string,
    overrides?: Partial<MessageOptions>,
  ) => Promise<boolean>;
  dismissMessage: (force?: boolean) => Promise<boolean>;
  dismissMessageById: (id: string, force?: boolean) => Promise<boolean>;
  resetMessage: (id: string) => void;
  setPreference: <T>(key: string, value: T) => void;
  clearShownFlags: () => void;
  markUserInteraction: () => void;
  markFullyRevealed: () => void;
  pauseSystem: () => void;
  resumeSystem: () => void;
  addToArchive: (message: ArchivedMessage) => void;
  clearQueue: () => void;
  getQueueLength: () => number;
  getNextQueuedId: () => string | null;

  // queue actions
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  removeFromQueue: (id: string) => boolean;
  getQueuedMessage: (id: string) => QueueItem | null;

  // batch actions
  showMessages: (
    ids: readonly string[],
    overrides?: Partial<MessageOptions>,
  ) => Promise<boolean[]>;
  clearAllMessages: () => void;

  // debug actions
  getDebugInfo: () => Record<string, unknown>;
  clearError: () => void;
}

const DEFAULT_OPTIONS: Required<MessageOptions> = {
  typingSpeedMs: 50,
  baseDismissMs: 1400,
  contentLengthFactorMs: 44,
  tailEnabled: false,
  minimumDisplayMs: 2000,
  priority: 0,
  emotion: { state: "normal" },
} as const;

const QUEUE_LIMIT = 50;

const validateMessageConfig = (
  config: MessageConfig | null | undefined,
): config is MessageConfig => {
  if (!config) return false;
  if (!config.id || typeof config.id !== "string") return false;
  if (
    !config.repeatRule ||
    !["always", "oncePerSession", "oncePerPersist"].includes(config.repeatRule)
  )
    return false;
  return true;
};

const canShowMessage = (
  state: MessageStoreState,
  config: MessageConfig,
): boolean => {
  if (state.systemPaused) return false;
  if (!validateMessageConfig(config)) return false;

  return match(config.repeatRule)
    .with("always", () => true)
    .with("oncePerSession", () => state.seenThisSession[config.id] !== true)
    .with("oncePerPersist", () => state.repeatFlags[config.id] !== true)
    .exhaustive();
};

const calculateMinimumDisplayTime = (
  config: MessageConfig,
  options: Required<MessageOptions>,
): number => {
  const text = Array.isArray(config.text)
    ? config.text.join(" ")
    : String(config.text ?? "");
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const perWordMs = 250;
  const readingMs = Math.max(800, Math.round(words * perWordMs));
  const minDisplay = Math.max(800, options.minimumDisplayMs || 1200);
  const total = Math.min(minDisplay, readingMs);
  return total;
};

const insertIntoQueue = (
  currentQueue: readonly QueueItem[],
  newItem: QueueItem,
): readonly QueueItem[] => {
  // prevent duplicate entries
  if (currentQueue.some((item) => item.id === newItem.id)) {
    return currentQueue;
  }

  const queue = [...currentQueue];

  // insert message based on priority
  let insertIndex = queue.length;
  for (let i = 0; i < queue.length; i++) {
    if (queue[i].priority < newItem.priority) {
      insertIndex = i;
      break;
    }
  }

  queue.splice(insertIndex, 0, newItem);

  return queue.slice(0, QUEUE_LIMIT);
};

const withErrorHandling = <T extends any[], R>(
  fn: (...args: T) => R,
  fallback: R,
  onError?: (error: Error) => void,
) => {
  return (...args: T): R => {
    try {
      return fn(...args);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error("[MessageStore Error]:", err);
      onError?.(err);
      return fallback;
    }
  };
};

const initialMessageState = {
  activeMessage: null,
  queue: [],
  archive: [],
  seenThisSession: {},
  repeatFlags: {},
  preferences: {},
  typingSpeedDefaultMs: 50,
  systemPaused: false,
  messageHistory: [],
  lastError: null,
  isHydrated: false,
};

export const useMessageStore = create<MessageStoreState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        ...initialMessageState,

        showMessage: withErrorHandling(
          async (
            id: string,
            overrides?: Partial<MessageOptions>,
          ): Promise<boolean> => {
            const cfg = getMessageById(id);
            if (!validateMessageConfig(cfg)) {
              console.warn(
                `[messageStore] Invalid message config for id: ${id}`,
              );
              return false;
            }

            const state = get();
            if (!canShowMessage(state, cfg)) {
              return false;
            }

            const alreadyQueued = state.queue.some((item) => item.id === id);
            const isActive = state.activeMessage?.config.id === id;
            if (alreadyQueued || isActive) return false;

            const mergedOptions: Required<MessageOptions> = {
              ...DEFAULT_OPTIONS,
              ...(cfg.options || {}),
              ...(overrides || {}),
            } as Required<MessageOptions>;

            const current = state.activeMessage;

            // queue message if one is currently active/revealing
            if (current && !current.error) {
              const newItem: QueueItem = {
                id,
                priority: cfg.options?.priority || 0,
                queuedAt: Date.now(),
                retryCount: 0,
              };

              set({
                queue: insertIntoQueue(state.queue, newItem),
                lastError: null,
              });
            }
            // if no active message, show immediately
            // gets called for every queued message
            else {
              const minimumDisplayUntil =
                Date.now() + calculateMinimumDisplayTime(cfg, mergedOptions);

              set({
                activeMessage: {
                  config: cfg,
                  options: mergedOptions,
                  startedAt: Date.now(),
                  currentLineIndex: 0,
                  revealedChars: 0,
                  isSkipping: false,
                  minimumDisplayUntil,
                  hasBeenFullyRevealed: false,
                  userHasInteracted: false,
                  isAnimating: false,
                },
                seenThisSession: { ...state.seenThisSession, [cfg.id]: true },
                messageHistory: [...state.messageHistory.slice(-49), cfg.id],
                lastError: null,
              });

              if (cfg.repeatRule === "oncePerPersist") {
                set({ repeatFlags: { ...state.repeatFlags, [cfg.id]: true } });
              }
            }

            return true;
          },
          Promise.resolve(false),
          (error) => set({ lastError: error.message }),
        ),

        dismissMessage: withErrorHandling(
          async (force: boolean = false): Promise<boolean> => {
            const state = get();
            const current = state.activeMessage;

            if (!current) return false;

            const now = Date.now();
            const timingMet = now >= current.minimumDisplayUntil;
            const interactionMet =
              current.userHasInteracted ||
              now >= current.minimumDisplayUntil + 1000;
            const canDismiss =
              force ||
              (timingMet && current.hasBeenFullyRevealed && interactionMet);

            if (!canDismiss && !force) {
              return false;
            }

            const nextItem = state.queue[0];
            if (!nextItem) {
              set({
                activeMessage: null,
                lastError: null,
              });
              return true;
            }

            const cfg = getMessageById(nextItem.id);
            if (!validateMessageConfig(cfg)) {
              console.warn(
                `[messageStore] Invalid queued message: ${nextItem.id}`,
              );
              set({
                queue: state.queue.slice(1),
                lastError: `Invalid queued message: ${nextItem.id}`,
              });
              return false;
            }

            const mergedOptions: Required<MessageOptions> = {
              ...DEFAULT_OPTIONS,
              ...(cfg.options || {}),
            } as Required<MessageOptions>;

            const minimumDisplayUntil =
              Date.now() + calculateMinimumDisplayTime(cfg, mergedOptions);

            set({
              activeMessage: {
                config: cfg,
                options: mergedOptions,
                startedAt: Date.now(),
                currentLineIndex: 0,
                revealedChars: 0,
                isSkipping: false,
                minimumDisplayUntil,
                hasBeenFullyRevealed: false,
                userHasInteracted: false,
                isAnimating: false,
              },
              queue: state.queue.slice(1),
              seenThisSession: { ...state.seenThisSession, [cfg.id]: true },
              repeatFlags:
                cfg.repeatRule === "oncePerPersist"
                  ? { ...state.repeatFlags, [cfg.id]: true }
                  : state.repeatFlags,
              messageHistory: [...state.messageHistory.slice(-49), cfg.id],
              lastError: null,
            });

            return true;
          },
          Promise.resolve(false),
          (error) => set({ lastError: error.message }),
        ),

        dismissMessageById: withErrorHandling(
          async (id: string, force: boolean = false): Promise<boolean> => {
            const state = get();
            const active = state.activeMessage;

            if (active?.config.id === id) {
              return await get().dismissMessage(force);
            }

            // remove from queue if it was there for some reason
            const wasInQueue = state.queue.some((item) => item.id === id);
            if (wasInQueue) {
              set({
                queue: state.queue.filter((item) => item.id !== id),
                lastError: null,
              });
            }
            return wasInQueue;
          },
          Promise.resolve(false),
          (error) => set({ lastError: error.message }),
        ),

        resetMessage: withErrorHandling(
          (id: string) => {
            const state = get();
            set({
              seenThisSession: { ...state.seenThisSession, [id]: false },
              repeatFlags: { ...state.repeatFlags, [id]: false },
              queue: state.queue.filter((item) => item.id !== id),
              activeMessage:
                state.activeMessage?.config.id === id
                  ? null
                  : state.activeMessage,
              lastError: null,
            });
          },
          undefined,
          (error) => set({ lastError: error.message }),
        ),

        setPreference: <T>(key: string, value: T) => {
          if (typeof key !== "string" || key.length === 0) {
            console.warn("[messageStore] Invalid preference key");
            return;
          }

          set({
            preferences: { ...get().preferences, [key]: value },
            lastError: null,
          });
        },
        addToArchive: (message: ArchivedMessage) => {
          const state = get();
          const newArchive = [...state.archive, message];
          set({ archive: newArchive });
        },

        clearShownFlags: () => {
          set({
            seenThisSession: {},
            repeatFlags: {},
            lastError: null,
          });
        },

        markUserInteraction: () => {
          const state = get();
          if (state.activeMessage && !state.activeMessage.userHasInteracted) {
            set({
              activeMessage: {
                ...state.activeMessage,
                userHasInteracted: true,
              },
              lastError: null,
            });
          }
        },

        markFullyRevealed: () => {
          const state = get();
          if (
            state.activeMessage &&
            !state.activeMessage.hasBeenFullyRevealed
          ) {
            set({
              activeMessage: {
                ...state.activeMessage,
                hasBeenFullyRevealed: true,
              },
              lastError: null,
            });

            // add one-time messages to archive
            if (state.activeMessage.config.repeatRule === "oncePerPersist") {
              const threadId = state.activeMessage.config.id;
              const sender = state.activeMessage.config.label;
              state.activeMessage.config.text.map((msg, index) => {
                const archivedMessage = {
                  id: threadId + index,
                  text: msg,
                  sender,
                  time: new Date(),
                };

                state.addToArchive(archivedMessage);
              });
            }
          }
        },

        pauseSystem: () => set({ systemPaused: true }),
        resumeSystem: () => set({ systemPaused: false }),

        clearQueue: () =>
          set({
            queue: [],
            lastError: null,
          }),

        getQueueLength: () => get().queue.length,

        getNextQueuedId: () =>
          (get().queue[0]?.id as string | undefined) ?? null,

        reorderQueue: (fromIndex: number, toIndex: number) => {
          const state = get();
          if (
            fromIndex < 0 ||
            toIndex < 0 ||
            fromIndex >= state.queue.length ||
            toIndex >= state.queue.length
          ) {
            return;
          }

          const newQueue = [...state.queue];
          const [movedItem] = newQueue.splice(fromIndex, 1);
          newQueue.splice(toIndex, 0, movedItem);

          set({
            queue: newQueue,
            lastError: null,
          });
        },

        removeFromQueue: (id: string): boolean => {
          const state = get();
          const initialLength = state.queue.length;
          const newQueue = state.queue.filter((item) => item.id !== id);

          if (newQueue.length !== initialLength) {
            set({
              queue: newQueue,
              lastError: null,
            });
            return true;
          }
          return false;
        },

        getQueuedMessage: (id: string): QueueItem | null => {
          return get().queue.find((item) => item.id === id) || null;
        },

        showMessages: async (
          ids: readonly string[],
          overrides?: Partial<MessageOptions>,
        ): Promise<boolean[]> => {
          const results: boolean[] = [];
          for (const id of ids) {
            setTimeout(
              async () => {
                results.push(await get().showMessage(id, overrides));
              },
              overrides?.baseDismissMs ? overrides?.baseDismissMs : 10,
            );
          }
          return results;
        },

        clearAllMessages: () => {
          set({
            seenThisSession: {},
            repeatFlags: {},
            activeMessage: null,
            queue: [],
            lastError: null,
            archive: [],
          });
        },

        getDebugInfo: () => {
          const state = get();
          return {
            activeMessageId: state.activeMessage?.config.id,
            queueLength: state.queue.length,
            queueIds: state.queue.map((item) => item.id),
            systemPaused: state.systemPaused,
            isHydrated: state.isHydrated,
            lastError: state.lastError,
            messageHistoryCount: state.messageHistory.length,
            preferences: Object.keys(state.preferences),
            repeatFlagsCount: Object.keys(state.repeatFlags).length,
            seenThisSessionCount: Object.keys(state.seenThisSession).length,
          };
        },

        clearError: () => set({ lastError: null }),
      }),
      {
        name: "message-store",
        version: 0,
        storage: createIndexedDBStorage<MessageStoreState>(),
        migrate: (persistedState: any, version: number) => {
          if (!persistedState) return initialMessageState;

          return {
            ...persistedState,
            ...initialMessageState,
            version: 0,
          };
        },
        partialize: (state) =>
          ({
            repeatFlags: state.repeatFlags,
            preferences: state.preferences,
            archive: state.archive,
          }) as Pick<
            MessageStoreState,
            "repeatFlags" | "preferences" | "archive"
          > as unknown as MessageStoreState,
        onRehydrateStorage: () => (state) => {
          if (state) {
            useMessageStore.setState({ isHydrated: true });
          }
        },
      },
    ),
  ),
);

// store helper
export const useActiveMessage = () =>
  useMessageStore((state) => state.activeMessage);
export const useQueue = () => useMessageStore((state) => state.queue);
export const useSystemPaused = () =>
  useMessageStore((state) => state.systemPaused);
export const useIsHydrated = () => useMessageStore((state) => state.isHydrated);
