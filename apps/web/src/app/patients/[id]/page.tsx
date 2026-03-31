"use client";

import * as React from "react";
import { useParams } from "next/navigation";

import { apiFetch } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PatientDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        const res = await apiFetch<any>(`/api/patients/${id}`);
        if (!mounted) return;
        setData(res);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading && !data) {
    return <div className="text-sm text-muted-foreground">Loading</div>;
  }

  if (!data) {
    return <div className="text-sm text-muted-foreground">Not found</div>;
  }

  const p = data.patient;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>
            {p.last_name} {p.first_name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="text-sm">
              <div className="text-muted-foreground">Email</div>
              <div>{p.email ?? "—"}</div>
            </div>
            <div className="text-sm">
              <div className="text-muted-foreground">Téléphone</div>
              <div>{p.phone ?? "—"}</div>
            </div>
            <div className="text-sm">
              <div className="text-muted-foreground">Pathologie</div>
              <div>{p.pathology ?? "—"}</div>
            </div>
            <div className="text-sm">
              <div className="text-muted-foreground">Sévérité</div>
              <div>{p.severity_status}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Constantes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.vitals?.slice(0, 5).map((v: any) => (
                <div key={v.id} className="text-sm text-muted-foreground">
                  {new Date(v.recorded_at).toLocaleDateString()} - {v.systolic_bp}/{v.diastolic_bp} - {v.heart_rate} bpm - SpO2 {v.spo2}%
                </div>
              ))}
              {!data.vitals?.length ? <div className="text-sm text-muted-foreground">Empty</div> : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Consultations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.consultations?.slice(0, 5).map((c: any) => (
                <div key={c.id} className="text-sm">
                  <div className="text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</div>
                  <div className="font-medium">{c.reason ?? "—"}</div>
                </div>
              ))}
              {!data.consultations?.length ? <div className="text-sm text-muted-foreground">Empty</div> : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
