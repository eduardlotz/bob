import { useBobSkin } from "@/hooks/useBobSkin";
import { BobTransitionTarget } from "./BobTransitionTarget";
import type { BobSkin } from "./bob/skins/registry";
import { forwardRef, Suspense, useMemo, useEffect } from "react";
import { RigidBody, BallCollider } from "@react-three/rapier";
import { BlobForm } from "./BlobForm";
import { BobWearables } from "./BobWearables";
import { getBobEyePosition, getBobFaceScale, DEFAULT_FORM_PARAMETERS, type BlobFormType, type BlobFormParameters } from "@/types/blobForms";
import { useActiveBobShape } from "@/hooks/useActiveBobShape";
import { getGameBallPhysics } from "@/utils/gameSizing";
import { useCoreStore } from "@/store";
import React from "react";
import { Group, SphereGeometry } from "three";

type Props = Omit<
  React.ComponentProps<typeof RigidBody>,
  "children" | "ref" | "colliders" | "position"
> & {
  position: [number, number, number];
  scale: [number, number, number] | number;
  /** Base collider radius before scale is applied. Defaults to `1`. */
  colliderRadius?: number;
  visualRef?: React.Ref<Group>;
};

// TODO: add emotions like blink and dizzy on hit
export const CharacterBall = forwardRef((props: Props, ref: any) => {
  const skin = useBobSkin();
  const bobItems = useCoreStore((state) => state.bobItems);
  const { formType, parameters, sizeFactor } = useActiveBobShape();

  const blobColor = skin.body;
  const eyeColor = skin.eyes;

  const {
    position,
    scale,
    visualRef,
    colliderRadius = 1,
    ccd = true,
    angularDamping = 0.5,
    restitution = 1.1,
    enabledTranslations = [true, true, false],
    ...rigidBodyProps
  } = props;

  const baseScale = typeof scale === "number" ? scale : Math.max(...scale);
  const physics = getGameBallPhysics(colliderRadius * baseScale, sizeFactor);

  return (
    <RigidBody
      ref={ref}
      colliders={false}
      {...rigidBodyProps}
      ccd={ccd}
      angularDamping={angularDamping}
      restitution={restitution}
      enabledTranslations={enabledTranslations}
      position={position}
    >
      <BallCollider args={[physics.radius]} mass={physics.mass} />

      <CharacterBallModel ref={visualRef} scale={scale} formType={formType} parameters={parameters} transitionTarget
        blobColor={blobColor} eyeColor={eyeColor} skin={skin}>
        <Suspense fallback={null}>
          <BobWearables
            items={bobItems.filter((item) => item.enabled)}
            blobFormType={formType}
            parameters={parameters}
          />
        </Suspense>
      </CharacterBallModel>
    </RigidBody>
  );
});

/** Shared game model: skins follow Bob everywhere; shape/physics remain opt-in. */
export const CharacterBallModel = forwardRef<Group, {
  scale?: number | [number, number, number]; formType?: BlobFormType; parameters?: BlobFormParameters;
  skin?: BobSkin; blobColor?: string; eyeColor?: string; children?: React.ReactNode; transitionTarget?: boolean;
}>(function CharacterBallModel({ scale = 1, formType = "sphere", parameters = DEFAULT_FORM_PARAMETERS.sphere,
  blobColor, eyeColor, skin: skinOverride, children, transitionTarget = false }, ref) {
  const selectedSkin = useBobSkin();
  const skin = skinOverride ?? selectedSkin;
  blobColor ??= skin.body;
  eyeColor ??= skin.eyes;
  const eyes = useMemo(() => new SphereGeometry(.12, 16, 16), []);
  useEffect(() => () => eyes.dispose(), [eyes]);
  return <group ref={ref} scale={scale}>
    <BobTransitionTarget enabled={transitionTarget}>
      <BlobForm formType={formType} parameters={parameters} blobColor={blobColor} skin={skin} />
      <group position={getBobEyePosition([0, .2, .85], formType, parameters)} scale={getBobFaceScale(formType, parameters)}>
        <mesh geometry={eyes} position={[-.45, 0, 0]}><meshToonMaterial color={eyeColor} /></mesh>
        <mesh geometry={eyes} position={[.45, 0, 0]}><meshToonMaterial color={eyeColor} /></mesh>
      </group>
    </BobTransitionTarget>
    {children}
  </group>;
});
