import * as T from "three";
import { assemble, type Part, type Vec3 } from "./worlds/InstancedModels";
import { createParticleTexture } from "@/utils/emojiTexture";

export type NewTapEffect = "comic" | "flowers" | "ducks" | "electric" | "autumn" | "paint";
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
    [new T.IcosahedronGeometry(1, 1), "#f9ce38", [0.25, 0.32, 0], [0.24, 0.24, 0.24]],
    [new T.ConeGeometry(0.12, 0.26, 5), "#f9ce38", [0.47, 0.29, 0], [1, 1, 0.7], [0, 0, -Math.PI / 2]],
    [new T.ConeGeometry(0.18, 0.33, 5), "#f9ce38", [-0.38, 0.08, 0], [1, 1, 0.7], [0, 0, Math.PI / 3]],
  ];
  for (const side of [-1, 1]) {
    parts.push([new T.SphereGeometry(0.032, 6, 4), "#000000", [0.34, 0.38, side * 0.19]]);
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

export function autumnLeafGeometry(variant: number) {
  const shape = new T.Shape();
  if (variant === 0) {
    shape.moveTo(0, -.48);
    for (const [x, y] of [[-.18,-.25],[-.48,-.22],[-.3,0],[-.58,.2],[-.28,.25],[-.25,.5],[-.08,.37],[0,.7],[.12,.37],[.3,.48],[.27,.23],[.58,.2],[.3,-.02],[.46,-.23],[.17,-.25],[0,-.48]]) shape.lineTo(x,y);
  } else {
    shape.moveTo(0, -.5);
    shape.bezierCurveTo(-.52, -.15, -.42, .3, 0, .66);
    shape.bezierCurveTo(.42, .3, .52, -.15, 0, -.5);
  }
  const leaf = new T.ShapeGeometry(shape, 12);
  const positions = leaf.getAttribute("position");
  for (let i = 0; i < positions.count; i++) positions.setZ(i, Math.abs(positions.getX(i)) * .25 + Math.sin(positions.getY(i) * 4) * .045);
  leaf.computeVertexNormals();
  const colors = ["#518c3b", "#87b957", "#34754a"];
  const parts: Part[] = [[leaf, colors[variant]]];
  parts.push([new T.CylinderGeometry(.012, .012, 1.12, 4), "#486b2e", [0, -.02, .015]]);
  for (const side of [-1,1]) for (let i = 0; i < 3; i++) {
    const curve = new T.LineCurve3(new T.Vector3(0,-.25+i*.23,.02),new T.Vector3(side*.24,-.08+i*.23,.075));
    parts.push([new T.TubeGeometry(curve,1,.008,3,false),"#abc574"]);
  }
  return assemble(parts);
}

/** Six silhouettes share the same material and burst pool. */
export function paintSplashGeometry(variant: number) {
  const parts: Part[] = [];
  const add = (shape: T.Shape, position: Vec3 = [0, 0, 0]) => parts.push([
    new T.ExtrudeGeometry(shape, { depth: .025, bevelEnabled: true, bevelSize: .018, bevelThickness: .012, bevelSegments: 1, curveSegments: 16 }),
    "#ffffff", position,
  ]);
  const oval = (rx: number, ry: number) => {
    const shape = new T.Shape();
    shape.absellipse(0, 0, rx, ry, 0, Math.PI * 2, false, 0);
    return shape;
  };
  if (variant === 2) {
    // A smooth teardrop, with small detached paint droplets.
    const drop = new T.Shape();
    drop.moveTo(0, .72);
    drop.bezierCurveTo(.1, .36, .48, -.02, .35, -.31);
    drop.bezierCurveTo(.2, -.65, -.35, -.54, -.36, -.22);
    drop.bezierCurveTo(-.38, .08, -.1, .37, 0, .72);
    add(drop);
    add(oval(.085, .12), [.45, .37, 0]);
    add(oval(.055, .075), [-.45, -.4, 0]);
  } else if (variant === 3) {
    // A loose cluster, visibly different from a single radial splat.
    for (const [x, y, rx, ry] of [[0,0,.27,.25],[.36,.18,.17,.22],[-.32,-.25,.18,.14],[.17,-.4,.095,.14],[-.3,.35,.085,.12],[.48,-.3,.055,.075]]) {
      add(oval(rx, ry), [x, y, 0]);
    }
  } else if (variant === 4) {
    const smear = new T.Shape();
    smear.moveTo(-.8, -.13);
    smear.bezierCurveTo(-.4, .36, .25, .28, .8, .05);
    smear.bezierCurveTo(.44, -.03, .02, -.03, -.12, -.22);
    smear.bezierCurveTo(-.32, -.43, -.6, -.34, -.8, -.13);
    add(smear);
    add(oval(.13, .07), [.92, .08, 0]);
    add(oval(.06, .045), [-.6, .3, 0]);
  } else {
    // Broad soft blobs, a stretched splash, and a thin-armed splat.
    const lobes = variant === 0 ? 5 : variant === 1 ? 7 : 9;
    const shape = new T.Shape();
    for (let i = 0; i <= lobes * 20; i++) {
      const angle = i / (lobes * 20) * Math.PI * 2;
      const wave = .5 + Math.sin(angle * lobes) * .5;
      const base = variant === 0 ? .4 : variant === 1 ? .31 : .24;
      const reach = variant === 0 ? .13 : variant === 1 ? .3 : .43;
      const radius = base + Math.pow(wave, variant === 5 ? 3 : 1.4) * reach * (.8 + Math.sin(angle * 3 + variant) * .2);
      const x = Math.cos(angle) * radius * (variant === 1 ? 1.45 : 1);
      const y = Math.sin(angle) * radius * (variant === 1 ? .7 : 1);
      if (i === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
    }
    shape.closePath();
    add(shape);
    for (let i = 0; i < (variant === 0 ? 2 : 4); i++) {
      const a = i * 2.3 + variant;
      add(oval(.04 + i * .012, .055 + i * .015), [Math.cos(a) * .82, Math.sin(a) * .73, 0]);
    }
  }
  return assemble(parts);
}
