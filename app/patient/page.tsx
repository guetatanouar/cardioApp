"use client";

import * as React from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip } from "recharts";
import { Heart, Activity, Scale, Wind, Plus, FileText, MessageSquare } from "lucide-react";
import Link from "next/link";

import { apiFetch } from "@/lib/api/client";
import { getSession } from "@/lib/auth/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PatientDashboard() {
  const session = typeof window !== "undefined" ? getSession() : null;
  const patientId = session?.userId;

  const [items, setItems] = React.useState<any[]>([]);
  const [form, setForm] = React.useState({
    systolicBp: "",
    diastolicBp: "",
    heartRate: "",
    spo2: "",
    weightKg: "",
    note: ""
  });

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
        weightKg: form.weightKg ? Number(form.weightKg) : undefined,
        note: form.note || undefined
      })
    });
    setForm({ systolicBp: "", diastolicBp: "", heartRate: "", spo2: "", weightKg: "", note: "" });
    await load();
  }

  const chartData = [...items]
    .reverse()
    .slice(-30)
    .map((v) => ({
      date: new Date(v.recorded_at).toLocaleDateString(),
      systolic: v.systolic_bp,
      diastolic: v.diastolic_bp,
      hr: v.heart_rate,
      spo2: v.spo2,
      weight: v.weight_kg
    }));

  const latest = items[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Bienvenue</h1>
        <p className="text-sm text-muted-foreground">Voici votre espace santé</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-gradient-to-br from-red-500 to-pink-600 text-white border-0">
          <CardContent className="p-4">
            <Heart className="h-6 w-6 mb-2" />
            <div className="text-2xl font-bold">{latest?.heart_rate ?? "-"}</div>
            <div className="text-xs text-white/80">Battements/min</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0">
          <CardContent className="p-4">
            <Activity className="h-6 w-6 mb-2" />
            <div className="text-2xl font-bold">{latest ? `${latest.systolic_bp ?? "-"}/${latest.diastolic_bp ?? "-"}` : "-"}</div>
            <div className="text-xs text-white/80">Pression artérielle</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0">
          <CardContent className="p-4">
            <Wind className="h-6 w-6 mb-2" />
            <div className="text-2xl font-bold">{latest?.spo2 ?? "-"}%</div>
            <div className="text-xs text-white/80">Saturation O2</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-0">
          <CardContent className="p-4">
            <Scale className="h-6 w-6 mb-2" />
            <div className="text-2xl font-bold">{latest?.weight_kg ?? "-"} kg</div>
            <div className="text-xs text-white/80">Poids</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Enregistrer mes constantes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Systolique</label>
              <Input placeholder="120" value={form.systolicBp} onChange={(e) => setForm((s) => ({ ...s, systolicBp: e.target.value }))} className="h-10" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Diastolique</label>
              <Input placeholder="80" value={form.diastolicBp} onChange={(e) => setForm((s) => ({ ...s, diastolicBp: e.target.value }))} className="h-10" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Fréquence card.</label>
              <Input placeholder="72" value={form.heartRate} onChange={(e) => setForm((s) => ({ ...s, heartRate: e.target.value }))} className="h-10" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">SpO2 (%)</label>
              <Input placeholder="98" value={form.spo2} onChange={(e) => setForm((s) => ({ ...s, spo2: e.target.value }))} className="h-10" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Poids (kg)</label>
            <Input placeholder="70" value={form.weightKg} onChange={(e) => setForm((s) => ({ ...s, weightKg: e.target.value }))} className="h-10" />
          </div>
          <Input placeholder="Note optionnelle" value={form.note} onChange={(e) => setForm((s) => ({ ...s, note: e.target.value }))} />
          <Button onClick={submit} className="w-full bg-indigo-600 hover:bg-indigo-700">
            <Plus className="h-4 w-4 mr-2" />
            Enregistrer
          </Button>
        </CardContent>
      </Card>

      <div className="flex gap-2 overflow-x-auto pb-2">
        <Link href="/patient/documents" className="flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-md whitespace-nowrap">
          <FileText className="h-4 w-4" />
          Mes ordonnances
        </Link>
        <Link href="/patient/chat" className="flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-md whitespace-nowrap">
          <MessageSquare className="h-4 w-4" />
          Contacter mon médecin
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Évolution récente</CardTitle>
        </CardHeader>
        <CardContent style={{ height: 240 }}>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <Tooltip />
                <Line type="monotone" dataKey="systolic" stroke="#ef4444" dot={false} name="Sys" />
                <Line type="monotone" dataKey="diastolic" stroke="#f97316" dot={false} name="Dia" />
                <Line type="monotone" dataKey="hr" stroke="#ef4444" strokeDasharray="5 5" dot={false} name="FC" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Enregistrez vos constantes pour voir l'évolution
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
