import { useCallback, useDeferredValue, useMemo, useSyncExternalStore } from "react";
import { PHONE_APP_MODULES, type PhoneAppId } from "./phoneApps";

const emptySnapshot = { status: "idle" } as const;
const getEmptySnapshot = () => emptySnapshot;
const subscribeToNothing = () => () => {};

export function usePhoneApp(app: PhoneAppId | undefined, enabled: boolean) {
  const resource = app && enabled ? PHONE_APP_MODULES[app] : undefined;
  const snapshot = useSyncExternalStore(
    resource?.subscribe ?? subscribeToNothing,
    resource?.getSnapshot ?? getEmptySnapshot,
  );
  // Module notifications are synchronous. Defer mounting the ready app so
  // the phone can respond first and React can yield during the render.
  const current = useMemo(() => ({ resource, snapshot }), [resource, snapshot]);
  const deferred = useDeferredValue(current);
  const visibleSnapshot = snapshot.status !== "ready"
    ? snapshot
    : deferred.resource === resource && deferred.snapshot.status === "ready"
      ? deferred.snapshot
      : emptySnapshot;
  const load = useCallback(() => {
    void resource?.load().catch(() => { /* The phone displays the retry state. */ });
  }, [resource]);
  return { snapshot: visibleSnapshot, retry: load };
}
