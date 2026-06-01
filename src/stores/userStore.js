import { create } from "zustand";
import { generateId } from "../lib/utils";
import { loadFromStorage, saveToStorage } from "../services/persistService";
import * as userApi from "../api/users";
import { DEFAULT_USERS } from "../data/constants";

const IS_SERVER = true;

const useUserStore = create((set, get) => ({
  users: loadFromStorage("users", IS_SERVER ? [] : DEFAULT_USERS),

  setUsers: (users) => {
    set({ users });
    if (!IS_SERVER) saveToStorage("users", users);
  },

  fetchUsers: async () => {
    if (!IS_SERVER) return null;
    try {
      const users = await userApi.fetchUsers();
      set({ users });
      return users;
    } catch { return null; }
  },

  addUser: async (user) => {
    const newUser = { ...user, id: generateId() };
    if (IS_SERVER) {
      try { await userApi.createUser(newUser); } catch (e) { console.error("addUser API error:", e); }
    }
    set((state) => ({ users: [...state.users, newUser] }));
    return newUser;
  },

  editUser: async (id, data) => {
    if (IS_SERVER) {
      try { await userApi.updateUser(id, data); } catch (e) { console.error("editUser API error:", e); }
    }
    set((state) => ({ users: state.users.map((u) => (u.id === id ? { ...u, ...data } : u)) }));
  },

  deleteUser: async (id) => {
    if (IS_SERVER) {
      try { await userApi.deleteUser(id); } catch (e) { console.error("deleteUser API error:", e); }
    }
    set((state) => ({ users: state.users.filter((u) => u.id !== id) }));
  },

  getSalesNames: () => get().users.filter((u) => u.role === "sales").map((u) => u.name),
}));

export default useUserStore;
