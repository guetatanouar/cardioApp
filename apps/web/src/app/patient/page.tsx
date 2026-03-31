"use client";

import * as React from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { apiFetch } from "@/lib/api/client";
import { getSession } from "@/lib/auth/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PatientDashboard() {
  const session = typeof window !== "undefined" ? getSession() : null;
  const patientId = session?.userId;

  const [items, setItems] = React.useState<any[]>([]);
  const [form, setForm] = React.useState({ systolicBp: "", diastolicBp: "", heartRate: "", spo2: "", weightKg: "" });

  async function load() {
    if (!patientId) return;
    const res = await apiFetch<{ items: any[] }>(`/api/patients/${patientId}/vitals`);
    setItems(res.items);
  }

  React.useEffect(() => {
    load();
  }, [patientId]);

  async function submit() {
    if (!patientId) return;
    await apiFetch(`/api/patients/${patientId}/vitals`, {
      method: "POST",
      body: JSON.stringify({
        systolicBp: form.systolicBp ? Number(form.systolicBp) : undefined,
        diastolicBp: form.diastolicBp ? Number(form.diastolicBp) : undefined,
        heartRate: form.heartRate ? Number(form.heartRate) : undefined,
        spo2: form.spo2 ? Number(form.spo2) : undefined,
        weightKg: form.weightKg ? Number(form.weightKg) : undefined
      })
    });
    setForm({ systolicBp: "", diastolicBp: "", heartRate: "", spo2: "", weightKg: "" });
    await load();
  }

  const chartData = [...items]
    .reverse()
    .slice(-30)
    .map((v) => ({
      date: new Date(v.recorded_at).toLocaleDateString(),
      hr: v.heart_rate,
      spo2: v.spo2
    }));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Mes constantes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-5">
            <Input placeholder="Sys" value={form.systolicBp} onChange={(e) => setForm((s) => ({ ...s, systolicBp: e.target.value }))} />
            <Input placeholder="Dia" value={form.diastolicBp} onChange={(e) => setForm((s) => ({ ...s, diastolicBp: e.target.value }))} />
            <Input placeholder="FC" value={form.heartRate} onChange={(e) => setForm((s) => ({ ...s, heartRate: e.target.value }))} />
            <Input placeholder="SpO2" value={form.spo2} onChange={(e) => setForm((s) => ({ ...s, spo2: e.target.value }))} />
            <Input placeholder="Poids" value={form.weightKg} onChange={(e) => setForm((s) => ({ ...s, weightKg: e.target.value }))} />
          </div>
          <div className="mt-3">
            <Button onClick={submit}>Enregistrer</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Évolution</CardTitle>
        </CardHeader>
        <CardContent style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="date" hide />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="hr" stroke="hsl(var(--primary))" dot={false} />
              <Line type="monotone" dataKey="spo2" stroke="#60a5fa" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
