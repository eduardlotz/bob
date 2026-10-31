import { useEffect, useMemo } from 'react';
import * as T from 'three';
import { assemble, type Part } from '@/3d-objects/worlds/InstancedModels';

/** A small lobby token built from primitives; the playable cabinet owns the detail. */
export function SlotMachineLobbyPreview() {
  const geometry = useMemo(() => {
    const parts: Part[] = [
      [new T.BoxGeometry(1, 1.1, .62), '#b72c39', [0, .66, 0]],
      [new T.BoxGeometry(1.08, .22, .68), '#f4c66b', [0, 1.3, 0]],
      [new T.BoxGeometry(1.08, .16, .7), '#792332', [0, .1, 0]],
      [new T.BoxGeometry(.86, .45, .05), '#2d1c21', [0, .83, .335]],
      [new T.BoxGeometry(.055, .5, .055), '#f4c66b', [.65, .7, 0]],
      [new T.SphereGeometry(.10, 10, 8), '#d23b42', [.65, .99, 0]],
    ];
    for (const x of [-.27, 0, .27]) {
      parts.push([new T.BoxGeometry(.23, .33, .035), '#fff7e5', [x, .83, .38]]);
      parts.push([new T.TorusGeometry(.06, .018, 5, 12), '#b72c39', [x, .83, .405]]);
    }
    return assemble(parts);
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} castShadow receiveShadow><meshToonMaterial vertexColors /></mesh>;
}
