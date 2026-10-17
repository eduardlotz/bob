import type { WorldAudioConfig } from "@/types/worldEnvironment";
import { EnvironmentAudio } from "./EnvironmentAudio";

export function WorldAudio({ config, authorized }: { config?: WorldAudioConfig; authorized: boolean }) {
  return <EnvironmentAudio config={config} authorized={authorized} />;
}
