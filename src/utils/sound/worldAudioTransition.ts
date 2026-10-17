/** A retiring world owns the output until its fade and voice cleanup finish. */
export class WorldAudioTransition {
  private readyAt = 0;
  constructor(private readonly now: () => number = () => performance.now()) {}
  retire(durationMs: number) { this.readyAt = Math.max(this.readyAt, this.now() + durationMs); }
  remainingMs() { return Math.max(0, this.readyAt - this.now()); }
}

export const WORLD_AMBIENCE_EXIT_MS = 800;
export const worldAudioTransition = new WorldAudioTransition();
