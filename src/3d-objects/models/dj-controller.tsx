import { useEffect, useMemo, useRef } from "react";
import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { CylinderGeometry, DataTexture, Mesh, MeshToonMaterial, NearestFilter, RedFormat } from "three";
import { useSoundSystem } from "@/hooks/useSoundSystem";

type Point = [number, number, number];
interface Props {
  position: Point;
  rotation?: Point;
  scale?: Point;
}

type SurfaceProps = { material: MeshToonMaterial; position: Point };

function Block({ position, size, material }: SurfaceProps & { size: Point }) {
  return <mesh position={position} material={material} castShadow receiveShadow>
    <boxGeometry args={size} />
  </mesh>;
}

function Dial({ position, material, radius = 0.032, height = 0.055 }: SurfaceProps & { radius?: number; height?: number }) {
  const geometry = useMemo(() => {
    const cylinder = new CylinderGeometry(radius, radius * 1.08, height, 12);
    const facets = cylinder.toNonIndexed();
    cylinder.dispose();
    facets.computeVertexNormals();
    return facets;
  }, [radius, height]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh position={position} geometry={geometry} material={material} castShadow receiveShadow />;
}

function Fader({ position, across = false, length = 0.22, offset = 0, track, cap }: {
  position: Point; across?: boolean; length?: number; offset?: number;
  track: MeshToonMaterial; cap: MeshToonMaterial;
}) {
  return <group position={position} rotation={[0, across ? Math.PI / 2 : 0, 0]}>
    <Block position={[0, 0, 0]} size={[0.016, 0.008, length]} material={track} />
    <Block position={[0, 0.023, offset]} size={[0.075, 0.038, 0.033]} material={cap} />
  </group>;
}

function VolumeMeters({ off, on }: { off: MeshToonMaterial; on: MeshToonMaterial }) {
  const segments = useRef<Array<Mesh | null>>([]);
  const levels = useRef([0, 0]);
  const { isActive, masterVolume } = useSoundSystem();

  useFrame(({ clock }, delta) => {
    const time = clock.elapsedTime;
    for (let channel = 0; channel < 2; channel++) {
      // Decorative levels share the speaker bounce's rhythm, rather than sampling SoundCloud audio.
      const pulse = Math.abs(Math.sin(time * 6.9 + channel * 0.35));
      const target = isActive ? masterVolume * (0.2 + pulse * 0.8) : 0;
      const previous = levels.current[channel];
      levels.current[channel] += (target - previous) * (1 - Math.exp(-(target > previous ? 25 : 8) * delta));
      for (let step = 0; step < 7; step++) {
        const segment = segments.current[channel * 7 + step];
        if (segment) segment.material = levels.current[channel] > (step + 0.5) / 7 ? on : off;
      }
    }
  });

  return <group>
    {[-0.026, 0.026].map((x, channel) => Array.from({ length: 7 }, (_, step) =>
      <mesh key={`${channel}-${step}`} ref={mesh => { segments.current[channel * 7 + step] = mesh; }}
        position={[x, 0.156, -step * 0.034]} material={off}>
        <boxGeometry args={[0.02, 0.008, 0.023]} />
      </mesh>
    ))}
  </group>;
}

/** A simplified DDJ-400 silhouette, facing the same way as the music desk. */
export function DjControllerModel({ position, rotation, scale = [1, 1, 1] }: Props) {
  const surfaces = useMemo(() => {
    const ramp = new DataTexture(new Uint8Array([90, 180, 255]), 3, 1, RedFormat);
    ramp.minFilter = ramp.magFilter = NearestFilter;
    ramp.generateMipmaps = false;
    ramp.unpackAlignment = 1;
    ramp.needsUpdate = true;
    const toon = (color: string) => new MeshToonMaterial({ color, gradientMap: ramp });
    return {
      ramp,
      body: toon("#1b1b1e"),
      panel: toon("#252529"),
      jog: toon("#3c3c41"),
      black: toon("#101013"),
      highlight: toon("#77777a"),
      pad: toon("#4a4a4e"),
      meterOff: toon("#353539"),
      meterOn: new MeshToonMaterial({ color: "#99999d", emissive: "#666669", emissiveIntensity: 0.35, gradientMap: ramp }),
    };
  }, []);
  useEffect(() => () => {
    surfaces.ramp.dispose();
    [surfaces.body, surfaces.panel, surfaces.jog, surfaces.black, surfaces.highlight, surfaces.pad, surfaces.meterOff, surfaces.meterOn].forEach(material => material.dispose());
  }, [surfaces]);

  return <group position={position} rotation={rotation} scale={scale}>
    <group rotation={[0, Math.PI / 2, 0]}>
      <RoundedBox args={[1.92, 0.14, 1.08]} position={[0, 0.07, 0]} radius={0.035} smoothness={1}
        material={surfaces.body} castShadow receiveShadow />
      <Block position={[0, 0.141, 0]} size={[1.84, 0.012, 1]} material={surfaces.panel} />
      {[-0.6, 0.6].map(x => <group key={x}>
        {/* Plain faceted jog wheels keep the DDJ silhouette without bright trim. */}
        <Dial position={[x, 0.174, -0.12]} radius={0.265} height={0.045} material={surfaces.black} />
        <Dial position={[x, 0.201, -0.12]} radius={0.243} height={0.016} material={surfaces.jog} />
        <Dial position={[x, 0.214, -0.12]} radius={0.065} height={0.008} material={surfaces.body} />

        {/* A single row of unoutlined pads and one subtly highlighted button. */}
        {[0, 1, 2, 3].map(column => <Block key={column}
          position={[x - 0.15 + column * 0.1, 0.164, 0.34]}
          size={[0.078, 0.024, 0.09]} material={surfaces.pad} />)}
        <Dial position={[x - 0.28, 0.168, 0.34]} radius={0.03} height={0.026} material={surfaces.highlight} />
      </group>)}

      {/* A readable two-channel mixer with reduced EQ controls. */}
      <VolumeMeters off={surfaces.meterOff} on={surfaces.meterOn} />
      {[-0.105, 0.105].map((x, channel) => <group key={x}>
        {[-0.29, -0.15].map(z => <group key={z}>
          <Dial position={[x, 0.188, z]} material={surfaces.jog} />
        </group>)}
        <Fader position={[x, 0.16, 0.16]} offset={channel === 0 ? -0.025 : 0.015} track={surfaces.black} cap={surfaces.jog} />
      </group>)}
      <Fader position={[0, 0.16, 0.43]} across length={0.27} offset={-0.025} track={surfaces.black} cap={surfaces.jog} />
    </group>
  </group>;
}

/** The About room owns a Blender-baked controller body; meters stay animated. */
export function DjControllerMeters({ position }: { position: Point }) {
  const materials = useMemo(() => ({
    off: new MeshToonMaterial({ color: "#353539" }),
    on: new MeshToonMaterial({ color: "#99999d", emissive: "#666669", emissiveIntensity: .35 }),
  }), []);
  useEffect(() => () => { materials.off.dispose(); materials.on.dispose(); }, [materials]);
  return <group position={position} rotation={[0, Math.PI / 2, 0]}>
    <VolumeMeters off={materials.off} on={materials.on} />
  </group>;
}
