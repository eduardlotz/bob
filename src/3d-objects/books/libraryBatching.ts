import { BufferAttribute, Color, Group, Matrix4, Mesh, type BufferGeometry, type Material, type Object3D, type Texture, Vector3 } from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import type { Book } from "@/store/books";

type Surface = Material & { color?: Color; map?: Texture; gradientMap?: Texture; roughness?: number; metalness?: number; emissive?: Color; emissiveIntensity?: number; vertexColors?: boolean };
type PickRange = { end: number; shelf: Book["status"] | undefined };
export type LibraryBatchMesh = Mesh & { userData: { libraryPickRanges: PickRange[] } };

function shelfOf(object: Object3D): Book["status"] | undefined {
  let current: Object3D | null = object;
  while (current) {
    if (current.userData.libraryShelf) return current.userData.libraryShelf;
    current = current.parent;
  }
}

export function libraryShelfAtFace(mesh: Mesh, faceIndex: number | undefined | null) {
  if (faceIndex == null) return;
  return (mesh.userData.libraryPickRanges as PickRange[] | undefined)?.find(range => faceIndex < range.end)?.shelf;
}

/** Bake static transforms and colors; retain shelf picking. */
export function createLibraryBatches(source: Group, { cellSize = 4 } = {}) {
  source.updateWorldMatrix(true, true);
  const inverse = source.matrixWorld.clone().invert();
  const transform = new Matrix4();
  const center = new Vector3();
  const buckets = new Map<string, { geometry: BufferGeometry[]; surface: Surface; ranges: PickRange[]; faces: number }>();
  source.traverse(object => {
    if (!(object instanceof Mesh) || Array.isArray(object.material)) return;
    const material = object.material as Surface;
    if (!material.visible) return;
    object.getWorldPosition(center).applyMatrix4(inverse);
    const key = JSON.stringify([Math.floor(center.x / cellSize), Math.floor(center.z / cellSize), material.type, material.map?.uuid, material.gradientMap?.uuid, material.roughness, material.metalness,
      material.emissive?.getHex(), material.emissiveIntensity, material.side, material.toneMapped,
      material.transparent, material.opacity, material.depthWrite, material.customProgramCacheKey()]);
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { geometry: [], surface: material, ranges: [], faces: 0 };
      buckets.set(key, bucket);
    }
    // Extrusions are non-indexed, while boxes and columns are indexed.
    // All parts in a merged draw must use the same triangle representation.
    const geometry = object.geometry.index
      ? object.geometry.toNonIndexed()
      : object.geometry.clone();
    geometry.clearGroups();
    transform.multiplyMatrices(inverse, object.matrixWorld);
    geometry.applyMatrix4(transform);
    const count = geometry.getAttribute("position").count;
    const colors = new Float32Array(count * 3);
    const color = material.color ?? new Color("white");
    for (let i = 0; i < count; i++) color.toArray(colors, i * 3);
    geometry.setAttribute("color", new BufferAttribute(colors, 3));
    // All library primitives use position, normal, uv; exclude incidental attributes.
    for (const attribute of Object.keys(geometry.attributes)) {
      if (!["position", "normal", "uv", "color"].includes(attribute)) geometry.deleteAttribute(attribute);
    }
    bucket.geometry.push(geometry);
    bucket.faces += (geometry.index?.count ?? count) / 3;
    bucket.ranges.push({ end: bucket.faces, shelf: shelfOf(object) });
  });
  const meshes: LibraryBatchMesh[] = [];
  for (const bucket of Array.from(buckets.values())) {
    const geometry = mergeGeometries(bucket.geometry, false);
    for (const part of bucket.geometry) part.dispose();
    if (!geometry) throw new Error("Library static geometry could not be merged");
    const material = bucket.surface.clone() as Surface;
    material.color?.set("white"); material.vertexColors = true;
    material.onBeforeCompile = bucket.surface.onBeforeCompile;
    material.customProgramCacheKey = bucket.surface.customProgramCacheKey;
    const mesh = new Mesh(geometry, material) as LibraryBatchMesh;
    mesh.name = "library-static-batch";
    mesh.userData.libraryPickRanges = bucket.ranges;
    mesh.castShadow = true; mesh.receiveShadow = true;
    meshes.push(mesh);
  }
  return {
    meshes,
    dispose: () => { for (const mesh of meshes) { mesh.geometry.dispose(); (mesh.material as Material).dispose(); } },
  };
}
