export type GrassQuality = 'low' | 'medium' | 'high';

export const GRASS_CHUNK_SIZE = 6;
export const grassDetailDistances = {
  low: { detailed: 4, sparse: 9, end: 14 },
  medium: { detailed: 6, sparse: 13, end: 20 },
  high: { detailed: 8, sparse: 18, end: 26 },
};

export type GrassChunk = ReturnType<typeof partitionGrassInstances>[number];
export type GrassBatch = { roots: Float32Array; shapes: Float32Array; count: number };

/** Three reusable upload buffers, independent of the number of spatial cells. */
export function createGrassBatches(count: number): GrassBatch[] {
  return Array.from({ length: 3 }, () => ({
    roots: new Float32Array(count * 3), shapes: new Float32Array(count * 4), count: 0,
  }));
}

// Keep this curve in sync with grassDistanceGLSL. A small CPU margin lets the
// vertex shader finish shrinking blades before they leave the upload buffers.
export function grassDensity(distance: number, quality: GrassQuality) {
  const limits = grassDetailDistances[quality];
  const t = Math.max(0, Math.min(1, (distance - limits.detailed) / (limits.sparse - limits.detailed)));
  return 1.08 - .88 * t * t * (3 - 2 * t);
}

export const grassDistanceGLSL = `
  uniform vec2 uEye;
  uniform vec3 uDetailDistances;
  float grassVisibility(vec2 root, float rank) {
    float distanceToEye = length(uEye - root);
    float density = 1.08 - .88 * smoothstep(uDetailDistances.x, uDetailDistances.y, distanceToEye);
    float thinning = 1.0 - smoothstep(density - .08, density, rank);
    return thinning * (1.0 - smoothstep(uDetailDistances.z * .75, uDetailDistances.z, distanceToEye));
  }
`;

/** Compact only nearby, surviving blades into three draws (4/2/1 segments).
 * Cells remain a CPU acceleration structure; they never become scene objects.
 */
export function updateGrassBatches(chunks: GrassChunk[], batches: GrassBatch[], eyeX: number, eyeZ: number, quality: GrassQuality) {
  const limits = grassDetailDistances[quality];
  for (const batch of batches) batch.count = 0;
  for (const chunk of chunks) {
    const nearest = Math.hypot(Math.max(0, Math.abs(chunk.x - eyeX) - GRASS_CHUNK_SIZE / 2),
      Math.max(0, Math.abs(chunk.z - eyeZ) - GRASS_CHUNK_SIZE / 2));
    if (nearest >= limits.end + .35) continue;
    for (let i = 0; i < chunk.count; i++) {
      const x = chunk.primary[i * 3], z = chunk.primary[i * 3 + 2];
      const distance = Math.hypot(x - eyeX, z - eyeZ);
      if (distance >= limits.end + .35 || chunk.secondary[i * 4 + 2] > grassDensity(distance - .35, quality)) continue;
      const batch = batches[distance < limits.detailed ? 0 : distance < limits.sparse ? 1 : 2];
      const n = batch.count++;
      for (let j = 0; j < 3; j++) batch.roots[n * 3 + j] = chunk.primary[i * 3 + j];
      for (let j = 0; j < 4; j++) batch.shapes[n * 4 + j] = chunk.secondary[i * 4 + j];
    }
  }
}

/** Partition source data once so CPU distance selection can skip whole cells. */
export function partitionGrassInstances(primary: Float32Array, secondary: Float32Array,
  primaryStride: number, secondaryStride: number, xIndex = 0, zIndex = 2) {
  const cells = new Map<string, { x: number; z: number; indices: number[] }>();
  for (let i = 0; i < primary.length / primaryStride; i++) {
    const x = Math.floor(primary[i * primaryStride + xIndex] / GRASS_CHUNK_SIZE);
    const z = Math.floor(primary[i * primaryStride + zIndex] / GRASS_CHUNK_SIZE);
    const key = `${x}:${z}`;
    let cell = cells.get(key);
    if (!cell) { cell = { x: (x + .5) * GRASS_CHUNK_SIZE, z: (z + .5) * GRASS_CHUNK_SIZE, indices: [] }; cells.set(key, cell); }
    cell.indices.push(i);
  }
  return Array.from(cells.values(), cell => {
    const first = new Float32Array(cell.indices.length * primaryStride);
    const second = new Float32Array(cell.indices.length * secondaryStride);
    cell.indices.forEach((index, i) => {
      first.set(primary.subarray(index * primaryStride, (index + 1) * primaryStride), i * primaryStride);
      second.set(secondary.subarray(index * secondaryStride, (index + 1) * secondaryStride), i * secondaryStride);
    });
    return { x: cell.x, z: cell.z, count: cell.indices.length, primary: first, secondary: second };
  });
}

