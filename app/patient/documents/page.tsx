"use client";

import * as React from "react";
import { apiFetch, apiUpload } from "@/lib/api/client";
import { getSession } from "@/lib/auth/storage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PatientHeader } from "@/components/patient/patient-header";

export default function PatientDocumentsPage() {
  const session = typeof window !== "undefined" ? getSession() : null;
  const patientId = session?.userId;

  const [items, setItems] = React.useState<any[]>([]);
  const [file, setFile] = React.useState<File | null>(null);
  const [category, setCategory] = React.useState("analyse");

  async function load() {
    if (!patientId) return;
    const res = await apiFetch<any[]>(`/api/documents/${patientId}`);
    setItems(res);
  }

  React.useEffect(() => {
    load();
  }, [patientId]);

  async function upload() {
    if (!patientId || !file) return;
    const form = new FormData();
    form.append("file", file);
    form.append("category", category);
    await apiUpload(`/api/documents/${patientId}`, form);
    setFile(null);
    await load();
  }

  async function remove(docId: string) {
    if (!patientId) return;
    await apiFetch(`/api/documents/${docId}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="min-h-full bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-sm border">
        <PatientHeader />
        <div className="p-4 md:p-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base md:text-lg">Mes documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-10 rounded-md border border-input bg-transparent px-3 text-sm">
                  <option value="analyse">Analyse</option>
                  <option value="radio">Radio</option>
                  <option value="echographie">Échographie</option>
                  <option value="autre">Autre</option>
                </select>
                <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-sm" />
                <Button onClick={upload} disabled={!file} className="h-10">Upload</Button>
              </div>
              <div className="divide-y divide-border">
                {items.map((d) => (
                  <div key={d.id} className="flex items-start md:items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <a className="text-sm underline break-all" href={`http://localhost:4000/${d.file_path}`} target="_blank" rel="noreferrer">{d.name}</a>
                      <div className="text-xs text-muted-foreground">{d.category} — {d.size}</div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => remove(d.id)} className="flex-shrink-0">Delete</Button>
                  </div>
                ))}
                {items.length === 0 ? <div className="py-8 text-sm text-muted-foreground">Empty</div> : null}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
