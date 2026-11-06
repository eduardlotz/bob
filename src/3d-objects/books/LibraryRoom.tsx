import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useAppStore } from "@/store";
import { CanvasTexture, MathUtils, SRGBColorSpace, type Group, type Texture } from "three";

/** A small shared oak grain map; no external texture downloads. */
export function useLibraryOak() {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 128; canvas.height = 512;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#79583d"; ctx.fillRect(0, 0, 128, 512);
    for (let x = 0; x < 128; x++) {
      const shade = 40 + Math.round(18 * Math.sin(x * 1.7) + 12 * Math.sin(x * 0.31));
      ctx.strokeStyle = `rgba(28,12,6,${0.1 + shade / 250})`;
      ctx.lineWidth = x % 9 === 0 ? 2 : 0.6;
      ctx.beginPath(); ctx.moveTo(x, 0);
      for (let y = 0; y <= 512; y += 16) ctx.lineTo(x + Math.sin(y * 0.018 + x) * 1.6, y);
      ctx.stroke();
    }
    const result = new CanvasTexture(canvas); result.colorSpace = SRGBColorSpace;
    return result;
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

export function Oak({ texture, color = "#82634e" }: { texture: Texture; color?: string }) {
  return <meshStandardMaterial map={texture} color={color} roughness={0.83} />;
}

export function LibraryCandle({ position, scale = 1, light = false }: {
  position: [number, number, number]; scale?: number; light?: boolean;
}) {
  return <group position={position} scale={scale}>
    <mesh position={[0, 0.025, 0]}><cylinderGeometry args={[0.11, 0.14, 0.05, 12]} /><meshStandardMaterial color="#927044" metalness={0.65} roughness={0.4} /></mesh>
    <mesh position={[0, 0.18, 0]}><cylinderGeometry args={[0.048, 0.055, 0.28, 12]} /><meshStandardMaterial color="#e4c99b" roughness={0.9} /></mesh>
    <mesh position={[0, 0.36, 0]} scale={[0.045, 0.095, 0.045]}><sphereGeometry args={[1, 8, 8]} /><meshBasicMaterial color="#ffd48a" toneMapped={false} /></mesh>
    <mesh position={[0, 0.35, 0]} scale={[0.025, 0.05, 0.025]}><sphereGeometry args={[1, 8, 8]} /><meshBasicMaterial color="#fff1cf" toneMapped={false} /></mesh>
    {light && <pointLight position={[0, 0.45, 0]} color="#ffc579" intensity={3.5} distance={6} decay={2} />}
  </group>;
}

export function LibraryRoom({ oak }: { oak: Texture }) {
  return <group>
    {/* Dark oak floorboards, offset at the joints. */}
    <mesh position={[0, -2.12, 0]} receiveShadow><boxGeometry args={[10.4, 0.14, 12]} /><Oak texture={oak} color="#3d2a20" /></mesh>
    {Array.from({ length: 20 }, (_, row) => [-1, 0, 1].map(column => <mesh key={`${row}-${column}`}
      position={[-4.94 + row * 0.52, -2.039, column * 4 + (row % 2 ? 0.65 : 0)]} receiveShadow>
      <boxGeometry args={[0.505, 0.025, 3.98]} /><Oak texture={oak} color={row % 3 ? "#82624b" : "#735039"} />
    </mesh>))}
    {/* Paneled walls and their raised timber framing. */}
    <mesh position={[0, 0.6, -5.05]} receiveShadow><boxGeometry args={[10.4, 5.4, 0.2]} /><meshStandardMaterial color="#302a26" roughness={1} /></mesh>
    {[-1, 1].map(side => <group key={side}>
      <mesh position={[side * 5.1, 0.6, 0.5]} receiveShadow><boxGeometry args={[0.2, 5.4, 11.2]} /><meshStandardMaterial color="#302a26" roughness={1} /></mesh>
      {[-1.85, -0.45, 2.7].map(y => <mesh key={y} position={[side * 4.98, y, 0.5]}><boxGeometry args={[0.13, 0.14, 11]} /><Oak texture={oak} color="#654832" /></mesh>)}
      {[-4.9, -2, 1, 4].map(z => <mesh key={z} position={[side * 4.97, 0.6, z]}><boxGeometry args={[0.16, 5.4, 0.2]} /><Oak texture={oak} color="#59402e" /></mesh>)}
    </group>)}
    {[-1.85, -0.45, 2.7].map(y => <mesh key={y} position={[0, y, -4.91]}><boxGeometry args={[10, 0.14, 0.16]} /><Oak texture={oak} color="#654832" /></mesh>)}
    {[-4.8, 0, 4.8].map(x => <mesh key={x} position={[x, 0.6, -4.9]}><boxGeometry args={[0.24, 5.4, 0.22]} /><Oak texture={oak} color="#59402e" /></mesh>)}
    <mesh position={[0, 3.35, 0]}><boxGeometry args={[10.4, 0.15, 12]} /><meshStandardMaterial color="#251d19" roughness={1} /></mesh>
    {[-4, -1, 2, 5].map(z => <mesh key={z} position={[0, 3.12, z]}><boxGeometry args={[10, 0.35, 0.28]} /><Oak texture={oak} color="#543926" /></mesh>)}
    {/* Plain woven rug with a subtle tonal border. */}
    <group position={[0, -2.005, 0.5]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[5.2, 5.7]} /><meshStandardMaterial color="#4b2429" roughness={1} /></mesh>
      <mesh position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[4.9, 5.4]} /><meshStandardMaterial color="#532b30" roughness={1} /></mesh>
    </group>
    {/* A heavy reading table with turned feet, brass corners, and open pages. */}
    <group position={[0, -2.03, 0.75]}>
      <mesh position={[0, 1.05, 0]} castShadow receiveShadow><boxGeometry args={[2.5, 0.16, 1.3]} /><Oak texture={oak} color="#987453" /></mesh>
      <mesh position={[0, 0.87, 0]} castShadow><boxGeometry args={[2.24, 0.25, 1.1]} /><Oak texture={oak} color="#735039" /></mesh>
      {[-1, 1].flatMap(x => [-0.46, 0.46].map(z => <group key={`${x}-${z}`} position={[x, 0, z]}>
        <mesh position={[0, 0.47, 0]} castShadow><cylinderGeometry args={[0.095, 0.12, 0.94, 10]} /><Oak texture={oak} color="#76553c" /></mesh>
        {[0.15, 0.72].map(y => <mesh key={y} position={[0, y, 0]}><sphereGeometry args={[0.14, 10, 8]} /><Oak texture={oak} color="#76553c" /></mesh>)}
      </group>))}
      <mesh position={[0, 0.23, 0]}><boxGeometry args={[2.1, 0.1, 0.12]} /><Oak texture={oak} /></mesh>
      <group position={[-0.2, 1.16, 0.08]} rotation={[0, -0.16, 0]}>
        {[-1, 1].map(side => <group key={side} rotation={[0, 0, side * -0.08]}>
          <mesh position={[side * 0.22, 0, 0]}><boxGeometry args={[0.44, 0.045, 0.61]} /><meshStandardMaterial color="#392029" roughness={0.9} /></mesh>
          <mesh position={[side * 0.21, 0.033, 0]}><boxGeometry args={[0.41, 0.035, 0.57]} /><meshStandardMaterial color="#caba96" roughness={1} /></mesh>
          {Array.from({ length: 9 }, (_, i) => <mesh key={i} position={[side * 0.21, 0.052, -0.21 + i * 0.05]}><boxGeometry args={[0.28, 0.001, 0.007]} /><meshStandardMaterial color="#766652" /></mesh>)}
        </group>)}
      </group>
      <LibraryCandle position={[0.86, 1.14, -0.2]} light />
      <LibraryCandle position={[0.62, 1.14, -0.31]} scale={0.75} />
    </group>
    {/* Warm fill keeps the oak readable beneath the shared scene lighting. */}
    <pointLight position={[-3.8, 1.7, -2.6]} color="#ffc17b" intensity={7} distance={9} decay={2} />
    <pointLight position={[3.8, 1.7, -2.6]} color="#ffc17b" intensity={7} distance={9} decay={2} />
  </group>;
}

/** Keep the wall behind the overview camera, and move it back for the menu camera. */
export function LibraryBackWall({ oak }: { oak: Texture }) {
  const wall = useRef<Group>(null);
  const showOptions = useAppStore(state => state.showOptions);
  useFrame((_, delta) => {
    if (wall.current) wall.current.position.z = MathUtils.damp(wall.current.position.z, showOptions ? 10 : 6, 10, delta);
  }, -1.5);
  return <group ref={wall} position={[0, 0, 6]} userData={{ foregroundOutline: false }}>
    <mesh position={[0, 0.6, 0]} receiveShadow>
      <boxGeometry args={[10.4, 5.4, 0.2]} />
      <meshStandardMaterial color="#302a26" roughness={1} />
    </mesh>
    {[-1.85, -0.45, 2.7].map(y => <mesh key={y} position={[0, y, -0.14]}>
      <boxGeometry args={[10, 0.14, 0.16]} /><Oak texture={oak} color="#654832" />
    </mesh>)}
    {[-4.8, 0, 4.8].map(x => <mesh key={x} position={[x, 0.6, -0.15]}>
      <boxGeometry args={[0.24, 5.4, 0.22]} /><Oak texture={oak} color="#59402e" />
    </mesh>)}
  </group>;
}
