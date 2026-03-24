import { defineMessages } from "@/i18n/defineMessages";
import type { MessageConfig } from "./config";

export const homeMessageConfigs = defineMessages<Record<string, MessageConfig>>(
  {
    de: {
      welcome_home: {
        id: "welcome_home_v3",
        text: [
          "Hey hey, ich bin der Bob 😗✌️",
          "Willkommen auf Eddies persönlicher Website!",
          "hier ist alles ein wenig anders als du es wahrscheinlich gewohnt bist, aber ich geb mein Bestes, dich mit Infos zu versorgen 🤞",
          "zum Start kannst du mich ja erstmal antippen 🫵 das macht spaß, vertrau mir!",
        ],
        label: "Bob",
        options: {
          typingSpeedMs: 30,
          baseDismissMs: 1800,
          contentLengthFactorMs: 40,
          emotion: { state: "happy", durationMs: 5000 },
        },
        repeatRule: "oncePerPersist",
      },
      return_greeting_1: {
        id: "return_greeting_1",
        text: ["Na duuuu", "Zurück für mehr taps? 🫶"],
        label: "Bob",
        options: {
          typingSpeedMs: 28,
          baseDismissMs: 1600,
          contentLengthFactorMs: 40,
          emotion: { state: "happy", durationMs: 3000 },
        },
        repeatRule: "oncePerSession",
      },
      return_greeting_2: {
        id: "return_greeting_2",
        text: ["schön, dass du wieder da bist :)"],
        label: "Bob",
        options: {
          typingSpeedMs: 28,
          baseDismissMs: 1600,
          contentLengthFactorMs: 40,
          emotion: { state: "happy", durationMs: 4000 },
        },
        repeatRule: "oncePerSession",
      },
      return_greeting_3: {
        id: "return_greeting_3",
        text: ["Was machen Sachen?"],
        label: "Bob",
        options: {
          typingSpeedMs: 28,
          baseDismissMs: 1600,
          contentLengthFactorMs: 40,
        },
        repeatRule: "oncePerSession",
      },
      return_greeting_4: {
        id: "return_greeting_4",
        text: ["ich bin der bob und ich bin auch dabei"],
        label: "Bob",
        options: {
          typingSpeedMs: 28,
          baseDismissMs: 1600,
          contentLengthFactorMs: 40,
          emotion: { state: "thinking", durationMs: 4000 },
        },
        repeatRule: "oncePerSession",
      },
      return_greeting_5: {
        id: "return_greeting_5",
        text: ["weeeeiter gehts mit taps 🤑"],
        label: "Bob",
        options: {
          typingSpeedMs: 28,
          baseDismissMs: 1500,
          contentLengthFactorMs: 38,
        },
        repeatRule: "oncePerSession",
      },
      return_greeting_6: {
        id: "return_greeting_6",
        text: ["heeey", "hoooo", "lets gooooooo 🫵"],
        label: "Bob",
        options: {
          typingSpeedMs: 28,
          baseDismissMs: 1500,
          contentLengthFactorMs: 40,
        },
        repeatRule: "oncePerSession",
      },
      return_greeting_7: {
        id: "return_greeting_7",
        text: ["👁️      👁️\n    👅   "],
        label: "Bob",
        options: {
          typingSpeedMs: 28,
          baseDismissMs: 1500,
          contentLengthFactorMs: 38,
        },
        repeatRule: "oncePerSession",
      },
      return_greeting_8: {
        id: "return_greeting_8",
        text: ["ich bin da wo ich immer bin 🤙"],
        label: "Bob",
        options: {
          typingSpeedMs: 28,
          baseDismissMs: 1500,
          contentLengthFactorMs: 40,
        },
        repeatRule: "oncePerSession",
      },
      return_shop_affordable: {
        id: "return_shop_affordable",
        text: [
          "Hast du eigentlich schon den shop gesehen? ",
          "Schau mal unten im phone, da wirst du bestimmt was cooles finden um die ganzen taps wieder auszugeben 🤪",
        ],
        label: "Bob",
        options: {
          typingSpeedMs: 28,
          baseDismissMs: 1700,
          contentLengthFactorMs: 42,
          emotion: { state: "happy", durationMs: 3500 },
        },
        repeatRule: "oncePerPersist",
      },
      first_tap_hint: {
        id: "first_tap_hint",
        text: [
          "Übrigenski: Solange du hier auf der Homepage bist, kannst du unten immer ein paar Tap Upgrades kaufen",
          "Der Auto-Tapper kostet zum Beispiel nur 15 taps! da muss man doch zuschlagen 🤪",
        ],
        label: "Bob",
        options: {
          typingSpeedMs: 30,
          baseDismissMs: 1800,
          contentLengthFactorMs: 50,
          emotion: { state: "thinking", durationMs: 4000 },
        },
        repeatRule: "oncePerPersist",
      },
    },
    en: {
      welcome_home: {
        id: "welcome_home_v3",
        text: [
          "Hey hey, I'm Bob 😗✌️",
          "Welcome to Eddie's personal website!",
          "Things are a bit different here than what you're probably used to, but I'll do my best to keep you informed 🤞",
          "For starters, tap me a bit 🫵 it's fun, trust me!",
        ],
        label: "Bob",
        options: {
          typingSpeedMs: 30,
          baseDismissMs: 1800,
          contentLengthFactorMs: 40,
          emotion: { state: "happy", durationMs: 5000 },
        },
        repeatRule: "oncePerPersist",
      },
      return_greeting_1: {
        id: "return_greeting_1",
        text: ["Heeey you", "Back for more taps? 🫶"],
        label: "Bob",
        options: {
          typingSpeedMs: 28,
          baseDismissMs: 1600,
          contentLengthFactorMs: 40,
          emotion: { state: "happy", durationMs: 3000 },
        },
        repeatRule: "oncePerSession",
      },
      return_greeting_2: {
        id: "return_greeting_2",
        text: ["Nice to see you back :)"],
        label: "Bob",
        options: {
          typingSpeedMs: 28,
          baseDismissMs: 1600,
          contentLengthFactorMs: 40,
          emotion: { state: "happy", durationMs: 4000 },
        },
        repeatRule: "oncePerSession",
      },
      return_greeting_3: {
        id: "return_greeting_3",
        text: ["What's up?"],
        label: "Bob",
        options: {
          typingSpeedMs: 28,
          baseDismissMs: 1600,
          contentLengthFactorMs: 40,
        },
        repeatRule: "oncePerSession",
      },
      return_greeting_4: {
        id: "return_greeting_4",
        text: ["I'm Bob and I'm in too"],
        label: "Bob",
        options: {
          typingSpeedMs: 28,
          baseDismissMs: 1600,
          contentLengthFactorMs: 40,
          emotion: { state: "thinking", durationMs: 4000 },
        },
        repeatRule: "oncePerSession",
      },
      return_greeting_5: {
        id: "return_greeting_5",
        text: ["leeeet's keep going with taps 🤑"],
        label: "Bob",
        options: {
          typingSpeedMs: 28,
          baseDismissMs: 1500,
          contentLengthFactorMs: 38,
        },
        repeatRule: "oncePerSession",
      },
      return_greeting_6: {
        id: "return_greeting_6",
        text: ["heeey", "hoooo", "lets gooooooo 🫵"],
        label: "Bob",
        options: {
          typingSpeedMs: 28,
          baseDismissMs: 1500,
          contentLengthFactorMs: 40,
        },
        repeatRule: "oncePerSession",
      },
      return_greeting_7: {
        id: "return_greeting_7",
        text: ["👁️      👁️\n    👅   "],
        label: "Bob",
        options: {
          typingSpeedMs: 28,
          baseDismissMs: 1500,
          contentLengthFactorMs: 38,
        },
        repeatRule: "oncePerSession",
      },
      return_greeting_8: {
        id: "return_greeting_8",
        text: ["I'm where I've always been 🤙"],
        label: "Bob",
        options: {
          typingSpeedMs: 28,
          baseDismissMs: 1500,
          contentLengthFactorMs: 40,
        },
        repeatRule: "oncePerSession",
      },
      return_shop_affordable: {
        id: "return_shop_affordable",
        text: [
          "Have you already checked out the shop?",
          "Take a look in the phone below, you'll probably find something cool to spend all those taps on 🤪",
        ],
        label: "Bob",
        options: {
          typingSpeedMs: 28,
          baseDismissMs: 1700,
          contentLengthFactorMs: 42,
          emotion: { state: "happy", durationMs: 3500 },
        },
        repeatRule: "oncePerPersist",
      },
      first_tap_hint: {
        id: "first_tap_hint",
        text: [
          "By the way: as long as you're on the homepage, you can always buy a few tap upgrades down below",
          "The auto tapper costs only 15 taps, for example. hard to pass that up 🤪",
        ],
        label: "Bob",
        options: {
          typingSpeedMs: 30,
          baseDismissMs: 1800,
          contentLengthFactorMs: 50,
          emotion: { state: "thinking", durationMs: 4000 },
        },
        repeatRule: "oncePerPersist",
      },
    },
  },
);
