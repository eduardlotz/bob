import { create } from "zustand";
import { persist } from "zustand/middleware";
import { checkAndMigrate } from "./migration";

export interface Quest {
  id: string;
  title: string;
  description: string;
  progress: number;
  maxProgress: number;
  reward: number;
  completed: boolean;
  routeId: string;
  type: "interaction" | "tap" | "time" | "custom";
  trigger?: {
    action: string;
    value?: any;
  };
}

export interface QuestStore {
  quests: Quest[];
  activeQuests: string[]; // Track active quests for current route
  addQuest: (quest: Quest) => void;
  updateQuestProgress: (questId: string, progress: number) => void;
  completeQuest: (questId: string) => void;
  getQuestsByRoute: (routeId: string) => Quest[];
  setActiveQuests: (routeId: string) => void;
  clearActiveQuests: () => void;
  resetQuests: () => void;
  resetAllQuests: () => void;
}

// Initial quests for each route
const initialQuests: Quest[] = [
  // About route quests
  {
    id: "about_quest_1",
    title: "Explore the Chair",
    description: "Click on the chair to learn about my development journey",
    progress: 0,
    maxProgress: 30,
    reward: 30,
    completed: false,
    routeId: "route_about",
    type: "interaction",
    trigger: {
      action: "click_chair",
      value: 30,
    },
  },
  {
    id: "about_quest_2",
    title: "Discover the Sun",
    description: "Click on the sun to learn about my passion for innovation",
    progress: 0,
    maxProgress: 25,
    reward: 25,
    completed: false,
    routeId: "route_about",
    type: "interaction",
    trigger: {
      action: "click_sun",
      value: 25,
    },
  },
  {
    id: "about_quest_3",
    title: "Illuminate the Lamp",
    description: "Click on the lamp to learn about my problem-solving approach",
    progress: 0,
    maxProgress: 35,
    reward: 35,
    completed: false,
    routeId: "route_about",
    type: "interaction",
    trigger: {
      action: "click_lamp",
      value: 35,
    },
  },
  // Portfolio route quests
  {
    id: "portfolio_quest_1",
    title: "Explore the Computer",
    description:
      "Click on the computer to learn about my development environment",
    progress: 0,
    maxProgress: 40,
    reward: 40,
    completed: false,
    routeId: "route_portfolio",
    type: "interaction",
    trigger: {
      action: "click_computer",
      value: 40,
    },
  },
  {
    id: "portfolio_quest_2",
    title: "Discover the Books",
    description: "Click on the books to learn about my continuous learning",
    progress: 0,
    maxProgress: 30,
    reward: 30,
    completed: false,
    routeId: "route_portfolio",
    type: "interaction",
    trigger: {
      action: "click_books",
      value: 30,
    },
  },
  {
    id: "portfolio_quest_3",
    title: "View Project Showcase",
    description: "Click on the coffee cup to view my project showcase",
    progress: 0,
    maxProgress: 50,
    reward: 50,
    completed: false,
    routeId: "route_portfolio",
    type: "interaction",
    trigger: {
      action: "click_coffee",
      value: 50,
    },
  },
  // Creative route quests
  {
    id: "creative_quest_1",
    title: "Explore Artwork",
    description: "View my creative artwork and designs",
    progress: 0,
    maxProgress: 120,
    reward: 60,
    completed: false,
    routeId: "route_creative",
    type: "interaction",
    trigger: {
      action: "view_artwork",
      value: 20,
    },
  },
  {
    id: "creative_quest_2",
    title: "Creative Process",
    description: "Learn about my creative process",
    progress: 0,
    maxProgress: 80,
    reward: 40,
    completed: false,
    routeId: "route_creative",
    type: "interaction",
    trigger: {
      action: "view_process",
      value: 40,
    },
  },
  // Technical route quests
  {
    id: "technical_quest_1",
    title: "Read Documentation",
    description: "Read through technical documentation",
    progress: 0,
    maxProgress: 200,
    reward: 100,
    completed: false,
    routeId: "route_technical",
    type: "interaction",
    trigger: {
      action: "read_docs",
      value: 25,
    },
  },
  {
    id: "technical_quest_2",
    title: "Code Review",
    description: "Review code samples and implementations",
    progress: 0,
    maxProgress: 150,
    reward: 75,
    completed: false,
    routeId: "route_technical",
    type: "interaction",
    trigger: {
      action: "review_code",
      value: 30,
    },
  },
  // Guestbook route quests
  {
    id: "guestbook_quest_1",
    title: "Leave a Message",
    description: "Sign the guestbook with a message",
    progress: 0,
    maxProgress: 100,
    reward: 50,
    completed: false,
    routeId: "route_guestbook",
    type: "interaction",
    trigger: {
      action: "sign_guestbook",
      value: 100,
    },
  },
  {
    id: "guestbook_quest_2",
    title: "Read Messages",
    description: "Read through guestbook messages",
    progress: 0,
    maxProgress: 80,
    reward: 40,
    completed: false,
    routeId: "route_guestbook",
    type: "interaction",
    trigger: {
      action: "read_messages",
      value: 20,
    },
  },
];

export const useQuestStore = create<QuestStore>()(
  persist(
    (set, get) => ({
      quests: initialQuests,
      activeQuests: [],

      addQuest: (quest) =>
        set((state) => ({
          quests: [...state.quests, quest],
        })),

      updateQuestProgress: (questId, progress) =>
        set((state) => ({
          quests: state.quests.map((quest) =>
            quest.id === questId
              ? { ...quest, progress: Math.min(progress, quest.maxProgress) }
              : quest
          ),
        })),

      completeQuest: (questId) =>
        set((state) => ({
          quests: state.quests.map((quest) =>
            quest.id === questId ? { ...quest, completed: true } : quest
          ),
        })),

      getQuestsByRoute: (routeId) => {
        const state = get();
        return state.quests.filter((quest) => quest.routeId === routeId);
      },

      setActiveQuests: (routeId) => {
        const state = get();
        const routeQuests = state.quests.filter(
          (quest) => quest.routeId === routeId
        );
        const questIds = routeQuests.map((quest) => quest.id);

        set(() => ({
          activeQuests: questIds,
        }));
      },

      clearActiveQuests: () =>
        set(() => ({
          activeQuests: [],
        })),

      resetQuests: () =>
        set(() => ({
          quests: initialQuests,
          activeQuests: [],
        })),

      // Reset quests for testing - clears all progress
      resetAllQuests: () =>
        set(() => ({
          quests: initialQuests.map((quest) => ({
            ...quest,
            progress: 0,
            completed: false,
          })),
          activeQuests: [],
        })),
    }),
    {
      name: "quest-store",
      version: 1,
      partialize: (state) => ({
        quests: state.quests,
        activeQuests: state.activeQuests,
      }),
      onRehydrateStorage: (state) => {
        console.log("Quest store rehydrated:", state);
        // Check for migration after store is loaded
        checkAndMigrate().catch(console.error);
      },
    }
  )
);
