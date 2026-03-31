"use client";

import * as React from "react";

import { apiFetch } from "@/lib/api/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrescriptionsPage() {
  const [patientId, setPatientId] = React.useState("");
  const [items, setItems] = React.useState<any[]>([]);

  async function load() {
    if (!patientId) return;
    const res = await apiFetch<{ items: any[] }>(`/api/prescriptions?patientId=${encodeURIComponent(patientId)}`);
    setItems(res.items);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ordonnances</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input value={patientId} onChange={(e) => setPatientId(e.target.value)} placeholder="Patient ID" />
          <Button variant="outline" onClick={load}>Load</Button>
        </div>
        <div className="space-y-3">
          {items.map((p) => (
            <div key={p.id} className="rounded-md border border-border p-3">
              <div className="text-sm text-muted-foreground">{new Date(p.created_at).toLocaleString()}</div>
              <pre className="mt-2 overflow-auto text-xs">{JSON.stringify(p.items, null, 2)}</pre>
            </div>
          ))}
          {items.length === 0 ? <div className="text-sm text-muted-foreground">Empty</div> : null}
        </div>
      </CardContent>
    </Card>
  );
}
