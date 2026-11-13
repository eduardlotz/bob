/** CSS-pixel cells: high-density desktop Macs need the larger grid. iPads
 * sometimes identify as Macs, so exclude touch devices from this correction. */
export function getCameraDitherPixelSize(platform: string, dpr: number, touchPoints = 0) {
  return /Mac/i.test(platform) && touchPoints === 0 && dpr >= 1.5 ? 2 : 1;
}

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

/** Quantize sRGB colors on the preview's integer grid, independently of the
 * full screen and WebGL drawing-buffer density. */
export function ditherCameraImage(data: Uint8ClampedArray, width: number, height: number, cellSize: number) {
  const step = Math.max(1, Math.round(cellSize));
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const sampleX = Math.min(width - 1, x + Math.floor(step / 2));
      const sampleY = Math.min(height - 1, y + Math.floor(step / 2));
      const sample = (sampleY * width + sampleX) * 4;
      const threshold = (BAYER[((y / step) % 4) * 4 + (x / step) % 4] + 0.5) / 16;
      const r = Math.min(255, Math.floor(data[sample] / 85 + threshold) * 85);
      const g = Math.min(255, Math.floor(data[sample + 1] / 85 + threshold) * 85);
      const b = Math.min(255, Math.floor(data[sample + 2] / 85 + threshold) * 85);
      for (let dy = y; dy < Math.min(y + step, height); dy++) {
        for (let dx = x; dx < Math.min(x + step, width); dx++) {
          const i = (dy * width + dx) * 4;
          data[i] = r; data[i + 1] = g; data[i + 2] = b;
        }
      }
    }
  }
}
