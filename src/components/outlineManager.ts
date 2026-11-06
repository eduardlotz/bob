import { BackSide, InstancedMesh, Mesh, MeshBasicMaterial, SkinnedMesh, type BufferGeometry, type Material, type Object3D } from "three";
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

function canOutlineMaterial(material: Material, bob: boolean) {
  return material.visible && (material.depthWrite || bob) && material.opacity > 0 && material.side !== BackSide;
}

export function canOutline(mesh: Mesh, scope = getOutlineScope(mesh)) {
  if (mesh.userData[OUTLINE_SHELL] || !mesh.geometry?.attributes.normal) return false;
  // Excludes invisible collision helpers, decals, shadows, and inside-out skies.
  if (Array.isArray(mesh.material)) {
    for (const material of mesh.material) if (canOutlineMaterial(material, scope === "bob")) return true;
    return false;
  }
  return canOutlineMaterial(mesh.material, scope === "bob");
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

type OutlineColors = Record<OutlineCategory, string>;
type ScopeMetadata = { scope: OutlineScope | undefined; thickness: unknown };
type Candidate = { scope: OutlineCategory; thickness: number };
type OutlineGeometry = { original: BufferGeometry; geometry: BufferGeometry; users: number };
type OutlineEntry = {
  shell: Mesh; geometry: OutlineGeometry; material: MeshBasicMaterial;
  thickness: { value: number }; rimOnly: { value: boolean }; color: string;
};
/** Shared lifecycle for all foreground models, including late GLTFs and instances.
 * Index scene structure on attachment changes, never by traversing it every frame.
 * Only outlined candidates need live material/visibility/geometry checks.
 */
export class ForegroundOutlineManager {
  private scene: Object3D | null = null;
  private active = false;
  private watched = new Set<Object3D>();
  private scopes = new Map<Object3D, ScopeMetadata>();
  private candidates = new Map<Mesh, Candidate>();
  private entries = new Map<Mesh, OutlineEntry>();
  private geometries = new Map<BufferGeometry, OutlineGeometry>();

  private childAdded = ({ child }: { child: Object3D }) => { this.observe(child); };
  private childRemoved = ({ child }: { child: Object3D }) => { this.unobserve(child); };

  private metadata(object: Object3D): ScopeMetadata {
    const tag = object.userData[OUTLINE_TAG];
    return {
      scope: tag === false || tag === "bob" || tag === "counter" || tag === "foreground" ? tag : undefined,
      thickness: object.userData.outlineThickness,
    };
  }

  private observe(object: Object3D) {
    if (object.userData[OUTLINE_SHELL] || this.watched.has(object)) return;
    this.watched.add(object);
    object.addEventListener("childadded", this.childAdded);
    object.addEventListener("childremoved", this.childRemoved);
    const metadata = this.metadata(object);
    if (metadata.scope !== undefined || metadata.thickness !== undefined) this.scopes.set(object, metadata);
    this.refreshCandidate(object);
    for (const child of object.children) this.observe(child);
  }

  private unobserve(object: Object3D) {
    if (!this.watched.delete(object)) return;
    object.removeEventListener("childadded", this.childAdded);
    object.removeEventListener("childremoved", this.childRemoved);
    this.scopes.delete(object);
    // Removing shells mutates children; process source children before the entry.
    for (const child of object.children) this.unobserve(child);
    if ((object as Mesh).isMesh) {
      const mesh = object as Mesh;
      this.candidates.delete(mesh);
      const entry = this.entries.get(mesh);
      if (entry) this.remove(mesh, entry);
    }
  }

  private refreshCandidate(object: Object3D) {
    if (!(object as Mesh).isMesh || object.userData[OUTLINE_SHELL]) return;
    const mesh = object as Mesh;
    const scope = getOutlineScope(mesh);
    if (scope) this.candidates.set(mesh, { scope, thickness: getOutlineThickness(mesh, scope) });
    else {
      this.candidates.delete(mesh);
      const entry = this.entries.get(mesh);
      if (entry) this.remove(mesh, entry);
    }
  }

  /** Explicit invalidation is also available for new tags assigned imperatively.
   * React's existing tagged groups and their descendants refresh automatically.
   */
  invalidate(object: Object3D) {
    if (!this.watched.has(object) || object.userData[OUTLINE_SHELL]) return;
    const metadata = this.metadata(object);
    if (metadata.scope !== undefined || metadata.thickness !== undefined || this.scopes.has(object)) {
      this.scopes.set(object, metadata);
    }
    this.refreshCandidate(object);
    for (const child of object.children) this.invalidate(child);
  }

  sync(scene: Object3D, enabled: Record<OutlineCategory, boolean>, colors: OutlineColors) {
    if (!enabled.bob && !enabled.counter && !enabled.foreground) {
      if (this.scene && this.scene !== scene) this.dispose();
      if (this.active) {
        this.entries.forEach((entry, mesh) => mesh.remove(entry.shell));
        this.active = false;
      }
      return;
    }
    if (this.scene !== scene) {
      this.dispose();
      this.scene = scene;
      this.observe(scene);
    }
    // Metadata changes are rare and only explicit scope/width owners are checked.
    this.scopes.forEach((previous, object) => {
      const tag = object.userData[OUTLINE_TAG];
      const scope = tag === false || tag === "bob" || tag === "counter" || tag === "foreground" ? tag : undefined;
      if (scope !== previous.scope || object.userData.outlineThickness !== previous.thickness) this.invalidate(object);
    });
    this.active = true;
    this.candidates.forEach((candidate, mesh) => {
      const { scope } = candidate;
      let entry = this.entries.get(mesh);
      if (!enabled[scope]) {
        if (entry?.shell.parent) mesh.remove(entry.shell);
        return;
      }
      let visible = true;
      for (let object: Object3D | null = mesh; object; object = object.parent) {
        if (!object.visible) { visible = false; break; }
      }
      if (!visible || !canOutline(mesh, scope)) {
        if (entry) entry.shell.visible = false;
        return;
      }
      if (!entry) {
        const material = new MeshBasicMaterial({ side: BackSide, color: colors[scope] });
        const thickness = { value: candidate.thickness };
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
        material.customProgramCacheKey = () => "foreground-outline-v2";
        const geometry = this.acquireGeometry(mesh.geometry);
        let shell: Mesh;
        if ((mesh as InstancedMesh).isInstancedMesh) {
          const original = mesh as InstancedMesh;
          shell = new InstancedMesh(geometry.geometry, material, original.count);
          (shell as InstancedMesh).instanceMatrix = original.instanceMatrix;
        } else if ((mesh as SkinnedMesh).isSkinnedMesh) {
          const original = mesh as SkinnedMesh;
          const skinned = new SkinnedMesh(geometry.geometry, material);
          skinned.bind(original.skeleton, original.bindMatrix);
          shell = skinned;
        } else shell = new Mesh(geometry.geometry, material);
        shell.name = "foreground-outline";
        shell.userData[OUTLINE_SHELL] = true;
        shell.raycast = () => {};
        shell.morphTargetDictionary = mesh.morphTargetDictionary;
        shell.morphTargetInfluences = mesh.morphTargetInfluences;
        entry = { shell, geometry, material, thickness, rimOnly, color: colors[scope] };
        this.entries.set(mesh, entry);
      } else if (entry.geometry.original !== mesh.geometry) {
        // Animated text keeps its shell, uniforms and compiled material.
        const geometry = this.acquireGeometry(mesh.geometry);
        this.releaseGeometry(entry.geometry);
        entry.geometry = geometry;
        entry.shell.geometry = geometry.geometry;
      }
      if (!entry.shell.parent) mesh.add(entry.shell);
      entry.shell.visible = true;
      entry.thickness.value = candidate.thickness;
      const source = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
      entry.rimOnly.value = source.transparent && scope === "bob";
      const color = mesh.userData.outlineColor ?? colors[scope];
      if (entry.color !== color) {
        entry.material.color.set(color);
        entry.color = color;
      }
      entry.material.opacity = source.opacity;
      if (entry.material.transparent !== source.transparent) {
        entry.material.transparent = source.transparent; entry.material.needsUpdate = true;
      }
      entry.shell.renderOrder = mesh.renderOrder;
      entry.shell.layers.mask = mesh.layers.mask;
      entry.shell.morphTargetInfluences = mesh.morphTargetInfluences;
      if ((mesh as InstancedMesh).isInstancedMesh) {
        (entry.shell as InstancedMesh).instanceMatrix = (mesh as InstancedMesh).instanceMatrix;
        (entry.shell as InstancedMesh).count = (mesh as InstancedMesh).count;
      }
    });
  }

  private acquireGeometry(original: BufferGeometry) {
    let entry = this.geometries.get(original);
    if (!entry) {
      // toCreasedNormals mutates non-indexed inputs: always give it owned data.
      const copy = original.index ? original.toNonIndexed() : original.clone();
      entry = { original, geometry: toCreasedNormals(copy, Math.PI), users: 0 };
      this.geometries.set(original, entry);
    }
    entry.users++;
    return entry;
  }

  private releaseGeometry(entry: OutlineGeometry) {
    if (--entry.users === 0) {
      this.geometries.delete(entry.original);
      entry.geometry.dispose();
    }
  }

  private remove(mesh: Mesh, entry: OutlineEntry) {
    mesh.remove(entry.shell);
    this.releaseGeometry(entry.geometry);
    entry.material.dispose();
    this.entries.delete(mesh);
  }
  dispose() {
    this.watched.forEach(object => {
      object.removeEventListener("childadded", this.childAdded);
      object.removeEventListener("childremoved", this.childRemoved);
    });
    this.watched.clear();
    this.scopes.clear();
    this.candidates.clear();
    this.entries.forEach((entry, mesh) => this.remove(mesh, entry));
    this.scene = null;
    this.active = false;
  }
}
