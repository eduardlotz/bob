import { readFileSync, statSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { formatNumber } from "./formatNumber.ts";

const sourceUrl = new URL("../../public/fonts/OpenRundeBold.json", import.meta.url);
const subsetUrl = new URL("../../public/fonts/OpenRundeBoldCounter.json", import.meta.url);
const source = JSON.parse(readFileSync(sourceUrl, "utf8"));
const subset = JSON.parse(readFileSync(subsetUrl, "utf8"));

test("the counter subset preserves authored outlines and font metrics", () => {
  const { glyphs, ...metrics } = source;
  const { glyphs: subsetGlyphs, ...subsetMetrics } = subset;
  assert.deepEqual(subsetMetrics, metrics);
  for (const [character, outline] of Object.entries(subsetGlyphs)) assert.deepEqual(outline, glyphs[character]);
  assert.ok(statSync(subsetUrl).size < statSync(sourceUrl).size * 0.05);
});

test("small, compact, negative, extreme, and sleep labels render with identical geometry", () => {
  const originalFont = new FontLoader().parse(source);
  const counterFont = new FontLoader().parse(subset);
  const labels = ["Z", ...[0, 1, 9999, 10000, 1e6, 1e9, 1e12, 1e18, 1e24, 1e33, -12345, Infinity, NaN].map(value => formatNumber(value))];
  for (const label of labels) {
    for (const character of label) assert.ok(subset.glyphs[character], `Missing glyph: ${character}`);
    const points = font => font.generateShapes(label, 1).map(shape => shape.getPoints());
    assert.deepEqual(points(counterFont), points(originalFont), label);
  }
});
