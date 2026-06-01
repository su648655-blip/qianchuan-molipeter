import { create } from "zustand";
import { loadFromStorage, saveToStorage, removeFromStorage } from "../services/persistService";
import * as authApi from "../api/auth";
import { DEFAULT_USERS } from "../data/constants";

const useAuthStore = create((set) => ({
  currentUser: loadFromStorage("currentUser", null),
  isAdmin: false,
  apiKey: "",
  editingKey: false,

  setEditingKey: (v) => set({ editingKey: v }),

  login: async (username, password, localUsers = []) => {
    try {
      const user = await authApi.login(username, password);
      saveToStorage("currentUser", user);
      set({ currentUser: user, isAdmin: user?.role === "admin" });
      try {
        const key = await authApi.fetchApiKey(username);
        set({ apiKey: key });
      } catch {}
      return true;
    } catch {
      // Fallback to local users if API fails
      const fallbackUsers = localUsers.length > 0 ? localUsers : DEFAULT_USERS;
      const u = fallbackUsers.find(x => x.username === username && x.password === password);
      if (u) {
        saveToStorage("currentUser", u);
        set({ currentUser: u, isAdmin: u?.role === "admin" });
        return true;
      }
      return false;
    }
  },

  loginLocal: (user) => {
    saveToStorage("currentUser", user);
    set({ currentUser: user, isAdmin: user?.role === "admin" });
  },

  logout: () => {
    removeFromStorage("currentUser");
    set({ currentUser: null, isAdmin: false });
  },

  restoreSession: () => {
    const saved = loadFromStorage("currentUser", null);
    if (saved) set({ currentUser: saved, isAdmin: saved?.role === "admin" });
  },

  setApiKey: (key) => set({ apiKey: key }),
}));

export default useAuthStore;
