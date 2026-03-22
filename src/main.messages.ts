import { defineMessages } from "@/i18n/defineMessages";

export const mainMessages = defineMessages({
  de: {
    errorBoundary: {
      title: "Etwas ist schiefgelaufen. Bitte lade die Seite neu.",
      retry: "Erneut versuchen",
    },
  },
  en: {
    errorBoundary: {
      title: "Something went wrong. Please reload the page.",
      retry: "Retry",
    },
  },
});
