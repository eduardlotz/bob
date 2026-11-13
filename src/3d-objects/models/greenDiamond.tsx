import * as THREE from "three";
import { useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { GLTF } from "three-stdlib";
import { useFrame } from "@react-three/fiber";
import { useCursorStore } from "@/store/core/cursor";
import { useAppStore, useViewStore } from "@/store";
import { useCoreStore } from "@/store";
import { previewMaterialProps } from "@/shop-items/utils";
import { useFloatingBar } from "@/layout/FloatingBar";
import { useI18n } from "@/i18n";
import { greenDiamondMessages } from "./greenDiamond.messages";
import { useQuestActions } from "@/hooks/useQuestSystem";

type GLTFResult = GLTF & {
  nodes: {
    Plumbob_Material001_0: THREE.Mesh;
  };
  materials: {
    ["Material.001"]: THREE.MeshBasicMaterial;
  };
};

const PATH = "/gltf/sims-plumbob.glb";

interface Props {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  color?: string;
}

export const GreenDiamond = ({
  color = "#b7e822",
  ...props
}: Props) => {
  const wiggle = useRef<THREE.Group>(null);
  const elapsed = useRef(1);
  useFrame((_, delta) => {
    elapsed.current += delta;
    if (wiggle.current) wiggle.current.rotation.z = elapsed.current < 0.55
      ? Math.sin(elapsed.current * 35) * 0.055 * Math.exp(-elapsed.current * 7) : 0;
  });
  const { nodes } = useGLTF(PATH) as unknown as GLTFResult;
  const previewMode = useCoreStore(state => state.previewMode);

  const { setHoveredObject } = useFloatingBar();
  const { locale } = useI18n();
  const { triggerQuest } = useQuestActions();

  const handlePointerEnter = (e: any) => {
    e.stopPropagation();

    useCursorStore.getState().setHoveringClickable(true);
    setHoveredObject({
      title: greenDiamondMessages[locale].floatingLabel,
    });
  };

  const handlePointerLeave = () => {
    setHoveredObject(null);
    useCursorStore.getState().setHoveringClickable(false);
  };

  return (
    <group {...props} onClick={event => {
      event.stopPropagation();
      if (event.delta > 5 || useAppStore.getState().showOptions || useViewStore.getState().isPhoneView()) return;
      triggerQuest("click_plumbob", 1);
      elapsed.current = 0;
    }}>
      <group ref={wiggle}>
        <group rotation={[-Math.PI / 2, 0, 0]} scale={0.24}>
          <mesh
            geometry={nodes.Plumbob_Material001_0.geometry}
            onPointerEnter={handlePointerEnter}
            onPointerLeave={handlePointerLeave}
          >
            <meshPhongMaterial
              color={color}
              {...(previewMode === "decoration" ? previewMaterialProps : {})}
            />
          </mesh>
        </group>
      </group>
    </group>
  );
};

useGLTF.preload(PATH);
