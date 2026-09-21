import { create } from 'zustand';
import type { SidebarState } from '@/types';

interface SidebarStore extends SidebarState {
  open: () => void;
  close: () => void;
  toggle: () => void;
  setCollapsed: (collapsed: boolean) => void;
  toggleCollapsed: () => void;
  setMobileOpen: (open: boolean) => void;
  toggleMobile: () => void;
}

export const useSidebarStore = create<SidebarStore>((set) => ({
  isOpen: true,
  isCollapsed: false,
  mobileOpen: false,

  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),

  setCollapsed: (collapsed) => set({ isCollapsed: collapsed }),
  toggleCollapsed: () => set((state) => ({ isCollapsed: !state.isCollapsed })),

  setMobileOpen: (open) => set({ mobileOpen: open }),
  toggleMobile: () => set((state) => ({ mobileOpen: !state.mobileOpen })),
}));
