import assert from "node:assert/strict";
import { gzipSync } from "node:zlib";
import { build } from "vite";
import { readFileSync } from "node:fs";

// Inspect the actual production chunks, including transitive shared imports.
const routeNames = ["Home", "About", "Portfolio", "Literature", "MiniGames"];
const routeModules = routeNames.flatMap(name => [`routes/${name}.tsx`, `routes/${name}Scene.tsx`]);
const appModules = ["bob", "camera", "credits", "debug", "help", "options", "quests", "shop"]
  .map(name => `apps/${name}.tsx`);
const wearableModels = ["toonWardrobe", "toonHats", "krustyKrabHat", "roundGlasses", "afroHair", "builderHelmet", "bobMoustache", "blackCap", "astronaut", "rastaBeanie", "simsPlumbob"];
const wearableModules = wearableModels.map(name => `3d-objects/models/${name}.tsx`);

await build({
  logLevel: "warn",
  build: { write: false },
  plugins: [{
    name: "check-route-loading",
    generateBundle(_, bundle) {
      const chunks = Object.values(bundle).filter(item => item.type === "chunk");
      const modules = chunk => Object.keys(chunk.modules)
        .filter(id => id.includes("/src/"))
        .map(id => id.split("/src/")[1]);
      const closure = roots => {
        const found = new Set();
        const visit = chunk => {
          if (!chunk || found.has(chunk)) return;
          found.add(chunk);
          chunk.imports.forEach(file => visit(bundle[file]));
        };
        roots.forEach(visit);
        return [...found];
      };
      const startup = closure(chunks.filter(chunk => chunk.isEntry));
      assert.deepEqual(startup.flatMap(modules).filter(id => routeModules.includes(id)), [],
        "Route pages and scenes must not be imported by the startup bundle");

      for (const routeModule of routeModules) {
        const owner = chunks.find(chunk => modules(chunk).includes(routeModule));
        assert.ok(owner, `Missing route module: ${routeModule}`);
        const foreignRoutes = closure([owner]).flatMap(modules)
          .filter(id => routeModules.includes(id) && id !== routeModule);
        assert.deepEqual(foreignRoutes, [], `${routeModule} loads another route`);
        assert.deepEqual(closure([owner]).flatMap(modules).filter(id => appModules.includes(id)), [],
          `${routeModule} imports a phone app before it is opened`);
      }

      for (const appModule of appModules) {
        const owner = chunks.find(chunk => modules(chunk).includes(appModule));
        assert.ok(owner, `Missing phone app: ${appModule}`);
        const dependencies = closure([owner]).flatMap(modules);
        assert.deepEqual(dependencies.filter(id => appModules.includes(id) && id !== appModule), [],
          `${appModule} imports another phone app`);
        assert.deepEqual(dependencies.filter(id => routeModules.includes(id)), [],
          `${appModule} imports a route page or scene`);
      }

      // These assets used to preload even on Home.
      const startupModules = startup.flatMap(modules);
      assert.deepEqual(startupModules.filter(id => wearableModules.includes(id)), [],
        "Unused wearable models must not be imported at startup");
      for (const modelModule of wearableModules) {
        const owner = chunks.find(chunk => modules(chunk).includes(modelModule));
        assert.ok(owner, `Missing wearable model: ${modelModule}`);
        assert.ok(!readFileSync(new URL(`../src/${modelModule}`, import.meta.url), "utf8").includes("useGLTF.preload("),
          `${modelModule} downloads an asset just by being imported`);
      }
      const shop = chunks.find(chunk => modules(chunk).includes("apps/shop.tsx"));
      assert.deepEqual(closure([shop]).flatMap(modules).filter(id => wearableModules.includes(id)), [],
        "Opening the shop must not download its 3D catalogue");
      assert.deepEqual(startupModules.filter(id => appModules.includes(id)), [],
        "Phone apps must not be imported at startup");
      for (const deferredModule of ["store/core/camera.ts", "components/CameraPortal.tsx", "components/BlobFormCustomization.tsx", "components/bob/BobSculptEditor.tsx", "apps/help.data.ts", "apps/WorldEnvironmentControls.tsx"]) {
        assert.ok(!startupModules.includes(deferredModule), `${deferredModule} loads before its app opens`);
      }
      for (const model of ["desk", "dj-controller", "skateboard", "xbox-controller", "ps-controller", "rigidBodyCamera", "globe", "bookTable", "pingPongPaddle"]) {
        assert.ok(!startupModules.includes(`3d-objects/models/${model}.tsx`), `${model} preloads at startup`);
      }

      const bytes = startup.reduce((total, chunk) => total + Buffer.byteLength(chunk.code), 0);
      const gzip = startup.reduce((total, chunk) => total + gzipSync(chunk.code).length, 0);
      console.log(`Loading checks passed: ${routeModules.length} separate page/scene modules and ${appModules.length} phone app modules; startup ${(bytes / 1e6).toFixed(2)} MB (${(gzip / 1e6).toFixed(2)} MB gzip).`);
    },
  }],
});
