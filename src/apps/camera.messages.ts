import { defineMessages } from "@/i18n/defineMessages";

export const cameraMessages = defineMessages({
  de: {
    capture: "Foto aufnehmen",
    download: "Download",
    delete: "Löschen",
    gallery: {
      empty: "Noch nichts hier..",
      label: "Fotogalerie",
      close: "Galerie schließen",
      closePhoto: "Foto schließen",
      focus: "Foto ansehen",
      photo: "Foto",
      full: "Galerie voll (24 Fotos / 3 MB). Lade Fotos herunter und lösche sie, um Platz zu schaffen.",
      storageError: "Fotos konnten nicht gespeichert werden. Bitte prüfe den verfügbaren Browserspeicher.",
    },
  },
  en: {
    capture: "Take photo",
    download: "Download",
    delete: "Delete",
    gallery: {
      empty: "Nothing here yet..",
      label: "Photo gallery",
      close: "Close gallery",
      closePhoto: "Close photo",
      focus: "View photo",
      photo: "Photo",
      full: "Gallery full (24 photos / 3 MB). Download and delete photos to make space.",
      storageError: "Photos could not be saved. Please check available browser storage.",
    },
  },
});
