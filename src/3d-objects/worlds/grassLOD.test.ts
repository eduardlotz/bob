import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { createGrassBatches, updateGrassBatches, grassDensity, partitionGrassInstances, grassDetailDistances } from './grassLOD';

describe('grass patches and distance detail', () => {
  test('chunking preserves every root and its matching blade attributes, including negative cells', () => {
    const roots = new Float32Array([1, 0, 2, -1, 0, -2, 2, 0, 3, 20, 0, 20]);
    const shapes = new Float32Array([10, 11, 20, 21, 30, 31, 40, 41]);
    const chunks = partitionGrassInstances(roots, shapes, 3, 2);
    assert.equal(chunks.length, 3);
    assert.equal(chunks.reduce((n, c) => n + c.count, 0), 4);
    const paired = chunks.flatMap(c => Array.from({ length: c.count }, (_, i) => [c.primary[i * 3], c.secondary[i * 2]]));
    assert.deepEqual(paired.sort((a, b) => a[1] - b[1]), [[1, 10], [-1, 20], [2, 30], [20, 40]]);
  });
  test('instance-matrix translations and colors use the same partitioning', () => {
    const matrices = new Float32Array(32); matrices[12] = -8; matrices[14] = 2; matrices[28] = 8; matrices[30] = -2;
    const chunks = partitionGrassInstances(matrices, new Float32Array([1, 0, 0, 0, 1, 0]), 16, 3, 12, 14);
    assert.equal(chunks.length, 2);
    assert.equal(chunks[0].primary[12], -8); assert.deepEqual(Array.from(chunks[0].secondary), [1, 0, 0]);
    assert.equal(chunks[1].primary[14], -2); assert.deepEqual(Array.from(chunks[1].secondary), [0, 1, 0]);
  });
});

describe('three grass draws per field', () => {
  const field = () => {
    const roots: number[] = [], shapes: number[] = [];
    for (let z = -40; z <= 40; z += .5) for (let x = -40; x <= 40; x += .5) {
      roots.push(x, 0, z);
      const index = shapes.length / 4;
      shapes.push(.15, .65, (index * .61803398875) % 1, index);
    }
    return { roots: new Float32Array(roots), shapes: new Float32Array(shapes) };
  };
  test('dozens of patches become at most three draws, with paired attributes and no duplicate blades', () => {
    const { roots, shapes } = field();
    const chunks = partitionGrassInstances(roots, shapes, 3, 4);
    const batches = createGrassBatches(roots.length / 3);
    updateGrassBatches(chunks, batches, 0, 0, 'high');
    assert.ok(chunks.filter(c => Math.hypot(Math.max(0, Math.abs(c.x) - 3), Math.max(0, Math.abs(c.z) - 3)) < 26).length > 50);
    assert.equal(batches.filter(b => b.count > 0).length, 3);
    const seen = new Set<number>();
    batches.forEach((batch, lod) => { for (let i = 0; i < batch.count; i++) {
      const index = batch.shapes[i * 4 + 3];
      assert.ok(!seen.has(index)); seen.add(index);
      assert.equal(batch.roots[i * 3], roots[index * 3]);
      assert.equal(batch.roots[i * 3 + 2], roots[index * 3 + 2]);
      const distance = Math.hypot(batch.roots[i * 3], batch.roots[i * 3 + 2]);
      assert.equal(lod, distance < 8 ? 0 : distance < 18 ? 1 : 2);
      assert.ok(distance < 26.35);
    } });
  });
  test('camera travel, quality changes, and leaving a field update counts in the same buffers', () => {
    const { roots, shapes } = field();
    const chunks = partitionGrassInstances(roots, shapes, 3, 4);
    const batches = createGrassBatches(roots.length / 3);
    const buffers = batches.map(b => b.roots);
    const triangles = () => batches.reduce((sum, b, i) => sum + b.count * [8, 4, 2][i], 0);
    updateGrassBatches(chunks, batches, 0, 0, 'high');
    const high = triangles();
    assert.ok(high < roots.length / 3 * 8 * .15);
    updateGrassBatches(chunks, batches, 0, 0, 'low');
    assert.ok(triangles() < high);
    updateGrassBatches(chunks, batches, -30, 15, 'medium');
    assert.ok(batches[0].count > 0);
    updateGrassBatches(chunks, batches, 200, 200, 'medium');
    assert.deepEqual(batches.map(b => b.count), [0, 0, 0]);
    batches.forEach((b, i) => assert.equal(b.roots, buffers[i]));
  });
  test('CPU selection retains every blade that the distance shader can still show', () => {
    const { roots, shapes } = field();
    const chunks = partitionGrassInstances(roots, shapes, 3, 4);
    const batches = createGrassBatches(roots.length / 3);
    for (const quality of ['low', 'medium', 'high'] as const) {
      updateGrassBatches(chunks, batches, 3, -2, quality);
      const submitted = new Set(batches.flatMap(b => Array.from({ length: b.count }, (_, i) => b.shapes[i * 4 + 3])));
      for (let i = 0; i < roots.length / 3; i++) {
        const distance = Math.hypot(roots[i * 3] - 3, roots[i * 3 + 2] + 2);
        if (distance < grassDetailDistances[quality].end && shapes[i * 4 + 2] < grassDensity(distance, quality)) {
          assert.ok(submitted.has(i), `missing visible blade ${i} on ${quality}`);
        }
      }
    }
  });
});
