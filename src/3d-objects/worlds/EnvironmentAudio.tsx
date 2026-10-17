import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useCoreStore } from "@/store";
import { addSoundConfig, getSoundConfig, playSound, removeSoundConfig, setSoundMix, stopSoundsById } from "@/utils/soundSystem";
import { ENVIRONMENT_AUDIO_SOURCES } from "@/utils/sound/worldSounds";
import { worldSoundGain, type EnvironmentAudioConfig, type EnvironmentSoundLayer } from "@/types/worldEnvironment";
import { useWorldEnvironment } from "./WorldEnvironment";
import { worldAudioTransition, WORLD_AMBIENCE_EXIT_MS } from "@/utils/sound/worldAudioTransition";

type ActiveLayer = { id: string; layer: EnvironmentSoundLayer; nextAt: number };
const randomInterval = (range: [number, number] = [15, 40]) => Math.max(1, range[0] + Math.random() * Math.max(0, range[1] - range[0]));

/** Shared lifecycle for world beds and object-owned loops/excerpts. Each mount owns its voices. */
export function EnvironmentAudio({ config, authorized, owner = "world" }: { config?: EnvironmentAudioConfig; authorized: boolean; owner?: "world" | "object" }) {
  const environment = useWorldEnvironment();
  const [visible, setVisible] = useState(() => !document.hidden);
  useEffect(() => {
    const onVisibility = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);
  const layers = useRef<ActiveLayer[]>([]);
  const enabled = useCoreStore((s) => authorized && s.soundSystem.enabled && s.soundSystem.masterVolume > 0 && s.soundSystem.worldEnabled !== false && s.soundSystem.worldVolume > 0 && !s.isPaused);
  const selectedMusic = useCoreStore((s) => s.audioSelections.worldSoundIds);
  const useFallbackMusic = Boolean(config?.music && !selectedMusic?.length);
  const elapsed = useRef(0);
  const sampleAt = useRef(0);

  useEffect(() => {
    if (!enabled || !visible || !config) return;
    const active: ActiveLayer[] = [];
    let startTimer: number | undefined;
    let cancelled = false;
    const start = () => {
      if (cancelled || document.hidden || useCoreStore.getState().isPaused) return;
      const session = crypto.randomUUID();
      const authored = [...config.layers];
      if (config.music && useFallbackMusic) {
        authored.push({ soundId: config.music.soundId, mode: "loop", volume: config.music.volume ?? 0.2, fadeSeconds: 2.5 });
      }
      authored.forEach((layer, index) => {
        const source = ENVIRONMENT_AUDIO_SOURCES[layer.soundId] ?? getSoundConfig(layer.soundId);
        if (!source) return;
        const id = `${owner}-ambience:${session}:${index}`;
        const fadeSeconds = layer.fadeSeconds ?? 2;
        const sprite = layer.excerpts?.length ? Object.fromEntries(layer.excerpts.map((clip, i) =>
          [`excerpt-${i}`, [clip.startSeconds * 1000, clip.durationSeconds * 1000] as [number, number]],
        )) : source.sprite;
        addSoundConfig({
          id, filePath: source.filePath, src: source.src, sprite, type: "world", category: "ambient",
          // Howls are created lazily on first playback; then they must load the clip.
          volume: layer.volume, loop: layer.mode === "loop", preload: true,
          // A short attack also protects a clip whose download outlasts the world fade-in.
          fadeIn: layer.mode === "loop" ? fadeSeconds * 1000 : 80, fadeOut: WORLD_AMBIENCE_EXIT_MS,
          distanceAttenuation: true,
          playback: { group: id, overlap: "ignore", maxConcurrent: 1, limitBehavior: "skip-new" },
        });
        setSoundMix(id, { gain: worldSoundGain(layer.condition, environment.current) });
        if (layer.mode === "loop") playSound(id);
        active.push({ id, layer, nextAt: elapsed.current + randomInterval(layer.intervalSeconds) });
      });
      layers.current = active;
    };
    const wait = worldAudioTransition.remainingMs();
    if (wait > 0) startTimer = window.setTimeout(start, wait);
    else start();
    return () => {
      cancelled = true;
      window.clearTimeout(startTimer);
      layers.current = [];
      if (active.length) worldAudioTransition.retire(WORLD_AMBIENCE_EXIT_MS + 50);
      active.forEach(({ id }) => {
        stopSoundsById(id, WORLD_AMBIENCE_EXIT_MS);
        // Allow the exit fade to finish before unloading the world-owned Howl.
        window.setTimeout(() => { removeSoundConfig(id); setSoundMix(id); }, WORLD_AMBIENCE_EXIT_MS + 30);
      });
    };
  }, [config, enabled, visible, useFallbackMusic, environment, owner]);

  useFrame((_, delta) => {
    if (!enabled || document.hidden) return;
    elapsed.current += Math.min(delta, 0.1);
    if (elapsed.current < sampleAt.current) return;
    sampleAt.current = elapsed.current + 0.1;
    layers.current.forEach((active) => {
      const target = worldSoundGain(active.layer.condition, environment.current);
      // Weather and day/night use a separate native gain; the voice owns one entry/exit fade.
      setSoundMix(active.id, { gain: target }, 110);
      if (active.layer.mode === "random" && elapsed.current >= active.nextAt) {
        const clips = active.layer.excerpts;
        const index = clips?.length ? Math.floor(Math.random() * clips.length) : -1;
        const clip = clips?.[index];
        if (target > 0.15) playSound(active.id, {
          loop: false, spriteName: clip ? `excerpt-${index}` : undefined,
          fadeIn: clip ? (clip.fadeInSeconds ?? .4) * 1000 : 80,
          fadeOut: clip ? (clip.fadeOutSeconds ?? .7) * 1000 : WORLD_AMBIENCE_EXIT_MS,
          fadeOutAtEnd: Boolean(clip),
        });
        active.nextAt = elapsed.current + randomInterval(active.layer.intervalSeconds);
      }
    });
  });
  return null;
}
