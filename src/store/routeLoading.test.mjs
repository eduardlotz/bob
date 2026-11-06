import { beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { isInitialRouteReady, isRouteReady, useRouteLoading } from "./routeLoading.ts";
import { getBobAssetKey } from "../utils/bobAssetKeys.ts";

beforeEach(() => useRouteLoading.setState({ ready: {} }));

test("a new route waits for both its page and scene, even when the previous route was ready", () => {
  const loading = useRouteLoading.getState();
  loading.markReady("shell", "shared");
  loading.markReady("page", "/home");
  loading.markReady("scene", "/home");
  assert.equal(isRouteReady("/home"), true);
  assert.equal(isRouteReady("/literature"), false);
  loading.markReady("page", "/literature");
  assert.equal(isRouteReady("/literature"), false);
  loading.markReady("scene", "/literature");
  assert.equal(isRouteReady("/literature"), true);
});

test("late cleanup from an outgoing route cannot clear the destination's readiness", () => {
  const loading = useRouteLoading.getState();
  loading.markReady("shell", "shared");
  for (const route of ["/home", "/about", "/literature"]) {
    loading.markReady("page", route);
    loading.markReady("scene", route);
  }
  loading.clearReady("scene", "/about");
  loading.clearReady("page", "/home");
  assert.equal(isRouteReady("/literature"), true);
  assert.equal(isRouteReady("/about"), false);
});

test("cached downloads cannot bypass an unmounted or suspended scene", () => {
  const loading = useRouteLoading.getState();
  loading.markReady("shell", "shared");
  loading.markReady("page", "/about");
  loading.markReady("scene", "/about");
  loading.clearReady("scene", "/about");
  assert.equal(isRouteReady("/about"), false);
  loading.markReady("scene", "/about");
  assert.equal(isRouteReady("/about"), true);
  loading.clearReady("shell", "shared");
  assert.equal(isRouteReady("/about"), false);
});

test("initial loading waits for the hydrated outfit rather than inheriting an empty Bob's readiness", () => {
  const loading = useRouteLoading.getState();
  const empty = getBobAssetKey([], false);
  const hat = getBobAssetKey([{ id: "builderHelmet" }], false);
  const plumbob = getBobAssetKey([{ id: "simsPlumbob", detached: true }], true);
  loading.markReady("shell", "shared");
  loading.markReady("page", "/home");
  loading.markReady("scene", "/home");
  loading.markReady("bob-attached", empty);
  loading.markReady("bob-detached", empty);
  assert.equal(isInitialRouteReady("/home", hat, plumbob), false);
  loading.markReady("bob-attached", hat);
  assert.equal(isInitialRouteReady("/home", hat, plumbob), false);
  loading.markReady("bob-detached", plumbob);
  assert.equal(isInitialRouteReady("/home", hat, plumbob), true);
});

test("game transitions do not wait for the lobby Bob's unmounted accessories", () => {
  const loading = useRouteLoading.getState();
  loading.markReady("shell", "shared");
  loading.markReady("page", "/mini");
  loading.markReady("scene", "/mini");
  assert.equal(isRouteReady("/mini"), true);
  assert.equal(isInitialRouteReady("/mini", "[]", "[]"), false);
});

test("outfit keys separate attached and detached items and ignore list ordering", () => {
  const items = [{ id: "glasses" }, { id: "hat" }, { id: "simsPlumbob", detached: true }];
  assert.equal(getBobAssetKey(items, false), getBobAssetKey([...items].reverse(), false));
  assert.equal(getBobAssetKey(items, false), '["glasses","hat"]');
  assert.equal(getBobAssetKey(items, true), '["simsPlumbob"]');
});
