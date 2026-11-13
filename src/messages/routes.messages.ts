import { defineMessages } from "@/i18n/defineMessages";
import type { MessageConfig } from "./config";

export const routeMessageConfigs = defineMessages<
  Record<string, MessageConfig>
>({
  de: {
    about_welcome: {
      id: "about_welcome_v3",
      text: [
        "gemütlich oder? 😊",
        "hier findest du mehr über die Person hinter der Website :) Tap einfach eine Ecke im Raum an, um sie dir näher anzuschauen",
        "Hinter mir findest du Eddies kleine Schallplattensammlung und im Regal dort seine Büchersammlung. Die Hälfte davon hat er noch garnicht gelesen, aber psst 🤓",
        "ach und wenn dich der Regen stört, kannst du auch das Fenster schließen ☔️ ich persönlich finds beruhigend ",
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
        "Willkommen im Portfolio-Universum! Hier findest du einen Mix aus kreativen Arbeiten von Eddie",
        "Tap einfach ein Bild an, um mehr es dir genauer anzusehen",
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
        "Cozy, isn't it? 😊",
        "Here you can find out more about the person behind the website :) Just tap any corner of the room to take a closer look",
        "Behind me you'll find Eddie's little record collection, and on that shelf over there, his book collection. He hasn't even read half of them yet, but shh 🤓",
        "Oh, and if the rain bothers you, you can also close the window ☔️—I personally find it soothing",
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
