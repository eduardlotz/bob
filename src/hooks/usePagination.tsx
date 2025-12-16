import { useMemo, useState } from "react";

export function usePagination<T>(items: T[], pageSize: number) {
  const [page, setPage] = useState(0);

  const pageCount = Math.ceil(items.length / pageSize);

  const data = useMemo(() => {
    const start = page * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  const next = () => setPage((p) => Math.min(p + 1, pageCount - 1));
  const prev = () => setPage((p) => Math.max(p - 1, 0));
  const goTo = (index: number) =>
    setPage(Math.max(0, Math.min(index, pageCount - 1)));

  return {
    page,
    pageCount,
    data,
    next,
    prev,
    goTo,
    hasNext: page < pageCount - 1,
    hasPrev: page > 0,
  };
}
