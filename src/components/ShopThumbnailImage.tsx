import { useEffect, useRef, useState } from "react";

/** Native lazy loading can fetch well beyond a scroll panel. Use its actual visible bounds. */
export function ShopThumbnailImage({ src }: { src: string | undefined }) {
  const image = useRef<HTMLImageElement>(null);
  const [visibleSource, setVisibleSource] = useState<string>();
  useEffect(() => {
    const target = image.current;
    if (!target || !src) return;
    if (!("IntersectionObserver" in window)) { setVisibleSource(src); return; }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        setVisibleSource(src);
        observer.disconnect();
      }
    }, { root: target.closest("[data-shop-catalogue]"), rootMargin: "0px" });
    observer.observe(target);
    return () => observer.disconnect();
  }, [src]);
  return <img ref={image} src={visibleSource === src ? src : undefined} alt="" width={80} height={80}
    draggable={false} decoding="async" loading="lazy" />;
}
