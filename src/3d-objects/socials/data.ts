// ─── Types ────────────────────────────────────────────────────────────────────

import { ThroneId } from "@/store/socials";

export interface SocialLink {
  label: string;
  url: string;
  emoji: string;
  color: string;
}

export interface TimelineEntry {
  year: string;
  title: string;
  org: string;
  type: "work" | "edu" | "project";
  desc?: string;
}

export interface AppEntry {
  name: string;
  emoji: string;
  color: string;
  category: string;
  url?: string;
}

export interface TrackEntry {
  title: string;
  artist: string;
  emoji: string;
  platform: "spotify" | "soundcloud" | "youtube";
  url: string;
  color: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

export const LINKS_DATA: SocialLink[] = [
  {
    label: "GitHub",
    url: "https://github.com/yourusername",
    emoji: "🐙",
    color: "#333333",
  },
  {
    label: "LinkedIn",
    url: "https://linkedin.com/in/yourprofile",
    emoji: "💼",
    color: "#0A66C2",
  },
  {
    label: "Twitter / X",
    url: "https://x.com/yourhandle",
    emoji: "✖",
    color: "#000000",
  },
  {
    label: "Instagram",
    url: "https://instagram.com/yourhandle",
    emoji: "📸",
    color: "#E4405F",
  },
  {
    label: "Behance",
    url: "https://behance.net/yourprofile",
    emoji: "🎨",
    color: "#1769FF",
  },
  {
    label: "Email",
    url: "mailto:you@example.com",
    emoji: "✉️",
    color: "#34D399",
  },
];

export const JOURNEY_DATA: TimelineEntry[] = [
  {
    year: "2024",
    title: "Senior Frontend Engineer",
    org: "Awesome Studio GmbH",
    type: "work",
    desc: "Led UI architecture for 3D web experiences — Three.js, React, real-time WebGL.",
  },
  {
    year: "2022",
    title: "Frontend Developer",
    org: "Creative Agency",
    type: "work",
    desc: "Built interactive campaign sites for global brands. Motion, scroll, creative direction.",
  },
  {
    year: "2021",
    title: "B.Sc. Informatik",
    org: "Universität Düsseldorf",
    type: "edu",
  },
  {
    year: "2020",
    title: "First Freelance Project",
    org: "Independent",
    type: "project",
    desc: "Portfolio for a local photographer — first time getting paid to make things look good.",
  },
  {
    year: "2018",
    title: "Fell down the rabbit hole",
    org: "Somewhere on the internet",
    type: "project",
    desc: "Opened DevTools for the first time. Never really closed them.",
  },
];

export const STACK_DATA: AppEntry[] = [
  { name: "VS Code", emoji: "💙", color: "#007ACC", category: "Editor" },
  { name: "Figma", emoji: "🎨", color: "#F24E1E", category: "Design" },
  { name: "React", emoji: "⚛️", color: "#61DAFB", category: "Dev" },
  { name: "Three.js", emoji: "🔷", color: "#444444", category: "Dev" },
  { name: "TypeScript", emoji: "🔵", color: "#3178C6", category: "Dev" },
  { name: "Framer Motion", emoji: "✨", color: "#0055FF", category: "Dev" },
  { name: "Arc Browser", emoji: "🌈", color: "#F5A623", category: "App" },
  { name: "Obsidian", emoji: "🟣", color: "#7C3AED", category: "App" },
  { name: "Notion", emoji: "⬜", color: "#333333", category: "App" },
  { name: "Raycast", emoji: "🚀", color: "#FF6363", category: "Tool" },
  { name: "Warp", emoji: "⚡", color: "#01A4FF", category: "Tool" },
  { name: "Spotify", emoji: "🎵", color: "#1DB954", category: "App" },
];

export const VIBES_DATA: TrackEntry[] = [
  {
    title: "Ivy",
    artist: "Frank Ocean",
    emoji: "🌿",
    platform: "spotify",
    url: "https://open.spotify.com/track/2ZWlPOoWh0626oTaHrnl2a",
    color: "#1DB954",
  },
  {
    title: "EARFQUAKE",
    artist: "Tyler, the Creator",
    emoji: "🌊",
    platform: "spotify",
    url: "https://open.spotify.com/track/2RdloZgEUJjrDSlDBGmABz",
    color: "#1DB954",
  },
  {
    title: "Nights",
    artist: "Frank Ocean",
    emoji: "🌙",
    platform: "spotify",
    url: "https://open.spotify.com/track/7eqoqGkKwgOaWNNHx90uEZ",
    color: "#1DB954",
  },
  {
    title: "Redbone",
    artist: "Childish Gambino",
    emoji: "🔥",
    platform: "spotify",
    url: "https://open.spotify.com/track/0pqnGHJpmpxLKifKRmU6WP",
    color: "#1DB954",
  },
  {
    title: "Good Days",
    artist: "SZA",
    emoji: "☀️",
    platform: "spotify",
    url: "https://open.spotify.com/track/3YzsuZC6sb2xnE9I8NHkLb",
    color: "#1DB954",
  },
  {
    title: "Do You Like Good Music",
    artist: "Shuggie Otis",
    emoji: "🎸",
    platform: "soundcloud",
    url: "https://soundcloud.com/search?q=Shuggie+Otis",
    color: "#FF5500",
  },
];

// ─── Meta ─────────────────────────────────────────────────────────────────────

export const THRONE_META: Record<
  ThroneId,
  { label: string; emoji: string; description: string; accentColor: string }
> = {
  links: {
    label: "Links",
    emoji: "🔗",
    description: "Find me on the internet",
    accentColor: "#4A9EFF",
  },
  journey: {
    label: "Journey",
    emoji: "🗺️",
    description: "Where I've been",
    accentColor: "#A78BFA",
  },
  stack: {
    label: "Stack",
    emoji: "🛠️",
    description: "Tools I love",
    accentColor: "#34D399",
  },
  vibes: {
    label: "Vibes",
    emoji: "🎵",
    description: "What I'm listening to",
    accentColor: "#FF6B9D",
  },
};
