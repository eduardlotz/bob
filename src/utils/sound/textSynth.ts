export interface SynthConfig {
  masterVolume: number; // 0–1

  oscillatorType: OscillatorType; // sine | square | sawtooth | triangle

  rootFrequency: number; // Hz — root of the scale
  /**
   * Pentatonic (default): [0, 3, 5, 7, 10]
   * Major:                [0, 2, 4, 5, 7, 9, 11]
   * Minor:                [0, 2, 3, 5, 7, 8, 10]
   */
  scale: readonly number[];
  octaveSpan: number;

  blipGain: number;
  gainVariance: number;
  pitchVarianceCents: number;

  attackTime: number;
  minDurationSec: number;
  maxDurationSec: number;

  filterStartFreq: number; // Hz — cutoff at blip onset
  filterPeakFreq: number; // Hz — cutoff at peak (after attackTime)
  filterEndFreq: number; // Hz — cutoff at blip end
  filterQ: number;

  lfoFrequency: number; // Hz
  lfoDepth: number; // Hz — modulation depth; 0 to disable

  maxNodes: number;
}

export interface VoiceConfig {
  pitchShiftSemitones: number;
  oscillatorType?: OscillatorType;
  volumeScale?: number;
}

export const PRESETS = {
  bob: {
    masterVolume: 0.35,
    oscillatorType: "sine",
    rootFrequency: 340,
    scale: [0, 2, 4, 7, 9] as const,
    octaveSpan: 1,
    blipGain: 0.5,
    gainVariance: 0.8,
    pitchVarianceCents: 80,
    attackTime: 0.01,
    minDurationSec: 0.04,
    maxDurationSec: 0.1,
    filterStartFreq: 300,
    filterPeakFreq: 600,
    filterEndFreq: 500,
    filterQ: 0.5,
    lfoFrequency: 0.5,
    lfoDepth: 5,
    maxNodes: 16,
  },

  retro: {
    masterVolume: 0.1,
    oscillatorType: "square",
    rootFrequency: 220, // A3
    scale: [0, 2, 4, 7, 9] as const,
    octaveSpan: 2,
    blipGain: 0.04,
    gainVariance: 0,
    pitchVarianceCents: 0,
    attackTime: 0.005,
    minDurationSec: 0.03,
    maxDurationSec: 0.07,
    filterStartFreq: 600,
    filterPeakFreq: 3000,
    filterEndFreq: 800,
    filterQ: 1.2,
    lfoFrequency: 0,
    lfoDepth: 0,
    maxNodes: 16,
  },

  soft: {
    masterVolume: 0.8,
    oscillatorType: "sine",
    rootFrequency: 440,
    scale: [0, 4, 7, 11] as const,
    octaveSpan: 1,
    blipGain: 0.06,
    gainVariance: 0.2,
    pitchVarianceCents: 8,
    attackTime: 0.015,
    minDurationSec: 0.06,
    maxDurationSec: 0.12,
    filterStartFreq: 500,
    filterPeakFreq: 1400,
    filterEndFreq: 700,
    filterQ: 0.5,
    lfoFrequency: 4,
    lfoDepth: 3,
    maxNodes: 8,
  },
} satisfies Record<string, SynthConfig>;

export type PresetName = keyof typeof PRESETS;

export const VOICES: Record<string, VoiceConfig> = {
  default: { pitchShiftSemitones: 0 },
  low: { pitchShiftSemitones: -7 },
  high: { pitchShiftSemitones: 7 },
  chipmunk: { pitchShiftSemitones: 12, volumeScale: 0.8 },
  gruff: {
    pitchShiftSemitones: -5,
    oscillatorType: "triangle",
    volumeScale: 1.2,
  },
};

function charToFrequency(
  char: string,
  config: SynthConfig,
  voice: VoiceConfig,
): number {
  const code = char.charCodeAt(0);
  const totalDegrees = config.scale.length * config.octaveSpan;
  const degree = code % totalDegrees;
  const octave = Math.floor(degree / config.scale.length);
  const semitone = config.scale[degree % config.scale.length];

  // root * 2^(semitone/12) * 2^octave * voiceShift
  const totalSemitones = semitone + octave * 12 + voice.pitchShiftSemitones;
  return config.rootFrequency * Math.pow(2, totalSemitones / 12);
}

export class TextSynth {
  private audioCtx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeNodeCount = 0;

  private config: SynthConfig;
  private voice: VoiceConfig;

