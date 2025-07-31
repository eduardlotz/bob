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

// Trophy object
export function TrophyObject({ color = "#ffd700", scale = 1, ...props }: any) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.008;
    }
  });

  return (
    <group ref={groupRef} {...props}>
      {/* Trophy base */}
      <mesh scale={[0.6 * scale, 0.1 * scale, 0.6 * scale]}>
        <cylinderGeometry args={[0.5, 0.5, 0.2, 16]} />
        <meshToonMaterial color="#8B4513" />
      </mesh>
      {/* Trophy stem */}
      <mesh
        position={[0, 0.3, 0]}
        scale={[0.05 * scale, 0.4 * scale, 0.05 * scale]}
      >
        <cylinderGeometry args={[0.5, 0.5, 0.8, 8]} />
        <meshToonMaterial color={color} />
      </mesh>
      {/* Trophy cup */}
      <mesh
        position={[0, 0.7, 0]}
        scale={[0.3 * scale, 0.2 * scale, 0.3 * scale]}
      >
        <cylinderGeometry args={[0.5, 0.3, 0.4, 16]} />
        <meshToonMaterial color={color} />
      </mesh>
      {/* Trophy handles */}
      <mesh
        position={[0.25, 0.7, 0]}
        scale={[0.05 * scale, 0.05 * scale, 0.2 * scale]}
      >
        <torusGeometry args={[0.1, 0.02, 8, 16]} />
        <meshToonMaterial color={color} />
      </mesh>
      <mesh
        position={[-0.25, 0.7, 0]}
        scale={[0.05 * scale, 0.05 * scale, 0.2 * scale]}
      >
        <torusGeometry args={[0.1, 0.02, 8, 16]} />
        <meshToonMaterial color={color} />
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

// Graduation cap object
export function GraduationCapObject({
  color = "#4facfe",
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
      {/* Cap base */}
      <mesh scale={[0.8 * scale, 0.1 * scale, 0.8 * scale]}>
        <cylinderGeometry args={[0.5, 0.5, 0.2, 16]} />
        <meshToonMaterial color={color} />
      </mesh>
      {/* Cap top */}
      <mesh
        position={[0, 0.15, 0]}
        scale={[0.6 * scale, 0.1 * scale, 0.6 * scale]}
      >
        <cylinderGeometry args={[0.4, 0.4, 0.2, 16]} />
        <meshToonMaterial color={color} />
      </mesh>
      {/* Tassel */}
      <mesh
        position={[0, 0.25, 0]}
        scale={[0.05 * scale, 0.2 * scale, 0.05 * scale]}
      >
        <cylinderGeometry args={[0.5, 0.5, 0.4, 8]} />
        <meshToonMaterial color="#ffd700" />
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

// Paintbrush object
export function PaintbrushObject({
  color = "#a8edea",
  scale = 1,
  ...props
}: any) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.01;
    }
  });

  return (
    <group ref={groupRef} {...props}>
      {/* Brush handle */}
      <mesh
        position={[0, -0.3, 0]}
        scale={[0.05 * scale, 0.6 * scale, 0.05 * scale]}
      >
        <cylinderGeometry args={[0.5, 0.5, 1.2, 8]} />
        <meshToonMaterial color="#8B4513" />
      </mesh>
      {/* Brush bristles */}
      <mesh
        position={[0, 0.1, 0]}
        scale={[0.1 * scale, 0.2 * scale, 0.1 * scale]}
      >
        <cylinderGeometry args={[0.5, 0.3, 0.4, 16]} />
        <meshToonMaterial color={color} />
      </mesh>
    </group>
  );
}

