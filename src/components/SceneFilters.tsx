import { EffectComposer, Pixelation, ToneMapping, createEffectComponent } from "@react-three/postprocessing";
import { useThree } from "@react-three/fiber";
import { useCallback, useMemo } from "react";
import { BlendFunction, Effect, RenderPass, ToneMappingMode } from "postprocessing";
import { SRGBColorSpace, Uniform, Vector2, type Camera, type Scene, type WebGLRenderer, type WebGLRenderTarget } from "three";
import { useCoreStore } from "@/store";

export const SCENE_RENDER_PRIORITY = 2;
export type SceneRenderSource = { scene: Scene; camera: Camera };

/** The standard RenderPass, pointed at the actual lens presentation camera/scene.
 * A default composer would render the outer R3F scene with the wrong camera.
 */
class LensRenderPass extends RenderPass {
  constructor(private readonly source: () => SceneRenderSource) {
    const { scene, camera } = source();
    super(scene, camera);
  }

  render(renderer: WebGLRenderer, input: WebGLRenderTarget | null,
    output: WebGLRenderTarget | null, delta?: number, stencil?: boolean) {
    const { scene, camera } = this.source();
    this.mainScene = scene;
    this.mainCamera = camera;
    super.render(renderer, input, output, delta, stencil);
  }
}

const bayerShader = /* glsl */ `
  uniform vec2 screenSize;
  uniform float pixelSize;
  float bayer2(vec2 p) {
    if (p.y < 1.0) return p.x < 1.0 ? 0.0 : 2.0;
    return p.x < 1.0 ? 3.0 : 1.0;
  }
  void mainUv(inout vec2 uv) {
    vec2 pixel = vec2(uv.x, 1.0 - uv.y) * screenSize;
    vec2 cell = floor(pixel / pixelSize);
    vec2 center = clamp((cell + 0.5) * pixelSize / screenSize, 0.0, 1.0);
    uv = vec2(center.x, 1.0 - center.y);
  }
  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec2 cell = floor(vec2(uv.x, 1.0 - uv.y) * screenSize / pixelSize);
    vec2 tile = mod(cell, 4.0);
    float rank = 4.0 * bayer2(mod(tile, 2.0)) + bayer2(floor(tile / 2.0));
    float threshold = (rank + 0.5) / 16.0;
    outputColor = vec4(clamp(floor(clamp(inputColor.rgb, 0.0, 1.0) * 3.0 + threshold) / 3.0, 0.0, 1.0), inputColor.a);
  }
`;

/** Retains the existing four-level Bayer look as a normal postprocessing Effect. */
class BayerDitherEffect extends Effect {
  constructor() {
    super("BayerDitherEffect", bayerShader, {
      blendFunction: BlendFunction.SRC,
      uniforms: new Map<string, Uniform>([
        ["screenSize", new Uniform(new Vector2(1, 1))],
        ["pixelSize", new Uniform(1)],
      ]),
    });
    // Quantize display colors; EffectPass owns both color conversions.
    this.inputColorSpace = SRGBColorSpace;
    this.outputColorSpace = SRGBColorSpace;
  }
  set pixelSize(value: number) { this.uniforms.get("pixelSize")!.value = value; }
  set screenSize(value: Vector2) { this.uniforms.get("screenSize")!.value.copy(value); }
}
const BayerDither = createEffectComponent<typeof BayerDitherEffect, { pixelSize: number; screenSize: Vector2 }>(BayerDitherEffect);

/** Add library effects here as ordinary JSX. Keep UV/convolution effects in separate
 * passes. Depth/normal/selection effects need world buffers, not the lens sphere.
 */
export function SceneFilters({ source }: { source: () => SceneRenderSource }) {
  const { sceneFilter, ditheringPixelSize, pixelationPixelSize } = useCoreStore(s => s.graphicPreferences);
  const size = useThree(s => s.size);
  const screenSize = useMemo(() => new Vector2(size.width, size.height), [size.width, size.height]);
  const renderPass = useCallback(() => new LensRenderPass(source), [source]);
  return (
    <EffectComposer renderPriority={SCENE_RENDER_PRIORITY} renderPass={renderPass}
      multisampling={0} mergeMode="none">
      {sceneFilter === "pixel" && <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />}
      {sceneFilter === "pixel" && <Pixelation granularity={pixelationPixelSize} />}
      {sceneFilter === "dither" && <BayerDither pixelSize={ditheringPixelSize} screenSize={screenSize} />}
    </EffectComposer>
  );
}
