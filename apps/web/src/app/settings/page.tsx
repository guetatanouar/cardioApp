"use client";

import * as React from "react";

import { apiFetch } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const [items, setItems] = React.useState<any[]>([]);

  async function load() {
    const res = await apiFetch<{ items: any[] }>("/api/settings/secretaire-permissions");
    setItems(res.items);
  }

  React.useEffect(() => {
    load();
  }, []);

  async function toggle(userId: string, key: string, value: boolean) {
    await apiFetch(`/api/settings/secretaire-permissions/${userId}`, {
      method: "PUT",
      body: JSON.stringify({ [key]: value })
    });
    await load();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Paramètres</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((p) => (
          <div key={p.user_id} className="rounded-md border border-border p-3">
            <div className="font-medium">{p.full_name}</div>
            <div className="text-sm text-muted-foreground">{p.email}</div>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {[
                ["canViewPatients", "Patients (view)"],
                ["canEditPatients", "Patients (edit)"],
                ["canViewAppointments", "RDV (view)"],
                ["canEditAppointments", "RDV (edit)"],
                ["canViewChat", "Chat"],
                ["canViewPrescriptions", "Ordonnances (view)"],
                ["canEditPrescriptions", "Ordonnances (edit)"]
              ].map(([key, label]) => (
                <Button
                  key={key}
                  variant="outline"
                  onClick={() => toggle(p.user_id, key, !p[key.replace(/[A-Z]/g, (m: string) => `_${m.toLowerCase()}`)])}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        ))}
        {items.length === 0 ? <div className="text-sm text-muted-foreground">Empty</div> : null}
      </CardContent>
    </Card>
  );
}
