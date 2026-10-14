import { useEffect, useMemo } from "react";
import type { ThreeElements } from "@react-three/fiber";
import { DataTexture, NearestFilter, RedFormat } from "three";

/** Three crisp light bands shared by the natural-world scenery. */
export function WorldToonMaterial(
  props: Omit<ThreeElements["meshToonMaterial"], "gradientMap">,
) {
  const gradientMap = useMemo(() => {
    const texture = new DataTexture(
      new Uint8Array([48, 144, 255]),
      3,
      1,
      RedFormat,
    );
    texture.minFilter = texture.magFilter = NearestFilter;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;
    return texture;
  }, []);
  useEffect(() => () => gradientMap.dispose(), [gradientMap]);

  return <meshToonMaterial {...props} gradientMap={gradientMap} />;
}
