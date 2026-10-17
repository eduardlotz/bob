import { RenderCubeTexture, type RenderCubeTextureApi } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useCallback, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { Euler, OrthographicCamera, PerspectiveCamera, Quaternion, Scene, Vector3, type Camera } from "three";
import { useCoreStore } from "@/store";
import { useScenePointer } from "@/hooks/useScenePointer";
import { SCENE_RENDER_PRIORITY, SceneFilters } from "./SceneFilters";
import { FISHEYE_CONFIG } from "@/store/config/themes";

/** Drei's cubemap/sphere projection, with a direct render path sharing the same portal.
 * Keeping the portal mounted preserves physics, camera controls and game state.
 */
export function SceneLens({ children }: { children: ReactNode }) {
  const { fisheyeEnabled: enabled, sceneFilter } = useCoreStore(s => s.graphicPreferences);
  const zoom = FISHEYE_CONFIG.MIN;
  const size = useThree(s => s.size);
  const cube = useRef<RenderCubeTextureApi>(null!);
  const world = useRef<{ scene: Scene; camera: Camera } | null>(null);
  const captureAutoClear = useRef(true);
  // EffectComposer disables autoClear globally. Each cubemap face must still
  // clear its color/depth, or moving objects leave stale depth/ghost images.
  useFrame(({ gl }) => {
    captureAutoClear.current = gl.autoClear;
    gl.autoClear = true;
  }, -1.1);
  useFrame(({ gl }) => { gl.autoClear = captureAutoClear.current; }, -0.9);
  const [presentation] = useState(() => new Scene());
  const [ortho] = useState(() => new OrthographicCamera());
  const radius = Math.hypot(size.width, size.height) / 100 * (0.5 + zoom / 2);

  useLayoutEffect(() => {
    ortho.position.set(0, 0, 100);
    ortho.zoom = 100;
    ortho.left = size.width / -2;
    ortho.right = size.width / 2;
    ortho.top = size.height / 2;
    ortho.bottom = size.height / -2;
    ortho.updateProjectionMatrix();
  }, [ortho, size.width, size.height]);

  const source = useCallback(() => enabled || !world.current
    ? { scene: presentation, camera: ortho }
    : world.current, [enabled, presentation, ortho]);
  useFrame(({ gl }) => {
    if (sceneFilter !== "none") return;
    const { scene, camera } = source();
    gl.render(scene, camera);
  }, SCENE_RENDER_PRIORITY);

  return (
    <>
      <primitive object={presentation}>
        <mesh scale={radius}>
          <sphereGeometry args={[1, 64, 64]} />
          <meshBasicMaterial>
            <RenderCubeTexture
              ref={cube}
              attach="envMap"
              flip
              resolution={896}
              frames={enabled ? Infinity : 0}
            >
              <LensCamera cube={cube} world={world} enabled={enabled} zoom={zoom} />
              {children}
            </RenderCubeTexture>
          </meshBasicMaterial>
        </mesh>
      </primitive>
      {sceneFilter !== "none" && <SceneFilters source={source} />}
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

  useFrame(() => {
    if (!enabled || !cube.current) return;
    camera.updateWorldMatrix(true, false);
    camera.matrixWorld.decompose(scratch.position, scratch.rotation, scratch.scale);
    cube.current.camera.position.copy(scratch.position);
    cube.current.camera.quaternion.copy(scratch.flip).premultiply(scratch.rotation);
  }, -2);
  return null;
}
