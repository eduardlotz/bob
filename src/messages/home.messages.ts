import { defineMessages } from "@/i18n/defineMessages";
import type { MessageConfig } from "./config";

export const homeMessageConfigs = defineMessages<Record<string, MessageConfig>>({
  de: {
    welcome_home: {
      id: "welcome_home",
      text: [
        "Hallööööchen, ich bin der Bob 😗✌️",
        "Willkommen in Eddies eigener Ecke im Internet!",
        "ich werde dich hier begleiten und mit Infos versorgen",
        "zum Start kannst du mich ja erstmal antippen 🫵 macht spaß!",
      ],
      label: "Bob",
      options: {
        typingSpeedMs: 30,
        baseDismissMs: 1800,
        contentLengthFactorMs: 40,
        tailEnabled: false,
        emotion: { state: "happy", durationMs: 5000 },
      },
      repeatRule: "oncePerPersist",
    },
    return_greeting_1: {
      id: "return_greeting_1",
      text: ["Ja hallooo", "Du auch hier?? 👁️👄👁️"],
      label: "Bob",
      options: {
        typingSpeedMs: 28,
        baseDismissMs: 1600,
        contentLengthFactorMs: 40,
        tailEnabled: false,
        emotion: { state: "dizzy", durationMs: 3000 },
      },
      repeatRule: "oncePerSession",
    },
    return_greeting_2: {
      id: "return_greeting_2",
      text: ["Na duuuu", "Zurück für mehr taps? 🫶"],
      label: "Bob",
      options: {
        typingSpeedMs: 28,
        baseDismissMs: 1600,
        contentLengthFactorMs: 40,
        tailEnabled: false,
        emotion: { state: "happy", durationMs: 4000 },
      },
      repeatRule: "oncePerSession",
    },
    return_greeting_3: {
      id: "return_greeting_3",
      text: ["yooooooooo", "lets gooooooo 🫵"],
      label: "Bob",
      options: {
        typingSpeedMs: 28,
        baseDismissMs: 1600,
        contentLengthFactorMs: 40,
        tailEnabled: false,
      },
      repeatRule: "oncePerSession",
    },
    return_greeting_4: {
      id: "return_greeting_4",
      text: ["Moin Meister", "alles fit?"],
      label: "Bob",
      options: {
        typingSpeedMs: 28,
        baseDismissMs: 1600,
        contentLengthFactorMs: 40,
        tailEnabled: false,
        emotion: { state: "suspicious", durationMs: 4000 },
      },
      repeatRule: "oncePerSession",
    },
    first_tap_hint: {
      id: "first_tap_hint",
      text: [
        "Ach übrigenski: für nur 15 taps 🫵 kannst du den Auto-Tapper aktivieren",
        "Dann kann ich für dich tappen, solange du dich auf der Seite umschaust 👀",
      ],
      label: "Bob",
      options: {
        typingSpeedMs: 30,
        baseDismissMs: 1800,
        contentLengthFactorMs: 50,
        tailEnabled: false,
        emotion: { state: "thinking", durationMs: 4000 },
      },
      repeatRule: "oncePerPersist",
    },
  },
  en: {
    welcome_home: {
      id: "welcome_home",
      text: [
        "Hellooooo, I'm Bob 😗✌️",
        "Welcome to Eddie's own corner of the internet!",
        "I'll hang out with you here and keep the info flowing",
        "for starters you can tap me a bit 🫵 it's fun!",
      ],
      label: "Bob",
      options: {
        typingSpeedMs: 30,
        baseDismissMs: 1800,
        contentLengthFactorMs: 40,
        tailEnabled: false,
        emotion: { state: "happy", durationMs: 5000 },
      },
      repeatRule: "oncePerPersist",
    },
    return_greeting_1: {
      id: "return_greeting_1",
      text: ["Well hellooo", "You too, huh?? 👁️👄👁️"],
      label: "Bob",
      options: {
        typingSpeedMs: 28,
        baseDismissMs: 1600,
        contentLengthFactorMs: 40,
        tailEnabled: false,
        emotion: { state: "dizzy", durationMs: 3000 },
      },
      repeatRule: "oncePerSession",
    },
    return_greeting_2: {
      id: "return_greeting_2",
      text: ["Heeey you", "Back for more taps? 🫶"],
      label: "Bob",
      options: {
        typingSpeedMs: 28,
        baseDismissMs: 1600,
        contentLengthFactorMs: 40,
        tailEnabled: false,
        emotion: { state: "happy", durationMs: 4000 },
      },
      repeatRule: "oncePerSession",
    },
    return_greeting_3: {
      id: "return_greeting_3",
      text: ["yooooooooo", "lets gooooooo 🫵"],
      label: "Bob",
      options: {
        typingSpeedMs: 28,
        baseDismissMs: 1600,
        contentLengthFactorMs: 40,
        tailEnabled: false,
      },
      repeatRule: "oncePerSession",
    },
    return_greeting_4: {
      id: "return_greeting_4",
      text: ["Hey chief", "everything good?"],
      label: "Bob",
      options: {
        typingSpeedMs: 28,
        baseDismissMs: 1600,
        contentLengthFactorMs: 40,
        tailEnabled: false,
        emotion: { state: "suspicious", durationMs: 4000 },
      },
      repeatRule: "oncePerSession",
    },
    first_tap_hint: {
      id: "first_tap_hint",
      text: [
        "By the way: for just 15 taps 🫵 you can unlock the auto tapper",
        "Then I can keep tapping for you while you look around 👀",
      ],
      label: "Bob",
      options: {
        typingSpeedMs: 30,
        baseDismissMs: 1800,
        contentLengthFactorMs: 50,
        tailEnabled: false,
        emotion: { state: "thinking", durationMs: 4000 },
      },
      repeatRule: "oncePerPersist",
    },
  },
});
