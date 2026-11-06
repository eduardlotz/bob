import type { BobItem } from "@/store/core/store";

/** Identity of the assets being rendered; a saved outfit must not inherit empty-Bob readiness. */
export const getBobAssetKey = (items: Pick<BobItem, "id" | "detached">[], detached: boolean) =>
  JSON.stringify(items.filter(item => Boolean(item.detached) === detached).map(item => item.id).sort());
