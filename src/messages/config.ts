import { Vector3Tuple } from "three";

export type MessageRepeatRule = "always" | "oncePerSession" | "oncePerPersist";

export type MessageText = string | string[];

export interface MessageOptions {
  typingSpeedMs?: number; // ms per character
  baseDismissMs?: number; // base time before auto-dismiss starts counting content length
  contentLengthFactorMs?: number; // per-character factor
  tailEnabled?: boolean;
  minimumDisplayMs?: number; // minimum time to display message
  priority?: number; // priority level for showing messages
}

export interface MessageConfig {
  id: string;
  text: MessageText;
  label?: string;
  options?: MessageOptions;
  repeatRule: MessageRepeatRule;
  dismissTimeout?: number; // explicit override
  persistKey?: string; // for storing user choices/preferences
  audioEnabled?: boolean;
  positionOffset?: Vector3Tuple; // [x,y,z]
  nextDelayMs?: number; // delay after this config finishes typing before the next config shows
  lines?: string[]; // lines to display
}

// Sample initial messages. Extend as needed.
export const MESSAGE_CONFIG: MessageConfig[] = [
  {
    id: "welcome_home",
    text: [
      "Huuuhuuuu",
      "Ich bin Bob 😊 Eddies erstes 3d-Projekt im Internet.",
      "Ist alles noch in Arbeit, aber so langsam wächst es schon",
      "Zum Start kannst du mich ja mal antippen 🫵 macht spaß!",
    ],
    label: "Bob",
    options: {
      typingSpeedMs: 30,
      baseDismissMs: 1800,
      contentLengthFactorMs: 40,
      tailEnabled: false,
    },
    repeatRule: "oncePerPersist",
    audioEnabled: true,
    positionOffset: [0, 0, 0],
    nextDelayMs: 3200,
  },
  {
    id: "return_greeting_1",
    text: ["Du auch hier?? 👁️👄👁️"],
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
    id: "return_greeting_2",
    text: ["Zurück für mehr taps? 🫶"],
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
    id: "return_greeting_3",
    text: ["lets gooooooo 🫵"],
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
    text: ["Moin Meister"],
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
    },
    repeatRule: "oncePerPersist",
    audioEnabled: true,
    positionOffset: [0, 0, 0],
    nextDelayMs: 1800,
  },
  {
    id: "home_features",
    text: [
      "Die anderen Seiten sind gerade noch in Arbeit, aber der Shop hat schon was zu bieten! 🤑",
      "Schau doch mal rein und schalt ein paar Effekte frei",
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
      "Hier gibts leider nicht viel spannendes zu sehen",
      "Die Möbel hier um mich herum sind nur Platzhalter",
      "Sorry 🥀😔",
      "Aber bald kommen dann ein paar Infos über die Person hinter der Website",
      "Und generell so der Sinn der Website",
      "gucken wir mal, was wird",
    ],
    label: "Eddie",
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
];

export const getMessageById = (id: string): MessageConfig | undefined =>
  MESSAGE_CONFIG.find((m) => m.id === id);
