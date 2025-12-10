import { forwardRef, useRef } from "react";
import {
  TextureLoader,
  RepeatWrapping,
  BackSide,
  Mesh,
  DoubleSide,
} from "three";
import { useLoader, extend } from "@react-three/fiber";
import { Decal, GradientTexture } from "@react-three/drei";
import { FLOOR_Y_POSITION } from "@/molecules/Scene";
import { GridToonMaterial } from "./GridToonMaterial";
import { WoodToonMaterial } from "./WoodToonMaterial";
import * as THREE from "three";
import { InteractiveObject } from "@/molecules/InteractiveObject";
import { useViewStore } from "@/store";

extend({ GridToonMaterial, WoodToonMaterial });

const ROOM_SIZE = 20;

export const Room = forwardRef(
  ({ posterUrls = [] }: { posterUrls?: string[] }, ref) => {
    const floorTexture = useLoader(TextureLoader, "/textures/wood_floor.jpg");
    const { transitionToView } = useViewStore();
    floorTexture.wrapS = floorTexture.wrapT = RepeatWrapping;
    floorTexture.repeat.set(12, 4);

    const wallRef = useRef<Mesh>(null);

    const handlePosterClick = () => {
      transitionToView("portrait");
    };

    return (
      <group ref={ref}>
        {/* FLOOR */}
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, FLOOR_Y_POSITION, 0]}
        >
          <planeGeometry args={[ROOM_SIZE, ROOM_SIZE]} />
          <woodToonMaterial
            uGridDensity={8}
            uGridColor1="#e1a87f"
            uGridColor2="#b37143"
            uGapThickness={0}
          />
        </mesh>

        {/* CEILING */}
        <mesh
          rotation={[Math.PI / 2, 0, 0]}
          position={[0, FLOOR_Y_POSITION + 7, 0]}
        >
          <planeGeometry args={[ROOM_SIZE, ROOM_SIZE]} />
          <gridToonMaterial
            uGridDensity={12}
            uGridColor1={new THREE.Color("#c4cdd3")}
            uGridColor2={new THREE.Color("#a9b6bd")}
          />
        </mesh>

        {/* FRONT WALL */}
        <mesh ref={wallRef} position={[0, FLOOR_Y_POSITION + 1.5, -5]}>
          <planeGeometry args={[ROOM_SIZE, 20]} />
          <gridToonMaterial
            uGridDensity={12}
            uGridColor1={new THREE.Color("#d8e1e7")}
            uGridColor2={new THREE.Color("#c1cdd4")}
          />

          {posterUrls.map((url, i) => (
            <Decal
              key={i}
              mesh={wallRef.current!} // link decal to mesh
              position={[i * 0.8 - 2.5, FLOOR_Y_POSITION + 3.5, 0.01]} // relative to mesh
              rotation={[0, 0, 0]}
              scale={1.5}
              map={useLoader(TextureLoader, url)}
              onClick={() => handlePosterClick(url)}
            />
          ))}
        </mesh>

        <mesh
          rotation={[0, -Math.PI, 0]}
          position={[0, FLOOR_Y_POSITION + 1.5, 5]}
        >
          <planeGeometry args={[ROOM_SIZE, 20]} />
          <gridToonMaterial
            uGridDensity={12}
            uGridColor1={new THREE.Color("#d8e1e7")}
            uGridColor2={new THREE.Color("#c1cdd4")}
          />
        </mesh>

        {/* RIGHT WALL */}
        <mesh
          rotation={[0, -Math.PI / 2, 0]}
          position={[5, FLOOR_Y_POSITION + 1.5, 0]}
        >
          <planeGeometry args={[ROOM_SIZE, 20]} />
          <gridToonMaterial
            uGridDensity={12}
            uGridColor1={new THREE.Color("#d8e1e7")}
            uGridColor2={new THREE.Color("#c1cdd4")}
          />
        </mesh>

        {/* LEFT WALL */}
        <mesh
          rotation={[0, Math.PI / 2, 0]}
          position={[-5, FLOOR_Y_POSITION + 1.5, 0]}
        >
          <planeGeometry args={[ROOM_SIZE, 20]} />
          <gridToonMaterial
            uGridDensity={12}
            uGridColor1={new THREE.Color("#d8e1e7")}
            uGridColor2={new THREE.Color("#c1cdd4")}
          />
        </mesh>
      </group>
    );
  }
);

Room.displayName = "Room";
