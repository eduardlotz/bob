import * as THREE from "three";
import { shaderMaterial } from "@react-three/drei";

export const GridToonMaterial = shaderMaterial(
  {
    uGridDensity: 8,
    uColorLight: new THREE.Color("#ffffff"),
    uColorDark: new THREE.Color("#cccccc"),
    uGridColor1: new THREE.Color("#e0e0e0"),
    uGridColor2: new THREE.Color("#d0d0d0"),
    uLightDir: new THREE.Vector3(0.5, 0.8, 0.3).normalize(),
  },
  // vertex shader
  `
  varying vec2 vUv;
  varying vec3 vNormal;
  void main(){
    vUv = uv;
    vNormal = normalMatrix * normal;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
  `,
  // fragment shader
  `
  varying vec2 vUv;
  varying vec3 vNormal;
  uniform float uGridDensity;
  uniform vec3 uGridColor1;
  uniform vec3 uGridColor2;
  uniform vec3 uLightDir;
  void main(){
    // procedural grid
    vec2 g = fract(vUv * uGridDensity);
    float line = step(0.05, g.x) * step(0.05, g.y);
    vec3 base = mix(uGridColor1, uGridColor2, step(0.5, fract(vUv.x * uGridDensity)));

    gl_FragColor = vec4(base, 1.0);
  }
  `
);

THREE.ColorManagement.legacyMode = false; // ensure correct color space
