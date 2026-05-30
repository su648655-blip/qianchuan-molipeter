import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(n) {
  if (n == null) return "-";
  if (n >= 10000) return (n / 10000).toFixed(1) + "万";
  return n.toLocaleString();
}

export function formatDate(d) {
  if (!d) return "-";
  return new Date(d).toISOString().slice(0, 10);
}

export function formatDateTime(d) {
  if (!d) return "-";
  return new Date(d).toLocaleString("zh-CN");
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
