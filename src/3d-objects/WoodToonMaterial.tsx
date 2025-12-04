import * as THREE from "three";
import { extend, Object3DNode } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";

const WoodToonMaterialImpl = shaderMaterial(
  {
    uGridDensity: 4.0,
    uColorLight: new THREE.Color("#ffffff"),
    uColorDark: new THREE.Color("#cccccc"),
    uGridColor1: new THREE.Color("#A0522D"),
    uGridColor2: new THREE.Color("#CD853F"),
    uLightDir: new THREE.Vector3(0.5, 0.8, 0.3).normalize(),
    uGapThickness: 0.05,
  },
  // Vertex Shader
  `
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
  `,
  // Fragment Shader
  `
  varying vec2 vUv;
  varying vec3 vNormal;
  
  uniform float uGridDensity;
  uniform vec3 uGridColor1;
  uniform vec3 uGridColor2;
  uniform vec3 uLightDir;
  uniform float uGapThickness;

  // Pseudo-random function based on grid coordinates
  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
  }

  void main() {
    vec2 gridUV = vUv * uGridDensity;
    // Make planks 4x longer than they are tall
    gridUV.y *= 4.0; 
    
    // Offset every other row
    float row = floor(gridUV.y);
    if (mod(row, 2.0) != 0.0) {
        gridUV.x += 0.5;
    }

    vec2 cellId = floor(gridUV);
    vec2 cellUv = fract(gridUV);

    // 3. Gap/Joint Logic (The dark lines)
    // Using smoothstep for slightly softer, better looking edges than raw step
    float lineX = smoothstep(0.0, uGapThickness, cellUv.x) * (1.0 - smoothstep(1.0 - uGapThickness, 1.0, cellUv.x));
    float lineY = smoothstep(0.0, uGapThickness, cellUv.y) * (1.0 - smoothstep(1.0 - uGapThickness, 1.0, cellUv.y));
    float jointMask = lineX * lineY;

    // 4. Color Variation
    // Mix the two colors based on the random value of the specific plank ID
    float noiseVal = random(cellId);
    vec3 plankColor = mix(uGridColor1, uGridColor2, noiseVal);

    // joint mask = black gaps
    gl_FragColor = vec4(plankColor * jointMask, 1.0);
  }
  `
);

type WoodToonMaterialType = {
  uGridDensity?: number;
  uGridColor1?: THREE.ColorRepresentation;
  uGridColor2?: THREE.ColorRepresentation;
  uLightDir?: THREE.Vector3;
  uGapThickness?: number;
} & JSX.IntrinsicElements["shaderMaterial"];

declare global {
  namespace JSX {
    interface IntrinsicElements {
      woodToonMaterial: Object3DNode<
        THREE.ShaderMaterial,
        WoodToonMaterialType
      >;
    }
  }
}

export const WoodToonMaterial = WoodToonMaterialImpl;
