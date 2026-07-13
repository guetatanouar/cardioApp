"use client";

import * as React from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip } from "recharts";
import { Heart, Activity, Scale, Wind, Plus } from "lucide-react";

import { apiFetch } from "@/lib/api/client";
import { getSession } from "@/lib/auth/storage";
import { useI18n } from "@/lib/i18n/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PatientHeader } from "@/components/patient/patient-header";

export default function PatientDashboard() {
  const { t } = useI18n();
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
    const res = await apiFetch<any[]>(`/api/vitals/${patientId}`);
    setItems(Array.isArray(res) ? res : []);
  }

  React.useEffect(() => { load(); }, [patientId]);

  async function submit() {
    if (!patientId) return;
    await apiFetch(`/api/vitals/${patientId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systolic: form.systolicBp ? Number(form.systolicBp) : undefined,
        diastolic: form.diastolicBp ? Number(form.diastolicBp) : undefined,
        heart_rate: form.heartRate ? Number(form.heartRate) : undefined,
        sp02: form.spo2 ? Number(form.spo2) : undefined,
        weight: form.weightKg ? Number(form.weightKg) : undefined,
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
      systolic: v.systolic,
      diastolic: v.diastolic,
      hr: v.heart_rate,
      spo2: v.sp02,
      weight: v.weight
    }));

  const latest = items[0];

  return (
    <div className="min-h-full bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-sm border">
        <PatientHeader />

        <div className="p-4 md:p-6 space-y-4 md:space-y-6">
          <div className="grid grid-cols-2 gap-2 md:gap-3">
            <div className="bg-red-50 rounded-xl p-3 md:p-4 text-center">
              <Heart className="h-5 w-5 md:h-6 md:w-6 text-red-500 mx-auto mb-1" />
              <div className="text-xl md:text-2xl font-bold text-red-700 leading-tight">{latest?.heart_rate ?? "-"}</div>
              <div className="text-[10px] md:text-xs text-red-500/80">{t("beatsPerMin" as any)}</div>
            </div>

            <div className="bg-blue-50 rounded-xl p-3 md:p-4 text-center">
              <Activity className="h-5 w-5 md:h-6 md:w-6 text-blue-500 mx-auto mb-1" />
              <div className="text-xl md:text-2xl font-bold text-blue-700 leading-tight">{latest ? `${latest.systolic ?? "-"}/${latest.diastolic ?? "-"}` : "-"}</div>
              <div className="text-[10px] md:text-xs text-blue-500/80">{t("bloodPressureLabel" as any)}</div>
            </div>

            <div className="bg-emerald-50 rounded-xl p-3 md:p-4 text-center">
              <Wind className="h-5 w-5 md:h-6 md:w-6 text-emerald-500 mx-auto mb-1" />
              <div className="text-xl md:text-2xl font-bold text-emerald-700 leading-tight">{latest?.sp02 ?? "-"}%</div>
              <div className="text-[10px] md:text-xs text-emerald-500/80">{t("oxygenSat" as any)}</div>
            </div>

            <div className="bg-amber-50 rounded-xl p-3 md:p-4 text-center">
              <Scale className="h-5 w-5 md:h-6 md:w-6 text-amber-500 mx-auto mb-1" />
              <div className="text-xl md:text-2xl font-bold text-amber-700 leading-tight">{latest?.weight ?? "-"} {t("kg" as any)}</div>
              <div className="text-[10px] md:text-xs text-amber-500/80">{t("weightLabel" as any)}</div>
            </div>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm md:text-base">{t("recordVitals" as any)}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] md:text-xs text-gray-500">{t("systolic" as any)}</label>
                  <Input placeholder="120" value={form.systolicBp} onChange={(e) => setForm((s) => ({ ...s, systolicBp: e.target.value }))} className="h-9 md:h-10 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] md:text-xs text-gray-500">{t("diastolic" as any)}</label>
                  <Input placeholder="80" value={form.diastolicBp} onChange={(e) => setForm((s) => ({ ...s, diastolicBp: e.target.value }))} className="h-9 md:h-10 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] md:text-xs text-gray-500">{t("heartRate" as any)}</label>
                  <Input placeholder="72" value={form.heartRate} onChange={(e) => setForm((s) => ({ ...s, heartRate: e.target.value }))} className="h-9 md:h-10 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] md:text-xs text-gray-500">{t("oxygenSat" as any)}</label>
                  <Input placeholder="98" value={form.spo2} onChange={(e) => setForm((s) => ({ ...s, spo2: e.target.value }))} className="h-9 md:h-10 text-sm" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] md:text-xs text-gray-500">{t("weight" as any)} ({t("kg" as any)})</label>
                <Input placeholder="70" value={form.weightKg} onChange={(e) => setForm((s) => ({ ...s, weightKg: e.target.value }))} className="h-9 md:h-10 text-sm" />
              </div>
              <Input placeholder={t("note" as any)} value={form.note} onChange={(e) => setForm((s) => ({ ...s, note: e.target.value }))} className="text-sm" />
              <Button onClick={submit} className="w-full bg-indigo-600 hover:bg-indigo-700 h-10 md:h-11">
                <Plus className="h-4 w-4 mr-2" />
                {t("record" as any)}
              </Button>
            </CardContent>
          </Card>

          <Card className="mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm md:text-base">{t("recentEvolution" as any)}</CardTitle>
            </CardHeader>
            <CardContent className="h-[200px] md:h-[240px]">
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
                <div className="flex h-full items-center justify-center text-sm text-gray-500">
                  {t("recordVitalsToSee" as any)}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
