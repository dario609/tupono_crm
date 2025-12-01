import { useMemo } from "react";

export const usePagination = ({ page, total, perpage }) => {
  const lastPage = useMemo(() => {
    if (perpage === -1) return 1;
    return Math.max(1, Math.ceil(total / perpage));
  }, [total, perpage]);

  const pagesToShow = useMemo(() => {
    const items = [];
    if (lastPage <= 1) return items;

    const push = (p) => items.push(p);

    if (page > 3) push(1);
    if (page > 4) push("...");

    for (let j = page - 2; j <= page + 2; j++) {
      if (j >= 1 && j <= lastPage) push(j);
    }

    if (page < lastPage - 3) push("...");
    if (page < lastPage - 2) push(lastPage);

    return items;
  }, [page, lastPage]);

  const hasPrev = page > 1;
  const hasNext = page < lastPage;

  return {
    lastPage,
    pagesToShow,
    hasPrev,
    hasNext,
  };
};
