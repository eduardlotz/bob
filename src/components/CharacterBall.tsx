import { forwardRef, useMemo } from "react";
import { RigidBody, BallCollider } from "@react-three/rapier";
import { BlobForm } from "./BlobForm"; // Adjust path
import { useCoreStore } from "@/store";
import React from "react";
import { SphereGeometry } from "three";

type Props = Omit<
  React.ComponentProps<typeof RigidBody>,
  "children" | "ref" | "colliders" | "position"
> & {
  position: [number, number, number];
  scale: [number, number, number] | number;
  /** Base collider radius before scale is applied. Defaults to `1`. */
  colliderRadius?: number;
};

// TODO: add emotions like blink and dizzy on hit
export const CharacterBall = forwardRef((props: Props, ref: any) => {
  const { currentTheme } = useCoreStore();

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
    colliderRadius = 1,
    ccd = true,
    angularDamping = 0.5,
    restitution = 1.1,
    enabledTranslations = [true, true, false],
    ...rigidBodyProps
  } = props;

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
      <BallCollider args={[colliderRadius]} scale={scale} />

      <group scale={scale}>
        <BlobForm
          formType="sphere"
          parameters={{
            sphereRadius: 1,
            sphereWidthSegments: 32,
            sphereHeightSegments: 32,
          }}
          blobColor={blobColor || "#ffffff"}
          outlineColor={outlineColor || "#000000"}
        />

        <group position={[0, 0.2, 0.85]}>
          <mesh geometry={eyeGeoms} position={[-0.45, 0, 0]}>
            <meshToonMaterial color={eyeColor || "#000000"} />
          </mesh>
          <mesh geometry={eyeGeoms} position={[0.45, 0, 0]}>
            <meshToonMaterial color={eyeColor || "#000000"} />
          </mesh>
        </group>
      </group>
    </RigidBody>
  );
});
