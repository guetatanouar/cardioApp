"use client";

import * as React from "react";

import { apiFetch } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AgendaPage() {
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await apiFetch<{ items: any[] }>("/api/appointments");
        if (!mounted) return;
        setItems(res.items);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agenda</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? <div className="text-sm text-muted-foreground">Loading</div> : null}
        <div className="divide-y divide-border">
          {items.map((a) => (
            <div key={a.id} className="flex items-center justify-between gap-3 py-3">
              <div>
                <div className="font-medium">
                  {a.last_name} {a.first_name}
                </div>
                <div className="text-sm text-muted-foreground">{a.type} • {a.status}</div>
              </div>
              <div className="text-sm text-muted-foreground">{new Date(a.starts_at).toLocaleString()}</div>
            </div>
          ))}
          {items.length === 0 ? <div className="py-8 text-sm text-muted-foreground">Empty</div> : null}
        </div>
      </CardContent>
    </Card>
  );
}
