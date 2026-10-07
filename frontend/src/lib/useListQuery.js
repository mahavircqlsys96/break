import { useState } from "react";
import { useDebounced } from "./useDebounced";

/** Table state (search, filters, sort, page) shaped like the API's ListQuery. */
export function useListQuery(initial = {}) {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(initial.filters ?? {});
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState({
    sortBy: initial.sortBy,
    sortDir: initial.sortDir,
  });
  const debounced = useDebounced(search, 250);

  const query = {
    search: debounced,
    filters,
    page,
    pageSize: initial.pageSize ?? 10,
    ...sort,
  };

  return {
    query,
    search,
    setSearch: (v) => {
      setSearch(v);
      setPage(1);
    },
    filters,
    setFilter: (key, value) => {
      setFilters((f) => ({ ...f, [key]: value }));
      setPage(1);
    },
    setPage,
    sort,
    toggleSort: (key) =>
      setSort((s) => ({
        sortBy: key,
        sortDir: s.sortBy === key && s.sortDir === "desc" ? "asc" : "desc",
      })),
  };
}
