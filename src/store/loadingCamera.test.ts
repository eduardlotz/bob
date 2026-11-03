import { afterEach, beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import type { CameraControls } from "@react-three/drei";
import { Vector3 } from "three";
import { useViewStore } from "./viewStore";
import { useAppStore } from "./core/app";
import { ROUTE_PATHS } from "./config/routes";
import { HEAD_CAMERA_POSES, LOADING_CAMERA_POSE } from "./config/camera";

describe("shared loading camera", () => {
  const originalView = useViewStore.getState();
  const originalApp = useAppStore.getState();
  let poses: number[][];
  let controls: CameraControls;

  beforeEach(() => {
    poses = [];
    controls = {
      smoothTime: .25,
      cancel() {}, setFocalOffset() {}, setTarget() {}, update() {},
      setLookAt(...args: number[]) { poses.push(args); return Promise.resolve(); },
      getPosition(value: Vector3) { return value.set(5, 1, 67); },
      getTarget(value: Vector3) { return value.set(0, 0, 0); },
      mouseButtons: {}, touches: {},
    } as unknown as CameraControls;
    useAppStore.setState({ currentRoute: ROUTE_PATHS.PORTFOLIO, showOptions: false });
    useViewStore.setState({
      currentView: "portfolio", viewMode: "object", isTransitioning: false,
      loadingCameraActive: false, loadingCameraView: "loading", pendingView: null, cameraControlsRef: { current: controls },
    });
  });

  afterEach(() => {
    useViewStore.getState().finishLoadingCamera(ROUTE_PATHS.HOME);
    useViewStore.setState(originalView);
    useAppStore.setState(originalApp);
  });

  test("closing the portfolio menu cannot restore the old portfolio camera", async () => {
    await useViewStore.getState().beginLoadingCamera(false);
    const loadingPose = poses.at(-1);
    await useViewStore.getState().resetToDefaultView();
    assert.equal(useViewStore.getState().currentView, "loading");
    assert.deepEqual(poses, [loadingPose]);
    assert.equal(loadingPose?.[0], 0);
    assert.equal(loadingPose?.[3], 0);
    assert.ok(loadingPose![2] < 67);
  });

  test("incoming lobby and route effects cannot move a held loading camera", async () => {
    await useViewStore.getState().beginLoadingCamera(false);
    const loadingPose = poses.at(-1);
    useViewStore.getState().syncViewToRoute(ROUTE_PATHS.MINIGAMES);
    await useViewStore.getState().transitionToView("default");
    useViewStore.getState().holdLoadingCamera();
    assert.equal(useViewStore.getState().currentView, "loading");
    assert.deepEqual(poses.at(-1), loadingPose);
    assert.equal(poses.length, 2);
  });

  test("loading keeps its distance while matching the default height and downward angle", async () => {
    await useViewStore.getState().beginLoadingCamera(false);
    const [x, y, z, targetX, targetY, targetZ] = poses.at(-1)!;
    const normal = HEAD_CAMERA_POSES.default;
    assert.equal(y, normal.position[1]);
    assert.equal(z, LOADING_CAMERA_POSE.position[2]);
    assert.equal(x, targetX);
    assert.equal((y - targetY) / (z - targetZ),
      (normal.position[1] - normal.target[1]) / (normal.position[2] - normal.target[2]));
  });

  test("release goes straight to the destination and restores camera smoothing", async () => {
    await useViewStore.getState().beginLoadingCamera(false);
    useViewStore.getState().syncViewToRoute(ROUTE_PATHS.PORTFOLIO);
    useViewStore.getState().finishLoadingCamera(ROUTE_PATHS.HOME);
    assert.equal(useViewStore.getState().loadingCameraActive, false);
    assert.equal(useViewStore.getState().currentView, "default");
    assert.equal(controls.smoothTime, .25);
    assert.ok(poses.every(pose => pose[2] < 67));
  });

  test("initial reveal keeps the default view on direct links while allowing live camera follow", async () => {
    await useViewStore.getState().beginLoadingCamera(false, { initial: true });
    const expected = [...HEAD_CAMERA_POSES.default.position, ...HEAD_CAMERA_POSES.default.target];
    assert.deepEqual(poses.at(-1)?.slice(0, 6), expected);
    assert.equal(useViewStore.getState().currentView, "default");
    assert.equal(controls.smoothTime, .25);

    useViewStore.getState().syncViewToRoute(ROUTE_PATHS.PORTFOLIO);
    await useViewStore.getState().transitionToView("portfolio");
    // Ordinary cursor follow may update the camera throughout the reveal.
    controls.setLookAt(0, 2, 4, .6, 1.1, 0, true);
    const followedPose = poses.at(-1);
    useViewStore.getState().holdLoadingCamera();
    assert.equal(useViewStore.getState().currentView, "default");
    assert.equal(poses.length, 2);
    assert.deepEqual(poses.at(-1), followedPose);

    useViewStore.getState().finishLoadingCamera(ROUTE_PATHS.PORTFOLIO);
    assert.equal(useViewStore.getState().currentView, "portfolio");
  });

  test("finishing the initial home reveal preserves live follow and later transitions use the runtime pose", async () => {
    await useViewStore.getState().beginLoadingCamera(false, { initial: true });
    controls.setLookAt(0, 2, 4, .6, 1.1, 0, true);
    const followedPose = poses.at(-1);
    const poseCount = poses.length;
    useViewStore.getState().finishLoadingCamera(ROUTE_PATHS.HOME);
    assert.equal(useViewStore.getState().loadingCameraActive, false);
    assert.equal(poses.length, poseCount);
    assert.deepEqual(poses.at(-1), followedPose);

    await useViewStore.getState().beginLoadingCamera(false);
    assert.equal(useViewStore.getState().currentView, "loading");
    assert.equal(poses.at(-1)?.[2], LOADING_CAMERA_POSE.position[2]);
  });
});
