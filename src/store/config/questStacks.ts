export type QuestStackDefinition = {
  title: string;
  description: string;
};

export const questStackDefinitions = {
  automation_mastery: {
    title: "Automation Mastery",
    description: "Push your core Auto Tapper all the way to max.",
  },
  about_tour: {
    title: "Talking Stage",
    description: "Explore the interactive objects in the About room.",
  },
  manual_taps: {
    title: "Manual Tap Milestones",
    description: "Build up your own tapping stamina.",
  },
  total_taps: {
    title: "Total Tap Milestones",
    description: "Reach long-term lifetime tap goals.",
  },
  shop_item_categories: {
    title: "Shop Collector",
    description: "Buy one item from Bob, Effects, and Worlds.",
  },
  route_unlocks: {
    title: "Route Explorer",
    description: "Unlock new routes to expand your world.",
  },
  playtime: {
    title: "Playtime Milestones",
    description: "Stay in the game to unlock endurance rewards.",
  },
  upgrade_levels: {
    title: "Upgrade Mastery",
    description: "Invest broadly across your full upgrade tree.",
  },
  auto_tap_rate: {
    title: "Automation Output",
    description: "Keep raising your passive tap production.",
  },
  tap_multiplier: {
    title: "Tap Power",
    description: "Keep making every manual tap hit harder.",
  },
} as const satisfies Record<string, QuestStackDefinition>;

export type QuestStackId = keyof typeof questStackDefinitions;

export const getQuestStackDefinition = (stackId: string) =>
  questStackDefinitions[stackId as QuestStackId];
