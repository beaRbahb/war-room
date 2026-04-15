import type { UserSession } from "../types";

const SESSION_KEY = "war-room-session";

/** Get stored session from localStorage */
export function getSession(): UserSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as UserSession) : null;
  } catch {
    return null;
  }
}

/** Save session to localStorage */
export function saveSession(session: UserSession): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

/** Clear session */
export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

/** Generate a simple unique ID for this user */
export function generateUserId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
