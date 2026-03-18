import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { FUN_FACTS } from "@/3d-objects/socials/contentData";
import type { FunFact } from "@/3d-objects/socials/types";
import type { ThroneId } from "@/3d-objects/socials/data";
import { useQuestStore } from "@/store/core/quests";

type FunFactId = FunFact["id"];

interface SocialsStore {
  focusedThrone: ThroneId | null;
  currentFunFactIndex: number;
  funFactRevealToken: number;
  revealedFunFactIds: Record<FunFactId, boolean>;
  unlockedFunFactIds: FunFactId[];
  lastUnlockedFunFactId: FunFactId | null;
  lastUnlockedFunFactIndex: number | null;
  setFocused: (id: ThroneId) => void;
  clearFocus: () => void;
  setCurrentFunFact: (index: number) => FunFact | null;
  revealNextUnrevealedFunFact: () => FunFact | null;
  revealFunFactByIndex: (index: number) => FunFact | null;
  revealFunFactById: (factId: FunFactId) => FunFact | null;
  isFunFactUnlocked: (factIdOrIndex: FunFactId | number) => boolean;
  getUnlockedFunFactIds: () => FunFactId[];
  getUnlockedFunFacts: () => FunFact[];
  getNextUnrevealedFunFactIndex: () => number;
  getNextUnrevealedFunFact: () => FunFact | null;
}

const FACT_COUNT = FUN_FACTS.length;

const clampFactIndex = (index: number) =>
  Math.max(0, Math.min(index, Math.max(0, FACT_COUNT - 1)));

const getFactByIndex = (index: number) => FUN_FACTS[clampFactIndex(index)] ?? null;

const getFactIndexById = (factId: FunFactId) =>
  FUN_FACTS.findIndex((fact) => fact.id === factId);

const normalizeFactIds = (ids: readonly string[] | undefined): FunFactId[] =>
  Array.from(
    new Set(
      (ids ?? []).filter(
        (id): id is FunFactId => FUN_FACTS.some((fact) => fact.id === id),
      ),
    ),
  );

const triggerQuestAction = (action: string, value = 1) => {
  const questStore = useQuestStore.getState();
  if (typeof questStore.triggerQuestAction === "function") {
    questStore.triggerQuestAction(action, value);
  }
};

const buildUnlockState = (
  state: SocialsStore,
  fact: FunFact,
  index: number,
  isNewUnlock: boolean,
) => {
  const unlockedFunFactIds = isNewUnlock
    ? [...state.unlockedFunFactIds, fact.id]
    : state.unlockedFunFactIds;

  const revealedFunFactIds = isNewUnlock
    ? { ...state.revealedFunFactIds, [fact.id]: true }
    : state.revealedFunFactIds;

  return {
    currentFunFactIndex: index,
    funFactRevealToken: state.funFactRevealToken + 1,
    revealedFunFactIds,
    unlockedFunFactIds,
    lastUnlockedFunFactId: fact.id,
    lastUnlockedFunFactIndex: index,
  };
};