  constructor(
    preset: PresetName | SynthConfig = "bob",
    voice: string | VoiceConfig = "default",
  ) {
    this.config =
      typeof preset === "string" ? { ...PRESETS[preset] } : { ...preset };
    this.voice =
      typeof voice === "string"
        ? { ...(VOICES[voice] ?? VOICES.default) }
        : { ...voice };
  }

  async resume(): Promise<void> {
    this.ensureContext();
    if (this.audioCtx?.state === "suspended") {
      await this.audioCtx.resume().catch(() => {});
    }
  }

  dispose(): void {
    this.audioCtx?.close().catch(() => {});
    this.audioCtx = null;
    this.masterGain = null;
    this.activeNodeCount = 0;
  }

  setPreset(preset: PresetName | SynthConfig): void {
    this.config =
      typeof preset === "string" ? { ...PRESETS[preset] } : { ...preset };
    this.applyMasterVolume();
  }

  patch(partial: Partial<SynthConfig>): void {
    Object.assign(this.config, partial);
    if (partial.masterVolume !== undefined) this.applyMasterVolume();
  }

  setVoice(voice: string | VoiceConfig): void {
    this.voice =
      typeof voice === "string"
        ? { ...(VOICES[voice] ?? VOICES.default) }
        : { ...voice };
  }

  setVolume(volume: number): void {
    this.config.masterVolume = Math.max(0, Math.min(1, volume));
    this.applyMasterVolume();
  }

  playChar(char: string, durationMs: number = 60): void {
    this.ensureContext();
    if (!this.audioCtx || !this.masterGain) return;
    if (this.audioCtx.state !== "running") return;
    if (this.activeNodeCount >= this.config.maxNodes) return;

    const ctx = this.audioCtx;
    const cfg = this.config;
    const dur = Math.max(
      cfg.minDurationSec,
      Math.min(cfg.maxDurationSec, durationMs / 1000),
    );
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = this.voice.oscillatorType ?? cfg.oscillatorType;

    const env = ctx.createGain();
    env.gain.value = 0.0001;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.Q.value = cfg.filterQ;

    osc.connect(filter);
    filter.connect(env);
    env.connect(this.masterGain);

    let lfo: OscillatorNode | null = null;
    if (cfg.lfoDepth > 0) {
      lfo = ctx.createOscillator();
      lfo.type = "sine";
      lfo.frequency.value = cfg.lfoFrequency;

      const lfoGain = ctx.createGain();
      lfoGain.gain.value = cfg.lfoDepth;

      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
    }

    // Schedule
    const targetGain =
      cfg.blipGain *
      (this.voice.volumeScale ?? 1) *
      (1 + (Math.random() * 2 - 1) * cfg.gainVariance);

    const baseFreq = charToFrequency(char, cfg, this.voice);
    const centOffset = (Math.random() * 2 - 1) * cfg.pitchVarianceCents;
    const freq = baseFreq * Math.pow(2, centOffset / 1200);

    env.gain.setValueAtTime(0.0001, now);
    env.gain.exponentialRampToValueAtTime(
      Math.max(0.0001, targetGain),
      now + cfg.attackTime,
    );
    env.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    osc.frequency.setValueAtTime(freq, now);

    filter.frequency.setValueAtTime(cfg.filterStartFreq, now);
    filter.frequency.linearRampToValueAtTime(
      cfg.filterPeakFreq,
      now + cfg.attackTime,
    );
    filter.frequency.linearRampToValueAtTime(cfg.filterEndFreq, now + dur);

    const stopAt = now + dur + 0.01;
    osc.start(now);
    lfo?.start(now);
    osc.stop(stopAt);
    lfo?.stop(stopAt);

    this.activeNodeCount++;
    osc.onended = () => {
      this.activeNodeCount = Math.max(0, this.activeNodeCount - 1);
      osc.disconnect();
      filter.disconnect();
      env.disconnect();
      lfo?.disconnect();
    };
  }

  private ensureContext(): void {
    if (this.audioCtx) return;
    try {
      const AudioCtx =
        window.AudioContext ??
        (window as unknown as Record<string, unknown>).webkitAudioContext;
      if (!AudioCtx) return;
      this.audioCtx = new (AudioCtx as typeof AudioContext)();
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.value = this.config.masterVolume;
      this.masterGain.connect(this.audioCtx.destination);
    } catch {}
  }

  private applyMasterVolume(): void {
    if (!this.audioCtx || !this.masterGain) return;
    const t = this.audioCtx.currentTime;
    this.masterGain.gain.cancelScheduledValues(t);
    this.masterGain.gain.setValueAtTime(this.config.masterVolume, t);
  }
}

export const textSynth = new TextSynth("bob");
export const uiSynthSound = new TextSynth("soft");
