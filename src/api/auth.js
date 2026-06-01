import { api } from "./client";

export async function login(username, password) {
  const res = await api("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  return res.user;
}

export async function fetchApiKey(username) {
  const res = await api(`/api/apikey/${username}`);
  return res.apiKey || "";
}

export async function saveApiKey(username, key) {
  return api("/api/apikey", {
    method: "POST",
    body: JSON.stringify({ username, apiKey: key }),
  });
}
