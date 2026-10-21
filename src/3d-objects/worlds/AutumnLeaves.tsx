import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as T from "three";
import { assemble, ModelInstances, type Part, type Placement } from "./InstancedModels";
import { seededRandom, useWorldQuality } from "./quality";
import { WorldToonMaterial } from "./WorldToonMaterial";
import { useWorldEnvironment } from "./WorldEnvironment";

const LEAF_COLORS = ["#c75a29", "#df8b32", "#ad3930", "#c5a044", "#94512c"];

function leafGeometry() {
  const shape = new T.Shape();
  shape.moveTo(0, .58);
  [[.1, .27], [.32, .36], [.25, .1], [.49, .04], [.2, -.17], [.04, -.23], [.025, -.43], [-.025, -.43], [-.04, -.23], [-.2, -.17], [-.49, .04], [-.25, .1], [-.32, .36], [-.1, .27]].forEach(([x, y]) => shape.lineTo(x, y));
  shape.closePath();
  const geometry = new T.ShapeGeometry(shape);
  const positions = geometry.getAttribute("position");
  for (let i = 0; i < positions.count; i++) positions.setZ(i, Math.abs(positions.getX(i)) * .24);
  geometry.computeVertexNormals();
  return geometry;
}

function leafPileGeometry() {
  const random = seededRandom(1032);
  const parts: Part[] = [[new T.IcosahedronGeometry(1, 1), "#642c22", [0, .12, 0], [1.3, .25, 1.2]]];
  for (let i = 0; i < 160; i++) {
    const angle = random() * Math.PI * 2, radius = Math.sqrt(random()) * 1.55;
    const size = .4 + random() * .4;
    const height = .08 + Math.sqrt(Math.max(0, 1 - (radius / 1.55) ** 2)) * .52;
    parts.push([leafGeometry(), LEAF_COLORS[i % LEAF_COLORS.length], [Math.cos(angle) * radius, height + random() * .04, Math.sin(angle) * radius], [size, size, size], [-Math.PI / 2 + (random() - .5) * .45, random() * Math.PI * 2, (random() - .5) * .25]]);
  }
  return assemble(parts);
}

const BOB_PILES: Placement[] = [
  { position: [-3.4, -1.36, 1.9], scale: [1.35, 1.2, 1.1] },
  { position: [3.8, -1.36, 1.6], scale: [1.3, 1.15, 1.15] },
  { position: [-4.5, -1.36, -3.5], scale: [1.15, 1, 1] },
  { position: [4.8, -1.36, -4], scale: [1.25, 1.1, 1.1] },
];

export function AutumnLeaves({ trees }: { trees: Placement[] }) {
  const piles = useMemo(() => [...trees.map((tree): Placement => ({
    position: tree.position,
    rotation: tree.rotation,
    scale: [tree.scale[0] * .65, tree.scale[1] * .45, tree.scale[2] * .65],
  })), ...BOB_PILES], [trees]);
  const quality = useWorldQuality();
  const environment = useWorldEnvironment();
  const geometry = useMemo(leafGeometry, []);
  const mesh = useRef<T.InstancedMesh>(null);
  const dummy = useMemo(() => new T.Object3D(), []);
  const seeds = useMemo(() => {
    const random = seededRandom(1033);
    return Array.from({ length: quality === "low" ? 32 : 72 }, () => ({ x: random() * 36, y: random() * 9, z: random() * 27 - 17, phase: random() * Math.PI * 2, size: .16 + random() * .25, speed: .4 + random() * .5 }));
  }, [quality]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useLayoutEffect(() => {
    const color = new T.Color();
    seeds.forEach((_, i) => mesh.current?.setColorAt(i, color.set(LEAF_COLORS[i % LEAF_COLORS.length])));
    if (mesh.current?.instanceColor) mesh.current.instanceColor.needsUpdate = true;
    mesh.current?.instanceMatrix.setUsage(T.DynamicDrawUsage);
  }, [seeds]);
  useFrame(() => {
    if (!mesh.current) return;
    const time = environment.current.elapsed;
    seeds.forEach((seed, i) => {
      const life = T.MathUtils.euclideanModulo(seed.y - time * seed.speed * .22, 9);
      dummy.position.set(T.MathUtils.euclideanModulo(seed.x + time * seed.speed, 36) - 18 + Math.sin(time * .7 + seed.phase) * .5, -1.1 + life, seed.z + Math.sin(time * .3 + seed.phase) * .7);
      dummy.rotation.set(time * .8 + seed.phase, time * .45 + seed.phase, Math.sin(time + seed.phase) * .8);
      dummy.scale.setScalar(seed.size * Math.min(1, life * 2, (9 - life) * 2));
      dummy.updateMatrix(); mesh.current!.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });
  return <group name="halloween-autumn-leaves">
    <ModelInstances build={leafPileGeometry} placements={piles} name="autumn-leaf-stacks" toon />
    <instancedMesh key={seeds.length} ref={mesh} args={[geometry, undefined, seeds.length]} frustumCulled={false} name="flying-autumn-leaves">
      <WorldToonMaterial side={T.DoubleSide} />
    </instancedMesh>
  </group>;
}
