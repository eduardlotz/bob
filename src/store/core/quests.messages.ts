import { getLocale } from "@/i18n";
import { defineMessages } from "@/i18n/defineMessages";
import type { Locale } from "@/i18n/types";

export const questMessages = defineMessages({
  de: {
    auto_tap_milestone_1: {
      title: "Passives Einkommen",
      description: "Kauf deine ersten Auto-Tap-Upgrades",
    },
    about_quest_2: {
      title: "Sul Sul!",
      description: "Finde den Plumbob 🕵",
    },
    portfolio_quest_1: {
      title: "Weltraumspaziergang",
      description: "Schau dir ein paar meiner kreativen Arbeiten an",
    },
    about_books_shelf_3: {
      title: "Bücherwurm",
      description: "Schau dir mehrere Bücher in der Sammlung an",
    },
    manual_taps_50: {
      title: "Finger warmtippen",
      description: "Tippe 50 Mal selbst",
    },
    manual_taps_100: {
      title: "Klickmaschine",
      description: "Tippe 100 Mal selbst",
    },
    manual_taps_1000: {
      title: "1000er Club",
      description: "Tippe 1000 Mal selbst",
    },
    total_taps_1000: {
      title: "Vierstellig",
      description: "Erreiche insgesamt 1.000 Taps",
    },
    total_taps_10000: {
      title: "Millionär",
      description: "Erreiche insgesamt 1.000.000 Taps",
    },
    total_taps_1000000: {
      title: "Milliardär",
      description: "Erreiche insgesamt 1.000.000.000 Taps",
    },
    total_taps_1000000000000: {
      title: "Trillion Club",
      description: "Erreiche insgesamt 1.000.000.000.000 Taps",
    },
    total_taps_1000000000000000: {
      title: "Jenseits der Unendlichkeit",
      description: "Erreiche insgesamt 1.000.000.000.000.000 Taps",
    },
    shop_buy_bob_item_1: {
      title: "Neuer Fit",
      description: "Kaufe ein Bob-Item im Shop",
    },
    shop_buy_tap_effect_1: {
      title: "Effektvoll",
      description: "Kaufe einen Tap-Effekt im Shop",
    },
    shop_buy_world_1: {
      title: "Weltentdecker",
      description: "Kaufe eine Welt im Shop",
    },
    playtime_60s: {
      title: "Kurze Session",
      description: "Spiele insgesamt 1 Minute",
    },
    playtime_600s: {
      title: "Langstrecke",
      description: "Spiele insgesamt 10 Minuten",
    },
    minigames_flappy_points_10: {
      title: "Flappy Bobbie",
      description: "Erziele 10 Punkte im Flappy-Bird-Minigame",
    },
    minigames_slot_spins_15: {
      title: "Spielsüchtig",
      description: "Benutze den Slotautomaten 15 Mal",
    },
    minigames_slot_wins_5: {
      title: "Alles wieder reingeholt",
      description: "Gewinne am Slotautomaten",
    },
  },
  en: {
    auto_tap_milestone_1: {
      title: "Passive Income",
      description: "Buy your first auto-tap upgrades",
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
      title: "Millionaire",
      description: "Reach 1,000,000 total taps",
    },
    total_taps_1000000: {
      title: "Billionaire",
      description: "Reach 1,000,000,000 total taps",
    },
    total_taps_1000000000000: {
      title: "Trillion Club",
      description: "Reach 1,000,000,000,000 total taps",
    },
    total_taps_1000000000000000: {
      title: "Beyond Infinity",
      description: "Reach 1,000,000,000,000,000 total taps",
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
      description: "Play for a total of 1 minute",
    },
    playtime_600s: {
      title: "Long Haul",
      description: "Play for a total of 10 minutes",
    },
    minigames_flappy_points_10: {
      title: "Flappy Bobbie",
      description: "Score 10 points in the Flappy Bird minigame",
    },
    minigames_slot_spins_15: {
      title: "Hooked",
      description: "Use the slot machine 15 times",
    },
    minigames_slot_wins_5: {
      title: "Won It Back",
      description: "Win on the slot machine",
    },
  },
});

export type QuestMessageId = keyof (typeof questMessages)["de"];

export const getQuestCopy = (
  questId: QuestMessageId,
  locale: Locale = getLocale(),
) => questMessages[locale][questId];

export const questStackMessages = defineMessages({
  de: {
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
    shop_item_categories: {
      title: "Shop-Sammler",
      description: "Kaufe je ein Item aus Bob, Effekte und Welten.",
    },
  },
  en: {
    manual_taps: {
      title: "Manual Tap Milestones",
      description: "Build up your own tapping stamina.",
    },
    total_taps: {
      title: "Total Tap Milestones",
      description: "Reach long-term lifetime tap goals.",
    },
    playtime: {
      title: "Playtime Milestones",
      description: "Stay in the game to unlock endurance rewards.",
    },
    shop_item_categories: {
      title: "Shop Collector",
      description: "Buy one item from Bob, Effects, and Worlds.",
    },
  },
});

export type QuestStackMessageId = keyof (typeof questStackMessages)["de"];

export const getQuestStackCopy = (
  stackId: QuestStackMessageId,
  locale: Locale = getLocale(),
) => questStackMessages[locale][stackId];
