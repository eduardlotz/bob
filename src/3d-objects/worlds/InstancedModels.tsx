import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as T from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

export type Vec3 = [number, number, number];
export type Placement = { position: Vec3; scale: Vec3; rotation?: Vec3 };
export type Part = [T.BufferGeometry, string, Vec3?, Vec3?, Vec3?];

/** Bake small colored parts into one geometry, so detail doesn't add draw calls. */
export function assemble(parts: Part[]) {
  const geometries = parts.map(
    ([
      source,
      color,
      position = [0, 0, 0],
      scale = [1, 1, 1],
      rotation = [0, 0, 0],
    ]) => {
      const g = source.index ? source.toNonIndexed() : source.clone();
      source.dispose();
      g.scale(...scale);
      g.rotateX(rotation[0]);
      g.rotateY(rotation[1]);
      g.rotateZ(rotation[2]);
      g.translate(...position);
      const c = new T.Color(color);
      const colors = new Float32Array(g.getAttribute("position").count * 3);
      for (let i = 0; i < colors.length; i += 3) c.toArray(colors, i);
      g.setAttribute("color", new T.BufferAttribute(colors, 3));
      g.deleteAttribute("uv");
      return g;
    },
  );
  const merged = mergeGeometries(geometries)!;
  geometries.forEach((g) => g.dispose());
  return merged;
}

export function ModelInstances({
  build,
  placements,
  name,
}: {
  build: () => T.BufferGeometry;
  placements: Placement[];
  name: string;
}) {
  const geometry = useMemo(build, [build]);
  const ref = useRef<T.InstancedMesh>(null);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const dummy = new T.Object3D();
    const tint = new T.Color();
    placements.forEach((p, i) => {
      dummy.position.set(...p.position);
      dummy.scale.set(...p.scale);
      dummy.rotation.set(...(p.rotation ?? [0, 0, 0]));
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, tint.setScalar(0.88 + (i % 5) * 0.03));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [placements, geometry]);
  return (
    <instancedMesh
      key={placements.length}
      name={name}
      ref={ref}
      args={[geometry, undefined, placements.length]}
    >
      <meshStandardMaterial vertexColors roughness={1} flatShading />
    </instancedMesh>
  );
}
