"use client";

import { useState, useEffect } from "react";
import { getSession, setSession, SecretairePermissions } from "./storage";
import { apiFetch } from "@/lib/api/client";

export function usePagePermission(requiredPerm?: keyof SecretairePermissions): boolean {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkAccess() {
      const session = getSession();
      
      if (!session) {
        window.location.href = "/login";
        return;
      }

      if (session.role === "admin" || session.role === "patient") {
        setHasAccess(true);
        return;
      }

      // Refresh permissions from server
      try {
        const permRes = await apiFetch<{ items: any[] }>("/api/settings/secretaire-permissions");
        const freshPerms = permRes.items.find((p: any) => String(p.user_id) === String(session.userId));
        if (freshPerms) {
          const updatedSession = { ...session, permissions: freshPerms };
          setSession(updatedSession);
          if (requiredPerm && !freshPerms[requiredPerm]) {
            window.location.href = "/access-denied";
            return;
          }
        }
      } catch {
        // Use cached permissions if refresh fails
      }

      if (requiredPerm && !session.permissions?.[requiredPerm]) {
        window.location.href = "/access-denied";
        return;
      }

      setHasAccess(true);
    }

    checkAccess();
  }, [requiredPerm]);

  return hasAccess === true;
}
