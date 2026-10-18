import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_FORM_PARAMETERS } from "@/types/blobForms";
import { fitBobWearable, getBobBodyFit, type WearableMount } from "./wearableFit";

describe("Cube wearable seating", () => {
  test("fixed-height hat seating stays stable as the body gets narrower", () => {
    const mount: WearableMount = { kind: "crown", bottom: 0.735, scaling: "horizontal", cubeInset: 0.07 };
    const positions = [0.4, 1.75, 3.5].map(cubeWidth => {
      const body = getBobBodyFit("cube", { cubeWidth, cubeHeight: 3.5, cubeDepth: 1, cubeRadius: 0.05 });
      const fit = fitBobWearable(body, mount);
      assert.equal(fit.scale[1], 1);
      assert.ok(Math.abs(fit.position[1] + mount.bottom - (1.75 - 0.07)) < 1e-8);
      return fit.position[1];
    });
    assert.equal(new Set(positions).size, 1);
  });

  test("uniform hats use the widest horizontal dimension and remain seated", () => {
    for (const cubeWidth of [0.4, 3.5]) for (const cubeDepth of [0.4, 3.5]) {
      const body = getBobBodyFit("cube", { cubeWidth, cubeHeight: 3.5, cubeDepth, cubeRadius: 0.05 });
      const fit = fitBobWearable(body, { kind: "crown", bottom: 0.65, scaling: "uniform", cubeInset: 0.1 });
      assert.equal(fit.scale[0], fit.scale[1]);
      assert.equal(fit.scale[1], fit.scale[2]);
      assert.ok(Math.abs(fit.position[1] + 0.65 * fit.scale[1] - (1.75 - 0.1 * fit.scale[1])) < 1e-8);
    }
  });

  test("afro depth extension affects only Cube and preserves fixed height", () => {
    for (const formType of ["sphere", "cube"] as const) {
      const body = getBobBodyFit(formType, formType === "cube"
        ? { cubeWidth: 3.5, cubeHeight: 3.5, cubeDepth: 0.4, cubeRadius: 0.05 }
        : DEFAULT_FORM_PARAMETERS.sphere);
      const original = fitBobWearable(body, { kind: "hair", scaling: "horizontal" });
      const extended = fitBobWearable(body, { kind: "hair", scaling: "horizontal", cubeDepthScale: 1.5 });
      if (formType === "cube") {
        assert.ok(extended.scale[2] > original.scale[2] * 1.4);
        assert.ok(extended.scale[2] <= original.scale[2] * 1.5);
      } else assert.equal(extended.scale[2], original.scale[2]);
      assert.equal(extended.scale[1], 1);
      assert.deepEqual(extended.position, original.position);
    }
    const deep = getBobBodyFit("cube", { cubeWidth: 0.4, cubeHeight: 3.5, cubeDepth: 3.5, cubeRadius: 0.05 });
    assert.deepEqual(fitBobWearable(deep, { kind: "hair", cubeDepthScale: 1.5 }), fitBobWearable(deep, { kind: "hair" }));
  });

  test("Cube seating settings preserve Ball placement", () => {
    const body = getBobBodyFit("sphere", { sphereRadius: 0.5 });
    const mount: WearableMount = { kind: "crown", bottom: 0.735, scaling: "horizontal" };
    assert.deepEqual(fitBobWearable(body, { ...mount, cubeInset: 0.14 }), fitBobWearable(body, mount));
  });
});
