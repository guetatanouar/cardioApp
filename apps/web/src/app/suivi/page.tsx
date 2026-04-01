"use client";

import * as React from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { apiFetch } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Period = "1m" | "3m" | "6m" | "1y";

export default function SuiviPage() {
  const [patients, setPatients] = React.useState<Array<{ id: string; first_name: string; last_name: string }>>([]);
  const [patientId, setPatientId] = React.useState("");
  const [period, setPeriod] = React.useState<Period>("3m");
  const [items, setItems] = React.useState<any[]>([]);

  async function loadPatients() {
    const res = await apiFetch<{ items: Array<{ id: string; first_name: string; last_name: string }> }>(
      "/api/patients?page=1&pageSize=50"
    );
    setPatients(res.items);
    if (!patientId && res.items[0]) {
      setPatientId(res.items[0].id);
    }
  }

  async function loadVitals(targetPatientId: string) {
    if (!targetPatientId) return;
    const res = await apiFetch<{ items: any[] }>(`/api/patients/${targetPatientId}/vitals`);
    setItems(res.items);
  }

  React.useEffect(() => {
    loadPatients().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    loadVitals(patientId).catch(() => undefined);
  }, [patientId]);

  const cutoffDate = React.useMemo(() => {
    const d = new Date();
    if (period === "1m") d.setMonth(d.getMonth() - 1);
    if (period === "3m") d.setMonth(d.getMonth() - 3);
    if (period === "6m") d.setMonth(d.getMonth() - 6);
    if (period === "1y") d.setFullYear(d.getFullYear() - 1);
    return d;
  }, [period]);

  const filtered = items
    .filter((v) => new Date(v.recorded_at) >= cutoffDate)
    .sort((a, b) => +new Date(a.recorded_at) - +new Date(b.recorded_at));

  const chartData = filtered.map((v) => ({
    date: new Date(v.recorded_at).toLocaleDateString(),
    systolic: v.systolic_bp,
    diastolic: v.diastolic_bp,
    hr: v.heart_rate,
    weight: v.weight_kg,
    spo2: v.spo2
  }));

  const latest = filtered[filtered.length - 1];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Suivi medical</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="h-10 min-w-72 rounded-md border border-input bg-transparent px-3 text-sm"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.last_name} {p.first_name}
                </option>
              ))}
            </select>

            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as Period)}
              className="h-10 rounded-md border border-input bg-transparent px-3 text-sm"
            >
              <option value="1m">1 mois</option>
              <option value="3m">3 mois</option>
              <option value="6m">6 mois</option>
              <option value="1y">1 an</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">TA</div>
            <div className="text-2xl font-semibold">{latest ? `${latest.systolic_bp ?? "-"}/${latest.diastolic_bp ?? "-"}` : "-"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Frequence cardiaque</div>
            <div className="text-2xl font-semibold">{latest?.heart_rate ?? "-"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Poids</div>
            <div className="text-2xl font-semibold">{latest?.weight_kg ?? "-"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">SpO2</div>
            <div className="text-2xl font-semibold">{latest?.spo2 ?? "-"}%</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Evolution tension arterielle</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="date" hide />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="systolic" stroke="#ef4444" dot={false} />
              <Line type="monotone" dataKey="diastolic" stroke="#f97316" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Frequence cardiaque et SpO2</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="date" hide />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="hr" stroke="#3b82f6" dot={false} />
                <Line type="monotone" dataKey="spo2" stroke="#22c55e" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Evolution du poids</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="date" hide />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="weight" stroke="#8b5cf6" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
