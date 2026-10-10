import * as T from "three";

const hash = (x: number, z: number) => {
  const n = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return n - Math.floor(n);
};
const smooth = (t: number) => t * t * (3 - 2 * t);

/** Shared patch field ties blade tint, tuft height, and ground tones together. */
export function grassPatch(x: number, z: number) {
  x /= 2.8;
  z /= 2.8;
  const ix = Math.floor(x),
    iz = Math.floor(z);
  const u = smooth(x - ix),
    v = smooth(z - iz);
  return T.MathUtils.lerp(
    T.MathUtils.lerp(hash(ix, iz), hash(ix + 1, iz), u),
    T.MathUtils.lerp(hash(ix, iz + 1), hash(ix + 1, iz + 1), u),
    v,
  );
}

/** Bake once: the ground needs one texture sample, not noise evaluation per pixel. */
export function grassGroundTexture(radius: number) {
  const size = 256;
  const pixels = new Uint8Array(size * size * 4);
  const base = new T.Color("#3a6121");
  const shade = new T.Color();
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const px = (((x + 0.5) / size) * 2 - 1) * radius;
      // A circle rotated onto the ground maps its local Y to world -Z.
      const pz = -(((y + 0.5) / size) * 2 - 1) * radius;
      const edge =
        1 - T.MathUtils.smoothstep(Math.hypot(px, pz), radius * 0.7, radius);
      const patch = grassPatch(px, pz);
      const grain = hash(x, y) - 0.5;
      shade
        .copy(base)
        .multiplyScalar(1 + edge * ((patch - 0.5) * 0.25 + grain * 0.025));
      shade.convertLinearToSRGB();
      const i = (y * size + x) * 4;
      pixels[i] = Math.round(shade.r * 255);
      pixels[i + 1] = Math.round(shade.g * 255);
      pixels[i + 2] = Math.round(shade.b * 255);
      pixels[i + 3] = 255;
    }
  }
  const texture = new T.DataTexture(pixels, size, size);
  texture.colorSpace = T.SRGBColorSpace;
  texture.magFilter = T.LinearFilter;
  texture.minFilter = T.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}
