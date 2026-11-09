import { useGLTF } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import { Material, Mesh, MeshBasicMaterial, MeshStandardMaterial } from "three";
import { CloudSky } from "@/3d-objects/worlds/CloudSky";
import { FLOOR_Y_POSITION } from "@/store/config/scene";

export const LIBRARY_MODEL = "/gltf/library/library-marble-baked.glb?revision=soft-stone-v1";

/** Blender's combined bake supplies marble, indirect light, shadows and gloss. */
export function LibraryRoom() {
  const { scene } = useGLTF(LIBRARY_MODEL);
  const { object, materials } = useMemo(() => {
    const object = scene.clone(true);
    const materials: Material[] = [];
    const copies = new Map<Material, MeshBasicMaterial>();
    object.traverse(child => {
      if (!(child instanceof Mesh)) return;
      const baked = (source: Material) => {
        const existing = copies.get(source);
        if (existing) return existing;
        const map = source instanceof MeshBasicMaterial ? source.map
          : source instanceof MeshStandardMaterial ? source.emissiveMap ?? source.map : null;
        if (!map) throw new Error("Library scenery is missing its Blender lighting bake");
        map.anisotropy = 8;
        const material = new MeshBasicMaterial({ map, color: "white", side: source.side, toneMapped: false });
        material.name = "Library_Baked_Daylight";
        copies.set(source, material);
        materials.push(material);
        return material;
      };
      child.material = Array.isArray(child.material) ? child.material.map(baked) : baked(child.material);
      child.castShadow = false;
      child.receiveShadow = false;
    });
    return { object, materials };
  }, [scene]);
  useEffect(() => () => materials.forEach(material => material.dispose()), [materials]);
  return <primitive object={object} dispose={null} />;
}

export function LibraryDaylight() {
  return <>
    <CloudSky climate="city" colors={["#93afc7", "#c5d4df", "#e7eceb"]} stops={[0, .48, 1]} sunDirection={[-.4, 1, .6]} />
    {/* Only the movable books and Bob need live lighting. Match Blender's sun. */}
    <hemisphereLight args={["#edf5ff", "#acb5bd", 1.35]} />
    <directionalLight position={[-8, 11, 7]} color="#fff5e8" intensity={1.8} castShadow
      shadow-mapSize={[1024, 1024]} shadow-camera-left={-16} shadow-camera-right={16}
      shadow-camera-top={16} shadow-camera-bottom={-16} shadow-camera-far={60}
      shadow-normalBias={.025} shadow-bias={-.0001} shadow-radius={4} />
  </>;
}

/** Receive shadows from Bob and movable books without relighting the bake. */
export function LibraryBobShadow() {
  return <mesh position={[0, FLOOR_Y_POSITION + .034, -2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
    <planeGeometry args={[24.5, 24.5]} />
    <shadowMaterial color="#354963" transparent opacity={.4} depthWrite={false} />
  </mesh>;
}
