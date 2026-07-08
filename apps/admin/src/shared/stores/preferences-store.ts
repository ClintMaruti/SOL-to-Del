import { create } from "zustand";

interface PreferencesStore {
  // Add preference-related state here as needed
  // Example: columnSettings, theme preferences, etc.
}

export const usePreferencesStore = create<PreferencesStore>(() => ({}));
