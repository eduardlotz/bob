import React from "react";
import { RoundedBox, Outlines } from "@react-three/drei";
import { BlobFormType, BlobFormParameters } from "@/types/blobForms";

interface BlobFormProps {
  formType: BlobFormType;
  parameters: BlobFormParameters;
  blobColor: string;
  outlineColor: string;
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
            <Outlines thickness={0.0125} color={outlineColor} screenspace />
          </mesh>
        );

      case "cube":
        return (
          <RoundedBox
            args={[
              parameters.cubeWidth || 1.75,
              parameters.cubeHeight || 1.75,
              parameters.cubeDepth || 1.65,
            ]}
            radius={parameters.cubeRadius || 0.2}
            smoothness={2}
            castShadow
            receiveShadow
          >
            <meshToonMaterial color={blobColor} />
            <Outlines thickness={0.0125} color={outlineColor} screenspace />
          </RoundedBox>
        );

      default:
        // fallback to sphere
        return (
          <mesh castShadow receiveShadow>
            <sphereGeometry args={[1, 24, 16]} />
            <meshToonMaterial color={blobColor} />
            <Outlines thickness={0.0125} color={outlineColor} screenspace />
          </mesh>
        );
    }
  },
);
