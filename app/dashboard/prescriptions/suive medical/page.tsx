import * as React from "react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";

import { apiFetch } from "@/lib/api/client";
import { dispatchNotification } from "@/lib/notifications";
import { usePagePermission } from "@/lib/auth/usePermissions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Plus, Trash2, Printer, Download } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function PrescriptionsPage() {
  const hasAccess = usePagePermission("can_view_prescriptions");
  const [patients, setPatients] = React.useState<any[]>([]);
  const [patientId, setPatientId] = React.useState("");
  const [items, setItems] = React.useState<any[]>([]);

  const [showNew, setShowNew] = React.useState(false);
  const [generalNotes, setGeneralNotes] = React.useState("");
  const [medicines, setMedicines] = React.useState([
    { name: "", dosage: "", frequency: "", duration: "", instructions: "" }
  ]);

  async function loadPatients() {
    const res = await apiFetch<any[] | { items: any[] }>("/api/patients?page=1&pageSize=100");
    const patientList = Array.isArray(res) ? res : (res as any).items ?? [];
    setPatients(patientList);
    if (!patientId && patientList[0]) {
      setPatientId(patientList[0].id);
    }
  }

  async function load() {
    if (!patientId) return;
    const res = await apiFetch<any[] | { items: any[] }>(`/api/prescriptions?patientId=${encodeURIComponent(patientId)}`);
    const rxItems = Array.isArray(res) ? res : (res as any).items ?? [];
    setItems(rxItems);
  }

  React.useEffect(() => {
    loadPatients().catch(() => undefined);
  }, []);
interface Patient {
  id: string;
  first_name: string;
  last_name: string;
}

  React.useEffect(() => {
    load().catch(() => undefined);
  }, [patientId]);
