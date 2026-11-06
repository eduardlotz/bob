import { useMemo } from "react";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { DoubleSide, Quaternion, Vector3 } from "three";
import { BookTable } from "./models/bookTable";
import { useFloatingBar } from "@/layout/FloatingBar";
import { useI18n } from "@/i18n";
import { viewControlsMessages } from "@/molecules/ViewControls.messages";

const TABLE_SCALE = 1.15;
const LEG_EXTENSION = 0.25;
// The GLB's origin is above its feet; keep those feet exactly on the room floor.
const TABLE_ORIGIN_Y = (0.8091443777 + LEG_EXTENSION) * TABLE_SCALE;
export const WORK_SURFACE_Y = TABLE_ORIGIN_Y + 0.6148958802 * TABLE_SCALE;

type Point = [number, number, number];

function Rod({ from, to, radius = 0.035, color = "#303338" }: {
  from: Point; to: Point; radius?: number; color?: string;
}) {
  const { midpoint, quaternion, length } = useMemo(() => {
    const start = new Vector3(...from);
    const end = new Vector3(...to);
    const direction = end.clone().sub(start);
    return {
      midpoint: start.add(end).multiplyScalar(0.5),
      quaternion: new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), direction.clone().normalize()),
      length: direction.length(),
    };
  }, [from[0], from[1], from[2], to[0], to[1], to[2]]);
  return <mesh position={midpoint} quaternion={quaternion} castShadow>
    <cylinderGeometry args={[radius, radius, length, 8]} />
    <meshStandardMaterial color={color} roughness={0.8} />
  </mesh>;
}

