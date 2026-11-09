import { Color, DataTexture, MeshToonMaterial, NearestFilter, RedFormat, Vector3 } from "three";
import type { BobSkin } from "./registry";

// Shared, immutable ramp: one tiny texture for every Bob, including game models.
const toonRamp = new DataTexture(new Uint8Array([70, 165, 255]), 3, 1, RedFormat);
toonRamp.minFilter = toonRamp.magFilter = NearestFilter;
toonRamp.generateMipmaps = false;
toonRamp.needsUpdate = true;

const modes: Record<BobSkin["material"], number> = {
  solid: 0, moon: 1, disco: 2, watermelon: 3, glass: 4, gold: 5,
  wood: 7, water: 8, jelly: 9, sponge: 10, lightbulb: 11,
};

const surface = /* glsl */ `
  varying vec3 skinPosition;
  varying vec3 skinView;
  uniform vec3 skinBounds;
  uniform vec3 skinSecondary;
  uniform float skinMode;
  uniform float skinTime;
  uniform float skinMotion;
  uniform float skinRound;

  float skinHash(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.yzx + 33.33);
    return fract((p.x + p.y) * p.z);
  }
  float skinNoise(vec3 p) {
    vec3 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(skinHash(i), skinHash(i + vec3(1,0,0)), f.x),
                   mix(skinHash(i + vec3(0,1,0)), skinHash(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(skinHash(i + vec3(0,0,1)), skinHash(i + vec3(1,0,1)), f.x),
                   mix(skinHash(i + vec3(0,1,1)), skinHash(i + vec3(1,1,1)), f.x), f.y), f.z);
  }
  vec2 skinCrater(vec3 p, vec3 center, float radius) {
    float d = length(p - normalize(center)) / radius;
    float aa = max(fwidth(d), 0.015);
    float bowl = 1.0 - smoothstep(0.72 - aa, 0.72 + aa, d);
    float rim = smoothstep(0.78 - aa, 0.78 + aa, d) * (1.0 - smoothstep(1.0 - aa, 1.0 + aa, d));
    return vec2(bowl, rim);
  }
  float skinSparkle(vec3 p, vec3 center, float phase) {
    vec3 n = normalize(center);
    vec3 up = normalize(cross(n, vec3(0.0, 1.0, 0.01)));
    vec3 right = cross(n, up);
    vec3 delta = normalize(p) - n;
    vec2 uv = vec2(dot(delta, up), dot(delta, right));
    float pulse = pow(max(0.0, sin(skinTime * 1.05 + phase)), 12.0);
    float size = max(0.001, 0.1 * sqrt(pulse));
    float rays = min(abs(uv.x) * 6.0 + abs(uv.y), abs(uv.x) + abs(uv.y) * 6.0);
    float aa = max(fwidth(rays), 0.0015);
    return (1.0 - smoothstep(size - aa, size + aa, rays)) * step(0.9, dot(normalize(p), n))
      * pulse * skinMotion;
  }
  float skinBubble(vec3 p, vec3 ray, vec3 center, float radius) {
    float t = dot(center - p, ray);
    float d = length(p + ray * max(t, 0.0) - center) / radius;
    float aa = max(fwidth(d), 0.04);
    return smoothstep(0.58 - aa, 0.58 + aa, d) * (1.0 - smoothstep(0.94 - aa, 0.94 + aa, d)) * step(0.0, t);
  }
`;

