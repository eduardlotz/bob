import { initialQuests } from "@/store/config/quests";
import { questStackDefinitions } from "@/store/config/questStacks";
import { getLocale } from "@/i18n";
import { defineMessages } from "@/i18n/defineMessages";
import type { Locale } from "@/i18n/types";

type QuestCopy = {
  title: string;
  description: string;
};

const deQuestMessagesFromConfig: Record<string, QuestCopy> = Object.fromEntries(
  initialQuests.map((quest) => [
    quest.id,
    {
      title: quest.title,
      description: quest.description,
    },
  ]),
);

const enQuestMessageOverrides: Record<string, QuestCopy> = {
  auto_tap_level_10: {
    title: "Workshop Warmup",
    description: "Reach level 10 on the Auto Tapper",
  },
  auto_tap_level_50: {
    title: "Assembly Fever",
    description: "Reach level 50 on the Auto Tapper",
  },
  auto_tap_level_100: {
    title: "Fully Automated",
    description: "Max out the Auto Tapper",
  },
  about_quest_2: {
    title: "Sul Sul!",
    description: "Find the plumbob 🕵",
  },
  portfolio_quest_1: {
    title: "Space Walk",
    description: "Take a look at a few of my creative projects",
  },
  about_books_shelf_3: {
    title: "Bookworm",
    description: "Inspect several books in the collection",
  },
  about_socials_1: {
    title: "Social Butterfly",
    description: "Open the socials globe in the About area",
  },
  about_desk_1: {
    title: "Desk Check",
    description: "Interact with the desk in the About area",
  },
  about_box_1: {
    title: "Box Hunter",
    description: "Interact with the box in the About area",
  },
  manual_taps_50: {
    title: "Warmup Fingers",
    description: "Tap manually 50 times",
  },
  manual_taps_100: {
    title: "Click Machine",
    description: "Tap manually 100 times",
  },
  manual_taps_1000: {
    title: "1,000 Club",
    description: "Tap manually 1,000 times",
  },
  total_taps_1000: {
    title: "Four Digits",
    description: "Reach 1,000 total taps",
  },
  total_taps_10000: {
    title: "Five Digits",
    description: "Reach 10,000 total taps",
  },
  total_taps_1000000: {
    title: "Millionaire",
    description: "Reach 1,000,000 total taps",
  },
  total_taps_1000000000000: {
    title: "Eight Digits",
    description: "Reach 100,000,000 total taps",
  },
  total_taps_1000000000000000: {
    title: "Beyond Infinity",
    description: "Reach 1,000,000,000,000 total taps",
  },
  shop_buy_bob_item_1: {
    title: "Fresh Fit",
    description: "Buy one Bob item in the shop",
  },
  shop_buy_tap_effect_1: {
    title: "Special Effects",
    description: "Buy one tap effect in the shop",
  },
  shop_buy_world_1: {
    title: "World Explorer",
    description: "Buy one world in the shop",
  },
  playtime_60s: {
    title: "Short Session",
    description: "Play for a total of 2 minutes",
  },
  playtime_600s: {
    title: "Nice Session",
    description: "Play for a total of 5 minutes",
  },
  playtime_1800s: {
    title: "Long Haul",
    description: "Play for a total of 10 minutes",
  },
  upgrade_levels_25: {
    title: "Toolbox",
    description: "Reach 25 total upgrade levels",
  },
  upgrade_levels_100: {
    title: "Machine Room",
    description: "Reach 100 total upgrade levels",
  },
  upgrade_levels_200: {
    title: "Patch Day",
    description: "Reach 200 total upgrade levels",
  },
  auto_tap_rate_100: {
    title: "Production Line",
    description: "Reach 100 auto taps per second",
  },
  auto_tap_rate_1000: {
    title: "Machines Humming",
    description: "Reach 1,000 auto taps per second",
  },
  auto_tap_rate_10000: {
    title: "Full Steam",
    description: "Reach 10,000 auto taps per second",
  },
  tap_multiplier_5: {
    title: "Fast Fingers",
    description: "Reach 5x tap power",
  },
  tap_multiplier_20: {
    title: "Muscle Memory",
    description: "Reach 20x tap power",
  },
  tap_multiplier_50: {
    title: "Jackhammer Hand",
    description: "Reach 50x tap power",
  },
  minigames_flappy_points_10: {
    title: "Flappy Bobbie",
    description: "Score 10 points in the Flappy Bird minigame",
  },
  minigames_slot_wins_5: {
    title: "Won It Back",
    description: "Win on the slot machine",
  },
  routes_purchased_1: {
    title: "First Journey",
    description: "Unlock your first additional route",
  },
  routes_purchased_3: {
    title: "Map Master",
    description: "Unlock three additional routes",
  },
};

const enQuestMessages: Record<string, QuestCopy> = {
  ...deQuestMessagesFromConfig,
  ...enQuestMessageOverrides,
};

export const questMessages = defineMessages({
  de: deQuestMessagesFromConfig,
  en: enQuestMessages,
});

export type QuestMessageId = keyof (typeof questMessages)["de"];

export const getQuestCopy = (
  questId: QuestMessageId,
  locale: Locale = getLocale(),
) => questMessages[locale][questId];

const defaultQuestStackMessages: Record<string, QuestCopy> = Object.fromEntries(
  Object.entries(questStackDefinitions).map(([stackId, copy]) => [
    stackId,
    {
      title: copy.title,
      description: copy.description,
    },
  ]),
);

const deStackMessageOverrides: Record<string, QuestCopy> = {
  manual_taps: {
    title: "Manuelle Tap-Meilensteine",
    description: "Baue deine eigene Klick-Ausdauer auf.",
  },
  total_taps: {
    title: "Gesamt-Tap-Meilensteine",
    description: "Erreiche langfristige Lifetime-Tap-Ziele.",
  },
  playtime: {
    title: "Spielzeit-Meilensteine",
    description: "Bleib im Spiel und sammle Ausdauer-Belohnungen.",
  },
  automation_mastery: {
    title: "Automations-Meisterschaft",
    description: "Baue deinen Kern-Auto-Tapper bis zum Maximum aus.",
  },
  upgrade_levels: {
    title: "Upgrade-Meisterschaft",
    description: "Investiere breit in deinen gesamten Upgrade-Baum.",
  },
  auto_tap_rate: {
    title: "Auto-Tap-Ausstoß",
    description: "Steigere deine passive Produktion immer weiter.",
  },
  tap_multiplier: {
    title: "Tap-Power",
    description: "Verstärke jeden einzelnen manuellen Tap.",
  },
  about_tour: {
    title: "Kennlernphase",
    description: "Erkunde die interaktiven Objekte im Über Mich-Raum.",
  },
  route_unlocks: {
    title: "Routen-Explorer",
    description: "Schalte neue Routen frei und erweitere deine Welt.",
  },
  shop_item_categories: {
    title: "Shop-Sammler",
    description: "Kaufe je ein Item aus Bob, Effekte und Welten.",
  },
};

const deQuestStackMessages: Record<string, QuestCopy> = {
  ...defaultQuestStackMessages,
  ...deStackMessageOverrides,
};

const enQuestStackMessages: Record<string, QuestCopy> = {
  ...defaultQuestStackMessages,
};

export const questStackMessages = defineMessages({
  de: deQuestStackMessages,
  en: enQuestStackMessages,
});

export type QuestStackMessageId = keyof (typeof questStackMessages)["de"];

export const getQuestStackCopy = (
  stackId: QuestStackMessageId,
  locale: Locale = getLocale(),
) => questStackMessages[locale][stackId];
