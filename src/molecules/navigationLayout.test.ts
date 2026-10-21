import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { Object3D, PerspectiveCamera, Vector3 } from "three";
import { createNavigationPositionCalculator, getNavigationPositions } from "./navigationLayout";

describe("navigation framing", () => {
  for (const [width, height] of [[1280, 720], [390, 844], [844, 390]]) {
    test(`preserves the approved projection across lens toggles at ${width}×${height}`, () => {
      const camera = new PerspectiveCamera(50, width / height);
      camera.position.set(0.2, 2, 8);
      camera.lookAt(0.3, 1, 0);
      camera.updateMatrixWorld();
      const calculatePosition = createNavigationPositionCalculator();
      const size = { width, height };

      for (const position of getNavigationPositions(4, width, height)) {
        const anchor = new Object3D();
        anchor.position.copy(position).add(new Vector3(0, 1.5, 0));
        anchor.updateMatrixWorld();
        // Compare against Three's original 50-degree projection, independently
        // of the menu calculator, before and after SceneLens changes the FOV.
        const ndc = anchor.position.clone().project(camera);
        const expected = [(ndc.x + 1) * width / 2, (1 - ndc.y) * height / 2];
        const directFov = 2 * Math.atan(height / (Math.hypot(width, height) * 0.55)) * 180 / Math.PI;
        for (const fov of [50, directFov, 50, directFov]) {
          camera.fov = fov;
          camera.updateProjectionMatrix();
          const actual = calculatePosition(anchor, camera, size);
          assert.ok(Math.abs(actual[0] - expected[0]) < 1e-8);
          assert.ok(Math.abs(actual[1] - expected[1]) < 1e-8);
        }
        camera.fov = 50;
        camera.updateProjectionMatrix();
      }
    });
  }

  test("handles empty routes and an unmeasured canvas", () => {
    assert.deepEqual(getNavigationPositions(0, 1280, 720), []);
    assert.deepEqual(getNavigationPositions(4, 0, 0), []);
    assert.deepEqual(getNavigationPositions(4, 390, 0), []);
  });
});
