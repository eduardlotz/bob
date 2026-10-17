import * as T from "three";
import { assemble, type Part, type Vec3 } from "./worlds/InstancedModels";
import { createParticleTexture } from "@/utils/emojiTexture";

export type NewTapEffect = "comic" | "flowers" | "ducks" | "electric";
export const COMIC_VARIANTS = ["POW!", "BAM!", "POP!", "!", "?", "*", "POW!", "!", "BOOM!"] as const;

export function comicTexture(variant: number) {
  return createParticleTexture((c) => {
    c.lineJoin = "round";
    c.lineWidth = 8;
    c.strokeStyle = "#201e2b";
    const colors = ["#ffcd38", "#ff638b", "#73d8ef", "#fff4dd"];
    // Three different silhouettes, plus words and punctuation with no backing.
    if (variant === 0 || variant === 1 || variant === 2 || variant === 8) {
      c.beginPath();
      if (variant === 1) {
        // A puffy comic cloud.
        c.moveTo(37, 93);
        c.bezierCurveTo(5, 55, 61, 27, 89, 51);
        c.bezierCurveTo(112, 4, 164, 17, 176, 48);
        c.bezierCurveTo(230, 23, 251, 76, 222, 105);
        c.bezierCurveTo(263, 147, 221, 199, 183, 188);
        c.bezierCurveTo(151, 235, 100, 231, 76, 197);
        c.bezierCurveTo(19, 222, -3, 151, 37, 130);
      } else if (variant === 2) {
        // Oval speech bubble and tail.
        c.ellipse(128, 114, 110, 80, -0.12, 0, Math.PI * 2);
        c.moveTo(80, 181); c.lineTo(58, 229); c.lineTo(118, 190);
      } else {
        const points = variant === 8 ? 8 : 12;
        for (let i = 0; i < points * 2; i++) {
          const angle = i * Math.PI / points;
          const r = i % 2 ? 76 : (i % 4 ? 116 : 124);
          const x = 128 + Math.cos(angle) * r, y = 128 + Math.sin(angle) * r * 0.8;
          if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
        }
      }
      c.closePath(); c.fillStyle = colors[variant % colors.length]; c.fill(); c.stroke();
    }
    const character = COMIC_VARIANTS[variant];
    c.font = `900 ${character.length === 1 ? 184 : character.length > 4 ? 48 : 57}px sans-serif`;
    c.textAlign = "center"; c.textBaseline = "middle";
    c.lineWidth = character.length === 1 ? 12 : 7;
    c.strokeText(character, 128, 133);
    c.fillStyle = variant >= 3 && variant <= 7 ? colors[variant % colors.length] : "#fffdf1";
    c.fillText(character, 128, 133);
  }, 256);
}

export function flowerGeometry(variant: number) {
  const parts: Part[] = [];
  const petals = [6, 8, 5][variant];
  for (let i = 0; i < petals; i++) {
    const a = i * Math.PI * 2 / petals;
    parts.push([new T.IcosahedronGeometry(1, 0), ["#f076b4", "#fff1d5", "#a481e8"][variant],
      [Math.cos(a) * 0.34, Math.sin(a) * 0.34, 0], [0.29, 0.18, 0.12], [0, 0, a]]);
  }
  parts.push([new T.IcosahedronGeometry(0.22, 1), "#f5c447", [0, 0, 0.04], [1, 1, 0.65]]);
  // Short stem and leaf make these read as small 3D flowers from all angles.
  parts.push([new T.CylinderGeometry(0.035, 0.035, 0.65, 5), "#548a49", [0, -0.4, -0.06]]);
  parts.push([new T.OctahedronGeometry(1), "#74ac55", [0.15, -0.48, -0.06], [0.22, 0.09, 0.045], [0, 0, 0.45]]);
  return assemble(parts);
}

export function duckGeometry() {
  const parts: Part[] = [
    [new T.IcosahedronGeometry(1, 1), "#f9ce38", [0, 0, 0], [0.42, 0.28, 0.31]],
    [new T.IcosahedronGeometry(1, 1), "#ffdd46", [0.25, 0.32, 0], [0.24, 0.24, 0.24]],
    [new T.ConeGeometry(0.17, 0.26, 4), "#ed8730", [0.51, 0.28, 0], [1, 1, 0.55], [0, 0, -Math.PI / 2]],
    [new T.ConeGeometry(0.18, 0.33, 5), "#f9ce38", [-0.38, 0.08, 0], [1, 1, 0.7], [0, 0, Math.PI / 3]],
  ];
  for (const side of [-1, 1]) {
    parts.push([new T.IcosahedronGeometry(1, 0), "#edb82e", [-0.04, 0.03, side * 0.27], [0.25, 0.13, 0.065]]);
    parts.push([new T.SphereGeometry(0.032, 6, 4), "#202329", [0.34, 0.38, side * 0.19]]);
  }
  return assemble(parts);
}

export function lightningGeometry(variant: number) {
  const parts: Part[] = [];
  const points: Vec3[] = [[0, -1.4, 0], [0.12, -0.95, 0.03], [-0.16, -0.55, -0.03],
    [0.16, -0.15, 0.02], [-0.13, 0.3, -0.02], [0.13, 0.75, 0.03], [0, 1.4, 0]];
  const bend = variant % 2 ? -1 : 1;
  const curve = new T.CatmullRomCurve3(points.map(([x, y, z]) => new T.Vector3(x * bend * (1 + variant * 0.25), y, z)));
  parts.push([new T.TubeGeometry(curve, 24, 0.025, 4, false), "#ffda39"]);
  // Forks stay part of the same instanced geometry.
  for (const side of variant === 2 ? [-1, 1] : [bend]) {
    const branch = new T.CatmullRomCurve3([new T.Vector3(-0.1, 0.3, 0), new T.Vector3(side * 0.3, 0.52, 0.04), new T.Vector3(side * 0.24, 0.73, 0), new T.Vector3(side * 0.55, 0.95, 0.03)]);
    parts.push([new T.TubeGeometry(branch, 10, 0.017, 4, false), "#fff095"]);
  }
  return assemble(parts);
}
