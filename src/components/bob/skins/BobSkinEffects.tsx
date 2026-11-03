import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useCoreStore } from "@/store/core/store";
import { getBlobFormHalfSize, type BlobFormParameters, type BlobFormType } from "@/types/blobForms";
import type { BobSkin } from "./registry";
import { createTntFuse, createTntSparkMaterial, createTntSparks, updateTntSparks } from "./effects";

export function BobSkinEffects({ skin, form, parameters }: { skin: BobSkin; form: BlobFormType; parameters: BlobFormParameters }) {
  return skin.material === "tnt" ? <TntFuse form={form} parameters={parameters} /> : null;
}

function TntFuse({ form, parameters }: { form: BlobFormType; parameters: BlobFormParameters }) {
  const [x, y, z] = getBlobFormHalfSize(form, parameters);
  const fuse = useMemo(() => createTntFuse([x, y, z]), [x, y, z]);
  const sparks = useMemo(createTntSparks, []);
  const sparkMaterial = useMemo(() => createTntSparkMaterial(fuse.size), [fuse.size]);
  const motion = useCoreStore(state => state.graphicPreferences.effectsEnabled && !state.graphicPreferences.reducedTapMotion);
  useEffect(() => () => fuse.geometry.dispose(), [fuse]);
  useEffect(() => () => sparks.dispose(), [sparks]);
  useEffect(() => () => sparkMaterial.dispose(), [sparkMaterial]);
  useFrame(({ clock, size, gl }) => {
    if (!motion) return;
    updateTntSparks(sparks, fuse, clock.elapsedTime);
    sparkMaterial.uniforms.sparkPixelScale.value = size.height * gl.getPixelRatio() * 0.5;
  });
  return <group name="bob-tnt-fuse">
    <mesh geometry={fuse.geometry}><meshToonMaterial color="#534039" /></mesh>
    <mesh position={fuse.tip} scale={fuse.size * 0.045}>
      <sphereGeometry args={[1, 8, 6]} /><meshBasicMaterial color="#ffe2a0" toneMapped={false} />
    </mesh>
    <points geometry={sparks} material={sparkMaterial} visible={motion} frustumCulled={false} />
  </group>;
}
