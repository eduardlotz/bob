import type { SkinId } from "./registry";

/** Authored offline with scripts/render-skin-previews.html. No WebGL work in the shop. */
export const getSkinPreview = (id: SkinId) => `/images/shop-items/skin/${id}.png`;
