import * as T from "three";

export const FIRE_LIGHT_POSITION = new T.Vector3(0, -.8, 2);
export const FIRE_LIGHT_TINT = new T.Color("#ffad54");

/** Shared flicker keeps the grass, ground and ordinary materials in sync. */
export function firelightStrength(elapsed: number, daylight: number) {
  return (1 - daylight) * (.82 + .1 * Math.sin(elapsed * 13) + .08 * Math.sin(elapsed * 23.7)) * .65;
}

export const firelightGLSL = `
  uniform vec3 uFirePosition, uFireTint;
  uniform float uFireStrength;
  varying vec3 vFirePosition;
  float fireReach() {
    return 1.0 - smoothstep(1.9, 7.5, length(vFirePosition - vec3(uFirePosition.x, 0.0, uFirePosition.z)));
  }
`;
