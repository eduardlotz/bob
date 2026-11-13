import { RenderCubeTexture, type RenderCubeTextureApi } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useCallback, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { Euler, OrthographicCamera, PerspectiveCamera, Quaternion, Scene, ShaderChunk, Vector3, type Camera } from "three";
import { useCoreStore } from "@/store";
import { useScenePointer } from "@/hooks/useScenePointer";
import { FISHEYE_CONFIG } from "@/store/config/themes";
import { useBobEditor } from "@/store/bobEditor";
import { getSceneLensRadius, SCENE_LENS } from "@/utils/sceneLensFraming";

/** Drei's cubemap/sphere projection, with a direct render path sharing the same portal.
 * Keeping the portal mounted preserves physics, camera controls and game state.
 */
export function SceneLens({ children, enabled: enabledOverride, transparent = false }: {
  children: ReactNode;
  enabled?: boolean;
  /** Preserve the captured background alpha when authoring transparent PNGs. */
  transparent?: boolean;
}) {
  const storedEnabled = useCoreStore(s => s.graphicPreferences.fisheyeEnabled);
  const enabled = enabledOverride ?? storedEnabled;
  const zoom = FISHEYE_CONFIG.MIN;
  const size = useThree(s => s.size);
  const screenOffset = useBobEditor(s => s.screenOffset);
  const cube = useRef<RenderCubeTextureApi>(null!);
  const world = useRef<{ scene: Scene; camera: Camera } | null>(null);
  const [presentation] = useState(() => new Scene());
  const [ortho] = useState(() => new OrthographicCamera());
  const radius = getSceneLensRadius(size.width, size.height, screenOffset) / 100;

  useLayoutEffect(() => {
    // The reflected cubemap moves opposite the presentation camera's offset.
    ortho.position.set(screenOffset.x / 100, -screenOffset.y / 100, 100);
    ortho.zoom = 100;
    ortho.left = size.width / -2;
    ortho.right = size.width / 2;
    ortho.top = size.height / 2;
    ortho.bottom = size.height / -2;
    ortho.updateProjectionMatrix();
  }, [ortho, size.width, size.height, screenOffset]);

  const source = useCallback(() => enabled || !world.current
    ? { scene: presentation, camera: ortho }
    : world.current, [enabled, presentation, ortho]);
  useFrame(({ gl }) => {
    const { scene, camera } = source();
    gl.autoClear = true;
    gl.render(scene, camera);
  }, 2);

  return (
    <>
      <primitive object={presentation}>
        <mesh scale={radius}>
          <sphereGeometry args={[1, SCENE_LENS.sphereSegments, SCENE_LENS.sphereSegments]} />
          <meshBasicMaterial transparent={transparent}
            customProgramCacheKey={() => `scene-lens-alpha:${transparent}`}
            onBeforeCompile={shader => {
              if (!transparent) return;
              shader.fragmentShader = shader.fragmentShader.replace("#include <envmap_fragment>", ShaderChunk.envmap_fragment.replace(
                "#ifdef ENVMAP_BLENDING_MULTIPLY",
                "diffuseColor.a *= envColor.a;\nenvColor.rgb /= max(envColor.a, 0.00001);\n#ifdef ENVMAP_BLENDING_MULTIPLY",
              ));
            }}>
            <RenderCubeTexture
              ref={cube}
              attach="envMap"
              flip
              resolution={SCENE_LENS.cubeResolution}
              frames={enabled ? Infinity : 0}
            >
              <LensCamera cube={cube} world={world} enabled={enabled} zoom={zoom} />
              {children}
            </RenderCubeTexture>
          </meshBasicMaterial>
        </mesh>
      </primitive>
    </>
  );
}

function LensCamera({ cube, world, enabled, zoom }: {
  cube: RefObject<RenderCubeTextureApi>;
  world: RefObject<{ scene: Scene; camera: Camera } | null>;
  enabled: boolean;
  zoom: number;
}) {
  // Applies to every route, rather than only the upgrade floor.
  useScenePointer();
  const camera = useThree(s => s.camera);
  const scene = useThree(s => s.scene);
  const size = useThree(s => s.size);
  const screenOffset = useBobEditor(s => s.screenOffset);
  const [scratch] = useState(() => ({
    position: new Vector3(), rotation: new Quaternion(), scale: new Vector3(),
    flip: new Quaternion().setFromEuler(new Euler(0, Math.PI, 0)),
  }));
  useLayoutEffect(() => {
    world.current = { camera, scene };
    if (!(camera instanceof PerspectiveCamera)) return;
    const originalFov = camera.fov;
    // Fisheye's center ray slope is 2/radius (radius in CSS pixels).
    // Match it with the perspective camera without moving the world/camera.
    const radius = Math.hypot(size.width, size.height) * (0.5 + zoom / 2);
    camera.fov = enabled ? originalFov : 2 * Math.atan(size.height / radius) * 180 / Math.PI;
    camera.updateProjectionMatrix();
    return () => { camera.fov = originalFov; camera.updateProjectionMatrix(); };
  }, [camera, scene, enabled, zoom, size.width, size.height, world]);

  useLayoutEffect(() => {
    if (!(camera instanceof PerspectiveCamera)) return;
    if (!enabled && (screenOffset.x || screenOffset.y)) camera.setViewOffset(size.width, size.height, screenOffset.x, screenOffset.y, size.width, size.height);
    else camera.clearViewOffset();
    return () => { camera.clearViewOffset(); };
  }, [camera, enabled, size.width, size.height, screenOffset]);

  useFrame(() => {
    if (!enabled || !cube.current) return;
    camera.updateWorldMatrix(true, false);
    camera.matrixWorld.decompose(scratch.position, scratch.rotation, scratch.scale);
    cube.current.camera.position.copy(scratch.position);
    cube.current.camera.quaternion.copy(scratch.flip).premultiply(scratch.rotation);
  }, -2);
  return null;
}