// Canvas object
export function CanvasObject({ color = "#a8edea", scale = 1, ...props }: any) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.005;
    }
  });

  return (
    <group ref={groupRef} {...props}>
      {/* Canvas frame */}
      <mesh scale={[1.2 * scale, 0.8 * scale, 0.05 * scale]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshToonMaterial color="#8B4513" />
      </mesh>
      {/* Canvas surface */}
      <mesh
        position={[0, 0, 0.03]}
        scale={[1.1 * scale, 0.7 * scale, 0.01 * scale]}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshToonMaterial color="#fff" />
      </mesh>
      {/* Paint strokes */}
      {[
        {
          pos: [-0.3, 0.2, 0.04] as [number, number, number],
          color: "#ff6b6b",
        },
        {
          pos: [0.2, -0.1, 0.04] as [number, number, number],
          color: "#4facfe",
        },
        { pos: [0, 0.3, 0.04] as [number, number, number], color: "#a8edea" },
      ].map((stroke, i) => (
        <mesh
          key={i}
          position={stroke.pos}
          scale={[0.2 * scale, 0.05 * scale, 0.01 * scale]}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshToonMaterial color={stroke.color} />
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

// Laptop object
export function LaptopObject({ color = "#ffecd2", scale = 1, ...props }: any) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.007;
    }
  });

  return (
    <group ref={groupRef} {...props}>
      {/* Laptop base */}
      <mesh scale={[1.2 * scale, 0.1 * scale, 0.8 * scale]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshToonMaterial color="#333" />
      </mesh>
      {/* Laptop screen */}
      <mesh
        position={[0, 0.4, 0.3]}
        scale={[1.1 * scale, 0.7 * scale, 0.05 * scale]}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshToonMaterial color="#000" />
      </mesh>
      {/* Screen content */}
      <mesh
        position={[0, 0.4, 0.33]}
        scale={[1 * scale, 0.6 * scale, 0.01 * scale]}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshToonMaterial color="#4facfe" />
      </mesh>
      {/* Keyboard */}
      <mesh
        position={[0, 0.06, 0]}
        scale={[1 * scale, 0.02 * scale, 0.6 * scale]}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshToonMaterial color="#666" />
      </mesh>
    </group>
  );
}

// Server object
export function ServerObject({ color = "#ffecd2", scale = 1, ...props }: any) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.005;
    }
  });

  return (
    <group ref={groupRef} {...props}>
      {/* Server case */}
      <mesh scale={[0.8 * scale, 1.2 * scale, 0.6 * scale]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshToonMaterial color="#333" />
      </mesh>
      {/* Server bays */}
      {[0, 1, 2, 3].map((bay) => (
        <mesh
          key={bay}
          position={[0, 0.3 - bay * 0.2, 0.31]}
          scale={[0.6 * scale, 0.05 * scale, 0.4 * scale]}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshToonMaterial color="#666" />
        </mesh>
      ))}
      {/* LED lights */}
      {[
        {
          pos: [-0.3, 0.5, 0.31] as [number, number, number],
          color: "#00ff00",
        },
        { pos: [0.3, 0.5, 0.31] as [number, number, number], color: "#ff0000" },
      ].map((led, i) => (
        <mesh
          key={i}
          position={led.pos}
          scale={[0.05 * scale, 0.05 * scale, 0.01 * scale]}
        >
          <sphereGeometry args={[0.5, 8, 8]} />
          <meshToonMaterial color={led.color} />
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

// Guestbook object
export function GuestbookObject({
  color = "#ff9a9e",
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
      {/* Guestbook base */}
      <mesh scale={[0.8 * scale, 0.1 * scale, 1.2 * scale]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshToonMaterial color="#8B4513" />
      </mesh>
      {/* Guestbook pages */}
      <mesh
        position={[0, 0.06, 0]}
        scale={[0.75 * scale, 0.08 * scale, 1.15 * scale]}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshToonMaterial color="#fff" />
      </mesh>
      {/* Guestbook spine */}
      <mesh
        position={[0, 0, 0.6]}
        scale={[0.05 * scale, 0.12 * scale, 0.1 * scale]}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshToonMaterial color="#333" />
      </mesh>
      {/* Guestbook title */}
      <mesh
        position={[0, 0.12, 0.6]}
        scale={[0.3 * scale, 0.02 * scale, 0.02 * scale]}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshToonMaterial color={color} />
      </mesh>
    </group>
  );
}

// Pen object
export function PenObject({ color = "#ff9a9e", scale = 1, ...props }: any) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.01;
    }
  });

  return (
    <group ref={groupRef} {...props}>
      {/* Pen body */}
      <mesh
        position={[0, -0.2, 0]}
        scale={[0.03 * scale, 0.4 * scale, 0.03 * scale]}
      >
        <cylinderGeometry args={[0.5, 0.5, 0.8, 8]} />
        <meshToonMaterial color="#333" />
      </mesh>
      {/* Pen tip */}
      <mesh
        position={[0, 0.2, 0]}
        scale={[0.02 * scale, 0.1 * scale, 0.02 * scale]}
      >
        <cylinderGeometry args={[0.5, 0.2, 0.2, 8]} />
        <meshToonMaterial color="#000" />
      </mesh>
      {/* Pen cap */}
      <mesh
        position={[0, -0.4, 0]}
        scale={[0.04 * scale, 0.05 * scale, 0.04 * scale]}
      >
        <cylinderGeometry args={[0.5, 0.5, 0.1, 8]} />
        <meshToonMaterial color={color} />
      </mesh>
    </group>
  );
}

// Collection of all objects for easy access
export const ObjectPrimitives = {
  camera: CameraObject,
  trophy: TrophyObject,
  book: BookObject,
  graduationCap: GraduationCapObject,
  palette: PaletteObject,
  paintbrush: PaintbrushObject,
  canvas: CanvasObject,
  codeBlock: CodeBlockObject,
  laptop: LaptopObject,
  server: ServerObject,
  message: MessageObject,
  guestbook: GuestbookObject,
  pen: PenObject,
};
