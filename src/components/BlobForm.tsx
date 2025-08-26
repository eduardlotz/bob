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
          <mesh castShadow>
            <sphereGeometry
              args={[
                parameters.sphereRadius || 1,
                parameters.sphereWidthSegments || 64,
                parameters.sphereHeightSegments || 64,
              ]}
            />
            <meshToonMaterial color={blobColor} />
            <Outlines thickness={0.005} color={outlineColor} screenspace />
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
            castShadow
          >
            <meshToonMaterial color={blobColor} />
            <Outlines thickness={0.005} color={outlineColor} screenspace />
          </RoundedBox>
        );

      case "pill":
        return (
          <mesh castShadow>
            <cylinderGeometry
              args={[
                parameters.pillRadiusTop || 0.8,
                parameters.pillRadiusBottom || 0.8,
                parameters.pillHeight || 1.6,
                parameters.pillRadialSegments || 32,
              ]}
            />
            <meshToonMaterial color={blobColor} />
            <Outlines thickness={0.005} color={outlineColor} screenspace />
          </mesh>
        );

      default:
        // fallback to sphere
        return (
          <mesh castShadow>
            <sphereGeometry args={[1, 64, 64]} />
            <meshToonMaterial color={blobColor} />
            <Outlines thickness={0.005} color={outlineColor} screenspace />
          </mesh>
        );
    }
  }
);
