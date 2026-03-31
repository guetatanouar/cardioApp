"use client";

import * as React from "react";
import Link from "next/link";

import { apiFetch } from "@/lib/api/client";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PatientListItem = {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  severity_status: "critique" | "surveillance" | "stable";
  pathology: string | null;
};

export default function PatientsPage() {
  const [q, setQ] = React.useState("");
  const [items, setItems] = React.useState<PatientListItem[]>([]);
  const [loading, setLoading] = React.useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await apiFetch<{ items: PatientListItem[] }>(`/api/patients?page=1&pageSize=20&q=${encodeURIComponent(q)}`);
      setItems(res.items);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input placeholder="Rechercher" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="h-10 rounded-md border border-input px-3 text-sm" onClick={load} disabled={loading}>
          Search
        </button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Patients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {items.map((p) => (
              <Link key={p.id} href={`/patients/${p.id}`} className="flex items-center justify-between gap-3 py-3 hover:opacity-80">
                <div>
                  <div className="font-medium">
                    {p.last_name} {p.first_name}
                  </div>
                  <div className="text-sm text-muted-foreground">{p.pathology ?? ""}</div>
                </div>
                <div className="text-xs text-muted-foreground">{p.severity_status}</div>
              </Link>
            ))}
            {items.length === 0 ? <div className="py-8 text-sm text-muted-foreground">Empty</div> : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
