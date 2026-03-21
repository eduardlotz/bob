import type { ComponentType } from "react";

export interface ThroneFocusInteraction {
  allowDrag?: boolean;
  dismissOnClick?: boolean;
  dragSensitivity?: number;
  idleSpinSpeed?: number;
  yawLimit?: [number, number] | null;
  pitchLimit?: [number, number] | null;
}

export interface ResolvedThroneFocusInteraction {
  allowDrag: boolean;
  dismissOnClick: boolean;
  dragSensitivity: number;
  idleSpinSpeed: number;
  yawLimit: [number, number] | null;
  pitchLimit: [number, number] | null;
}

export interface ThroneObjectProps {
  color?: string;
  focused: boolean;
  isFloating?: boolean;
  throneId: string;
  interaction: ResolvedThroneFocusInteraction;
}

export interface ThroneMeta {
  label: string;
  description: string;
  accentColor: string;
}

export interface ThroneOverlayConfig {
  subtitle: string;
  Component: ComponentType;
  preferredWidth?: string;
  minHeight?: string;
  maxHeight?: string;
}

export interface SocialThroneConfig {
  id: string;
  x: number;
  z: number;
  pedestalHeight?: number;
  baseColor: string;
  rimColor: string;
  meta: ThroneMeta;
  object: {
    Component: ComponentType<ThroneObjectProps>;
    focusInteraction?: ThroneFocusInteraction;
  };
  overlay: ThroneOverlayConfig;
}

export interface SocialLink {
  id: string;
  label: string;
  href: string;
  handle: string;
  color: string;
  sticker: string;
  textColor?: string;
}

export interface TimelineEntry {
  id: string;
  date: string;
  emoji: string;
  title: string;
  description?: string;
}

export interface FavoriteEntry {
  id: string;
  title: string;
  artist: string;
  album: string;
  href: string;
}

export interface FavoriteFallbackGradient {
  id: string;
  colors: [string, string, string];
}

export interface ResolvedFavoriteEntry extends FavoriteEntry {
  artworkUrl: string | null;
  textureUrl: string;
  fallbackGradient: FavoriteFallbackGradient;
}

export interface FunFact {
  id: string;
  name: string;
  text: string;
  accentColor: string;
}
