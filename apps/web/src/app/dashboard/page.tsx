"use client";

import * as React from "react";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api/client";

type DashboardSummary = {
  patientsTotal: number;
  appointmentsCountToday: number;
  appointmentsUrgent: number;
  appointmentsPlanned: number;
  appointmentsCompleted: number;
  appointmentsToday: {
    id: string;
    starts_at: string;
    duration_minutes: number;
    type: string;
    status: string;
    reason: string | null;
    patient_id: string;
    first_name: string;
    last_name: string;
    severity_status: "critique" | "surveillance" | "stable";
  }[];
  unreadStaffMessages: number;
  criticalAlerts: {
    patient_id: string;
    first_name: string;
    last_name: string;
    severity_status: "critique" | "surveillance" | "stable";
    recorded_at: string;
    spo2: number | null;
    heart_rate: number | null;
  }[];
  recentActivity: {
    id: string;
    event_at: string;
    event_type: "consultation" | "document";
    patient_id: string;
    first_name: string;
    last_name: string;
    label: string;
  }[];
};

const mockSummary: DashboardSummary = {
  patientsTotal: 25,
  appointmentsCountToday: 12,
  appointmentsUrgent: 2,
  appointmentsPlanned: 6,
  appointmentsCompleted: 4,
  unreadStaffMessages: 3,
  appointmentsToday: [],
  criticalAlerts: [],
  recentActivity: []
};

export default function DashboardPage() {
  const [summary, setSummary] = React.useState<DashboardSummary | null>(null);
  const [offline, setOffline] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const res = await apiFetch<DashboardSummary>("/api/dashboard/summary");
        if (!mounted) return;
        setSummary(res);
        setOffline(false);
      } catch {
        if (!mounted) return;
        setSummary(mockSummary);
        setOffline(true);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const appointments = summary?.appointmentsToday ?? [];
  const alerts = summary?.criticalAlerts ?? [];
  const activity = summary?.recentActivity ?? [];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Patients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{summary?.patientsTotal ?? "—"}</div>
            <div className="text-sm text-muted-foreground">actifs</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>RDV aujourd'hui</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{summary?.appointmentsCountToday ?? "—"}</div>
            <div className="text-sm text-muted-foreground">{summary?.appointmentsPlanned ?? 0} planifiés</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cas urgents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{summary?.appointmentsUrgent ?? "—"}</div>
            <div className="text-sm text-muted-foreground">à traiter</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Consultations / mois</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{summary?.appointmentsCompleted ?? "—"}</div>
            <div className="text-sm text-muted-foreground">ce mois</div>
          </CardContent>
        </Card>
      </div>

      {offline ? <div className="text-sm text-amber-600">Mode hors ligne: affichage des données de démonstration.</div> : null}

      <div className="grid gap-4 md:grid-cols-4">
        <Link href="/patients" className="rounded-lg border border-border bg-card p-4 text-sm hover:bg-accent/40">Nouveau dossier patient</Link>
        <Link href="/agenda" className="rounded-lg border border-border bg-card p-4 text-sm hover:bg-accent/40">Planifier un rendez-vous</Link>
        <Link href="/prescriptions" className="rounded-lg border border-border bg-card p-4 text-sm hover:bg-accent/40">Creer une ordonnance</Link>
        <Link href="/chat" className="rounded-lg border border-border bg-card p-4 text-sm hover:bg-accent/40">Ouvrir la messagerie</Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>RDV du jour</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {appointments.map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <div className="font-medium">
                      {a.last_name} {a.first_name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {a.type} • {a.status}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">{new Date(a.starts_at).toLocaleTimeString()}</div>
                </div>
              ))}
              {appointments.length === 0 ? <div className="py-8 text-sm text-muted-foreground">Aucun rendez-vous</div> : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alertes critiques</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {alerts.map((x) => (
                <div key={x.patient_id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <div className="font-medium">
                      {x.last_name} {x.first_name}
                    </div>
                    <div className="text-sm text-muted-foreground">{new Date(x.recorded_at).toLocaleDateString()}</div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {typeof x.spo2 === "number" ? `SpO2 ${x.spo2}%` : ""}
                    {typeof x.heart_rate === "number" ? ` • FC ${x.heart_rate} bpm` : ""}
                  </div>
                </div>
              ))}
              {alerts.length === 0 ? <div className="py-8 text-sm text-muted-foreground">Aucune alerte</div> : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activite recente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {activity.map((a) => (
                <div key={`${a.event_type}-${a.id}`} className="py-3">
                  <div className="font-medium">
                    {a.last_name} {a.first_name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {a.event_type === "consultation" ? "Consultation" : "Document"} - {a.label || "-"}
                  </div>
                  <div className="text-xs text-muted-foreground">{new Date(a.event_at).toLocaleString()}</div>
                </div>
              ))}
              {activity.length === 0 ? <div className="py-8 text-sm text-muted-foreground">Aucune activite</div> : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
