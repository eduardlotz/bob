import { defineMessages } from "@/i18n/defineMessages";
import type { MessageConfig } from "./config";

export const systemMessageConfigs = defineMessages<Record<string, MessageConfig>>({
  de: {
    dev_message: {
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
    dev_message_2: {
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
    route_locked: {
      id: "route_locked",
      text: ["Das ist noch nicht fertig 😥"],
      label: "Bob",
      repeatRule: "always",
    },
    cannot_afford: {
      id: "cannot_afford",
      text: ["Das kannst du dir nicht leisten :("],
      label: "Bob",
      repeatRule: "always",
    },
    chat_theme_preview: {
      id: "chat_theme_preview",
      text: ["So wird der Chat aussehen", " 👁️👅👁️"],
      label: "Vorschau",
      repeatRule: "always",
      options: {
        emotion: { state: "happy", durationMs: 4000 },
      },
    },
  },
  en: {
    dev_message: {
      id: "dev_message",
      text: [
        "hey you 🫵🤓",
        "YEAH YOU",
        "the messages are supposed to feel like a mix of Animal Crossing and iMessage",
        "basically a chat between friends",
        "except you can't reply hehe",
        "but maybe that comes later one day, with preset answers or something",
        "we'll see",
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
    dev_message_2: {
      id: "dev_message_2",
      text: [
        "and now here's another really long message to test the lovely text sound hmmmmmmmmmmmm cool wow",
        "toodle-oo",
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
    route_locked: {
      id: "route_locked",
      text: ["This isn't finished yet 😥"],
      label: "Bob",
      repeatRule: "always",
    },
    cannot_afford: {
      id: "cannot_afford",
      text: ["You can't afford that :("],
      label: "Bob",
      repeatRule: "always",
    },
    chat_theme_preview: {
      id: "chat_theme_preview",
      text: ["This is how the chat will look", " 👁️👅👁️"],
      label: "Preview",
      repeatRule: "always",
      options: {
        emotion: { state: "happy", durationMs: 4000 },
      },
    },
  },
});
