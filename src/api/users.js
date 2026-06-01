import { api } from "./client";

export async function fetchUsers() {
  const res = await api("/api/users");
  return res.data || [];
}

export async function createUser(user) {
  return api("/api/users", { method: "POST", body: JSON.stringify(user) });
}

export async function updateUser(id, data) {
  return api(`/api/users/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export async function deleteUser(id) {
  return api(`/api/users/${id}`, { method: "DELETE" });
}
