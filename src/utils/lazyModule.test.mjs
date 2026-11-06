import { test } from "node:test";
import assert from "node:assert/strict";
import { createLazyModule } from "./lazyModule.ts";

test("creating an app entry does not import it", () => {
  let imports = 0;
  const app = createLazyModule(async () => { imports++; return {}; });
  assert.equal(imports, 0);
  assert.equal(app.getSnapshot().status, "idle");
  assert.equal(app.getSnapshot(), app.getSnapshot());
});

test("concurrent opens share a download and reopening reuses the cached module", async () => {
  let imports = 0;
  const module = { View: () => null };
  const app = createLazyModule(async () => { imports++; return module; });
  const states = [];
  app.subscribe(() => states.push(app.getSnapshot().status));
  const first = app.load();
  assert.equal(app.load(), first);
  assert.equal(await first, module);
  assert.equal(await app.load(), module);
  assert.equal(imports, 1);
  assert.deepEqual(states, ["loading", "ready"]);
  assert.equal(app.getSnapshot().value, module);
});

test("a failed download can retry without retaining the rejected request", async () => {
  let imports = 0;
  const module = {};
  const app = createLazyModule(async () => {
    if (++imports === 1) throw new Error("offline");
    return module;
  });
  await assert.rejects(app.load(), /offline/);
  assert.equal(app.getSnapshot().status, "error");
  assert.equal(await app.load(), module);
  assert.equal(imports, 2);
  assert.equal(app.getSnapshot().status, "ready");
});

test("closing an app detaches its listener while an in-flight download finishes into cache", async () => {
  let finish;
  const module = {};
  const app = createLazyModule(() => new Promise(resolve => { finish = resolve; }));
  const states = [];
  const unsubscribe = app.subscribe(() => states.push(app.getSnapshot().status));
  const pending = app.load();
  await Promise.resolve();
  unsubscribe();
  finish(module);
  await pending;
  assert.deepEqual(states, ["loading"]);
  assert.equal(app.getSnapshot().value, module);
  assert.equal(await app.load(), module);
});
