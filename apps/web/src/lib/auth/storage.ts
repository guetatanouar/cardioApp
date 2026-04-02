"use client";

export type AuthRole = "admin" | "secretaire" | "patient";

export type StoredSession = {
  token: string;
  role: AuthRole;
  userId?: string;
  fullName?: string;
  email?: string;
};

const KEY = "cm_session";

export function getSession(): StoredSession | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredSession;
  } catch {
    return null;
  }
}

export function setSession(s: StoredSession) {
  window.localStorage.setItem(KEY, JSON.stringify(s));
}

export function clearSession() {
  window.localStorage.removeItem(KEY);
}
