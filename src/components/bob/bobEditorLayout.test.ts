import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { BOB_CONTROL_MARGIN, getBobControlPosition } from "./bobEditorLayout";
import { getBobEditorFraming, getBobEditorGuide } from "@/store/config/bobEditorFraming";
import { trackPoint } from "./elasticTrack";

const guide = { left: 500, right: 700, top: 200, bottom: 400 };

describe("Bob editor placement", () => {
  test("fixed desktop layout reserves the phone panel without using live body geometry", () => {
    for (const [width, height] of [[1280, 720], [1280, 800], [1920, 1080]]) {
      const fixedGuide = getBobEditorGuide(width, height);
      const position = getBobControlPosition("cubeWidth", fixedGuide);
      const captionBottom = position.top + 90 + 30 + 12 + 34;
      assert.ok(captionBottom <= height - 186 - 12 + 0.001);
      assert.equal(getBobControlPosition("cubeHeight", fixedGuide).top, (fixedGuide.top + fixedGuide.bottom) / 2 - 150);
    }
  });
  test("the entire size arc keeps room for the handle at either endpoint", () => {
    const position = getBobControlPosition("sphereRadius", guide);
    for (const progress of [0, 0.5, 1]) {
      assert.ok(position.left + trackPoint("size", progress).x - 40 - guide.right >= BOB_CONTROL_MARGIN);
    }
  });
  test("the shortest width cannot overlap the depth handle", () => {
    const depth = getBobControlPosition("cubeDepth", guide);
    const width = getBobControlPosition("cubeWidth", guide);
    assert.ok(depth.left + 130 + 40 + 16 <= width.left + trackPoint("width", 0).x - 40);
  });
  test("default view returns to the front after any tool's preview", () => {
    for (const [width, height, mobile] of [[1280, 800, false], [390, 844, true], [844, 390, true]] as const) {
      const defaultView = getBobEditorFraming(width, height, mobile, true);
      assert.equal(defaultView.position[0], 0);
      if (mobile) assert.ok(defaultView.position[1] / defaultView.position[2] < 0.1);
      else assert.equal(defaultView.position[1], 0.65);
      for (const key of ["cubeWidth", "cubeHeight", "sphereRadius"] as const) assert.equal(getBobEditorFraming(width, height, mobile, true, key).position[0], 0);
      for (const key of ["cubeDepth", "cubeRadius"] as const) assert.ok(getBobEditorFraming(width, height, mobile, true, key).position[0] > 0);
    }
  });
  test("tool views share the same presentation offset so switching cannot move controls", () => {
    const home = getBobEditorFraming(1280, 800, false, true);
    for (const key of ["cubeWidth", "cubeHeight", "cubeDepth", "cubeRadius", "sphereRadius"] as const) {
      assert.deepEqual(getBobEditorFraming(1280, 800, false, true, key).offset, home.offset);
    }
  });
});
