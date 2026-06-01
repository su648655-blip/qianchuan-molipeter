const PREFIX = "qc_";

export function loadFromStorage(key, fallback = null) {
  try {
    const saved = localStorage.getItem(PREFIX + key);
    return saved ? JSON.parse(saved) : fallback;
  } catch { return fallback; }
}

export function saveToStorage(key, data) {
  try { localStorage.setItem(PREFIX + key, JSON.stringify(data)); } catch {}
}

export function removeFromStorage(key) {
  try { localStorage.removeItem(PREFIX + key); } catch {}
}