export const useSocialsStore = create<SocialsStore>()(
  persist(
    (set, get) => {
      const unlockFunFactAtIndex = (index: number) => {
        const fact = getFactByIndex(index);
        if (!fact) return null;

        const state = get();
        const normalizedIndex = clampFactIndex(index);
        const isNewUnlock = state.revealedFunFactIds[fact.id] !== true;
        const nextState = buildUnlockState(
          state,
          fact,
          normalizedIndex,
          isNewUnlock,
        );

        set(() => nextState);

        if (isNewUnlock) {
          if (state.unlockedFunFactIds.length === 0) {
            triggerQuestAction("socials_fun_fact_first_unlock");
          }

          if (state.unlockedFunFactIds.length + 1 === FACT_COUNT) {
            triggerQuestAction("socials_fun_fact_last_unlock");
          }
        }

        return fact;
      };

      return {
        focusedThrone: null,
        currentFunFactIndex: 0,
        funFactRevealToken: 0,
        revealedFunFactIds: {},
        unlockedFunFactIds: [],
        lastUnlockedFunFactId: null,
        lastUnlockedFunFactIndex: null,
        setFocused: (id) => set({ focusedThrone: id }),
        clearFocus: () => set({ focusedThrone: null }),
        setCurrentFunFact: (index) => unlockFunFactAtIndex(index),
        revealNextUnrevealedFunFact: () => {
          const nextIndex = FUN_FACTS.findIndex(
            (fact) => get().revealedFunFactIds[fact.id] !== true,
          );

          return nextIndex === -1 ? null : unlockFunFactAtIndex(nextIndex);
        },
        revealFunFactByIndex: (index) => unlockFunFactAtIndex(index),
        revealFunFactById: (factId) => {
          const factIndex = getFactIndexById(factId);
          return factIndex === -1 ? null : unlockFunFactAtIndex(factIndex);
        },
        isFunFactUnlocked: (factIdOrIndex) => {
          const state = get();
          const factId =
            typeof factIdOrIndex === "number"
              ? Number.isInteger(factIdOrIndex) &&
                factIdOrIndex >= 0 &&
                factIdOrIndex < FUN_FACTS.length
                ? FUN_FACTS[factIdOrIndex]?.id
                : null
              : factIdOrIndex;

          if (!factId) return false;

          return state.revealedFunFactIds[factId] === true;
        },
        getUnlockedFunFactIds: () => get().unlockedFunFactIds,
        getUnlockedFunFacts: () =>
          get()
            .unlockedFunFactIds.map((factId) => FUN_FACTS.find((fact) => fact.id === factId))
            .filter((fact): fact is FunFact => Boolean(fact)),
        getNextUnrevealedFunFactIndex: () => {
          const state = get();
          const nextIndex = FUN_FACTS.findIndex(
            (fact) => state.revealedFunFactIds[fact.id] !== true,
          );
          return nextIndex;
        },
        getNextUnrevealedFunFact: () => {
          const state = get();
          const nextIndex = FUN_FACTS.findIndex(
            (fact) => state.revealedFunFactIds[fact.id] !== true,
          );
          return nextIndex === -1 ? null : FUN_FACTS[nextIndex] ?? null;
        },
      };
    },
    {
      name: "socials-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        focusedThrone: state.focusedThrone,
        currentFunFactIndex: state.currentFunFactIndex,
        revealedFunFactIds: state.revealedFunFactIds,
        unlockedFunFactIds: state.unlockedFunFactIds,
        lastUnlockedFunFactId: state.lastUnlockedFunFactId,
        lastUnlockedFunFactIndex: state.lastUnlockedFunFactIndex,
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<SocialsStore> | undefined;
        const normalizedUnlockedIds = normalizeFactIds(
          persisted?.unlockedFunFactIds,
        );

        const revealedFunFactIds = FUN_FACTS.reduce<Record<FunFactId, boolean>>(
          (acc, fact) => {
            acc[fact.id] =
              persisted?.revealedFunFactIds?.[fact.id] === true ||
              normalizedUnlockedIds.includes(fact.id);
            return acc;
          },
          {} as Record<FunFactId, boolean>,
        );

        const sanitizedCurrentIndex = clampFactIndex(
          Number(persisted?.currentFunFactIndex) || 0,
        );
        const lastUnlockedFunFactIndex =
          Number.isFinite(persisted?.lastUnlockedFunFactIndex)
            ? clampFactIndex(Number(persisted?.lastUnlockedFunFactIndex))
            : null;
        const lastUnlockedFunFactId =
          persisted?.lastUnlockedFunFactId &&
          FUN_FACTS.some((fact) => fact.id === persisted.lastUnlockedFunFactId)
            ? persisted.lastUnlockedFunFactId
            : null;

        return {
          ...currentState,
          ...persisted,
          currentFunFactIndex: sanitizedCurrentIndex,
          revealedFunFactIds,
          unlockedFunFactIds: normalizedUnlockedIds,
          lastUnlockedFunFactId,
          lastUnlockedFunFactIndex,
        };
      },
    },
  ),
);
