"use client";

import { getSession } from "@/lib/auth/storage";
import { config } from "@/lib/config";

// Mock data for offline mode
const mockData: Record<string, any> = {
  "/api/dashboard/summary": {
    totalPatients: 25,
    appointmentsToday: 4,
    unreadStaffMessages: 2,
    criticalAlerts: [
      { patient_id: "1", first_name: "Ahmed", last_name: "Benali", spo2: 88, heart_rate: 110 }
    ]
  },
  "/api/patients": {
    items: [
      { id: "1", first_name: "Ahmed", last_name: "Benali", date_of_birth: "1975-03-15", severity_status: "critique", pathology: "Hypertension", phone: "+213550123456", email: "ahmed@email.com" },
      { id: "2", first_name: "Fatima", last_name: "Zohra", date_of_birth: "1982-07-22", severity_status: "stable", pathology: "Diabète", phone: "+213550789012", email: null },
      { id: "3", first_name: "Karim", last_name: "Saidi", date_of_birth: "1968-11-05", severity_status: "surveillance", pathology: "Insuffisance cardiaque", phone: "+213550345678", email: "karim@email.com" }
    ],
    total: 3
  },
  "/api/appointments": {
    items: [
      { id: "1", patient_id: "1", first_name: "Ahmed", last_name: "Benali", starts_at: new Date().toISOString(), duration_minutes: 30, type: "consultation", status: "scheduled", reason: "Contrôle routine", notes: "" },
      { id: "2", patient_id: "2", first_name: "Fatima", last_name: "Zohra", starts_at: new Date(Date.now() + 3600000).toISOString(), duration_minutes: 45, type: "suivi", status: "scheduled", reason: "Suivi diabète", notes: "" }
    ]
  },
  "/api/chat": {
    items: [
      { id: "1", sender_role: "patient", content: "Bonjour docteur, j'ai une question", created_at: new Date().toISOString(), is_read: false },
      { id: "2", sender_role: "admin", content: "Bonjour, je vous écoute", created_at: new Date(Date.now() - 60000).toISOString(), is_read: true }
    ]
  }
};

function getMockResponse<T>(path: string): T | null {
  // Try exact match first
  if (mockData[path]) return mockData[path] as T;

  // Try pattern matching for paths with query params or IDs
  const basePath = path.split("?")[0];
  if (mockData[basePath]) return mockData[basePath] as T;

  // Handle /api/patients/:id pattern
  if (basePath.match(/\/api\/patients\/[^\/]+$/)) {
    return {
      patient: { id: "1", first_name: "Ahmed", last_name: "Benali", date_of_birth: "1975-03-15", blood_type: "A+", phone: "+213550123456", email: "ahmed@email.com", address: "Alger", emergency_contact_name: "Wife", emergency_contact_phone: "+213550999999", allergies: "Pollen", medical_history: "Hypertension depuis 2010", pathology: "Hypertension", severity_status: "critique" },
      vitals: [
        { id: "1", recorded_at: new Date(Date.now() - 86400000).toISOString(), systolic_bp: 140, diastolic_bp: 90, heart_rate: 75, spo2: 98, weight_kg: 78.5 }
      ],
      consultations: [
        { id: "1", created_at: new Date(Date.now() - 172800000).toISOString(), reason: "Contrôle", exam: "Auscultation", diagnosis: "HTA contrôlée", treatment: "Bisoprolol", note: "Suite du traitement" }
      ],
      documents: []
    } as T;
  }

  return null;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const session = typeof window !== "undefined" ? getSession() : null;

  const headers = new Headers();
  if (init?.headers) {
    const h = init.headers;
    if (h instanceof Headers) h.forEach((v, k) => headers.set(k, v));
    else if (Array.isArray(h)) h.forEach(([k, v]) => headers.set(k, v));
    else Object.entries(h as Record<string, string>).forEach(([k, v]) => headers.set(k, v));
  }
  headers.set("Content-Type", "application/json");
  if (session?.token) headers.set("Authorization", `Bearer ${session.token}`);

  const isMutation = init?.method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(init.method.toUpperCase());

  try {
    const res = await fetch(`${config.api.baseUrl}${path}`, {
      ...init,
      headers
    });

    if (!res.ok) {
      const text = await res.text();

      // Session expirée → rediriger vers la page de connexion
      if (res.status === 401) {
        const { clearSession } = await import("@/lib/auth/storage");
        clearSession();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }

      if (isMutation) {
        console.error(`[API ERROR] ${init?.method} ${path} returned ${res.status}:`, text);
      }
      throw new Error(text || `HTTP_${res.status}`);
    }

    return (await res.json()) as T;
  } catch (e) {
    // Return mock data only for GET requests (offline mode)
    if (!isMutation) {
      const mock = getMockResponse<T>(path);
      if (mock !== null) {
        console.warn(`[OFFLINE] Using mock data for ${path}`);
        return mock;
      }
    }
    throw e;
  }
}

export async function apiUpload<T>(path: string, form: FormData, init?: RequestInit): Promise<T> {
  const session = typeof window !== "undefined" ? getSession() : null;
  const headers = new Headers(init?.headers);
  if (session?.token) headers.set("Authorization", `Bearer ${session.token}`);

  try {
    const res = await fetch(`${config.api.baseUrl}${path}`, {
      ...init,
      method: init?.method ?? "POST",
      headers,
      body: form
    });

    if (!res.ok) {
      const text = await res.text();

      // Session expirée → rediriger vers la page de connexion
      if (res.status === 401) {
        const { clearSession } = await import("@/lib/auth/storage");
        clearSession();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }

      throw new Error(text || `HTTP_${res.status}`);
    }

    return (await res.json()) as T;
  } catch (e) {
    throw e;
  }
}
