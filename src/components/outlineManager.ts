import { BackSide, InstancedMesh, Mesh, MeshBasicMaterial, SkinnedMesh, type BufferGeometry, type Object3D } from "three";
import { toCreasedNormals } from "three/addons/utils/BufferGeometryUtils.js";

export type OutlineCategory = "counter" | "bob" | "foreground";
export type OutlineScope = OutlineCategory | false;
export const OUTLINE_TAG = "foregroundOutline";
export const OUTLINE_SHELL = "foregroundOutlineShell";
export function getOutlineScope(object: Object3D): OutlineScope | undefined {
  let current: Object3D | null = object;
  while (current) {
    const scope = current.userData[OUTLINE_TAG];
    if (scope === false || scope === "counter" || scope === "bob" || scope === "foreground") return scope;
    current = current.parent;
  }
}

export function canOutline(mesh: Mesh) {
  if (mesh.userData[OUTLINE_SHELL] || !mesh.geometry?.attributes.normal) return false;
  const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  // Excludes invisible collision helpers, decals, shadows, and inside-out skies.
  return materials.some(material => material.visible && (material.depthWrite || getOutlineScope(mesh) === "bob") && material.opacity > 0 && material.side !== BackSide);
}

export function getOutlineThickness(object: Object3D, category: OutlineCategory) {
  let current: Object3D | null = object;
  while (current) {
    const value = current.userData.outlineThickness;
    if (typeof value === "number" && Number.isFinite(value) && value > 0) return value;
    current = current.parent;
  }
  return category === "counter" ? 0.02 : 0.0125;
}

type OutlineEntry = { shell: Mesh; original: BufferGeometry; material: MeshBasicMaterial; thickness: { value: number }; rimOnly: { value: boolean } };
/** Shared lifecycle for all foreground models, including late GLTFs and instances.
 * Only owned shell geometry/materials are disposed; source assets remain intact.
 */
export class ForegroundOutlineManager {
  private entries = new Map<Mesh, OutlineEntry>();
  sync(scene: Object3D, enabled: Record<OutlineCategory, boolean>, colors: Record<OutlineCategory, string>) {
    const found = new Map<Mesh, OutlineCategory>();
    scene.traverse(object => {
      if (!(object as Mesh).isMesh) return;
      const mesh = object as Mesh;
      const scope = getOutlineScope(mesh);
      if (scope && enabled[scope] && canOutline(mesh)) found.set(mesh, scope);
    });
    for (const [mesh, entry] of Array.from(this.entries)) {
      if (!found.has(mesh) || entry.original !== mesh.geometry) this.remove(mesh, entry);
    }
    for (const [mesh, scope] of Array.from(found)) {
      let entry = this.entries.get(mesh);
      if (!entry) {
        const material = new MeshBasicMaterial({ side: BackSide, color: colors[scope] });
        const thickness = { value: getOutlineThickness(mesh, scope) };
        const rimOnly = { value: false };
        material.onBeforeCompile = shader => {
          shader.uniforms.outlineThickness = thickness;
          shader.uniforms.outlineRimOnly = rimOnly;
          shader.vertexShader = `uniform float outlineThickness;\nvarying vec3 outlineNormal;\nvarying vec3 outlineView;\n${shader.vertexShader}`.replace(
            "#include <begin_vertex>", "#include <begin_vertex>\ntransformed += normalize(normal) * outlineThickness;",
          ).replace("#include <project_vertex>", "#include <project_vertex>\noutlineNormal = normalize(normalMatrix * normal);\noutlineView = -mvPosition.xyz;");
          shader.fragmentShader = `uniform bool outlineRimOnly;\nvarying vec3 outlineNormal;\nvarying vec3 outlineView;\n${shader.fragmentShader}`.replace(
            "#include <opaque_fragment>",
            "if (outlineRimOnly && abs(dot(normalize(outlineNormal), normalize(outlineView))) > 0.2) discard;\n#include <opaque_fragment>",
          );
        };
        material.customProgramCacheKey = () => `foreground-outline-v2:${scope}`;
        // Smooth across coincident vertices, including GLTF seams and beveled text.
        const geometry = toCreasedNormals(mesh.geometry, Math.PI);
        let shell: Mesh;
        if ((mesh as InstancedMesh).isInstancedMesh) {
          const original = mesh as InstancedMesh;
          shell = new InstancedMesh(geometry, material, original.count);
          (shell as InstancedMesh).instanceMatrix = original.instanceMatrix;
        } else if ((mesh as SkinnedMesh).isSkinnedMesh) {
          const original = mesh as SkinnedMesh;
          const skinned = new SkinnedMesh(geometry, material);
          skinned.bind(original.skeleton, original.bindMatrix);
          shell = skinned;
        } else shell = new Mesh(geometry, material);
        shell.name = "foreground-outline";
        shell.userData[OUTLINE_SHELL] = true;
        shell.raycast = () => {};
        shell.morphTargetDictionary = mesh.morphTargetDictionary;
        shell.morphTargetInfluences = mesh.morphTargetInfluences;
        mesh.add(shell);
        entry = { shell, original: mesh.geometry, material, thickness, rimOnly };
        this.entries.set(mesh, entry);
      }
      entry.thickness.value = getOutlineThickness(mesh, scope);
      const source = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
      entry.rimOnly.value = source.transparent && scope === "bob";
      entry.material.color.set(mesh.userData.outlineColor ?? colors[scope]);
      entry.material.opacity = source.opacity;
      if (entry.material.transparent !== source.transparent) {
        entry.material.transparent = source.transparent; entry.material.needsUpdate = true;
      }
      entry.shell.renderOrder = mesh.renderOrder;
      entry.shell.layers.mask = mesh.layers.mask;
      entry.shell.morphTargetInfluences = mesh.morphTargetInfluences;
      if ((mesh as InstancedMesh).isInstancedMesh) (entry.shell as InstancedMesh).count = (mesh as InstancedMesh).count;
    }
  }
  private remove(mesh: Mesh, entry: OutlineEntry) {
    mesh.remove(entry.shell); entry.shell.geometry.dispose(); entry.material.dispose(); this.entries.delete(mesh);
  }
  dispose() { for (const [mesh, entry] of Array.from(this.entries)) this.remove(mesh, entry); }
}
