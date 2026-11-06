import { useEffect, useMemo, useRef } from "react";
import { CanvasTexture, SRGBColorSpace } from "three";

export interface TemplateCoverData {
  title: string;
  author: string;
  label?: string;
  background?: string;
  accent?: string;
}

/** The same deterministic template paints both the magazine texture and its detail preview. */
export function drawTemplateCover(ctx: CanvasRenderingContext2D, data: TemplateCoverData, width: number, height: number) {
  const accent = data.accent ?? "#708d78";
  ctx.fillStyle = data.background ?? "#f8ebd0";
  ctx.fillRect(0, 0, width, height);
  const margin = width * 0.075;
  ctx.fillStyle = accent;
  ctx.fillRect(margin, height * 0.05, width - margin * 2, height * 0.07);
  ctx.fillStyle = "#fff6e3";
  ctx.font = `900 ${width * 0.038}px Nunito, sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText(data.label ?? "READING NOTES", width / 2, height * 0.095, width - margin * 3);

  let fontSize = width * 0.112;
  let lines: string[] = [];
  while (fontSize >= width * 0.045) {
    ctx.font = `900 ${fontSize}px Nunito, sans-serif`;
    lines = [];
    let line = "";
    for (const word of data.title.split(/\s+/)) {
      const next = line ? `${line} ${word}` : word;
      if (line && ctx.measureText(next).width > width - margin * 2) { lines.push(line); line = word; }
      else line = next;
    }
    if (line) lines.push(line);
    if (lines.length * fontSize * 1.12 < height * 0.34) break;
    fontSize -= 2;
  }
  ctx.fillStyle = "#3e392e";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  lines.forEach((line, i) => ctx.fillText(line, margin, height * 0.17 + i * fontSize * 1.12));

  // A shared geometric motif makes this a reusable cover, rather than an illustration per article.
  ctx.save();
  ctx.translate(width * 0.5, height * 0.66);
  ctx.rotate(-0.18);
  ctx.fillStyle = accent;
  ctx.fillRect(-width * 0.31, -width * 0.22, width * 0.62, width * 0.44);
  ctx.fillStyle = "#f2ca75";
  ctx.beginPath(); ctx.arc(width * 0.11, 0, width * 0.2, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#3e392e"; ctx.lineWidth = width * 0.012;
  ctx.strokeRect(-width * 0.31, -width * 0.22, width * 0.62, width * 0.44);
  ctx.restore();
  ctx.fillStyle = "#3e392e";
  ctx.font = `800 ${width * 0.045}px Nunito, sans-serif`;
  ctx.fillText(data.author, margin, height * 0.87, width - margin * 2);
  ctx.fillRect(margin, height * 0.95, width * 0.2, height * 0.008);
}

export function useTemplateCover(data: TemplateCoverData) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas"); canvas.width = 384; canvas.height = 576;
    drawTemplateCover(canvas.getContext("2d")!, data, canvas.width, canvas.height);
    const result = new CanvasTexture(canvas); result.colorSpace = SRGBColorSpace;
    return result;
  }, [data.title, data.author, data.label, data.background, data.accent]);
  useEffect(() => {
    let active = true;
    void document.fonts.ready.then(() => {
      if (!active) return;
      const canvas = texture.image as HTMLCanvasElement;
      drawTemplateCover(canvas.getContext("2d")!, data, canvas.width, canvas.height);
      texture.needsUpdate = true;
    });
    return () => { active = false; texture.dispose(); };
  }, [texture]);
  return texture;
}

export function TemplateCoverPreview({ data }: { data: TemplateCoverData }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let active = true;
    const draw = () => { if (active && ref.current) drawTemplateCover(ref.current.getContext("2d")!, data, 384, 576); };
    draw(); void document.fonts.ready.then(draw);
    return () => { active = false; };
  }, [data.title, data.author, data.label, data.background, data.accent]);
  return <canvas ref={ref} width={384} height={576} role="img" aria-label={`${data.title} — ${data.author}`} style={{ width: 140, alignSelf: "center" }} />;
}
