// Run in its own process: bun scripts/check-environment-audio.mjs
import { mock } from "bun:test";
import assert from "node:assert/strict";

let effects = [], frames = [];
const environment = { current: { elapsed: 0, daylight: 1, rain: 0, wind: 0.35 } };
const core = { soundSystem: { enabled: true, masterVolume: 1, worldEnabled: true, worldVolume: 1 }, audioSelections: { worldSoundIds: [] }, isPaused: false };
const registered = [], played = [];
globalThis.document = { hidden: false, addEventListener() {}, removeEventListener() {} };
globalThis.window = { clearTimeout, setTimeout };

mock.module("react", () => ({
  useRef: current => ({ current }),
  useState: initial => [typeof initial === "function" ? initial() : initial, () => {}],
  useEffect: effect => effects.push(effect),
}));
mock.module("@react-three/fiber", () => ({ useFrame: callback => frames.push(callback) }));
mock.module("../src/store", () => ({ useCoreStore: Object.assign(selector => selector(core), { getState: () => core }) }));
mock.module("../src/3d-objects/worlds/WorldEnvironment", () => ({ useWorldEnvironment: () => environment }));
mock.module("../src/utils/sound/worldAudioTransition", () => ({ worldAudioTransition: { remainingMs: () => 0 }, WORLD_AMBIENCE_EXIT_MS: 800 }));
mock.module("../src/utils/soundSystem", () => ({
  addSoundConfig: config => registered.push(config),
  getSoundConfig: () => undefined,
  playSound: id => played.push(id),
  removeSoundConfig() {}, setSoundMix() {}, stopSoundsById() {},
}));

const { EnvironmentAudio } = await import("../src/3d-objects/worlds/EnvironmentAudio.tsx");
const config = { layers: [
  { soundId: "ambience-rain", mode: "loop", volume: 0.35, condition: "rain" },
  { soundId: "ambience-garden", mode: "loop", volume: 0.2 },
] };

EnvironmentAudio({ config, authorized: false });
effects.forEach(effect => effect());
assert.equal(registered.length, 0, "Audio must wait for Start");
effects = []; frames = [];
EnvironmentAudio({ config, authorized: true });
effects.forEach(effect => effect());
const rain = registered.find(clip => clip.filePath.endsWith("/rain.wav"));
const garden = registered.find(clip => clip.filePath.endsWith("/garden.wav"));
assert.deepEqual(played, [garden.id], "Clear weather must not request the 5.7 MB rain clip");
environment.current.rain = 1;
frames.forEach(frame => frame({}, 0.1));
assert.deepEqual(played, [garden.id, rain.id], "Rain must load when it becomes audible");
for (let index = 0; index < 10; index++) frames.forEach(frame => frame({}, 0.1));
assert.equal(played.length, 2, "A running loop must not restart every frame");
console.log("Environment audio checks passed: no playback before Start, silent rain deferred, audible rain starts once.");
