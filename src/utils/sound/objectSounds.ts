import type { EnvironmentAudioConfig } from "@/types/worldEnvironment";

/** Object defaults live here, not in the world catalogue; each placed object owns its instance. */
export const CAMPFIRE_AUDIO: EnvironmentAudioConfig = {
  layers: [{ soundId: "object-campfire", mode: "loop", volume: .065, condition: "night", fadeSeconds: 2 }],
};
