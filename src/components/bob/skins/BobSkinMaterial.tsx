import { useEffect, useLayoutEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useCoreStore } from "@/store/core/store";
import { getBlobFormHalfSize, type BlobFormParameters, type BlobFormType } from "@/types/blobForms";
import type { BobSkin } from "./registry";
import { createBobSkinMaterial } from "./material";

export function BobSkinMaterial({ skin, form, parameters }: { skin: BobSkin; form: BlobFormType; parameters: BlobFormParameters }) {
  const [recipe] = useState(() => createBobSkinMaterial(skin, getBlobFormHalfSize(form, parameters)));
  const [x, y, z] = getBlobFormHalfSize(form, parameters);
  const effectsEnabled = useCoreStore(state => state.graphicPreferences.effectsEnabled && !state.graphicPreferences.reducedTapMotion);
  useLayoutEffect(() => {
    recipe.setSkin(skin);
    recipe.setHalfSize([x, y, z]);
    recipe.setRound(form === "sphere" || form === "egg");
  }, [recipe, skin, form, x, y, z]);
  useFrame(({ clock }) => {
    if (skin.material === "water" || skin.material === "gold") recipe.setTime(clock.elapsedTime, effectsEnabled);
  });
  useEffect(() => () => recipe.material.dispose(), [recipe]);
  return <primitive object={recipe.material} attach="material" />;
}
