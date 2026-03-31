"use client";

import { getSession } from "@/lib/auth/storage";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:4000";

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const session = typeof window !== "undefined" ? getSession() : null;

  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  if (session?.token) headers.set("Authorization", `Bearer ${session.token}`);

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `HTTP_${res.status}`);
    }

    return (await res.json()) as T;
  } catch (e) {
    throw e;
  }
}

export async function apiUpload<T>(path: string, form: FormData, init?: RequestInit): Promise<T> {
  const session = typeof window !== "undefined" ? getSession() : null;
  const headers = new Headers(init?.headers);
  if (session?.token) headers.set("Authorization", `Bearer ${session.token}`);

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    method: init?.method ?? "POST",
    headers,
    body: form
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP_${res.status}`);
  }

  return (await res.json()) as T;
}
