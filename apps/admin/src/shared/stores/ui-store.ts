import { create } from "zustand";

interface UIStore {
  sidebarOpen: boolean; // Mobile/tablet visibility
  mainSidebarCollapsed: boolean; // Main sidebar collapsed state
  selectedMainSidebarItem: string | null; // Selected main sidebar item ID
  selectedPageSidebarItem: string | null; // Selected page sidebar item ID
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleMainSidebarCollapsed: () => void;
  setMainSidebarCollapsed: (collapsed: boolean) => void;
  setSelectedMainSidebarItem: (itemId: string | null) => void;
  setSelectedPageSidebarItem: (itemId: string | null) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: false,
  mainSidebarCollapsed: true, // Default to collapsed
  selectedMainSidebarItem: "database", // Default to database
  selectedPageSidebarItem: null,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleMainSidebarCollapsed: () =>
    set((state) => ({ mainSidebarCollapsed: !state.mainSidebarCollapsed })),
  setMainSidebarCollapsed: (collapsed) =>
    set({ mainSidebarCollapsed: collapsed }),
  setSelectedMainSidebarItem: (itemId) => {
    // Select main sidebar item without auto-collapsing
    set((state) => ({
      selectedMainSidebarItem: itemId,
      selectedPageSidebarItem: null,
      // Keep current collapsed state - only collapse button can change it
      mainSidebarCollapsed: state.mainSidebarCollapsed,
    }));
  },
  setSelectedPageSidebarItem: (itemId) => {
    // Select page sidebar item without auto-collapsing main sidebar
    set((state) => ({
      selectedPageSidebarItem: itemId,
      // Keep current collapsed state - only collapse button can change it
      mainSidebarCollapsed: state.mainSidebarCollapsed,
    }));
  },
}));
