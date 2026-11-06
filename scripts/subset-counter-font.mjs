import { readFileSync, writeFileSync } from "node:fs";

// Preserve the exact authored outlines and metrics used by counters and sleep Zs.
const source = JSON.parse(readFileSync(new URL("../public/fonts/OpenRundeBold.json", import.meta.url), "utf8"));
const characters = new Set([...Array.from({ length: 95 }, (_, index) => String.fromCharCode(index + 32)), ..."−∞µ\u00a0\u202f"]);
const subset = { ...source, glyphs: Object.fromEntries(Object.entries(source.glyphs).filter(([character]) => characters.has(character))) };
const output = JSON.stringify(subset);
writeFileSync(new URL("../public/fonts/OpenRundeBoldCounter.json", import.meta.url), output + "\n");
console.log(`Counter font: ${Object.keys(subset.glyphs).length} glyphs, ${(Buffer.byteLength(output) / 1024).toFixed(1)} KiB.`);
