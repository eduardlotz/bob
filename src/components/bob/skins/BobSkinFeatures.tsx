import { useEffect, useMemo } from "react";
import * as T from "three";
import { LeafCanopies, type Canopy } from "@/3d-objects/worlds/StylizedVegetation";
import { assemble, type Part } from "@/3d-objects/worlds/InstancedModels";
import { getBlobFormHalfSize, getCubeCornerRadius, isBoxForm, type BlobFormParameters, type BlobFormType } from "@/types/blobForms";
import { getEggRadiusAtY } from "@/types/eggShape";
import type { Vec3 } from "@/3d-objects/worlds/InstancedModels";
import type { BobSkin } from "./registry";

const BUSH_CANOPY: Canopy[] = [{ center: [0, 0, 0], size: [1, 1, 1], scale: .64 }];

/** Extra skin geometry shares Bob's transform, shape changes and game movement. */
export function BobSkinFeatures({ skin, form, parameters }: {
  skin: BobSkin; form: BlobFormType; parameters: BlobFormParameters;
}) {
  const size = getBlobFormHalfSize(form, parameters);
  const surface = useMemo(() => {
    if (isBoxForm(form)) {
      const radius = getCubeCornerRadius(parameters);
      return (normal: Vec3): Vec3 => {
        const maximum = Math.max(...normal.map(Math.abs));
        return normal.map((n, i) => n / maximum * (1 - radius / size[i]) + n * radius / size[i]) as Vec3;
      };
    }
    if (form === "egg") return ([x, y, z]: Vec3): Vec3 => {
      const ring = Math.sqrt(Math.max(.0001, 1 - y * y));
      const radius = getEggRadiusAtY(y * size[1], parameters);
      return [x / ring * radius / size[0], y, z / ring * radius / size[2]];
    };
    return undefined;
  }, [form, size[0], size[1], size[2], parameters]);
  if (skin.id === "bush") return <group scale={size} name="bob-bush-skin">
    <LeafCanopies canopies={BUSH_CANOPY} seed={1907} bush faceOpening surface={surface} />
  </group>;
  if (skin.id === "lightbulb") return <LightbulbFeatures size={size} />;
  return null;
}

function LightbulbFeatures({ size }: { size: [number, number, number] }) {
  const [socket, filament] = useMemo(() => {
    const parts: Part[] = [
      [new T.CylinderGeometry(.37, .33, .3, 24), "#92969c", [0, -.86, 0]],
      [new T.CylinderGeometry(.2, .2, .04, 20), "#343439", [0, -1.025, 0]],
    ];
    const points = [new T.Vector3(-.22, -.7, 0), new T.Vector3(-.24, .02, 0)];
    for (let i = 0; i <= 48; i++) {
      const t = i / 48;
      points.push(new T.Vector3(-.24 + t * .48, .08 + Math.sin(t * Math.PI * 6) * .075, Math.cos(t * Math.PI * 6) * .04));
    }
    points.push(new T.Vector3(.22, -.7, 0));
    return [assemble(parts), new T.TubeGeometry(new T.CatmullRomCurve3(points), 96, .017, 6, false)];
  }, []);
  useEffect(() => () => { socket.dispose(); filament.dispose(); }, [socket, filament]);
  return <group scale={size} name="bob-lightbulb-skin">
    <mesh geometry={socket} castShadow><meshToonMaterial vertexColors /></mesh>
    <mesh geometry={filament}><meshBasicMaterial color="#ffb52c" toneMapped={false} /></mesh>

  </group>;
}
