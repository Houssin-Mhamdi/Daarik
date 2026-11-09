"use client";

import { useState } from "react";

export function usePagination<T>(items: T[], pageSize = 12) {
  const [page, setPageState] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  const pageItems = items.slice(start, start + pageSize);
  const setPage = (next: number) => {
    setPageState(Math.min(Math.max(1, next), totalPages));
  };
  return {
    page: safePage,
    setPage,
    totalPages,
    pageItems,
    pageSize,
    total: items.length,
  };
}
