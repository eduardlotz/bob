import type {
  FavoriteEntry,
  FavoriteFallbackGradient,
  SocialLink,
  TimelineEntry,
} from "./types";

export const SOCIAL_LINKS: SocialLink[] = [
  {
    id: "github",
    label: "GitHub",
    href: "https://github.com/yourusername",
    handle: "github.com/yourusername",
    color: "#171717",
    sticker: "GH",
    textColor: "#171717",
  },
  {
    id: "x",
    label: "Twitter (X)",
    href: "https://x.com/yourhandle",
    handle: "x.com/yourhandle",
    color: "#2fb2ee",
    sticker: "X",
    textColor: "#ffffff",
  },
  {
    id: "instagram",
    label: "Instagram",
    href: "https://instagram.com/yourhandle",
    handle: "instagram.com/yourhandle",
    color: "#1f1f1f",
    sticker: "IG",
    textColor: "#ffffff",
  },
  {
    id: "soundcloud",
    label: "Soundcloud",
    href: "https://soundcloud.com/captainlowie",
    handle: "soundcloud.com/captainlowie",
    color: "#ff8d22",
    sticker: "SC",
    textColor: "#ffffff",
  },
  {
    id: "cosmos",
    label: "Cosmos",
    href: "https://cosmos.so/yourhandle",
    handle: "cosmos.so/yourhandle",
    color: "#1f1f1f",
    sticker: "CO",
    textColor: "#ffffff",
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    href: "https://linkedin.com/in/yourprofile",
    handle: "linkedin.com/in/yourprofile",
    color: "#315eb6",
    sticker: "in",
    textColor: "#ffffff",
  },
];

export const TIMELINE_ENTRIES: TimelineEntry[] = [
  {
    id: "timeline-06-2021-pemedia",
    date: "06/2021 - heute",
    emoji: "💼",
    title: "Frontend Developer bei pemedia",
    description:
      "Landingpages, Web Apps, Dashboards, Tests und Workshops mit TypeScript, React, Next.js, GSAP und motion.",
  },
  {
    id: "timeline-09-2024-hsd",
    date: "09/2024 - 05/2025",
    emoji: "🎓",
    title: "Kommunikationsdesign an der Hochschule Duesseldorf",
    description: "Zwei Semester Studium als spaeterer Richtungswechsel zur Praxis.",
  },
  {
    id: "timeline-03-2025-portfolio-start",
    date: "03/2025",
    emoji: "💻",
    title: "3D Portfolio v0 angefangen",
    description: "Eigene Website mit v0.dev und spaeterem Three/R3F-Ausbau gestartet.",
  },
  {
    id: "timeline-05-2025-study-end",
    date: "05/2025",
    emoji: "👋",
    title: "Design Studium nach zwei Semestern beendet",
  },
  {
    id: "timeline-04-2026-portfolio",
    date: "04/2026",
    emoji: "🔥",
    title: "Online Portfolio v1 fertig!",
  },
  {
    id: "timeline-07-2020-whitespace",
    date: "07/2020 - 05/2021",
    emoji: "🖤",
    title: "Freiberuflich als UI Designer bei whitespace_",
    description: "Erste professionelle UI-/Branding-Arbeit in einer kleineren Agenturstruktur.",
  },
  {
    id: "timeline-02-2021-active-value",
    date: "02/2021 - 05/2021",
    emoji: "🟢",
    title: "Frontend Developer bei active value",
    description: "Kurzstation mit Fokus auf Frontend-Umsetzung parallel zu anderen Projekten.",
  },
  {
    id: "timeline-08-2018-ausbildung",
    date: "08/2018 - 01/2021",
    emoji: "🛠️",
    title: "Ausbildung zum Fachinformatiker Anwendungsentwicklung",
    description: "Lumesse / Saba Software mit viel Praxis in Web- und Produktentwicklung.",
  },
  {
    id: "timeline-10-2016-hhu",
    date: "10/2016 - 03/2018",
    emoji: "📚",
    title: "Informatik an der HHU Duesseldorf",
    description: "Drei Semester Studium, bevor der Weg staerker in die Praxis ging.",
  },
  {
    id: "timeline-07-2016-abitur",
    date: "07/2016",
    emoji: "🏫",
    title: "Abitur am Quirinus Gymnasium Neuss",
  },
  {
    id: "timeline-09-2014-html-css-placeholder",
    date: "09/2014",
    emoji: "🌱",
    title: "HTML/CSS fuer mich entdeckt",
    description: "Platzhalter fuer den ungefaehren Startpunkt, an dem Web fuer mich interessant wurde.",
  },
  {
    id: "timeline-05-2019-figma-placeholder",
    date: "05/2019",
    emoji: "✏️",
    title: "Erste ernsthafte UI-/Figma-Workflows",
    description: "Platzhalter fuer den Zeitraum, in dem Design-Tools und Interface-Arbeit relevanter wurden.",
  },
  {
    id: "timeline-01-2020-react-placeholder",
    date: "01/2020",
    emoji: "⚛️",
    title: "React und moderne Frontend-Stacks vertieft",
    description: "Platzhalter fuer die Phase, in der React/TypeScript fester Teil meiner Arbeit wurden.",
  },
];

export const FAVORITES: FavoriteEntry[] = [
  {
    id: "favorite-palm-of-my-hand",
    title: "Palm of My Hand",
    artist: "ZHU",
    album: "Palm of My Hand",
    href: "https://open.spotify.com/track/4SdTlyC3TJfxsNetvoVlum?si=470a235f1c794dc2",
  },
  {
    id: "favorite-dew",
    title: "Dew",
    artist: "Howling",
    album: "Dew",
    href: "https://open.spotify.com/track/42w04qqrG7DpibRE6V2dN7?si=3c38382598294ec8",
  },
  {
    id: "favorite-gnossienne-no-1",
    title: "Gnossienne No. 1",
    artist: "Erik Satie",
    album: "Gnossienne No. 1",
    href: "https://open.spotify.com/track/5fdp9rXfEixCGLM1Og4EN1?si=6bbbf69c6b674668",
  },
  {
    id: "favorite-wohin",
    title: "Wohin",
    artist: "Steintor Herrenchor",
    album: "Wohin",
    href: "https://open.spotify.com/track/2sAp8fbeTgikm6dDVsEeiV?si=1e628657a1d2445a",
  },
];

export const FAVORITE_FALLBACK_GRADIENTS: FavoriteFallbackGradient[] = [
  {
    id: "copper-dusk",
    colors: ["#2d1238", "#ba4d65", "#f8be66"],
  },
  {
    id: "lagoon-glow",
    colors: ["#0f2239", "#1c7cc2", "#8be3ff"],
  },
  {
    id: "moss-haze",
    colors: ["#10231d", "#2f7f62", "#d5ef9a"],
  },
  {
    id: "velvet-signal",
    colors: ["#1f1642", "#6f54ff", "#ff9a6c"],
  },
  {
    id: "rose-frequency",
    colors: ["#311521", "#cb5d88", "#f6d37a"],
  },
];