interface VitalEntry {
  id: string;
  recorded_at: string;
  systolic?: number | null;
  diastolic?: number | null;
  heart_rate?: number | null;
  weight?: number | null;
  sp02?: number | null;
}

  async function createPrescription(e: React.FormEvent) {
    e.preventDefault();
    if (!patientId) return;
function formatDate(d: string) {
  const dt = new Date(d);
  return `${dt.getDate()} ${dt.toLocaleString("fr", { month: "short" })}`;
}

    const payloadItems = medicines.filter((m) => m.name && m.dosage && m.frequency && m.duration);
    if (payloadItems.length === 0) return;
function formatMonth(d: string) {
  return new Date(d).toLocaleString("fr", { month: "short" });
}

    await apiFetch("/api/prescriptions", {
      method: "POST",
      body: JSON.stringify({
        patientId,
        generalNotes,
        items: payloadItems
export default function MedicalDashboard() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [vitals, setVitals] = useState<VitalEntry[]>([]);

  useEffect(() => {
    apiFetch<Patient[]>("/api/patients")
      .then((res) => {
        const list = Array.isArray(res) ? res : (res as any).items ?? [];
        setPatients(list);
      })
    });

    const patient = patients.find(p => p.id === patientId);
    dispatchNotification({
      id: `presc-${Date.now()}`,
      title: "Ordonnance créée",
      detail: `Pour ${patient?.last_name || ""} ${patient?.first_name || ""}`,
      type: "success"
    });

    setShowNew(false);
    setGeneralNotes("");
    setMedicines([{ name: "", dosage: "", frequency: "", duration: "", instructions: "" }]);
    await load();
  }

  const exportPdfPrescription = (p: any) => {
    const patient = patients.find((pat) => pat.id === p.patient_id);
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.setTextColor(59, 130, 246);
    doc.text("ORDONNANCE MEDICALE", 105, 20, { align: "center" });

    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text("Dr. Cabinet de Cardiologie", 20, 35);
    doc.text("123 Avenue de la Sante", 20, 40);
    doc.text("Alger, Algerie", 20, 45);
    doc.text(new Date(p.date).toLocaleDateString("fr-DZ"), 190, 35, { align: "right" });

    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(0.5);
    doc.line(20, 50, 190, 50);

    doc.setFillColor(249, 250, 251);
    doc.rect(20, 55, 170, 20, "F");
    doc.setFontSize(10);
    doc.text(`Patient: ${patient?.last_name || ""} ${patient?.first_name || ""}`, 25, 62);
    doc.text(`Ne(e) le: ${patient ? new Date(patient.date_of_birth).toLocaleDateString() : ""}`, 25, 68);
      .catch(() => undefined);
  }, []);

    const meds = typeof p.medications === 'string' ? JSON.parse(p.medications) : (p.medications || []);
    autoTable(doc, {
      startY: 80,
      head: [["Medicament", "Dosage", "Frequence", "Duree"]],
      body: meds.map((item: any) => [item.name, item.dosage, item.frequency, item.duration]),
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [59, 130, 246], textColor: 255 },
      alternateRowStyles: { fillColor: [249, 250, 251] }
    });
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

    doc.save(`ordonnance_${patient?.last_name || "patient"}.pdf`);
  };
  const sortedVitals = useMemo(
    () => [...vitals].sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()),
    [vitals]
  );

  function addMedicine() {
    setMedicines([...medicines, { name: "", dosage: "", frequency: "", duration: "", instructions: "" }]);
  }
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

  function removeMedicine(i: number) {
    setMedicines(medicines.filter((_, idx) => idx !== i));
  }
  const fcData = useMemo(
    () => sortedVitals
      .filter((v) => v.heart_rate != null)
      .map((v) => ({ date: formatDate(v.recorded_at), frequence: v.heart_rate! })),
    [sortedVitals]
  );

  function updateMedicine(i: number, field: string, value: string) {
    const updated = [...medicines];
    updated[i] = { ...updated[i], [field]: value };
    setMedicines(updated);
  }
  const poidsData = useMemo(
    () => sortedVitals
      .filter((v) => v.weight != null)
      .map((v) => ({ date: formatMonth(v.recorded_at), poids: v.weight! })),
    [sortedVitals]
  );

  if (!hasAccess) return null;
  const latest = sortedVitals[sortedVitals.length - 1];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Ordonnances</h1>
        <Button onClick={() => setShowNew(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle ordonnance
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ordonnances recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(items || []).map((p) => {
              const meds = typeof p.medications === 'string' ? JSON.parse(p.medications) : (p.medications || []);
              return (
                <div key={p.id} className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-primary" />
                    <div>
                      <div className="font-medium">{p.patient_name || "Patient"}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(p.date).toLocaleDateString()} - {meds.length} medicament(s)
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => exportPdfPrescription(p)}>
                      <Download className="mr-1 h-4 w-4" />
                      PDF
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => window.print()}>
                      <Printer className="mr-1 h-4 w-4" />
                      Imprimer
                    </Button>
                  </div>
                </div>
              );
            })}
            {(items || []).length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Aucune ordonnance
              </div>
    <div className="flex min-h-screen bg-[#f6f6f3]">
      <main className="flex-1 p-6">
        {/* Patients */}
        <div className="bg-white rounded-2xl p-4 border mb-5">
          <p className="text-sm text-gray-500 mb-3">Sélectionner un patient</p>
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
              <span className="text-sm text-gray-400">Aucun patient trouvé</span>
            )}
          </div>
        </CardContent>
      </Card>

      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Nouvelle ordonnance</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={createPrescription}>
                <div>
                  <label className="text-sm">Patient</label>
                  <select
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                    className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                    required
                  >
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>{p.last_name} {p.first_name}</option>
                    ))}
                  </select>
                </div>
        </div>

                <div>
                  <label className="text-sm">Medicaments</label>
                  <div className="mt-2 space-y-2">
                    {medicines.map((med, i) => (
                      <div key={i} className="grid gap-2 md:grid-cols-5">
                        <Input
                          placeholder="Nom"
                          value={med.name}
                          onChange={(e) => updateMedicine(i, "name", e.target.value)}
                          required
                        />
                        <Input
                          placeholder="Dosage"
                          value={med.dosage}
                          onChange={(e) => updateMedicine(i, "dosage", e.target.value)}
                          required
                        />
                        <Input
                          placeholder="Frequence"
                          value={med.frequency}
                          onChange={(e) => updateMedicine(i, "frequency", e.target.value)}
                          required
                        />
                        <Input
                          placeholder="Duree"
                          value={med.duration}
                          onChange={(e) => updateMedicine(i, "duration", e.target.value)}
                          required
                        />
                        {medicines.length > 1 && (
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeMedicine(i)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={addMedicine}>
                      <Plus className="mr-1 h-4 w-4" />
                      Ajouter medicament
                    </Button>
                  </div>
                </div>
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Tension artérielle"
            value={latest ? `${latest.systolic ?? "—"}/${latest.diastolic ?? "—"}` : "—"}
            unit="mmHg"
          />
          <StatCard
            title="Fréquence cardiaque"
            value={latest?.heart_rate != null ? String(latest.heart_rate) : "—"}
            unit="bpm"
          />
          <StatCard
            title="Poids"
            value={latest?.weight != null ? String(latest.weight) : "—"}
            unit="kg"
          />
          <StatCard
            title="Saturation O₂"
            value={latest?.sp02 != null ? String(latest.sp02) : "—"}
            unit="%"
          />
        </div>

                <div>
                  <label className="text-sm">Notes generales</label>
                  <Input
                    value={generalNotes}
                    onChange={(e) => setGeneralNotes(e.target.value)}
                    placeholder="Notes additionnelles..."
                  />
                </div>
        {/* Blood pressure chart */}
        <div className="bg-white rounded-2xl border p-5 mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Évolution de la tension artérielle</h3>
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

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowNew(false)}>Annuler</Button>
                  <Button type="submit">Creer ordonnance</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        {/* Bottom Charts */}
        <div className="grid grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl border p-5">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Fréquence cardiaque</h3>
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
            <h3 className="text-sm font-medium text-gray-700 mb-4">Évolution du poids</h3>
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
      )}
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
    <div className="bg-white border rounded-2xl p-5">
      <p className="text-sm text-gray-500">{title}</p>

      <div className="flex items-end gap-1 mt-2">
        <h3 className="text-3xl font-bold text-gray-800">{value}</h3>
        <span className="text-gray-400 mb-1">{unit}</span>
      </div>
    </div>
  );
}
