import type { FavoriteEntry, FunFact, SocialLink, TimelineEntry } from "./types";

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
    id: "favorite-warum-edit",
    title: "warum (edit)",
    subtitle: "SoundCloud edit / 2026",
    image: "/images/portfolio/warum_v2.jpeg",
    href: "https://soundcloud.com/captainlowie/warum-edit",
    color: "#f26d3d",
  },
  {
    id: "favorite-hassliebe",
    title: "hassliebe",
    subtitle: "Track + cover direction",
    image: "/images/portfolio/hassliebe_cover.jpeg",
    href: "https://soundcloud.com/captainlowie/hassliebe",
    color: "#db5c7a",
  },
  {
    id: "favorite-soundchecks",
    title: "Soundchecks",
    subtitle: "Mixes for late nights",
    image: "/images/portfolio/soundcheck-cover.jpeg",
    href: "https://soundcloud.com/captainlowie/sets/soundchecks",
    color: "#5d8df5",
  },
  {
    id: "favorite-du-fehlst",
    title: "du fehlst",
    subtitle: "Single artwork + sound",
    image: "/images/portfolio/du-fehlst-cover.jpeg",
    href: "https://soundcloud.com/captainlowie/du-fehlst",
    color: "#f29f48",
  },
];

export const FUN_FACT_REVEAL_COST = 10;

export const FUN_FACTS: FunFact[] = [
  {
    id: "FF-01",
    name: "Design x Code",
    text: "I like it most when a design idea survives the jump into code without losing its weird little spark.",
    accentColor: "#87a4ff",
  },
  {
    id: "FF-02",
    name: "Tiny Worlds",
    text: "A lot of my favorite interfaces feel less like pages and more like tiny places you can hang out in for a minute.",
    accentColor: "#7bd2b0",
  },
  {
    id: "FF-03",
    name: "Music Brain",
    text: "When something in the UI feels off, I usually notice it like a rhythm problem before I can explain it with words.",
    accentColor: "#f6a661",
  },
  {
    id: "FF-04",
    name: "Builder Mode",
    text: "I almost always prototype motion early, because movement tells me faster than a mockup whether the idea actually has life.",
    accentColor: "#ee7ca3",
  },
  {
    id: "FF-05",
    name: "3D Detour",
    text: "Three-dimensional scenes became my favorite excuse to make portfolios feel playful again instead of perfectly polite.",
    accentColor: "#8ec6ff",
  },
  {
    id: "FF-06",
    name: "Favorite Constraint",
    text: "A clear constraint usually makes me more creative, not less. It turns the whole thing into a puzzle worth solving.",
    accentColor: "#9fd17c",
  },
];
