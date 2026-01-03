// Lightweight oscillator-based text sound synth using WebAudio
// Sine wave with subtle LFO and rising low-pass cutoff per blip

class TextSynth {
  private audioCtx: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  initialize() {
    if (this.audioCtx) return;
    try {
      this.audioCtx = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.value = 0.15; // gentle default
      this.masterGain.connect(this.audioCtx.destination);
    } catch (e) {
      // ignore
    }
  }

  setVolume(volume: number) {
    this.initialize();
    if (!this.audioCtx || !this.masterGain) return;
    const v = Math.max(0, Math.min(1, volume));
    try {
      // set immediate without scheduling drift
      this.masterGain.gain.cancelScheduledValues(this.audioCtx.currentTime);
      this.masterGain.gain.setValueAtTime(v, this.audioCtx.currentTime);
    } catch {}
  }

  async resume() {
    this.initialize();
    if (!this.audioCtx) return;
    try {
      if (this.audioCtx.state === "suspended") await this.audioCtx.resume();
    } catch {}
  }

  // Short blip with sine + LFO on frequency, plus LPF cutoff ramp
  // durationMs allows syncing to typing speed; optional gainScale tweaks loudness per blip
  playCharBlip(durationMs: number = 60, gainScale: number = 10) {
    this.initialize();
    if (!this.audioCtx || !this.masterGain) return;
    const ctx = this.audioCtx;

    const osc = ctx.createOscillator();
    osc.type = "sine";
    const gain = ctx.createGain();
    gain.gain.value = 0.0001; // will ramp in briefly

    // Low-pass filter for character timbre; cutoff rises quickly then falls
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 600; // start lower
    filter.Q.value = 0.7;

    // LFO: subtle vibrato
    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 6; // 6 Hz vibrato
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 8; // depth in Hz

    // Connect graph: lfo -> lfoGain -> osc.frequency
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency as any);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    const now = ctx.currentTime;
    const dur = Math.max(0.02, Math.min(0.12, durationMs / 1000));
    try {
      // Fade in/out quickly
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(gainScale, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

      // Base freq randomized slightly
      const baseFreq = 360 + Math.random() * 90;
      osc.frequency.setValueAtTime(baseFreq, now);

      // Filter cutoff rises then decays
      filter.frequency.setValueAtTime(600, now);
      filter.frequency.linearRampToValueAtTime(1800, now + 0.02);
      filter.frequency.linearRampToValueAtTime(800, now + dur);

      osc.start(now);
      lfo.start(now);
      osc.stop(now + dur);
      lfo.stop(now + dur);
    } catch {}
  }
}

export const textSynth = new TextSynth();
