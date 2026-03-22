import { defineMessages } from "@/i18n/defineMessages";
import type { MessageConfig } from "./config";

export const routeMessageConfigs = defineMessages<Record<string, MessageConfig>>({
  de: {
    about_welcome: {
      id: "about_welcome",
      text: [
        "Hier fehlt leider noch einiges",
        "Sorry 🥀😔",
        "im Karton kannst du aber schon ein paar von Eddies Interessen finden",
        "such doch mal nach dem Plumbob 👀",
      ],
      label: "Bob",
      options: {
        typingSpeedMs: 25,
        baseDismissMs: 2000,
        contentLengthFactorMs: 50,
        tailEnabled: false,
        emotion: { state: "happy", durationMs: 3000 },
      },
      repeatRule: "oncePerPersist",
    },
    portfolio_welcome: {
      id: "portfolio_welcome",
      text: [
        "Willkommen im Portfolio-Universum",
        "Hier kannst du dir private Arbeiten von Eddie anschauen",
        "Tipp ein Bild an, um mehr Infos anzuzeigen. Manche enthalten sogar Links 🔗",
      ],
      label: "Bob",
      options: {
        typingSpeedMs: 25,
        baseDismissMs: 1000,
        contentLengthFactorMs: 50,
        tailEnabled: false,
        emotion: { state: "happy", durationMs: 3000 },
      },
      repeatRule: "oncePerPersist",
      positionOffset: [0, 5, 0],
    },
    minigames_welcome: {
      id: "minigames_welcome",
      text: [
        "ja mooooin, bock was zu zocken??",
        "hier gibt's Ping Pong 🏓, Flappy Bird 🐦 und den Slotautomaten 🎰",
      ],
      label: "Bob",
      repeatRule: "oncePerPersist",
      options: {
        emotion: { state: "happy", durationMs: 4000 },
      },
    },
  },
  en: {
    about_welcome: {
      id: "about_welcome",
      text: [
        "There's still quite a bit missing here",
        "Sorry 🥀😔",
        "but the cardboard box already holds a few of Eddie's interests",
        "maybe look for the plumbob 👀",
      ],
      label: "Bob",
      options: {
        typingSpeedMs: 25,
        baseDismissMs: 2000,
        contentLengthFactorMs: 50,
        tailEnabled: false,
        emotion: { state: "happy", durationMs: 3000 },
      },
      repeatRule: "oncePerPersist",
    },
    portfolio_welcome: {
      id: "portfolio_welcome",
      text: [
        "Welcome to the portfolio universe",
        "You can browse Eddie's personal projects here",
        "Tap an image to see more info. Some of them even include links 🔗",
      ],
      label: "Bob",
      options: {
        typingSpeedMs: 25,
        baseDismissMs: 1000,
        contentLengthFactorMs: 50,
        tailEnabled: false,
        emotion: { state: "happy", durationMs: 3000 },
      },
      repeatRule: "oncePerPersist",
      positionOffset: [0, 5, 0],
    },
    minigames_welcome: {
      id: "minigames_welcome",
      text: [
        "heyyy, feel like playing something??",
        "there's Ping Pong 🏓, Flappy Bird 🐦, and the slot machine 🎰",
      ],
      label: "Bob",
      repeatRule: "oncePerPersist",
      options: {
        emotion: { state: "happy", durationMs: 4000 },
      },
    },
  },
});