const patterns = /* glsl */ `
  vec3 sp = skinPosition / max(skinBounds, vec3(0.001));
  float skinHighlight = 0.0;
  if (skinMode > 0.5 && skinMode < 1.5) {
    vec3 p = normalize(sp);
    vec2 crater = skinCrater(p, vec3(-0.45,0.55,0.8), 0.25)
      + skinCrater(p, vec3(0.48,0.35,0.85), 0.19)
      + skinCrater(p, vec3(0.12,-0.4,1.0), 0.28)
      + skinCrater(p, vec3(-0.7,-0.25,0.6), 0.14)
      + skinCrater(p, vec3(0.7,-0.45,0.5), 0.13)
      + skinCrater(p, vec3(-0.05,0.15,1.0), 0.075)
      + skinCrater(p, vec3(0.1,0.8,-0.6), 0.25)
      + skinCrater(p, vec3(-0.6,-0.5,-0.7), 0.22)
      + skinCrater(p, vec3(0.55,0.25,-0.8), 0.16);
    diffuseColor.rgb = mix(diffuseColor.rgb, skinSecondary, clamp(crater.x * 0.62, 0.0, 0.7));
    diffuseColor.rgb = mix(diffuseColor.rgb, vec3(1.0,0.98,0.89), clamp(crater.y * 0.4, 0.0, 0.4));
  } else if (skinMode > 1.5 && skinMode < 2.5) {
    // Each mirror tile uses a flat reflected direction. Moving studio lights
    // sweep across the facets; small dark seams keep the disco grid readable.
    vec3 p = normalize(sp);
    vec2 uv = vec2(atan(p.x, p.z) / 6.2831853 + 0.5,
      asin(clamp(p.y, -1.0, 1.0)) / 3.1415927 + 0.5) * vec2(24.0, 12.0);
    vec2 tile = floor(uv);
    vec2 angles = ((tile + 0.5) / vec2(24.0, 12.0) - 0.5) * vec2(6.2831853, 3.1415927);
    vec3 tileNormal = vec3(sin(angles.x) * cos(angles.y), sin(angles.y), cos(angles.x) * cos(angles.y));
    vec3 reflection = reflect(-normalize(skinView), tileNormal);
    float phase = skinTime * 0.32;
    vec3 light = normalize(vec3(sin(phase) * 0.8, 0.65, cos(phase) * 0.8));
    float beam = pow(max(dot(reflection, light), 0.0), 22.0);
    float horizon = smoothstep(-0.2, 0.45, reflection.y);
    float bands = 0.5 + 0.5 * sin(reflection.y * 11.0 + reflection.x * 3.0 + phase);
    float tint = skinHash(vec3(tile, 2.0));
    vec3 color = 0.78 + 0.18 * cos(vec3(0.0, 2.1, 4.2) + tint * 6.2831853);
    vec3 mirror = color * (0.1 + horizon * 0.48 + bands * 0.2) + vec3(beam * 0.8);
    vec2 edge = min(fract(uv), 1.0 - fract(uv));
    float seamAA = max(max(fwidth(uv.x), fwidth(uv.y)) * 0.35, 0.015);
    float mirrorFace = smoothstep(0.025, 0.025 + seamAA, min(edge.x, edge.y));
    diffuseColor.rgb = mix(vec3(0.025, 0.035, 0.055), mirror, mirrorFace);
    skinHighlight = skinSparkle(p, vec3(-0.4,0.55,0.9), 0.0)
      + skinSparkle(p, vec3(0.55,-0.15,0.9), 2.1);
  } else if (skinMode > 2.5 && skinMode < 3.5) {
    // Wavy, broad rind stripes follow the length of every selected Bob form.
    float longitude = atan(sp.x, sp.z);
    float warp = sin(sp.y * 5.0 + sin(longitude * 3.0)) * 0.32;
    float stripes = sin(longitude * 9.0 + warp);
    float aa = max(fwidth(stripes), 0.04);
    float rind = smoothstep(0.12 - aa, 0.36 + aa, stripes);
    float mottling = skinNoise(sp * 18.0);
    diffuseColor.rgb = mix(diffuseColor.rgb, skinSecondary, rind * 0.92);
    diffuseColor.rgb *= 0.92 + mottling * 0.12;
  } else if (skinMode > 3.5 && skinMode < 4.5) {
    float facing = abs(dot(normalize(vNormal), normalize(vViewPosition)));
    float rim = smoothstep(0.28, 0.34, 1.0 - facing);
    vec3 p = normalize(sp);
    skinHighlight = smoothstep(0.955, 0.965, dot(p, normalize(vec3(-0.5,0.65,1.0))));
    skinHighlight += smoothstep(0.993, 0.998, dot(p, normalize(vec3(0.5,-0.45,1.0))));
    skinHighlight = clamp(skinHighlight, 0.0, 1.0);
    diffuseColor.rgb = mix(diffuseColor.rgb, skinSecondary, rim * 0.35);
    diffuseColor.a *= clamp(0.3 + rim * 0.45 + skinHighlight, 0.0, 1.0);
  } else if (skinMode > 4.5 && skinMode < 5.5) {
    // A procedural studio reflection gives silver chrome a dark horizon,
    // bright softboxes, and a polished rim without an extra scene capture.
    vec3 reflection = inverseTransformDirection(
      reflect(-normalize(vViewPosition), normalize(vNormal)), viewMatrix);
    float sky = smoothstep(-0.12, 0.55, reflection.y);
    float ground = 1.0 - smoothstep(-0.7, -0.12, reflection.y);
    float softbox = exp(-pow((reflection.y - 0.42 + reflection.x * 0.17) * 9.0, 2.0));
    float strip = exp(-pow((reflection.x + 0.62) * 18.0, 2.0)) * smoothstep(-0.4, 0.5, reflection.y);
    float metal = clamp(0.055 + sky * 0.66 + ground * 0.35 + softbox * 0.48 + strip * 0.5, 0.0, 1.0);
    // Four crisp reflection bands, with only pixel-wide edge antialiasing.
    // Preserve the studio reflection layout and layer soft highlights on top.
    float bandAA = max(fwidth(metal), 0.001);
    float band = 0.1 + 0.25 * smoothstep(0.2 - bandAA, 0.2 + bandAA, metal)
      + 0.3 * smoothstep(0.45 - bandAA, 0.45 + bandAA, metal)
      + 0.35 * smoothstep(0.75 - bandAA, 0.75 + bandAA, metal);
    float rim = pow(1.0 - abs(dot(normalize(vNormal), normalize(vViewPosition))), 4.0);
    diffuseColor.rgb = mix(vec3(0.018, 0.025, 0.04), diffuseColor.rgb, band);
    diffuseColor.rgb = mix(diffuseColor.rgb, vec3(1.0), softbox * 0.3 + rim * 0.4);
    vec3 p = normalize(sp);
    skinHighlight = skinSparkle(p, vec3(0.48,0.48,0.85), 0.0)
      + skinSparkle(p, vec3(0.45,-0.4,0.9), 2.1)
      + skinSparkle(p, vec3(-0.55,-0.25,0.85), 4.2)
      + skinSparkle(p, vec3(-0.3,-0.6,-0.8), 1.5)
      + skinSparkle(p, vec3(0.7,0.4,-0.6), 3.6);
    skinHighlight = clamp(skinHighlight, 0.0, 1.0);
  } else if (skinMode > 6.5 && skinMode < 7.5) {
    // Flowing grain and an offset knot wrap through the volume without UV seams.
    float knot = length(vec2((sp.x + 0.32) * 1.5, (sp.y - 0.26) * 2.8));
    float warp = sin(sp.y * 3.0 + sp.z * 2.0) * 0.22 + exp(-knot * 2.3) * 0.6;
    float rings = sin((sp.x + sp.z * 0.32 + warp) * 34.0);
    float aa = max(fwidth(rings), 0.08);
    float grain = smoothstep(0.4 - aa, 0.4 + aa, rings);
    float heart = 1.0 - smoothstep(0.08, 0.15, knot);
    diffuseColor.rgb = mix(diffuseColor.rgb, skinSecondary, grain * 0.48 + heart * 0.35);
  } else if (skinMode > 7.5 && skinMode < 8.5) {
    // Front-face shell plus an analytic interior water plane. No refraction
    // buffers, back-face pass, simulation, or additional draw calls.
    vec3 ray = -normalize(skinView / max(skinBounds, vec3(0.001)));
    float wave = sin(skinTime * 1.1 + sp.x * 3.0) * 0.045 + cos(skinTime * 0.8 + sp.z * 2.5) * 0.025;
    float level = 0.08 + wave;
    float aa = max(fwidth(sp.y), 0.006);
    float filled = 1.0 - smoothstep(level - aa, level + aa, sp.y);
    float distanceToPlane = (level - sp.y) / (abs(ray.y) < 0.001 ? 0.001 : ray.y);
    vec3 hit = sp + ray * distanceToPlane;
    float inside = mix(max(abs(hit.x), abs(hit.z)), length(hit.xz), skinRound);
    float top = step(0.0, distanceToPlane) * (1.0 - smoothstep(0.9, 0.96, inside)) * (1.0 - filled);
    float rim = pow(1.0 - abs(dot(normalize(vNormal), normalize(vViewPosition))), 2.0);
    vec3 waterColor = mix(skinSecondary * 0.72, skinSecondary, smoothstep(-1.0, level, sp.y));
    diffuseColor.rgb = mix(diffuseColor.rgb, waterColor, filled * 0.8);
    diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.32,0.84,0.98), top * 0.72);
    float bubbles = skinBubble(sp, ray, vec3(-0.36,-0.72 + mod(skinTime * 0.15,0.64),0.18),0.075)
      + skinBubble(sp, ray, vec3(0.25,-0.78 + mod(skinTime * 0.12 + 0.18,0.7),0.32),0.055)
      + skinBubble(sp, ray, vec3(-0.08,-0.75 + mod(skinTime * 0.18 + 0.4,0.65),-0.12),0.045)
      + skinBubble(sp, ray, vec3(0.48,-0.7 + mod(skinTime * 0.13 + 0.32,0.6),-0.08),0.035);
    skinHighlight = clamp(bubbles * filled * 0.58, 0.0, 0.75);
    float waterline = 1.0 - smoothstep(0.008, 0.025, abs(sp.y - level));
    skinHighlight = max(skinHighlight, waterline * 0.28);
    float gleam = smoothstep(0.968, 0.977, dot(normalize(sp), normalize(vec3(-0.5,0.65,1.0))));
    skinHighlight = max(skinHighlight, gleam * 0.65);
    diffuseColor.a *= clamp(0.16 + filled * 0.66 + top * 0.4 + rim * 0.48 + gleam * 0.7, 0.0, 1.0);
  } else if (skinMode > 8.5 && skinMode < 9.5) {
    // Lime jelly: an analytic interior depth and suspended bubbles give it
    // volume. Both the tint and opacity change smoothly across the whole body.
    vec3 ray = -normalize(skinView / max(skinBounds, vec3(0.001)));
    vec3 p = normalize(sp);
    float facing = abs(dot(normalize(vNormal), normalize(vViewPosition)));
    float rim = pow(1.0 - facing, 2.5);
    float depth = sqrt(max(0.0, 1.0 - dot(p.xy, p.xy)));
    float wobble = sin(sp.y * 4.0 + skinTime * 0.9) * cos(sp.x * 3.0 - skinTime * 0.6) * 0.04;
    float tint = clamp(0.25 + depth * 0.48 - sp.y * 0.14 + wobble, 0.0, 1.0);
    diffuseColor.rgb = mix(diffuseColor.rgb, skinSecondary, tint);
    float bubbles = skinBubble(sp, ray, vec3(-0.35,-0.3,0.15), 0.09)
      + skinBubble(sp, ray, vec3(0.3,0.35,-0.15), 0.065)
      + skinBubble(sp, ray, vec3(0.15,-0.6,0.25), 0.045);
    float gleam = pow(max(0.0, dot(p, normalize(vec3(-0.5,0.65,1.0)))), 32.0);
    skinHighlight = clamp(gleam * 0.8 + bubbles * 0.24 + rim * 0.1, 0.0, 0.85);
    diffuseColor.a *= 0.66 + depth * 0.16 + rim * 0.14;
  } else if (skinMode > 9.5 && skinMode < 10.5) {
    // Volumetric pores wrap over every body form, without a texture seam.
    vec3 cell = floor(sp * 5.0);
    float pore = 0.0;
    float lip = 0.0;
    for (int x = -1; x <= 1; x++) {
      for (int y = -1; y <= 1; y++) {
        for (int z = -1; z <= 1; z++) {
          vec3 tile = cell + vec3(float(x), float(y), float(z));
          vec3 center = tile + .2 + vec3(skinHash(tile), skinHash(tile+13.0), skinHash(tile+27.0)) * .6;
          float radius = .17 + skinHash(tile+7.0) * .16;
          float d = length(sp * 5.0 - center) / radius;
          float aa = max(fwidth(d), .04);
          pore = max(pore, 1.0 - smoothstep(.65-aa, 1.0+aa, d));
          lip = max(lip, smoothstep(.8-aa, 1.0, d) * (1.0-smoothstep(1.0,1.3+aa,d)));
        }
      }
    }
    diffuseColor.rgb *= .94 + skinNoise(sp * 65.0) * .12;
    diffuseColor.rgb = mix(diffuseColor.rgb, skinSecondary * .65, pore * .85);
    diffuseColor.rgb = mix(diffuseColor.rgb, vec3(1.0,.92,.45), lip * .4);
  } else if (skinMode > 10.5) {
    float facing = abs(dot(normalize(vNormal), normalize(vViewPosition)));
    float rim = pow(1.0-facing, 2.0);
    float gleam = pow(max(0.0,dot(normalize(sp),normalize(vec3(-.45,.6,1.0)))),40.0);
    diffuseColor.rgb = mix(diffuseColor.rgb, skinSecondary, rim * .45);
    diffuseColor.a *= .2 + rim * .48 + gleam * .6;
    skinHighlight = gleam * .8;
  }
`;

