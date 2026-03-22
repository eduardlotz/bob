import { EmotionState } from "@/hooks/useBlobEmotions";
import { getLocale } from "@/i18n";
import type { Locale } from "@/i18n/types";
import { Vector3Tuple } from "three";
import { homeMessageConfigs } from "./home.messages";
import { routeMessageConfigs } from "./routes.messages";
import { systemMessageConfigs } from "./system.messages";

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
    state: EmotionState;
    durationMs?: number;
  };
}

export interface MessageConfig {
  id: string;
  text: string[];
  label?: string;
  options?: MessageOptions;
  repeatRule: MessageRepeatRule;
  dismissTimeout?: number;
  persistKey?: string;
  positionOffset?: Vector3Tuple;
  lines?: string[];
}

export interface ArchivedMessage {
  id: string;
  text: string;
  time: Date;
  sender?: string;
  messageId?: string;
  messageLineIndex?: number;
}

export const MESSAGE_CONFIG: Record<Locale, MessageConfig[]> = {
  de: [
    ...Object.values(homeMessageConfigs.de),
    ...Object.values(routeMessageConfigs.de),
    ...Object.values(systemMessageConfigs.de),
  ],
  en: [
    ...Object.values(homeMessageConfigs.en),
    ...Object.values(routeMessageConfigs.en),
    ...Object.values(systemMessageConfigs.en),
  ],
};

export const getMessageCatalog = (
  locale: Locale = getLocale(),
): MessageConfig[] => MESSAGE_CONFIG[locale];

export const getMessageById = (
  id: string,
  locale: Locale = getLocale(),
): MessageConfig | undefined =>
  getMessageCatalog(locale).find((m) => m.id === id);
