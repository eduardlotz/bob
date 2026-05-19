import { defineMessages } from "@/i18n/defineMessages";
import type { MessageConfig } from "./config";

export const routeMessageConfigs = defineMessages<
  Record<string, MessageConfig>
>({
  de: {
    about_welcome: {
      id: "about_welcome_v3",
      text: [
        "Hier findest du mehr über Eddie und seine Interessen :)",
        "Tap dich einfach durch und lern ein paar (neue) Dinge über die Person hinter Website ✨",
      ],
      label: "Bob",
      options: {
        typingSpeedMs: 25,
        baseDismissMs: 1900,
        contentLengthFactorMs: 48,
        tailEnabled: false,
        emotion: { state: "happy", durationMs: 3000 },
      },
      repeatRule: "oncePerPersist",
    },
    portfolio_welcome: {
      id: "portfolio_welcome_v3",
      text: [
        "Willkommen im Portfolio-Universum",
        "Tap ein Bild an, um mehr Infos anzuzeigen",
      ],
      label: "Bob",
      options: {
        typingSpeedMs: 25,
        baseDismissMs: 1400,
        contentLengthFactorMs: 48,
        tailEnabled: false,
        emotion: { state: "happy", durationMs: 3000 },
      },
      repeatRule: "oncePerPersist",
      positionOffset: [0, 5, 0],
    },
    minigames_welcome: {
      id: "minigames_welcome_v3",
      text: [
        "Mooooooin, bock was zu zocken??",
        "tap einfach einen gegenstand an, um das Spiel dafür auszuprobieren",
      ],
      label: "Bob",
      repeatRule: "oncePerPersist",
      options: {
        typingSpeedMs: 25,
        baseDismissMs: 1400,
        contentLengthFactorMs: 48,
        tailEnabled: false,
        emotion: { state: "happy", durationMs: 3500 },
      },
    },
  },
  en: {
    about_welcome: {
      id: "about_welcome_v3",
      text: [
        "Here you'll find more about Eddie and his interests :)",
        "The room isn't fully finished yet, but there's already plenty to discover",
        "Just tap your way through and learn a few (new) things about the person behind this website ✨",
      ],
      label: "Bob",
      options: {
        typingSpeedMs: 25,
        baseDismissMs: 1900,
        contentLengthFactorMs: 48,
        tailEnabled: false,
        emotion: { state: "happy", durationMs: 3000 },
      },
      repeatRule: "oncePerPersist",
    },
    portfolio_welcome: {
      id: "portfolio_welcome_v3",
      text: [
        "Welcome to the portfolio universe",
        "Here you can check out Eddie's free-time projects",
        "Tap an image to show more info",
      ],
      label: "Bob",
      options: {
        typingSpeedMs: 25,
        baseDismissMs: 1400,
        contentLengthFactorMs: 48,
        tailEnabled: false,
        emotion: { state: "happy", durationMs: 3000 },
      },
      repeatRule: "oncePerPersist",
      positionOffset: [0, 5, 0],
    },
    minigames_welcome: {
      id: "minigames_welcome_v3",
      text: [
        "well helloooo, feel like playing something??",
        "just tap an object to try the game for it",
      ],
      label: "Bob",
      repeatRule: "oncePerPersist",
      options: {
        typingSpeedMs: 25,
        baseDismissMs: 1400,
        contentLengthFactorMs: 48,
        tailEnabled: false,
        emotion: { state: "happy", durationMs: 3500 },
      },
    },
  },
});
