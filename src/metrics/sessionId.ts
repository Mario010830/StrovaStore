const STORAGE_KEY = "mkt_session_id";

function newSessionId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    // fall through
  }
  return `mkt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
}

/**
 * Anonymous session id persisted in localStorage for the browser profile.
 */
export function getSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (existing?.trim()) return existing.trim();
    const id = newSessionId();
    window.localStorage.setItem(STORAGE_KEY, id);
    return id;
  } catch {
    return newSessionId();
  }
}
