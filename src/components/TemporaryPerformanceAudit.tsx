import { useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useCoreStore, useAppStore, useViewStore } from "@/store";
import { useRouteLoading } from "@/store/routeLoading";
import { useBobEditor } from "@/store/bobEditor";

const enabled = import.meta.env.DEV && new URLSearchParams(window.location.search).has("perf-audit");
let interactions: { label: string; start: number; frames: number[]; commits: Record<string, { count: number; ms: number; max: number }> }[] = [];
let commits: Record<string, { count: number; ms: number; max: number }> = {};
export function recordAuditCommit(id: string, _phase: unknown, ms: number) {
  if (!enabled || !useCoreStore.getState().isReady) return;
  const entry = commits[id] ??= { count: 0, ms: 0, max: 0 };
  entry.count++; entry.ms += ms; entry.max = Math.max(entry.max, ms);
  const recent = interactions.at(-1);
  if (recent && performance.now() - recent.start < 1200) {
    const item = recent.commits[id] ??= { count: 0, ms: 0, max: 0 };
    item.count++; item.ms += ms; item.max = Math.max(item.max, ms);
  }
}

export function TemporaryPerformanceAudit() {
  const data = audit;
  useFrame(({ gl }, delta) => {
    if (!enabled || !useCoreStore.getState().isReady) return;
    data.frames.push(delta * 1000);
    const recent = interactions.at(-1);
    if (recent && performance.now() - recent.start < 1200) recent.frames.push(delta * 1000);
    data.gpu = { programs: gl.info.programs?.length, geometries: gl.info.memory.geometries, textures: gl.info.memory.textures };
  }, 3);
  useEffect(() => {
    if (!enabled) return;
    if (new URLSearchParams(window.location.search).has("perf-forest")) {
      let configured = false;
      const configure = () => {
        if (configured || !useCoreStore.getState().isHydrated) return;
        configured = true;
        useCoreStore.persist.setOptions({ storage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } });
        useCoreStore.setState(state => ({
          worlds: state.worlds.map(world => ({ ...world, enabled: world.id === "world_forest", preview: false })),
          bobItems: state.bobItems.map(item => ({ ...item, enabled: ["builderHelmet", "chickenLittleGlasses", "clownNose"].includes(item.id), preview: false })),
          upgrades: state.upgrades.map(upgrade => ({ ...upgrade, level: Math.floor(upgrade.maxLevel * 0.8) })),
          taps: 50_000_000,
          previewMode: null,
        }));
      };
      configure();
      const unsubscribe = useCoreStore.subscribe(configure);
      if (configured) unsubscribe();
    }
    const onClick = (event: MouseEvent) => {
      const target = (event.target as Element).closest("button");
      if (!target) return;
      const label = target.getAttribute("aria-label") || target.textContent || "";
      if (!["Menü", "Phone", "Shop", "Hilfe", "Bob", "Quests", "Optionen"].includes(label)) return;
      interactions.push({ label, start: performance.now(), frames: [], commits: {} });
      interactions = interactions.slice(-12);
    };
    document.addEventListener("click", onClick, true);
    const node = document.createElement("pre");
    node.id = "performance-audit-data";
    node.setAttribute("aria-hidden", "true");
    Object.assign(node.style, { position: "fixed", top: "4px", left: "4px", zIndex: "999999", fontSize: "9px", maxWidth: "620px", maxHeight: "250px", overflow: "hidden", pointerEvents: "none", color: "lime", background: "#000b" });
    document.body.appendChild(node);
    let writes: Record<string, number> = {}, keys: Record<string, number> = {}, requests: string[] = [], longTasks: number[] = [];
    const stores = { core: useCoreStore, app: useAppStore, view: useViewStore, loading: useRouteLoading, editor: useBobEditor };
    const unsubscribes = Object.entries(stores).map(([name, store]) => store.subscribe((next: any, previous: any) => {
      if (!useCoreStore.getState().isReady) return;
      writes[name] = (writes[name] ?? 0) + 1;
      for (const key of Object.keys(next)) if (next[key] !== previous[key]) keys[`${name}.${key}`] = (keys[`${name}.${key}`] ?? 0) + 1;
    }));
    const resources = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) requests.push(entry.name);
    });
    resources.observe({ type: "resource", buffered: true });
    const tasks = new PerformanceObserver(list => { longTasks.push(...list.getEntries().map(entry => entry.duration)); });
    try { tasks.observe({ type: "longtask", buffered: true }); } catch {}
    const history: object[] = [];
    const timer = window.setInterval(() => {
      const frames = data.frames.splice(0).sort((a, b) => a - b);
      const sample = { ready: useCoreStore.getState().isReady, world: useCoreStore.getState().worlds.find(world => world.enabled)?.id, frameCount: frames.length, frameMs: frames.length ? { median: +frames[Math.floor(frames.length / 2)].toFixed(2), p95: +frames[Math.floor(frames.length * 0.95)].toFixed(2) } : null, gpu: data.gpu, commits, writes, keys, requests, longTasks };
      history.push(sample);
      node.textContent = JSON.stringify({ latest: sample, history: history.slice(-5), interactions: interactions.map(item => ({ label: item.label, elapsed: performance.now() - item.start, frames: item.frames.length, worstFrameMs: Math.max(0, ...item.frames), over16ms: item.frames.filter(ms => ms > 16.7).length, commits: item.commits })) });
      commits = {}; writes = {}; keys = {}; requests = []; longTasks = [];
    }, 3000);
    return () => { document.removeEventListener("click", onClick, true); clearInterval(timer); unsubscribes.forEach(unsubscribe => unsubscribe()); resources.disconnect(); tasks.disconnect(); node.remove(); };
  }, []);
  return null;
}
const audit = { frames: [] as number[], gpu: {} as object };