export function PottedPlant({ scale = 1 }: { scale?: number }) {
  return <group scale={scale}>
    <mesh position={[0, 0.19, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[0.23, 0.17, 0.38, 12]} />
      <meshStandardMaterial color="#b07d60" roughness={0.95} />
    </mesh>
    <mesh position={[0, 0.37, 0]}>
      <cylinderGeometry args={[0.205, 0.205, 0.025, 12]} />
      <meshStandardMaterial color="#44392e" roughness={1} />
    </mesh>
    <mesh position={[0, 0.365, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[0.216, 0.025, 5, 12]} />
      <meshStandardMaterial color="#b07d60" roughness={0.95} />
    </mesh>
    {[0, 1, 2, 3, 4, 5, 6].map((index) => {
      const angle = index * 2.4;
      const height = 0.62 + (index % 3) * 0.16;
      const reach = 0.21 + (index % 2) * 0.1;
      const end: Point = [Math.sin(angle) * reach, height, Math.cos(angle) * reach];
      return <group key={index}>
        <Rod from={[0, 0.35, 0]} to={end} radius={0.012} color="#526344" />
        <group position={end} rotation={[0, angle, -0.68]}>
          <mesh position={[0, 0.095, 0]} scale={[0.105, 0.23, 0.035]} castShadow>
            <sphereGeometry args={[1, 8, 6]} />
            <meshStandardMaterial color={index % 2 ? "#637a50" : "#4c6844"} roughness={0.92} />
          </mesh>
        </group>
      </group>;
    })}
  </group>;
}

function DeskMonitor() {
  return <group>
    {[-0.48, 0.48].map((x) => <group key={x} position={[x, 0, 0]}>
      <mesh position={[0, 0.025, 0.035]} castShadow>
        <boxGeometry args={[0.3, 0.05, 0.32]} />
        <meshStandardMaterial color="#34373b" roughness={0.7} />
      </mesh>
      <Rod from={[0, 0.04, -0.04]} to={[0, 0.27, -0.08]} radius={0.025} />
    </group>)}
    <mesh position={[0, 0.79, -0.08]} castShadow>
      <boxGeometry args={[1.98, 1.16, 0.09]} />
      <meshStandardMaterial color="#26292d" roughness={0.7} />
    </mesh>
    <mesh position={[0, 0.8, -0.032]}>
      <planeGeometry args={[1.88, 1.0575]} />
      <meshStandardMaterial color="#151d24" roughness={0.38} />
    </mesh>
  </group>;
}

function DeskLamp() {
  return <group>
    <mesh position={[0, 0.035, 0]} castShadow>
      <cylinderGeometry args={[0.2, 0.22, 0.07, 16]} />
      <meshStandardMaterial color="#4c514d" roughness={0.8} />
    </mesh>
    <Rod from={[0, 0.06, 0]} to={[0, 0.71, 0]} color="#4c514d" />
    <Rod from={[0, 0.71, 0]} to={[-0.32, 0.98, 0]} color="#4c514d" />
    <mesh position={[-0.32, 0.85, 0]} castShadow>
      <cylinderGeometry args={[0.09, 0.23, 0.27, 16, 1, true]} />
      <meshStandardMaterial color="#657064" side={DoubleSide} roughness={0.8} />
    </mesh>
    <mesh position={[-0.32, 0.72, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.205, 16]} />
      <meshBasicMaterial color="#ffe6ad" toneMapped={false} />
    </mesh>
    {/* A purely visual beam and pool, with no extra real-time light or shadows. */}
    <mesh position={[-0.32, 0.362, 0]} raycast={() => null}>
      <cylinderGeometry args={[0.205, 0.45, 0.71, 24, 1, true]} />
      <shaderMaterial transparent depthWrite={false} side={DoubleSide} toneMapped={false}
        vertexShader={`varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`}
        fragmentShader={`varying vec2 vUv; void main() { float fade = smoothstep(0.0, 0.2, vUv.y); gl_FragColor = vec4(1.0, 0.85, 0.55, 0.085 * fade); }`}
      />
    </mesh>
    <mesh position={[-0.32, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
      <circleGeometry args={[0.45, 32]} />
      <shaderMaterial transparent depthWrite={false} toneMapped={false}
        vertexShader={`varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`}
        fragmentShader={`varying vec2 vUv; void main() { float r = length(vUv - 0.5) * 2.0; gl_FragColor = vec4(1.0, 0.84, 0.5, (1.0 - smoothstep(0.25, 1.0, r)) * 0.22); }`}
      />
    </mesh>
  </group>;
}

function OfficeChair() {
  return <group>
    <mesh position={[0, 0.98, 0]} castShadow receiveShadow>
      <boxGeometry args={[0.88, 0.16, 0.83]} />
      <meshStandardMaterial color="#555e60" roughness={0.95} />
    </mesh>
    <mesh position={[0, 1.48, 0.37]} rotation={[-0.12, 0, 0]} castShadow>
      <boxGeometry args={[0.83, 0.87, 0.13]} />
      <meshStandardMaterial color="#555e60" roughness={0.95} />
    </mesh>
    <Rod from={[0, 0.22, 0]} to={[0, 0.91, 0]} radius={0.065} color="#33383a" />
    {Array.from({ length: 5 }, (_, index) => <group key={index} rotation={[0, index * Math.PI * 2 / 5, 0]}>
      <Rod from={[0, 0.25, 0]} to={[0.49, 0.17, 0]} radius={0.04} />
      <mesh position={[0.49, 0.1, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.1, 10]} />
        <meshStandardMaterial color="#272c2f" roughness={0.9} />
      </mesh>
    </group>)}
  </group>;
}

export function WorkCorner() {
  const { setHoveredObject } = useFloatingBar();
  const { locale } = useI18n();
  return <group onPointerEnter={() => setHoveredObject({ title: viewControlsMessages[locale].viewTitles.computer })}
    onPointerLeave={() => setHoveredObject(null)}>
    <BookTable position={[0, TABLE_ORIGIN_Y, 0]} rotation={[0, Math.PI * 2, 0]}
      scale={[TABLE_SCALE, TABLE_SCALE, TABLE_SCALE]} legExtension={LEG_EXTENSION} interactive={false} />
    <group position={[-0.25, WORK_SURFACE_Y, -0.17]}><DeskMonitor /></group>
    <group position={[1.99, WORK_SURFACE_Y, -0.22]}><DeskLamp /></group>
    <group position={[-2.13, WORK_SURFACE_Y, -0.15]}><PottedPlant scale={0.64} /></group>
    <group position={[-0.25, 0, 1.46]}><OfficeChair /></group>
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider args={[2.73, 0.045, 0.77]} position={[0, WORK_SURFACE_Y - 0.045, 0]} />
      <CuboidCollider args={[0.44, 0.08, 0.415]} position={[-0.25, 0.98, 1.46]} />
      <CuboidCollider args={[0.415, 0.44, 0.085]} position={[-0.25, 1.48, 1.83]} />
    </RigidBody>
  </group>;
}
