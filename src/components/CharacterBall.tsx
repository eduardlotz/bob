import { forwardRef, useMemo } from "react";
import { RigidBody, BallCollider } from "@react-three/rapier";
import { BlobForm } from "./BlobForm"; // Adjust path
import { useCoreStore } from "@/store";
import React from "react";
import { SphereGeometry } from "three";
import { Grabbable } from "@/physics/Grabbable";

interface Props {
  position: [number, number, number];
  scale: [number, number, number] | number;
  ccd?: boolean;
  angularDamping?: number;
  restitution?: number;
  enabledTranslations?: [boolean, boolean, boolean];
}

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

  const rigidSettings = {
    ccd: props?.ccd ?? true,
    angularDamping: props?.angularDamping ?? 0.5,
    restitution: props?.restitution ?? 1.1,
    enabledTranslations: props?.enabledTranslations ?? [true, true, false],
  };

  return (
    <Grabbable rigidBodyRef={ref} mode={"spring"} stiffness={50} damping={1}>
      <RigidBody
        ref={ref}
        colliders={false}
        ccd={rigidSettings.ccd}
        angularDamping={rigidSettings.angularDamping}
        restitution={rigidSettings.restitution}
        enabledTranslations={rigidSettings.enabledTranslations}
        position={props.position}
      >
        <BallCollider args={[1]} scale={props.scale} />

        <group scale={props.scale}>
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
    </Grabbable>
  );
});
