import { useFBO } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { HalfFloatType, ShaderMaterial, Vector2, WebGLRenderTarget } from "three";
import { FullScreenQuad } from "three/examples/jsm/postprocessing/Pass.js";

// Keep capture and presentation around Drei's final fisheye projection.
// Its cubemap is rendered earlier, at priority -1, and remains untouched.
export const FISHEYE_RENDER_PRIORITY = 2;

// Figma reference: full color, 2px blocks, 3 levels, neutral brightness/contrast.
const REFERENCE_SETTINGS = { pixelSize: 2, levels: 3, brightness: 0, contrast: 1 };

const fragmentShader = /* glsl */ `
  uniform sampler2D sceneTexture;
  uniform vec2 screenSize;
  uniform float pixelSize;
  uniform float levels;
  uniform float brightness;
  uniform float contrast;
  varying vec2 vUv;

  // Same recursive Bayer ordering as the supplied Figma shader.
  float bayer2(vec2 p) {
    if (p.y < 1.0) return p.x < 1.0 ? 0.0 : 2.0;
    return p.x < 1.0 ? 3.0 : 1.0;
  }

  void main() {
    // Work in CSS pixels so adaptive DPR does not resize the pattern.
    // Figma's pixel buffer starts at the top left, unlike WebGL UVs.
    vec2 pixel = vec2(vUv.x, 1.0 - vUv.y) * screenSize;
    vec2 cell = floor(pixel / pixelSize);
    vec2 center = clamp((cell + 0.5) * pixelSize / screenSize, 0.0, 1.0);
    gl_FragColor = texture2D(sceneTexture, vec2(center.x, 1.0 - center.y));

    // The captured fisheye is linear. Quantize display colors, just as Figma
    // quantizes its input image, with exactly one output color conversion.
    #include <colorspace_fragment>
    vec3 color = clamp((gl_FragColor.rgb - 0.5) * contrast + 0.5 + brightness, 0.0, 1.0);
    vec2 tile = mod(cell, 4.0);
    float rank = 4.0 * bayer2(mod(tile, 2.0)) + bayer2(floor(tile / 2.0));
    float threshold = (rank + 0.5) / 16.0;
    float steps = levels - 1.0;
    // Equivalent to Figma's round((color + (threshold - .5) / steps) * steps).
    gl_FragColor.rgb = clamp(floor(color * steps + threshold) / steps, 0.0, 1.0);
  }
`;

/** Mount only while enabled: the normal fisheye path has no extra pass or FBO. */
export function SceneDithering() {
  const size = useThree((state) => state.size);
  const target = useFBO({ type: HalfFloatType, depthBuffer: false, samples: 0 });
  const previousTarget = useRef<WebGLRenderTarget | null>(null);
  const material = useMemo(
    () => new ShaderMaterial({
      uniforms: {
        sceneTexture: { value: null },
        screenSize: { value: new Vector2() },
        pixelSize: { value: REFERENCE_SETTINGS.pixelSize },
        levels: { value: REFERENCE_SETTINGS.levels },
        brightness: { value: REFERENCE_SETTINGS.brightness },
        contrast: { value: REFERENCE_SETTINGS.contrast },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 0.0, 1.0);
        }
      `,
      fragmentShader,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    }),
    [],
  );
  const quad = useMemo(() => new FullScreenQuad(material), [material]);

  useEffect(() => () => {
    material.dispose();
    quad.dispose();
  }, [material, quad]);

  useFrame(({ gl }) => {
    previousTarget.current = gl.getRenderTarget();
    gl.setRenderTarget(target);
  }, FISHEYE_RENDER_PRIORITY - 1);

  useFrame(({ gl }) => {
    gl.setRenderTarget(previousTarget.current);
    material.uniforms.sceneTexture.value = target.texture;
    material.uniforms.screenSize.value.set(size.width, size.height);
    quad.render(gl);
  }, FISHEYE_RENDER_PRIORITY + 1);

  return null;
}
