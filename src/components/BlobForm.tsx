import React, { useMemo, useEffect } from "react";
import { createEggGeometry } from "@/3d-objects/models/eggGeometry";
import { RoundedBox, Outlines } from "@react-three/drei";
import { BlobFormType, BlobFormParameters, getCubeCornerRadius } from "@/types/blobForms";

interface BlobFormProps {
  formType: BlobFormType;
  parameters: BlobFormParameters;
  blobColor: string;
  outlineColor?: string;
}

export const BlobForm = React.memo(
  ({ formType, parameters, blobColor, outlineColor }: BlobFormProps) => {
    switch (formType) {
      case "sphere":
        return (
          <mesh castShadow receiveShadow>
            <sphereGeometry
              args={[
                parameters.sphereRadius || 1,
                Math.min(parameters.sphereWidthSegments || 24, 24),
                Math.min(parameters.sphereHeightSegments || 16, 16),
              ]}
            />
            <meshToonMaterial color={blobColor} />
            {outlineColor && (
              <Outlines thickness={0.0125} color={outlineColor} screenspace />
            )}
          </mesh>
        );

      case "egg":
        return <EggForm parameters={parameters} blobColor={blobColor} outlineColor={outlineColor} />;

      case "cuboid":
      case "cube":
        return (
          <RoundedBox
            args={[
              parameters.cubeWidth || 1.75,
              parameters.cubeHeight || 1.75,
              parameters.cubeDepth || 1.65,
            ]}
            radius={getCubeCornerRadius(parameters)}
            smoothness={2}
            castShadow
            receiveShadow
          >
            <meshToonMaterial color={blobColor} />
            {outlineColor && (
              <Outlines thickness={0.0125} color={outlineColor} screenspace />
            )}
          </RoundedBox>
        );

      default:
        // fallback to sphere
        return (
          <mesh castShadow receiveShadow>
            <sphereGeometry args={[1, 24, 16]} />
            <meshToonMaterial color={blobColor} />
            {outlineColor && (
              <Outlines thickness={0.0125} color={outlineColor} screenspace />
            )}
          </mesh>
        );
    }
  },
);

function EggForm({ parameters, blobColor, outlineColor }: Omit<BlobFormProps, "formType">) {
  const geometry = useMemo(() => createEggGeometry(parameters), [parameters.eggUpperRadius, parameters.eggLowerRadius]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} castShadow receiveShadow><meshToonMaterial color={blobColor} />{outlineColor && <Outlines thickness={0.0125} color={outlineColor} screenspace />}</mesh>;
}
