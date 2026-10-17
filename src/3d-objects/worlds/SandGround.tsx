import { useEffect, useMemo } from "react";
import * as T from "three";
import { seededRandom } from "./quality";
import { WorldToonMaterial } from "./WorldToonMaterial";

/** Bake tileable patches and grain once; rendering needs only one texture sample. */
export function createSandTexture(groundColor: string, accentColor: string) {
  const size = 512;
  const random = seededRandom(729);
  const cells = 8;
  const field = Float32Array.from({ length: cells * cells }, random);
  const noise = (x: number, y: number) => {
    const ix = Math.floor(x), iy = Math.floor(y);
    const u = T.MathUtils.smoothstep(x - ix, 0, 1);
    const v = T.MathUtils.smoothstep(y - iy, 0, 1);
    const sample = (dx: number, dy: number) => field[((iy + dy) % cells) * cells + ((ix + dx) % cells)];
    return T.MathUtils.lerp(
      T.MathUtils.lerp(sample(0, 0), sample(1, 0), u),
      T.MathUtils.lerp(sample(0, 1), sample(1, 1), u), v,
    );
  };
  const pixels = new Uint8Array(size * size * 4);
  const base = new T.Color(groundColor);
  const accent = new T.Color(accentColor);
  const shade = new T.Color();
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const patch = noise(x / size * cells, y / size * cells);
      const detail = noise(x / size * cells * 4, y / size * cells * 4);
      shade.copy(base).lerp(accent, 0.18 + patch * 0.65)
        .multiplyScalar(0.94 + detail * 0.08 + (random() - 0.5) * 0.065)
        .convertLinearToSRGB();
      const i = (y * size + x) * 4;
      pixels[i] = Math.round(shade.r * 255);
      pixels[i + 1] = Math.round(shade.g * 255);
      pixels[i + 2] = Math.round(shade.b * 255);
      pixels[i + 3] = 255;
    }
  }
  const texture = new T.DataTexture(pixels, size, size);
  texture.colorSpace = T.SRGBColorSpace;
  texture.wrapS = texture.wrapT = T.RepeatWrapping;
  texture.repeat.set(12, 12);
  texture.magFilter = T.LinearFilter;
  texture.minFilter = T.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

export function SandGround({ groundColor, accentColor, y }: {
  groundColor: string; accentColor: string; y: number;
}) {
  const texture = useMemo(() => createSandTexture(groundColor, accentColor), [groundColor, accentColor]);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <mesh name="desert-sand-ground" position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[96, 64]} />
      <WorldToonMaterial map={texture} />
    </mesh>
  );
}
