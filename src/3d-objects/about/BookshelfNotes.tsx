import { useEffect, useMemo } from "react";
import { CanvasTexture, SRGBColorSpace } from "three";
import { useI18n } from "@/i18n";
import { ABOUT_BOOKSHELF } from "../books/shelfLayout";
import { aboutRoomMessages } from "./aboutRoom.messages";

const TIERS = ["will-read", "have-read", "have-read", "currently-reading"] as const;

/** Localized paper labels stay in the room, separate from the Blender lighting bake. */
function PaperNote({ title, row }: { title: string; row: number }) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas"); canvas.width = 640; canvas.height = 160;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#f2e7c9"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    let seed = 6821;
    for (let i = 0; i < 1800; i++) {
      seed = (seed * 1664525 + 1013904223) >>> 0; const x = seed % canvas.width;
      seed = (seed * 1664525 + 1013904223) >>> 0; const y = seed % canvas.height;
      ctx.fillStyle = i % 2 ? "#fff6" : "#8b794414"; ctx.fillRect(x, y, 1, 1);
    }
    ctx.fillStyle = "#3b342a"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    let size = 55;
    do { ctx.font = `${size--}px "Nunito", Helvetica, Arial, sans-serif`; } while (ctx.measureText(title).width > 590 && size > 28);
    ctx.fillText(title, 320, 82);
    const map = new CanvasTexture(canvas); map.colorSpace = SRGBColorSpace; return map;
  }, [title]);
  useEffect(() => () => texture.dispose(), [texture]);
  return <mesh name={`bookshelf-category-note-${row}`} raycast={() => {}}
    position={[ABOUT_BOOKSHELF.position[0] + .58, ABOUT_BOOKSHELF.position[1] + ABOUT_BOOKSHELF.levels[row] - .012, -4.181]}
    rotation={[0, 0, row % 2 ? -.025 : .035]}>
    <planeGeometry args={[.23, .0575]} />
    <meshBasicMaterial map={texture} color="#737a85" />
  </mesh>;
}

export function BookshelfNotes() {
  const { locale } = useI18n();
  const labels = aboutRoomMessages[locale].bookCategories;
  return <>{TIERS.map((category, row) => <PaperNote key={row} title={labels[category]} row={row} />)}</>;
}
