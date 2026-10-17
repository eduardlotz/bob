/** Retarget from the currently audible value, never the previous fade's destination. */
export function rampAudioGain(gain: AudioParam, now: number, target: number, durationMs: number) {
  const current = gain.value;
  if (typeof gain.cancelAndHoldAtTime === "function") gain.cancelAndHoldAtTime(now);
  else {
    gain.cancelScheduledValues(now);
    gain.setValueAtTime(current, now);
  }
  if (durationMs > 0) gain.linearRampToValueAtTime(target, now + durationMs / 1000);
  else gain.setValueAtTime(target, now);
}
