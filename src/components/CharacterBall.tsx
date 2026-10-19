import { forwardRef, Suspense, useMemo } from "react";
import { RigidBody, BallCollider } from "@react-three/rapier";
import { BlobForm } from "./BlobForm";
import { BobWearables } from "./BobWearables";
import { getBobEyePosition, getBobFaceScale } from "@/types/blobForms";
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
  const currentTheme = useCoreStore((state) => state.currentTheme);
  const bobItems = useCoreStore((state) => state.bobItems);
  const ditheringEnabled = useCoreStore(
    (state) => state.graphicPreferences.ditheringEnabled,
  );
  const { formType, parameters, sizeFactor } = useActiveBobShape();

  const blobColor = currentTheme?.blobColor;
  const eyeColor = currentTheme?.eyeColor;
  const outlineColor = currentTheme?.outlineColor;

  const eyeGeoms = useMemo(() => {
    const sphere = new SphereGeometry(0.12, 16, 16);
    return sphere.clone();
  }, []);

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

      <group ref={visualRef} scale={scale}>
        <BlobForm
          formType={formType}
          parameters={parameters}
          blobColor={blobColor || "#ffffff"}
          // outlineColor={ditheringEnabled ? outlineColor : undefined}
          outlineColor={outlineColor}
        />

        <group
          position={getBobEyePosition([0, 0.2, 0.85], formType, parameters)}
          scale={getBobFaceScale(formType, parameters)}
        >
          <mesh geometry={eyeGeoms} position={[-0.45, 0, 0]}>
            <meshToonMaterial color={eyeColor || "#000000"} />
          </mesh>
          <mesh geometry={eyeGeoms} position={[0.45, 0, 0]}>
            <meshToonMaterial color={eyeColor || "#000000"} />
          </mesh>
        </group>
        <Suspense fallback={null}>
          <BobWearables
            items={bobItems.filter((item) => item.enabled)}
            blobFormType={formType}
            parameters={parameters}
            outlineColor={outlineColor}
          />
        </Suspense>
      </group>
    </RigidBody>
  );
});
