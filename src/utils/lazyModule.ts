export type ModuleSnapshot<T> =
  | { status: "idle" | "loading" }
  | { status: "ready"; value: T }
  | { status: "error"; error: unknown };

/** Keep successful imports and share in-flight requests. Failed downloads can retry. */
export function createLazyModule<T>(importModule: () => Promise<T>) {
  let snapshot: ModuleSnapshot<T> = { status: "idle" };
  let request: Promise<T> | undefined;
  const listeners = new Set<() => void>();
  const publish = (next: ModuleSnapshot<T>) => {
    snapshot = next;
    listeners.forEach(listener => listener());
  };

  return {
    getSnapshot: () => snapshot,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    load: () => {
      if (request) return request;
      request = Promise.resolve().then(importModule).then(value => {
        publish({ status: "ready", value });
        return value;
      }, error => {
        request = undefined;
        publish({ status: "error", error });
        throw error;
      });
      publish({ status: "loading" });
      return request;
    },
  };
}
