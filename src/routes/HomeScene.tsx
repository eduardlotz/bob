import { SceneDecorations } from "@/3d-objects/Decorations";
import { NightMaterialFill, Fireplace, StreetLightPools, CityCornerLights } from "@/3d-objects/worlds/NightLighting";
import type { WorldEnvironmentConfig } from "@/types/worldEnvironment";

export default function HomeScene({ nightLight, worldId }: Pick<WorldEnvironmentConfig, "nightLight"> & { worldId?: string }) {
  return <>
    {nightLight && <>
      {nightLight !== "street" && <NightMaterialFill key={worldId} kind={nightLight} />}
      {nightLight === "fire" && <Fireplace />}
      {nightLight === "street" && <><StreetLightPools /><CityCornerLights /></>}
    </>}
    <SceneDecorations />
  </>;
}
