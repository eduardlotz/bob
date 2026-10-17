import { useCoreStore } from "@/store";
import type { EnvironmentAudioConfig } from "@/types/worldEnvironment";
import { EnvironmentAudio } from "./EnvironmentAudio";

/** Place inside a reusable scene object: mounting, conditions, fades and cleanup follow that object. */
export function ObjectAudio({ config }: { config: EnvironmentAudioConfig }) {
  const authorized = useCoreStore(s => s.isReady);
  return <EnvironmentAudio config={config} authorized={authorized} owner="object" />;
}
