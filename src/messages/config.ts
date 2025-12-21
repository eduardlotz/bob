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

// TODO: simplify this mess
export const MESSAGE_CONFIG: MessageConfig[] = [
  {
    id: "welcome_home",
    text: [
      "Hallöchen 👋",
      "Ich bin Bob 😗✌️",
      "Ich begleite dich hier auf der Website von Eddie!",
      "Viel gibt es zwar noch nicht, aber der Kern steht schon",
      "Tipp mich doch mal an 🫵 macht Spaß!",
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
  // {
  //   id: "home_features",
  //   text: ["ach und noch was", "egal hab grad selber vergessen"],
  //   label: "Bob",
  //   options: {
  //     typingSpeedMs: 25,
  //     baseDismissMs: 2000,
  //     contentLengthFactorMs: 50,
  //     tailEnabled: false,
  //   },
  //   repeatRule: "oncePerPersist",
  //   audioEnabled: true,
  //   positionOffset: [0, 0, 0],
  //   nextDelayMs: 1800,
  // },
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
    text: ["🚧 NOCH IN ARBEIT 🚧"],
    label: "INFO",
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
];

export const getMessageById = (id: string): MessageConfig | undefined =>
  MESSAGE_CONFIG.find((m) => m.id === id);
