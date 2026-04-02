"use client";

export type AuthRole = "admin" | "secretaire" | "patient";

export type SecretairePermissions = {
  can_view_patients: boolean;
  can_edit_patients: boolean;
  can_view_appointments: boolean;
  can_edit_appointments: boolean;
  can_view_chat: boolean;
  can_view_prescriptions: boolean;
  can_edit_prescriptions: boolean;
  can_view_vitals: boolean;
  can_add_vitals: boolean;
  can_manage_patient_accounts: boolean;
};

export type StoredSession = {
  token: string;
  role: AuthRole;
  userId?: string;
  fullName?: string;
  email?: string;
  permissions?: SecretairePermissions;
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
