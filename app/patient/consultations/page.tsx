"use client";

import * as React from "react";

import { apiFetch } from "@/lib/api/client";
import { getSession } from "@/lib/auth/storage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PatientConsultationsPage() {
  const session = typeof window !== "undefined" ? getSession() : null;
  const patientId = session?.userId;

  const [items, setItems] = React.useState<any[]>([]);

  React.useEffect(() => {
    async function load() {
      if (!patientId) return;
      const res = await apiFetch<{ items: any[] }>(`/api/patients/${patientId}/consultations`);
      setItems(res.items);
    }
    load();
  }, [patientId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Consultations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((c) => (
            <div key={c.id} className="rounded-md border border-border p-3">
              <div className="text-sm text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</div>
              <div className="font-medium">{c.reason ?? "—"}</div>
              {c.ecole ? <div className="text-xs text-muted-foreground mt-0.5">Ecole: {c.ecole}</div> : null}
              <div className="text-sm text-muted-foreground">{c.diagnosis ?? ""}</div>
            </div>
          ))}
          {items.length === 0 ? <div className="text-sm text-muted-foreground">Empty</div> : null}
        </div>
      </CardContent>
    </Card>
  );
}
