import { useMemo } from "react";
import { RigidBody, BallCollider, RapierRigidBody } from "@react-three/rapier";
import { BlobForm } from "./BlobForm"; // Adjust path
import { useCoreStore } from "@/store";
import React from "react";
import { SphereGeometry } from "three";

// TODO: add emotions like blink and dizzy on hit
export const CharacterBall = React.forwardRef<RapierRigidBody>((props, ref) => {
  const { currentTheme } = useCoreStore();

  const blobColor = currentTheme?.blobColor;
  const eyeColor = currentTheme?.eyeColor;
  const outlineColor = currentTheme?.outlineColor;

  const eyeGeoms = useMemo(() => {
    const sphere = new SphereGeometry(0.12, 16, 16);
    return sphere.clone();
  }, []);

  return (
    <RigidBody
      ref={ref}
      colliders={false}
      ccd
      angularDamping={0.5}
      restitution={1.1}
      enabledTranslations={[true, true, false]} // The "2D" Game Constraint
      position={[0, 5, 0]}
    >
      <BallCollider args={[0.3]} />

      <group scale={0.3}>
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
