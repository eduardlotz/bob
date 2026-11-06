export type ShopCategory = "hats" | "skins" | "accessories" | "effects" | "worlds";

export function ShopCategoryIcon({ category }: { category: ShopCategory }) {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {category === "hats" && <>
      <path d="m6 14 1.5-8.5c.2-1 1.2-1.5 2.1-1.1L12 5.5l2.4-1.1c.9-.4 1.9.1 2.1 1.1L18 14" />
      <path d="M6 12c3.9 1.4 8.1 1.4 12 0M6.2 14C3.6 14.6 2 15.5 2 16.5 2 18.4 6.5 20 12 20s10-1.6 10-3.5c0-1-1.6-1.9-4.2-2.5" />
    </>}
    {category === "skins" && <>
      <path d="M21 12c0 5-3.6 9-9 9s-9-4-9-9 3.6-9 9-9 9 4 9 9Z" />
      <path d="M8 10v1m8-1v1m-8 4c2.2 2 5.8 2 8 0" />
    </>}
    {category === "accessories" && <>
      <rect x="2" y="10" width="8" height="8" rx="3" /><rect x="14" y="10" width="8" height="8" rx="3" />
      <path d="M10 13c1.2-1.2 2.8-1.2 4 0M2 13V8m20 5V8" />
    </>}
    {category === "effects" && <>
      <path d="m10 10 5 5-12 6 7-11Z" />
      <path d="M14 4c-2 0-3 1-3 3m6 3c0-2 1-3 3-3M16 2v2m5 10h1M5 6l1 1m13 3 2 1M16 18l1 2" />
      <path d="m17 5 1-1M7 13l4 4" />
    </>}
    {category === "worlds" && <>
      <path d="M3 21c4-3 14-3 18 0M11 19c2-4 3-8 2-12" />
      <path d="M13 7C10 2 6 3 4 6c4-1 7-1 9 1Zm0 0c1-4 5-4 8-2-4 0-6 1-8 2Zm0 0c4 0 6 3 6 6-2-3-3-4-6-6Zm0 0c-3 0-5 3-5 6 2-3 3-4 5-6Z" />
    </>}

  </svg>;
}
