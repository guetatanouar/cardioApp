"use client";

import * as React from "react";

import { apiFetch, apiUpload } from "@/lib/api/client";
import { getSession } from "@/lib/auth/storage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PatientDocumentsPage() {
  const session = typeof window !== "undefined" ? getSession() : null;
  const patientId = session?.userId;

  const [items, setItems] = React.useState<any[]>([]);
  const [file, setFile] = React.useState<File | null>(null);

  async function load() {
    if (!patientId) return;
    const res = await apiFetch<{ items: any[] }>(`/api/patients/${patientId}/documents`);
    setItems(res.items);
  }

  React.useEffect(() => {
    load();
  }, [patientId]);

  async function upload() {
    if (!patientId || !file) return;
    const form = new FormData();
    form.append("file", file);
    form.append("category", "Analyse");
    await apiUpload(`/api/patients/${patientId}/documents`, form);
    setFile(null);
    await load();
  }

  async function remove(docId: string) {
    if (!patientId) return;
    await apiFetch(`/api/patients/${patientId}/documents/${docId}`, { method: "DELETE" });
    await load();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mes documents</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <Button onClick={upload} disabled={!file}>Upload</Button>
        </div>

        <div className="divide-y divide-border">
          {items.map((d) => (
            <div key={d.id} className="flex items-center justify-between gap-3 py-3">
              <a className="text-sm underline" href={d.file_url} target="_blank" rel="noreferrer">
                {d.file_name}
              </a>
              <Button variant="outline" size="sm" onClick={() => remove(d.id)}>Delete</Button>
            </div>
          ))}
          {items.length === 0 ? <div className="py-8 text-sm text-muted-foreground">Empty</div> : null}
        </div>
      </CardContent>
    </Card>
  );
}
