import * as THREE from "three";

/** Shared canvas-texture setup for emoji and outlined comic particles. */
export const createParticleTexture = (
  draw: (context: CanvasRenderingContext2D, size: number) => void,
  size = 128,
) => {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.clearRect(0, 0, size, size);
  draw(context, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
};

export const createEmojiTexture = (emoji: string) => createParticleTexture((context, size) => {
  context.font = "96px Apple Color Emoji, Segoe UI Emoji, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(emoji, size / 2, size / 2 + 4);
});
