import { defineMessages } from "@/i18n/defineMessages";

export const optionsMessages = defineMessages({
  de: {
    sections: {
      bobShape: "Bobs Form",
      effects: "Effekte",
      audio: "Audio",
    },
    bobShape: {
      reset: "Form zurücksetzen",
      shapes: {
        sphere: "Ball",
        cube: "Würfel",
      },
      parameters: {
        sphereRadius: "Größe",
        cubeWidth: "Breite",
        cubeHeight: "Höhe",
        cubeDepth: "Tiefe",
        cubeRadius: "Abrundung",
      },
    },
    tabs: {
      audio: "Audio",
      theme: "Theme",
    },
    audio: {
      status: "Audio-Status",
      language: "Sprache",
      tapAnimation: "Tap-Animation",
      tapAnimationDescription:
        "Auto-Taps werden weiterhin gesammelt, auch ohne Animation",
      tapParticles: "Tap-Partikel",
      dithering: "Dithering",
      ditheringDescription: "Retro-Pixellook für die 3D-Welt",
      ditheringPixelSize: "Pixelgröße",
      master: "Master",
      music: "Musik",
      effects: "Tap",
      ui: "UI",
      chat: "Text",
      states: {
        playing: "aktiv",
        muted: "stumm",
        stopped: "gestoppt",
      },
    },
    theme: {
      active: "Aktiv",
      select: "Auswählen",
    },
  },
  en: {
    sections: {
      bobShape: "Bob shape",
      effects: "Effects",
      audio: "Audio",
    },
    bobShape: {
      reset: "Reset shape",
      shapes: {
        sphere: "Ball",
        cube: "Cube",
      },
      parameters: {
        sphereRadius: "Size",
        cubeWidth: "Width",
        cubeHeight: "Height",
        cubeDepth: "Depth",
        cubeRadius: "Roundness",
      },
    },
    tabs: {
      audio: "Audio",
      theme: "Theme",
    },
    audio: {
      status: "Audio status",
      language: "Language",
      tapAnimation: "Tap Animation",
      tapAnimationDescription:
        "Auto-taps are still collected, even without animation",
      tapParticles: "Tap Particles",
      dithering: "Dithering",
      ditheringDescription: "Retro pixel look for the 3D world",
      ditheringPixelSize: "Pixel size",
      master: "Master",
      music: "Music",
      effects: "Tap",
      ui: "UI",
      chat: "Text",
      states: {
        playing: "playing",
        muted: "muted",
        stopped: "stopped",
      },
    },
    theme: {
      active: "Active",
      select: "Select",
    },
  },
});
