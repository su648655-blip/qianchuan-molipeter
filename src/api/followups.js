import { api } from "./client";
import { fromSnakeFollowup, toSnakeFollowup } from "./adapters";

export async function fetchFollowups() {
  const res = await api("/api/followups");
  return (res.data || []).map(fromSnakeFollowup);
}

export async function createFollowup(f) {
  return api("/api/followups", { method: "POST", body: JSON.stringify(toSnakeFollowup(f)) });
}
