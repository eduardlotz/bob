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
  y: number;
  z: number;
  pedestalHeight?: number;
  showPedestal?: boolean;
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
