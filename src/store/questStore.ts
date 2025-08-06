import { create } from "zustand";
import { persist } from "zustand/middleware";

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
  addQuest: (quest: Quest) => void;
  updateQuestProgress: (questId: string, progress: number) => void;
  completeQuest: (questId: string) => void;
  getQuestsByRoute: (routeId: string) => Quest[];
  resetQuests: () => void;
}

// Initial quests for each route
const initialQuests: Quest[] = [
  // About route quests
  {
    id: "about_quest_1",
    title: "Learn About Me",
    description: "Read through my background and experience",
    progress: 0,
    maxProgress: 100,
    reward: 25,
    completed: false,
    routeId: "route_about",
    type: "interaction",
    trigger: {
      action: "click_background",
      value: 25,
    },
  },
  {
    id: "about_quest_2",
    title: "Explore Skills",
    description: "Discover my technical and creative skills",
    progress: 0,
    maxProgress: 100,
    reward: 50,
    completed: false,
    routeId: "route_about",
    type: "interaction",
    trigger: {
      action: "click_skills",
      value: 25,
    },
  },
  // Portfolio route quests
  {
    id: "portfolio_quest_1",
    title: "View Projects",
    description: "Browse through my portfolio projects",
    progress: 0,
    maxProgress: 150,
    reward: 75,
    completed: false,
    routeId: "route_portfolio",
    type: "interaction",
    trigger: {
      action: "view_project",
      value: 30,
    },
  },
  {
    id: "portfolio_quest_2",
    title: "Download Resume",
    description: "Download my resume to learn more",
    progress: 0,
    maxProgress: 50,
    reward: 100,
    completed: false,
    routeId: "route_portfolio",
    type: "interaction",
    trigger: {
      action: "download_resume",
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

      resetQuests: () =>
        set(() => ({
          quests: initialQuests,
        })),
    }),
    {
      name: "quest-store",
      version: 1,
      partialize: (state) => ({
        quests: state.quests,
      }),
    }
  )
);
