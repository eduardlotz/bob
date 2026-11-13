import type { Book } from "@/store/books";
import * as THREE from "three";

export function loadCoverFonts(book: Book) {
  return Promise.all([
    document.fonts.load('900 16px "Nunito"', book.title),
    document.fonts.load('600 16px "Nunito"', book.author),
  ]);
}

export function paintCover(
  ctx: CanvasRenderingContext2D,
  b: Book,
  W: number,
  H: number,
) {
  const bg = b.fallbackBackgroundColor;
  const fg = b.fallbackTextColor;

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const marginX = W * 0.08;
  const panelTop = H * 0.06;
  const panelBot = H * 0.4;
  const panelW = W - marginX * 2;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(marginX, panelTop, panelW, panelBot - panelTop);

  const barH = Math.max(4, H * 0.038);
  ctx.fillStyle = fg;
  ctx.fillRect(marginX, panelBot, panelW, barH);

  const pad = W * 0.06;
  const textX = marginX + pad;
  const maxW = panelW - pad * 2;
  // Available vertical space for title inside the panel (leave room for author)
  const maxTitleH = (panelBot - panelTop) * 0.65;

  // ── Auto-size title to fit ≤ 3 lines ─────────────────────────────────────
  const MAX_LINES = 3;
  const TITLE_MAX = Math.floor(W * 0.13);
  const TITLE_MIN = Math.floor(W * 0.07);

  let titleFS = TITLE_MAX;
  let titleLines: string[] = [];

  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  for (let fs = TITLE_MAX; fs >= TITLE_MIN; fs -= 2) {
    ctx.font = `900 ${fs}px "Nunito", sans-serif`;
    const lines = wrapText(ctx, b.title, maxW);
    const lineH = fs * 1.25;
    if (
      lines.length <= MAX_LINES &&
      lines.length * lineH <= maxTitleH &&
      lines.every((line) => ctx.measureText(line).width <= maxW)
    ) {
      titleFS = fs;
      titleLines = lines;
      break;
    }
    // Keep last attempt as fallback (TITLE_MIN)
    titleFS = fs;
    titleLines = lines.slice(0, MAX_LINES);
  }

  ctx.font = `900 ${titleFS}px "Nunito", sans-serif`;
  ctx.fillStyle = "#1a1a1a";
  const lineH = titleFS * 1.25;
  titleLines.forEach((line, i) =>
    ctx.fillText(line, textX, panelTop + H * 0.05 + i * lineH, maxW),
  );

  // ── Author ────────────────────────────────────────────────────────────────
  const authorFS = Math.floor(W * 0.085);
  ctx.font = `600 ${authorFS}px "Nunito", sans-serif`;
  ctx.fillStyle = "#3a3a3a";
  const authorY =
    panelTop + H * 0.05 + titleLines.length * lineH + authorFS * 0.5;
  ctx.fillText(b.author, textX, authorY, maxW);
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

// ── Cover texture ─────────────────────────────────────────────────────────────
const coverCache = new Map<number, THREE.CanvasTexture>();

export function getCoverTex(b: Book): THREE.CanvasTexture {
  if (!coverCache.has(b.id)) {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 192;
    paintCover(canvas.getContext("2d")!, b, 128, 192);
    const tex = new THREE.CanvasTexture(canvas);
    coverCache.set(b.id, tex);
    let hasJacket = false;

    // Canvas textures do not repaint automatically when a web font arrives.
    void loadCoverFonts(b)
      .then(() => {
        if (hasJacket) return;
        paintCover(canvas.getContext("2d")!, b, 128, 192);
        tex.needsUpdate = true;
      })
      .catch(() => {
        /* Keep the initial fallback if Google Fonts is unavailable. */
      });

    if (b.isbn) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        // OpenLibrary serves a tiny placeholder (~1×1) when no cover exists.
        // Keep the fallback canvas if the image is suspiciously small.
        if (img.naturalWidth < 50 || img.naturalHeight < 50) return;
        hasJacket = true;
        const ctx = canvas.getContext("2d")!;
        ctx.clearRect(0, 0, 128, 192);
        ctx.drawImage(img, 0, 0, 128, 192);
        tex.needsUpdate = true;
      };
      // onerror = network failure → fallback canvas stays, no action needed
      img.src = `https://covers.openlibrary.org/b/isbn/${b.isbn}-L.jpg`;
    }
  }
  return coverCache.get(b.id)!;
}
