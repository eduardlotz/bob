import { useMemo, useLayoutEffect, useRef } from "react";
import { extend, Object3DNode } from "@react-three/fiber";

import { Mesh, Group } from "three";

// 1. Parse font once outside the component loop
const loader = new FontLoader();
const font = loader.parse(fontJson);

const CHARACTER_SET = "0123456789.,KMB";
const SPACING = 2.2; // Adjust this based on your font size

export const CounterTextLoader = ({ value, themeConfig }) => {
  const groupRef = useRef<Group>(null);

  // 2. CREATE THE LOOKUP MAP (The Cache)
  // This runs ONCE. It creates the geometry for every possible character.
  const geometryCache = useMemo(() => {
    const cache: Record<string, TextGeometry> = {};

    CHARACTER_SET.split("").forEach((char) => {
      const geom = new TextGeometry(char, {
        font: font,
        size: 3,
        height: 1.5,
        curveSegments: 4, // Keep low for perf
        bevelEnabled: true,
        bevelThickness: 0.2,
        bevelSize: 0.03,
        bevelSegments: 1, // Keep low for perf
      });

      // Center the geometry so we can place it easily
      geom.computeBoundingBox();
      geom.center();

      cache[char] = geom;
    });

    return cache;
  }, []);

  // 3. RENDER LOOP
  // We split the string and render existing geometries.
  // No parsing. No generation. Just moving meshes.
  const characters = value.toString().split("");

  // Calculate total width to center the whole group (replacing your manual bounding box logic)
  const totalWidth = characters.length * SPACING;
  const startX = -(totalWidth / 2) + SPACING / 2;

  return (
    <group ref={groupRef}>
      {characters.map((char, index) => {
        // Fallback if character (like a space) isn't in cache
        const geometry = geometryCache[char];
        if (!geometry) return null;

        return (
          <mesh
            key={`${index}-${char}`} // React key
            geometry={geometry} // RE-USE THE GEOMETRY!
            position={[startX + index * SPACING, 0, 0]}
          >
            <meshToonMaterial color={themeConfig.counterColor} />
            {/* Note: Outlines might need a different approach on individual meshes, 
                but try standard Outlines first */}
          </mesh>
        );
      })}
    </group>
  );
};