/** One toon program handles the whole catalogue. Switching colors or patterns
 * updates uniforms, so an equipped Bob keeps its material and compiled shader.
 */
export function createBobSkinMaterial(skin: BobSkin, halfSize: readonly number[] = [1, 1, 1]) {
  const uniforms = {
    skinBounds: { value: new Vector3(...halfSize as [number, number, number]) },
    skinSecondary: { value: new Color() },
    skinMode: { value: modes[skin.material] },
    skinTime: { value: 0 },
    skinMotion: { value: 0 },
    skinRound: { value: 1 },
  };
  const material = new MeshToonMaterial({ gradientMap: toonRamp });
  const setSkin = (next: BobSkin) => {
    const transparent = next.material === "glass" || next.material === "water" || next.material === "jelly" || next.material === "lightbulb";
    if (material.transparent !== transparent) {
      material.transparent = transparent;
      material.needsUpdate = true;
    }
    material.opacity = next.material === "water" ? 0.92 : transparent ? 0.8 : 1;
    material.depthWrite = !transparent;
    material.color.set(next.body);
    uniforms.skinMode.value = modes[next.material];
    uniforms.skinSecondary.value.set(next.secondary ?? next.body);
    uniforms.skinTime.value = 0;
    uniforms.skinMotion.value = 0;
  };
  setSkin(skin);
  material.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = `varying vec3 skinPosition;\nvarying vec3 skinView;\n${shader.vertexShader}`.replace(
      "#include <begin_vertex>", "#include <begin_vertex>\nskinPosition = position;\nskinView = (vec4(cameraPosition - (modelMatrix * vec4(position, 1.0)).xyz, 0.0) * modelMatrix).xyz;",
    );
    shader.fragmentShader = `${surface}\n${shader.fragmentShader}`
      .replace("#include <color_fragment>", `#include <color_fragment>\n${patterns}`)
      .replace("#include <opaque_fragment>", "if ((skinMode > 1.5 && skinMode < 2.5) || (skinMode > 4.5 && skinMode < 5.5) || (skinMode > 8.5 && skinMode < 9.5) || skinMode > 10.5) outgoingLight = diffuseColor.rgb;\noutgoingLight = mix(outgoingLight, vec3(1.0), skinHighlight);\n#include <opaque_fragment>");
  };
  material.customProgramCacheKey = () => "bob-skin-toon-v7";
  return {
    material,
    setSkin,
    setTime: (time: number, enabled = true) => {
      uniforms.skinTime.value = enabled ? time : 0;
      uniforms.skinMotion.value = enabled ? 1 : 0;
    },
    setRound: (round: boolean) => { uniforms.skinRound.value = round ? 1 : 0; },
    setHalfSize: (size: readonly number[]) => uniforms.skinBounds.value.set(size[0], size[1], size[2]),
  };
}
