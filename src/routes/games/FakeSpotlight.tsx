import { GradientTexture } from "@react-three/drei";
import { DoubleSide, type MeshBasicMaterial } from "three";
import type { Ref } from "react";

/** The selection-screen beam, also used for the slot machine's win lights. */
export function FakeSpotlight({ materialRef, height = 9.5, upwards = false }: {
  materialRef?: Ref<MeshBasicMaterial>; height?: number; upwards?: boolean;
}) {
  return <mesh>
    <cylinderGeometry args={[upwards ? 1.26 : 0.08, upwards ? 0.08 : 1.26, height, 64, 1, true]} />
    <meshBasicMaterial ref={materialRef} transparent opacity={0} depthWrite={false} side={DoubleSide} toneMapped={false}
      customProgramCacheKey={() => upwards ? "spotlight-up" : "spotlight-down"}
      onBeforeCompile={(shader) => {
        if (!upwards) return;
        shader.fragmentShader = shader.fragmentShader.replace("#include <map_fragment>",
          "#include <map_fragment>\n #ifdef USE_MAP\n diffuseColor.a *= 1.0 - smoothstep(0.55, 1.0, vMapUv.y);\n #endif");
      }}>
      <GradientTexture stops={[0, 0.42, 1]} colors={["#ffffff", "#f5df9a", "#ffffff"]} size={256} />
    </meshBasicMaterial>
  </mesh>;
}
