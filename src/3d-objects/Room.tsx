import { forwardRef, useEffect, useRef } from "react";
import { TextureLoader, RepeatWrapping, Mesh } from "three";
import { useLoader, extend, useFrame } from "@react-three/fiber";
import { Decal } from "@react-three/drei";
import { FLOOR_Y_POSITION } from "@/molecules/Scene";
import { GridToonMaterial } from "./GridToonMaterial";
import { WoodToonMaterial } from "./WoodToonMaterial";
import * as THREE from "three";
import { useAppStore, useViewStore } from "@/store";
import { a, useSpring } from "@react-spring/three";

extend({ GridToonMaterial, WoodToonMaterial });

const ROOM_SIZE = 20;

export const Room = forwardRef(
  ({ posterUrls = [] }: { posterUrls?: string[] }, ref) => {
    const { transitionToView } = useViewStore();
    const { showOptions } = useAppStore();
    const [spring, api] = useSpring(() => ({
      position: [0, FLOOR_Y_POSITION + 1.5, 10],
      config: { tension: 120, friction: 14 },
    }));

    const wallRef = useRef<Mesh>(null);

    const handlePosterClick = () => {
      // nothing
    };

    useFrame(() => {
      if (showOptions) {
        api.start({
          position: [0, 0, 10],
        });
      } else {
        api.start({
          position: [0, 0, 5],
        });
      }
    });

    return (
      <group ref={ref}>
        {/* FLOOR */}
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, FLOOR_Y_POSITION - 0.55, 0]}
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
          <planeGeometry args={[ROOM_SIZE, ROOM_SIZE]} />
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

        <a.mesh
          rotation={[0, -Math.PI, 0]}
          position={spring.position.get() as [number, number, number]}
        >
          <planeGeometry args={[ROOM_SIZE, ROOM_SIZE]} />
          <gridToonMaterial
            uGridDensity={12}
            uGridColor1={new THREE.Color("#d8e1e7")}
            uGridColor2={new THREE.Color("#c1cdd4")}
          />
        </a.mesh>

        {/* RIGHT WALL */}
        <mesh
          rotation={[0, -Math.PI / 2, 0]}
          position={[5, FLOOR_Y_POSITION + 1.5, 0]}
        >
          <planeGeometry args={[ROOM_SIZE, ROOM_SIZE]} />
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
          <planeGeometry args={[ROOM_SIZE, ROOM_SIZE]} />
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
