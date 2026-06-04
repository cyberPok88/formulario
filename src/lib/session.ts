import type { User } from "./types";

const SESSION_KEY = "vote_user";
const SESSION_EXPIRY_KEY = "vote_user_expiry";
const SESSION_DURATION_MS = 12 * 60 * 60 * 1000;

export function saveSession(user: User): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  localStorage.setItem(SESSION_EXPIRY_KEY, String(Date.now() + SESSION_DURATION_MS));
}

export function getSession(): User | null {
  const stored = localStorage.getItem(SESSION_KEY);
  const expiry = localStorage.getItem(SESSION_EXPIRY_KEY);

  if (!stored || !expiry) {
    clearSession();
    return null;
  }

  if (Date.now() > Number(expiry)) {
    clearSession();
    return null;
  }

  try {
    return JSON.parse(stored) as User;
  } catch {
    clearSession();
    return null;
  }
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(SESSION_EXPIRY_KEY);
}

export function isSessionValid(): boolean {
  return getSession() !== null;
}
