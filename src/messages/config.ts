import { EmotionState } from "@/hooks/useBlobEmotions";
import { Vector3Tuple } from "three";

export type MessageRepeatRule = "always" | "oncePerSession" | "oncePerPersist";

export type MessageText = string | string[];

export interface MessageOptions {
  typingSpeedMs?: number;
  baseDismissMs?: number;
  contentLengthFactorMs?: number;
  tailEnabled?: boolean;
  minimumDisplayMs?: number;
  priority?: number;
  emotion?: {
    state: EmotionState;
    durationMs?: number;
  };
}

export interface MessageConfig {
  id: string;
  text: string[];
  label?: string;
  options?: MessageOptions;
  repeatRule: MessageRepeatRule;
  dismissTimeout?: number;
  persistKey?: string;
  positionOffset?: Vector3Tuple;
  lines?: string[];
}

export interface ArchivedMessage {
  id: string;
  text: string;
  time: Date;
  sender?: string;
}

// TODO: simplify this mess
export const MESSAGE_CONFIG: MessageConfig[] = [
  {
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
  {
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
  {
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
  {
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
  {
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
  {
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
  {
    id: "about_welcome",
    text: [
      "Hier fehlt leider noch einiges",
      "Sorry 🥀😔",
      "im Karton kannst du aber schon ein paar von Eddie's Interessen finden",
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
  {
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

  {
    id: "dev_message",
    text: [
      "hey du 🫵🤓",
      "JA GENAU DU",
      "die nachrichten sollen sich anfühlen wie eine mischung aus animal crossing und iMessage",
      "quasi ein chat zwischen freunden",
      "nur dass du nicht antworten kannst hehe",
      "aber das kommt vielleicht noch irgendwann. in form von vorauswahlen oder so",
      "mal gucken",
    ],
    label: "Bob",
    options: {
      typingSpeedMs: 25,
      baseDismissMs: 2000,
      contentLengthFactorMs: 50,
      tailEnabled: false,
      emotion: { state: "happy", durationMs: 4000 },
    },
    repeatRule: "always",
  },
  {
    id: "dev_message_2",
    text: [
      "und jetzt kommt nochmal eine so richtig lange nachricht die den schönen text sound testet hmmmmmmmmmmmm cool wow",
      "tüdelüüüü",
    ],
    label: "Bob",
    options: {
      typingSpeedMs: 25,
      baseDismissMs: 2000,
      contentLengthFactorMs: 50,
      tailEnabled: false,
    },
    repeatRule: "always",
  },

  {
    id: "route_locked",
    text: ["Das ist noch nicht fertig 😥"],
    label: "Bob",
    repeatRule: "always",
  },
  {
    id: "cannot_afford",
    text: ["Das kannst du dir nicht leisten :("],
    label: "Bob",
    repeatRule: "always",
  },

  {
    id: "chat_theme_preview",
    text: ["So wird der Chat aussehen", " 👁️👅👁️"],
    label: "Vorschau",
    repeatRule: "always",
    options: {
      emotion: { state: "happy", durationMs: 4000 },
    },
  },
  {
    id: "minigames_welcome",
    text: [
      "ja mooooin, bock was zu zocken??",
      "tap dafür einfach den Fußball ⚽️ oder den Tischtennisschläger 🏓 an",
    ],
    label: "Bob",
    repeatRule: "oncePerPersist",
    options: {
      emotion: { state: "happy", durationMs: 4000 },
    },
  },
];

export const getMessageById = (id: string): MessageConfig | undefined =>
  MESSAGE_CONFIG.find((m) => m.id === id);
