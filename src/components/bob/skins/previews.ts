import type { SkinId } from "./registry";

/** Saved thumbnails keep the shop from creating extra WebGL previews. */
export const getSkinPreview = (id: SkinId) => `/images/shop-items/skin/${id}.png`;
