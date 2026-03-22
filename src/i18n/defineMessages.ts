import type { Locale } from "./types";

export type MessageSlice<T> = Record<Locale, T>;

export const defineMessages = <T>(messages: MessageSlice<T>) => messages;
