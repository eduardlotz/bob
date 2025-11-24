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
    state: "normal" | "happy" | "dizzy" | "mad" | "thinking" | "suspicious";
    durationMs?: number;
  };
}

export interface MessageConfig {
  id: string;
  text: MessageText;
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

// simplify this mess
export const MESSAGE_CONFIG: MessageConfig[] = [
  {
    id: "welcome_home",
    text: [
      "Hallöchen Popöchen",
      "Ich bin Bob 😊",
      "Ist leider alles noch in Arbeit hier, aber der Kern steht schonmal",
      "Am Ende soll es ein Mix aus persönlicher Website und einem Clicker-Game werden ✨",
      "Tipp mich doch mal 🫵 macht spaß!",
    ],
    label: "Bob",
    options: {
      typingSpeedMs: 30,
      baseDismissMs: 1800,
      contentLengthFactorMs: 40,
      tailEnabled: false,
      emotion: { state: "happy", durationMs: 3000 },
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
    text: ["Na du", "Zurück für mehr taps? 🫶"],
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
    text: ["JAWOOOLL", "lets gooooooo 🫵"],
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
      "Übrigenski: für nur 15 taps 🫵 kannst du den Auto-Tapper aktivieren",
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
    id: "home_features",
    text: [
      "ach und noch was",
      "Der große blaue Knopf unten öffnet das Menü zu den anderen Unterseiten",
      "Aber die musst du erstmal freischalten (mit taps 🫵 natürlich)",
      "Ansonsten kannst du im Shop NATÜRLICH AUCH SKINS kaufen",
      "jedes spiel braucht doch skins oder nicht??",
      "sonst wird das ja langweilig hier 🥱",
    ],
    label: "Bob",
    options: {
      typingSpeedMs: 25,
      baseDismissMs: 2000,
      contentLengthFactorMs: 50,
      tailEnabled: false,
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
      "Aber bald kommen ein paar Infos über mich",
      "Und generell so der Sinn der Website",
      "wird schon noch alles",
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
    id: "dev_message",
    text: [
      "hey du 🫵🤓",
      "JA GENAU DU",
      "die nachrichten sollen sich anfühlen wie eine mischung aus animal crossing und iMessage",
      "quasi ein chat zwischen freunden",
      "nur dass du nicht antworten kannst hehe",
      "aber das kommt vielleicht noch irgendwann. in form von vorauswahlen oder so, mal gucken",
      "tüdelüüüü",
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
];

export const getMessageById = (id: string): MessageConfig | undefined =>
  MESSAGE_CONFIG.find((m) => m.id === id);
