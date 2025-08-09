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
}

// Sample initial messages. Extend as needed.
export const MESSAGE_CONFIG: MessageConfig[] = [
  {
    id: "welcome_home",
    text: [
      "Hallöchen Popöchen, willkommen in meiner Ecke des Internets!",
      "Das hier ist Bob, mein erstes 3D Projekt.",
    ],
    label: "Bob",
    options: {
      typingSpeedMs: 50,
      baseDismissMs: 1200,
      contentLengthFactorMs: 40,
      tailEnabled: false,
    },
    repeatRule: "oncePerPersist",
    audioEnabled: true,
    positionOffset: [0, 0, 0],
  },
  {
    id: "home_features",
    text: [
      "Mit jedem Klick auf Bob verdienst du Taps 🫵. Damit kannst du neue Seiten und Upgrades kaufen.",
      "Sobald du genug Taps hast, kannst du auch den Auto-Tapper aktivieren und Bob für dich farmen lassen.",
    ],
    label: "Bob",
    options: {
      typingSpeedMs: 50,
      baseDismissMs: 1200,
      contentLengthFactorMs: 40,
      tailEnabled: false,
    },
    repeatRule: "oncePerPersist",
    audioEnabled: true,
    positionOffset: [0, 0, 0],
  },
];

export const getMessageById = (id: string): MessageConfig | undefined =>
  MESSAGE_CONFIG.find((m) => m.id === id);
