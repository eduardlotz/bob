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
  audioEnabled?: boolean;
  positionOffset?: Vector3Tuple;
  nextDelayMs?: number;
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
      "Willkommen auf der persönlichen Website von Eduard Lotz!",
      "ich bin Bob 😗✌️",
      "ich bin quasi dein persönlicher Begleiter hier",
      "zum Start kannst du mich ja erstmal antippen 🫵",
      "danach schauen wir mal weiter",
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
    audioEnabled: true,
    positionOffset: [0, 0, 0],
    nextDelayMs: 3200,
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
    audioEnabled: true,
    positionOffset: [0, 0, 0],
    nextDelayMs: 2200,
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
    audioEnabled: true,
    positionOffset: [0, 0, 0],
    nextDelayMs: 2200,
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
    audioEnabled: true,
    positionOffset: [0, 0, 0],
    nextDelayMs: 2200,
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
    audioEnabled: true,
    positionOffset: [0, 0, 0],
    nextDelayMs: 2200,
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
    audioEnabled: true,
    positionOffset: [0, 0, 0],
    nextDelayMs: 1800,
  },
  {
    id: "about_welcome",
    text: [
      "Hier gibts leider noch nicht viel zu sehen",
      "Sorry 🥀😔",
      "ich fülle aktuell noch den Karton mit Dingen, die mich interessieren",
      "schau doch mal rein und wühl ein bisschen rum 👀",
    ],
    label: "Eddie",
    options: {
      typingSpeedMs: 25,
      baseDismissMs: 2000,
      contentLengthFactorMs: 50,
      tailEnabled: false,
      emotion: { state: "happy", durationMs: 3000 },
    },
    repeatRule: "oncePerPersist",
    audioEnabled: true,
    positionOffset: [0, 0, 0],
    nextDelayMs: 1800,
  },
  {
    id: "portfolio_welcome",
    text: [
      "Willkommen im ersten kreativeren Bereich 🧑‍🎨",
      "Hier darfst du dich sogar frei bewegen",
      "Eddie's Design Portfolio, verstreut in einem eigenen kleinen Universum",
      "Tipp ein Bild, um es dir genauer anzuschauen 🔍",
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
    audioEnabled: true,
    positionOffset: [0, 0, 0],
    nextDelayMs: 1800,
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
    label: "Bob (dev)",
    options: {
      typingSpeedMs: 25,
      baseDismissMs: 2000,
      contentLengthFactorMs: 50,
      tailEnabled: false,
      emotion: { state: "happy", durationMs: 4000 },
    },
    repeatRule: "always",
    audioEnabled: true,
    positionOffset: [0, 0, 0],
    nextDelayMs: 1800,
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
    audioEnabled: true,
    positionOffset: [0, 0, 0],
    nextDelayMs: 1800,
  },
  {
    id: "route_locked",
    text: ["Das ist noch nicht fertig 😥"],
    label: "Bob",
    repeatRule: "always",
    audioEnabled: true,
  },
  {
    id: "cannot_afford",
    text: ["Das kannst du dir nicht leisten :("],
    label: "Bob",
    repeatRule: "always",
    audioEnabled: true,
  },
  {
    id: "upgrade_is_maxxed",
    text: ["Da geht nichts mehr, maxxed out 💯"],
    label: "Bob",
    repeatRule: "always",
    audioEnabled: true,
  },
  {
    id: "chat_theme_preview",
    text: ["So wird der Chat aussehen", " 👁️👅👁️"],
    label: "Vorschau",
    repeatRule: "always",
    audioEnabled: true,
    options: {
      emotion: { state: "happy", durationMs: 4000 },
    },
  },
  {
    id: "minigames_welcome",
    text: [
      "Ja mooooin, bock was zu zocken??",
      "außer dem Fußball und dem dem Tor hinter mir steht hier leider noch nix ☹️",
      "wenn dir das nicht reicht, musst du wohl nochmal wieder kommen",
    ],
    label: "Bob",
    repeatRule: "oncePerPersist",
    audioEnabled: true,
    options: {
      emotion: { state: "happy", durationMs: 4000 },
    },
  },
  {
    id: "minigames_not_ready",
    text: [
      "Wie Sie sehen, sehen Sie nichts",
      "hier ist gibt es leider noch nichts neues",
      "vielleicht ja morgen...",
    ],
    label: "Bob",
    repeatRule: "oncePerSession",
    audioEnabled: true,
    options: {
      emotion: { state: "sad", durationMs: 4000 },
    },
  },
  {
    id: "minigames_home_goal_scored",
    text: ["TOOOOR!! 🎉⚽️"],
    label: "Bob",
    repeatRule: "always",
    audioEnabled: true,
    options: {
      emotion: { state: "happy", durationMs: 4000 },
    },
  },
];

export const getMessageById = (id: string): MessageConfig | undefined =>
  MESSAGE_CONFIG.find((m) => m.id === id);
