import { create } from "zustand";

export const useAuthStore = create((set) => ({
  user: null,
  activeWorkspace: null,
  setUser: (user) => set({ user }),
  setActiveWorkspace: (workspace) => ({ activeWorkspace: workspace }),
  logout: () => set({ user: null, activeWorkspace: null }),
}));
