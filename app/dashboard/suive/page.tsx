"use client";

import { useState, useEffect, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";

import { apiFetch } from "@/lib/api/client";
import { useI18n } from "@/lib/i18n/client";

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
}

interface VitalEntry {
  id: string;
  recorded_at: string;
  systolic?: number | null;
  diastolic?: number | null;
  heart_rate?: number | null;
  weight?: number | null;
  sp02?: number | null;
}

function formatDate(d: string) {
  const dt = new Date(d);
  return `${dt.getDate()} ${dt.toLocaleString("fr", { month: "short" })}`;
}

function formatMonth(d: string) {
  return new Date(d).toLocaleString("fr", { month: "short" });
}

export default function MedicalDashboard() {
  const { t } = useI18n();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery] = useState("");
  const [vitals, setVitals] = useState<VitalEntry[]>([]);

  useEffect(() => {
    apiFetch<Patient[]>("/api/patients")
      .then((res) => {
        const list = Array.isArray(res) ? res : (res as any).items ?? [];
        setPatients(list);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!selectedId) { setVitals([]); return; }
    apiFetch<VitalEntry[]>(`/api/vitals/${selectedId}`)
      .then((res) => setVitals(Array.isArray(res) ? res : []))
      .catch(() => undefined);
  }, [selectedId]);

  const filtered = useMemo(
    () => patients.filter((p) =>
      `${p.last_name} ${p.first_name}`.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [patients, searchQuery]
  );

  const sortedVitals = useMemo(
    () => [...vitals].sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()),
    [vitals]
  );

  const tensionData = useMemo(
    () => sortedVitals
      .filter((v) => v.systolic != null && v.diastolic != null)
      .map((v) => ({
        date: formatDate(v.recorded_at),
        systolique: v.systolic!,
        diastolique: v.diastolic!,
      })),
    [sortedVitals]
  );

  const fcData = useMemo(
    () => sortedVitals
      .filter((v) => v.heart_rate != null)
      .map((v) => ({ date: formatDate(v.recorded_at), frequence: v.heart_rate! })),
    [sortedVitals]
  );

  const poidsData = useMemo(
    () => sortedVitals
      .filter((v) => v.weight != null)
      .map((v) => ({ date: formatMonth(v.recorded_at), poids: v.weight! })),
    [sortedVitals]
  );

  const latest = sortedVitals[sortedVitals.length - 1];

  return (
    <div className="flex min-h-screen bg-[#f6f6f3]">
      <main className="flex-1 p-4 md:p-6">
        <div className="bg-white rounded-2xl p-4 border mb-5">
          <p className="text-sm text-gray-500 mb-3">{t("selectPatient")}</p>
          <div className="flex flex-wrap gap-2">
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className={`px-4 py-2 rounded-xl text-sm border transition ${
                  selectedId === p.id
                    ? "bg-[#4A49F5] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {p.last_name} {p.first_name}
              </button>
            ))}
            {filtered.length === 0 && (
              <span className="text-sm text-gray-400">{t("noPatientFound")}</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          <StatCard
            title={t("bloodPressure")}
            value={latest ? `${latest.systolic ?? "—"}/${latest.diastolic ?? "—"}` : "—"}
            unit="mmHg"
          />
          <StatCard
            title={t("heartRate")}
            value={latest?.heart_rate != null ? String(latest.heart_rate) : "—"}
            unit="bpm"
          />
          <StatCard
            title={t("weight")}
            value={latest?.weight != null ? String(latest.weight) : "—"}
            unit="kg"
          />
          <StatCard
            title={t("oxygenSat")}
            value={latest?.sp02 != null ? String(latest.sp02) : "—"}
            unit="%"
          />
        </div>

        <div className="bg-white rounded-2xl border p-5 mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-4">{t("bloodPressureEvolution")}</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={tensionData.length ? tensionData : [{ date: "—", systolique: 0, diastolique: 0 }]}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="systolique" stroke="#FF4D6D" strokeWidth={3} />
                <Line type="monotone" dataKey="diastolique" stroke="#FF9F43" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl border p-5">
            <h3 className="text-sm font-medium text-gray-700 mb-4">{t("heartRateEvolution")}</h3>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={fcData.length ? fcData : [{ date: "—", frequence: 0 }]}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="frequence" stroke="#4D7CFE" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white rounded-2xl border p-5">
            <h3 className="text-sm font-medium text-gray-700 mb-4">{t("weightEvolution")}</h3>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={poidsData.length ? poidsData : [{ date: "—", poids: 0 }]}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="poids" stroke="#8B5CF6" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  title,
  value,
  unit,
}: {
  title: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="bg-white border rounded-2xl p-3 md:p-5">
      <p className="text-xs md:text-sm text-gray-500">{title}</p>

      <div className="flex items-end gap-1 mt-2">
        <h3 className="text-xl md:text-3xl font-bold text-gray-800 leading-tight">{value}</h3>
        <span className="text-xs md:text-gray-400 text-gray-400 mb-1">{unit}</span>
      </div>
    </div>
  );
}
