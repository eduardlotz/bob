import { BufferAttribute, BufferGeometry, CatmullRomCurve3, ShaderMaterial, TubeGeometry, Vector3 } from "three";

/** The fuse is part of TNT's silhouette and scales with every Bob form. */
export function createTntFuse(halfSize: readonly number[] = [1, 1, 1]) {
  const [x, y, z] = halfSize;
  const size = Math.min(x, y, z);
  const tip = new Vector3(size * 0.18, y + size * 0.28, 0);
  const curve = new CatmullRomCurve3([
    new Vector3(0, y - size * 0.035, 0),
    new Vector3(size * 0.015, y + size * 0.16, 0),
    new Vector3(size * 0.09, y + size * 0.27, 0),
    tip,
  ]);
  return { geometry: new TubeGeometry(curve, 12, size * 0.028, 5, false), tip, size };
}

export function createTntSparks() {
  return new BufferGeometry()
    .setAttribute("position", new BufferAttribute(new Float32Array(21), 3))
    .setAttribute("sparkFade", new BufferAttribute(new Float32Array(7), 1));
}

/** Six short arcs and one fixed ember glow, updated in place without allocations. */
export function updateTntSparks(geometry: BufferGeometry, fuse: ReturnType<typeof createTntFuse>, time: number) {
  const positions = geometry.getAttribute("position") as BufferAttribute;
  const fades = geometry.getAttribute("sparkFade") as BufferAttribute;
  for (let i = 0; i < 6; i++) {
    const life = (time * 1.6 + i / 6) % 1;
    const angle = i * 2.4;
    positions.setXYZ(i,
      fuse.tip.x + Math.cos(angle) * life * fuse.size * 0.18,
      fuse.tip.y + (life * 0.38 - life * life * 0.16) * fuse.size,
      fuse.tip.z + Math.sin(angle) * life * fuse.size * 0.14);
    fades.setX(i, Math.pow(1 - life, 1.5) * Math.min(life / 0.07, 1));
  }
  positions.setXYZ(6, fuse.tip.x, fuse.tip.y, fuse.tip.z);
  fades.setX(6, 0.62 + Math.sin(time * 9) * 0.12);
  positions.needsUpdate = fades.needsUpdate = true;
}

export function createTntSparkMaterial(size = 1) {
  return new ShaderMaterial({
    transparent: true, depthWrite: false, toneMapped: false,
    uniforms: { sparkSize: { value: size * 0.075 }, sparkPixelScale: { value: 80 } },
    vertexShader: /* glsl */ `
      attribute float sparkFade;
      uniform float sparkSize;
      uniform float sparkPixelScale;
      varying float vSparkFade;
      void main() {
        vSparkFade = sparkFade;
        vec4 point = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * point;
        float perspective = step(0.5, -projectionMatrix[2][3]);
        float distanceScale = mix(1.0, max(-point.z, 0.01), perspective);
        gl_PointSize = clamp(sparkSize * sparkPixelScale * projectionMatrix[1][1]
          * mix(0.65, 1.4, sparkFade) / distanceScale, 1.0, 24.0);
      }
    `,
    fragmentShader: /* glsl */ `
      varying float vSparkFade;
      void main() {
        float radius = length(gl_PointCoord - vec2(0.5));
        float glow = 1.0 - smoothstep(0.12, 0.5, radius);
        float core = 1.0 - smoothstep(0.04, 0.2, radius);
        float alpha = glow * vSparkFade;
        if (alpha < 0.01) discard;
        gl_FragColor = vec4(mix(vec3(1.0,0.24,0.015), vec3(1.0,0.9,0.55), core), alpha);
        #include <colorspace_fragment>
      }
    `,
  });
}
