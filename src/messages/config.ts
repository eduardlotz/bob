import { Vector3Tuple } from "three";

export type MessageRepeatRule = "always" | "oncePerSession" | "oncePerPersist";

export type MessageText = string | string[];

export interface MessageOptions {
  typingSpeedMs?: number; // ms per character
  baseDismissMs?: number; // base time before auto-dismiss starts counting content length
  contentLengthFactorMs?: number; // per-character factor
  tailEnabled?: boolean;
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
}

// Sample initial messages. Extend as needed.
export const MESSAGE_CONFIG: MessageConfig[] = [
  {
    id: "welcome_home",
    text: [
      "Willkommen in meiner Ecke des Internets.",
      "Das hier ist Bob, mein erstes 3D-Projekt im Web.",
      "Es ist noch in Entwicklung und vielleicht noch etwas buggy.",
      "Über Feedback oder Fehlerberichte würde ich mich sehr freuen, aber das Feature existiert noch nicht 💀",
    ],
    label: "Bob",
    options: {
      typingSpeedMs: 30,
      baseDismissMs: 1600,
      contentLengthFactorMs: 40,
      tailEnabled: false,
    },
    repeatRule: "oncePerPersist",
    audioEnabled: true,
    positionOffset: [0, 0, 0],
    nextDelayMs: 3000,
  },
  {
    id: "home_features",
    text: [
      "Mit jedem Klick auf Bob verdienst du Taps 🫵. Damit kannst du neue Seiten und Upgrades freischalten.",
      "Für nur 15 Taps 🫵 kannst du den Auto-Tapper aktivieren und Bob für dich tappen lassen, solange du dich auf der Seite umschaust. 👀",
      "Viel Spaß beim Tappen!",
    ],
    label: "Bob",
    options: {
      typingSpeedMs: 25,
      baseDismissMs: 1600,
      contentLengthFactorMs: 50,
      tailEnabled: false,
    },
    repeatRule: "oncePerPersist",
    audioEnabled: true,
    positionOffset: [0, 0, 0],
    nextDelayMs: 1500,
  },
];

export const getMessageById = (id: string): MessageConfig | undefined =>
  MESSAGE_CONFIG.find((m) => m.id === id);
