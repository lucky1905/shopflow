import { create } from 'zustand';
import type { UIState } from '@/types';

interface UIStore extends UIState {
  setCommandMenuOpen: (open: boolean) => void;
  toggleCommandMenu: () => void;
  setSearchQuery: (query: string) => void;
  reset: () => void;
}

/**
 * Ephemeral (non-persisted) UI state shared across the shell:
 * the ⌘K command palette and the navbar search query.
 */
export const useUIStore = create<UIStore>((set) => ({
  commandMenuOpen: false,
  searchQuery: '',

  setCommandMenuOpen: (open) => set({ commandMenuOpen: open }),
  toggleCommandMenu: () => set((state) => ({ commandMenuOpen: !state.commandMenuOpen })),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  reset: () => set({ commandMenuOpen: false, searchQuery: '' }),
}));