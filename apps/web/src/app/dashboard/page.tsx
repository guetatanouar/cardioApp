"use client";

import * as React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api/client";

type PatientsRes = { total: number };

type AppointmentsRes = { items: any[] };

type HealthRes = { ok: boolean };

export default function DashboardPage() {
  const [apiOk, setApiOk] = React.useState<boolean | null>(null);
  const [patientsTotal, setPatientsTotal] = React.useState<number | null>(null);

  React.useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const health = await apiFetch<HealthRes>("/api/health");
        if (!mounted) return;
        setApiOk(health.ok);
      } catch {
        if (!mounted) return;
        setApiOk(false);
      }

      try {
        const patients = await apiFetch<{ total: number }>("/api/patients?page=1&pageSize=1");
        if (!mounted) return;
        setPatientsTotal(patients.total);
      } catch {
        if (!mounted) return;
        setPatientsTotal(null);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>API</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">{apiOk === null ? "Loading" : apiOk ? "Online" : "Offline"}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Patients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{patientsTotal ?? "—"}</div>
            <div className="text-sm text-muted-foreground">Total patients</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">—</div>
            <div className="text-sm text-muted-foreground">Critical alerts</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Today</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">RDV du jour (à venir)</div>
        </CardContent>
      </Card>
    </div>
  );
}
