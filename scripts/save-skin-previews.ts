import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { BOB_SKINS } from "../src/components/bob/skins/registry";

async function main() {
  const input = process.argv[2];
  if (!input) throw new Error("Pass the downloaded skin-previews.json path.");
  const previews = JSON.parse(await readFile(input, "utf8")) as Record<string, string>;
  const output = new URL("../public/images/shop-items/skin/", import.meta.url);
  // Validate the complete bundle before changing any saved thumbnail.
  const images = BOB_SKINS.map(skin => {
    const data = previews[skin.id];
    if (!data?.startsWith("data:image/png;base64,")) throw new Error(`Missing PNG: ${skin.id}`);
    const bytes = Buffer.from(data.slice("data:image/png;base64,".length), "base64");
    if (bytes.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a" || bytes.readUInt32BE(16) !== 160 || bytes.readUInt32BE(20) !== 160) throw new Error(`Invalid 160px PNG: ${skin.id}`);
    return { id: skin.id, bytes };
  });
  await mkdir(output, { recursive: true });
  for (const image of images) await writeFile(new URL(`${image.id}.png`, output), image.bytes);
  console.log(`Saved ${images.length} Bob thumbnails to ${fileURLToPath(output)}`);
}

main().catch(error => { console.error(error); process.exitCode = 1; });
