import { useCallback, useMemo, useState } from 'react';

export interface UseRowSelectionReturn {
  /** Ids of every selected row (across pages). */
  selectedIds: ReadonlySet<string>;
  selectedCount: number;
  isSelected: (id: string) => boolean;
  toggle: (id: string) => void;
  /** Selects every id when some are missing, otherwise clears them. */
  toggleAll: (ids: string[]) => void;
  selectAll: (ids: string[]) => void;
  clear: () => void;
  /** Drops ids that no longer exist (after deletes or refetches). */
  prune: (validIds: string[]) => void;
}

/**
 * Selection state for bulk actions in data tables.
 * Selection is id-based so it survives pagination, filtering and sorting.
 */
export function useRowSelection(): UseRowSelectionReturn {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  const toggle = useCallback((id: string) => {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback((ids: string[]) => {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      const allSelected = ids.length > 0 && ids.every((id) => next.has(id));
      if (allSelected) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  }, []);

  const selectAll = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  const clear = useCallback(() => setSelectedIds(new Set()), []);

  const prune = useCallback((validIds: string[]) => {
    setSelectedIds((previous) => {
      const next = new Set([...previous].filter((id) => validIds.includes(id)));
      return next.size === previous.size ? previous : next;
    });
  }, []);

  const isSelected = useCallback((id: string) => selectedIds.has(id), [selectedIds]);

  return useMemo(
    () => ({
      selectedIds,
      selectedCount: selectedIds.size,
      isSelected,
      toggle,
      toggleAll,
      selectAll,
      clear,
      prune,
    }),
    [selectedIds, isSelected, toggle, toggleAll, selectAll, clear, prune],
  );
}

export default useRowSelection;
