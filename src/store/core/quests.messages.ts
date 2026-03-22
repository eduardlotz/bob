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
