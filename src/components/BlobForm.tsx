import type { BobSkin } from "./bob/skins/registry";
import { BobSkinMaterial } from "./bob/skins/BobSkinMaterial";
import { BobSkinFeatures } from "./bob/skins/BobSkinFeatures";
import React, { useMemo, useEffect } from "react";
import { createEggGeometry } from "@/3d-objects/models/eggGeometry";
import { RoundedBox } from "@react-three/drei";
import { BlobFormType, BlobFormParameters, getCubeCornerRadius } from "@/types/blobForms";

interface BlobFormProps {
  formType: BlobFormType;
  parameters: BlobFormParameters;
  blobColor: string;
  skin?: BobSkin;
}

export const BlobForm = React.memo((props: BlobFormProps) => <group>
  <group scale={props.skin?.id === "bush" ? .9 : 1}><BlobBody {...props} /></group>
  {props.skin && <BobSkinFeatures skin={props.skin} form={props.formType} parameters={props.parameters} />}
</group>);

const BlobBody = React.memo(
  ({ formType, parameters, blobColor, skin }: BlobFormProps) => {
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
            {skin ? <BobSkinMaterial skin={skin} form={formType} parameters={parameters} /> : <meshToonMaterial color={blobColor} />}
          </mesh>
        );

      case "egg":
        return <EggForm parameters={parameters} blobColor={blobColor} skin={skin} />;

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
            {skin ? <BobSkinMaterial skin={skin} form={formType} parameters={parameters} /> : <meshToonMaterial color={blobColor} />}

          </RoundedBox>
        );

      default:
        // fallback to sphere
        return (
          <mesh castShadow receiveShadow>
            <sphereGeometry args={[1, 24, 16]} />
            {skin ? <BobSkinMaterial skin={skin} form={formType} parameters={parameters} /> : <meshToonMaterial color={blobColor} />}
          </mesh>
        );
    }
  },
);

function EggForm({ parameters, blobColor, skin }: Omit<BlobFormProps, "formType">) {
  const geometry = useMemo(() => createEggGeometry(parameters), [parameters.eggUpperRadius, parameters.eggLowerRadius]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} castShadow receiveShadow>{skin ? <BobSkinMaterial skin={skin} form="egg" parameters={parameters} /> : <meshToonMaterial color={blobColor} />}</mesh>;
}
