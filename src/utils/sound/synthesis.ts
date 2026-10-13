import { ensureReady, getMasterBus } from "@web-kits/audio";
import type { SoundSystemState } from "./types";
import {
  DEFAULT_MASTER_VOLUME,
  DEFAULT_UI_VOLUME,
  DEFAULT_TEXT_VOLUME,
} from "./defaults";

let uiBus: GainNode | null = null;
let textBus: GainNode | null = null;
let mix = {
  enabled: true,
  masterVolume: DEFAULT_MASTER_VOLUME,
  uiVolume: DEFAULT_UI_VOLUME,
  textVolume: DEFAULT_TEXT_VOLUME,
};

const applyMix = () => {
  const master = mix.enabled ? mix.masterVolume : 0;
  if (uiBus) uiBus.gain.value = master * mix.uiVolume;
  if (textBus) textBus.gain.value = master * mix.textVolume;
};

/** Store preferences without creating or resuming a context before a gesture. */
export const syncSynthesisVolumes = (state: SoundSystemState): void => {
  mix = {
    enabled: state.enabled,
    masterVolume: state.masterVolume,
    uiVolume: state.uiVolume,
    textVolume: state.textVolume,
  };
  applyMix();
};

export const getExistingSynthesisContext = (): AudioContext | null =>
  uiBus ? (uiBus.context as AudioContext) : null;

export const getSynthesisContext = (): AudioContext => {
  const bus = getMasterBus();
  if (bus !== uiBus) {
    textBus?.disconnect();
    uiBus = bus;
    const ctx = bus.context as AudioContext;
    // Speech shares the context, with an independent text-volume channel.
    textBus = ctx.createGain();
    textBus.connect(ctx.destination);
    applyMix();
  }
  return bus.context as AudioContext;
};

export const getSynthesisTextOutput = (): GainNode => {
  getSynthesisContext();
  return textBus!;
};

export const resumeSynthesisContext = async (): Promise<void> => {
  // Start resume synchronously inside the user's gesture, before file loading.
  const ready = ensureReady({ latencyHint: "interactive" });
  getSynthesisContext();
  const ctx = await ready;
  if (ctx.state !== "running" && ctx.state !== "closed") await ctx.resume();
};
