import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Camera object
export function CameraObject({ color = "#ff6b6b", scale = 1, ...props }: any) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.01;
    }
  });

  return (
    <group ref={groupRef} {...props}>
      {/* Camera body */}
      <mesh scale={[0.8 * scale, 0.6 * scale, 1 * scale]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshToonMaterial color={color} />
      </mesh>
      {/* Camera lens */}
      <mesh
        position={[0, 0, 0.6]}
        scale={[0.3 * scale, 0.3 * scale, 0.1 * scale]}
      >
        <cylinderGeometry args={[0.5, 0.5, 0.2, 16]} />
        <meshToonMaterial color="#333" />
      </mesh>
      {/* Camera viewfinder */}
      <mesh
        position={[0.3, 0.2, 0.3]}
        scale={[0.1 * scale, 0.1 * scale, 0.1 * scale]}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshToonMaterial color="#333" />
      </mesh>
    </group>
  );
}

// Book object
export function BookObject({ color = "#4facfe", scale = 1, ...props }: any) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.005;
    }
  });

  return (
    <group ref={groupRef} {...props}>
      {/* Book cover */}
      <mesh scale={[0.8 * scale, 0.1 * scale, 1.2 * scale]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshToonMaterial color={color} />
      </mesh>
      {/* Book pages */}
      <mesh
        position={[0, 0.06, 0]}
        scale={[0.75 * scale, 0.08 * scale, 1.15 * scale]}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshToonMaterial color="#fff" />
      </mesh>
      {/* Book spine */}
      <mesh
        position={[0, 0, 0.6]}
        scale={[0.05 * scale, 0.12 * scale, 0.1 * scale]}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshToonMaterial color="#333" />
      </mesh>
    </group>
  );
}

// Palette object
export function PaletteObject({ color = "#a8edea", scale = 1, ...props }: any) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.008;
    }
  });

  return (
    <group ref={groupRef} {...props}>
      {/* Palette base */}
      <mesh scale={[1 * scale, 0.1 * scale, 1 * scale]}>
        <cylinderGeometry args={[0.8, 0.8, 0.2, 16]} />
        <meshToonMaterial color="#8B4513" />
      </mesh>
      {/* Paint wells */}
      {[
        { pos: [0.3, 0.06, 0.3] as [number, number, number], color: "#ff6b6b" },
        {
          pos: [-0.3, 0.06, 0.3] as [number, number, number],
          color: "#4facfe",
        },
        { pos: [0, 0.06, -0.3] as [number, number, number], color: "#a8edea" },
        { pos: [0.2, 0.06, 0] as [number, number, number], color: "#ffecd2" },
        { pos: [-0.2, 0.06, 0] as [number, number, number], color: "#ff9a9e" },
      ].map((well, i) => (
        <mesh
          key={i}
          position={well.pos}
          scale={[0.15 * scale, 0.05 * scale, 0.15 * scale]}
        >
          <cylinderGeometry args={[0.5, 0.5, 0.1, 16]} />
          <meshToonMaterial color={well.color} />
        </mesh>
      ))}
    </group>
  );
}

// Code block object
export function CodeBlockObject({
  color = "#ffecd2",
  scale = 1,
  ...props
}: any) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.006;
    }
  });

  return (
    <group ref={groupRef} {...props}>
      {/* Code block base */}
      <mesh scale={[1 * scale, 0.6 * scale, 0.8 * scale]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshToonMaterial color={color} />
      </mesh>
      {/* Code lines */}
      {[
        {
          pos: [-0.3, 0.31, 0.1] as [number, number, number],
          scale: [0.4 * scale, 0.02 * scale, 0.02 * scale] as [
            number,
            number,
            number
          ],
        },
        {
          pos: [-0.2, 0.21, 0.1] as [number, number, number],
          scale: [0.6 * scale, 0.02 * scale, 0.02 * scale] as [
            number,
            number,
            number
          ],
        },
        {
          pos: [-0.1, 0.11, 0.1] as [number, number, number],
          scale: [0.5 * scale, 0.02 * scale, 0.02 * scale] as [
            number,
            number,
            number
          ],
        },
        {
          pos: [0, 0.01, 0.1] as [number, number, number],
          scale: [0.3 * scale, 0.02 * scale, 0.02 * scale] as [
            number,
            number,
            number
          ],
        },
        {
          pos: [0.1, -0.09, 0.1] as [number, number, number],
          scale: [0.7 * scale, 0.02 * scale, 0.02 * scale] as [
            number,
            number,
            number
          ],
        },
        {
          pos: [0.2, -0.19, 0.1] as [number, number, number],
          scale: [0.4 * scale, 0.02 * scale, 0.02 * scale] as [
            number,
            number,
            number
          ],
        },
      ].map((line, i) => (
        <mesh key={i} position={line.pos} scale={line.scale}>
          <boxGeometry args={[1, 1, 1]} />
          <meshToonMaterial color="#333" />
        </mesh>
      ))}
    </group>
  );
}

// Message object
export function MessageObject({ color = "#ff9a9e", scale = 1, ...props }: any) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.007;
    }
  });

  return (
    <group ref={groupRef} {...props}>
      {/* Message paper */}
      <mesh scale={[0.8 * scale, 0.6 * scale, 0.1 * scale]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshToonMaterial color="#fff" />
      </mesh>
      {/* Message lines */}
      {[
        {
          pos: [-0.2, 0.1, 0.06] as [number, number, number],
          scale: [0.3 * scale, 0.02 * scale, 0.02 * scale] as [
            number,
            number,
            number
          ],
        },
        {
          pos: [-0.1, 0, 0.06] as [number, number, number],
          scale: [0.4 * scale, 0.02 * scale, 0.02 * scale] as [
            number,
            number,
            number
          ],
        },
        {
          pos: [0, -0.1, 0.06] as [number, number, number],
          scale: [0.2 * scale, 0.02 * scale, 0.02 * scale] as [
            number,
            number,
            number
          ],
        },
        {
          pos: [0.1, -0.2, 0.06] as [number, number, number],
          scale: [0.3 * scale, 0.02 * scale, 0.02 * scale] as [
            number,
            number,
            number
          ],
        },
      ].map((line, i) => (
        <mesh key={i} position={line.pos} scale={line.scale}>
          <boxGeometry args={[1, 1, 1]} />
          <meshToonMaterial color="#333" />
        </mesh>
      ))}
      {/* Message icon */}
      <mesh
        position={[0.25, 0.15, 0.06]}
        scale={[0.1 * scale, 0.1 * scale, 0.02 * scale]}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshToonMaterial color={color} />
      </mesh>
    </group>
  );
}

// Collection of all objects for easy access
export const ObjectPrimitives = {
  camera: CameraObject,
  book: BookObject,
  palette: PaletteObject,
  codeBlock: CodeBlockObject,
  message: MessageObject,
};
