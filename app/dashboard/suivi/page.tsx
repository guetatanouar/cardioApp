"use client";

import * as React from "react";
import { apiFetch } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SuiviPage() {
  const [patients, setPatients] = React.useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = React.useState<any>(null);
  const [vitals, setVitals] = React.useState<any[]>([]);
  const [consultations, setConsultations] = React.useState<any[]>([]);

  const [newVital, setNewVital] = React.useState({
    systolic: "",
    diastolic: "",
    heart_rate: "",
    weight: "",
    sp02: "",
    note: ""
  });

  async function loadPatients() {
    const res = await apiFetch<any[] | { items: any[] }>("/api/patients?page=1&pageSize=100");
    const patientList = Array.isArray(res) ? res : (res as any).items ?? [];
    setPatients(patientList);
  }

  async function loadPatientData(id: string) {
    try {
      const data = await apiFetch<{
        patient: any;
        vitals: any[];
        consultations: any[];
      }>(`/api/patients/${id}`);
      setSelectedPatient(data.patient);
      setVitals(data.vitals || []);
      setConsultations(data.consultations || []);
    } catch (e) {
      console.error(e);
    }
  }

  React.useEffect(() => {
    loadPatients().catch(() => undefined);
  }, []);

  async function addVital() {
    if (!selectedPatient) return;
    const payload = {
      systolic: Number(newVital.systolic),
      diastolic: Number(newVital.diastolic),
      heart_rate: Number(newVital.heart_rate),
      weight: Number(newVital.weight),
      sp02: Number(newVital.sp02),
      note: newVital.note || undefined
    };
    await apiFetch(`/api/patients/${selectedPatient.id}/vitals`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
    setNewVital({ systolic: "", diastolic: "", heart_rate: "", weight: "", sp02: "", note: "" });
    await loadPatientData(selectedPatient.id);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Suivi medical</h1>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Selection patient</CardTitle>
          </CardHeader>
          <CardContent>
            <select
              value={selectedPatient?.id || ""}
              onChange={(e) => {
                const p = patients.find((pat) => pat.id === e.target.value);
                setSelectedPatient(p || null);
                if (p) loadPatientData(p.id);
              }}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            >
              <option value="">Choisir un patient</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>{p.last_name} {p.first_name}</option>
              ))}
            </select>
          </CardContent>
        </Card>

        {selectedPatient && (
          <Card>
            <CardHeader>
              <CardTitle>Informations patient</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 text-sm">
                <div><span className="text-muted-foreground">Nom:</span> {selectedPatient.last_name} {selectedPatient.first_name}</div>
                <div><span className="text-muted-foreground">Date de naissance:</span> {selectedPatient.date_of_birth}</div>
                <div><span className="text-muted-foreground">Groupe sanguin:</span> {selectedPatient.blood_type || "—"}</div>
                <div><span className="text-muted-foreground">Pathologie:</span> {selectedPatient.pathology || "—"}</div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {selectedPatient && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Ajouter constante</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm">Tension systolique</label>
                  <Input
                    type="number"
                    value={newVital.systolic}
                    onChange={(e) => setNewVital({ ...newVital, systolic: e.target.value })}
                    placeholder="120"
                  />
                </div>
                <div>
                  <label className="text-sm">Tension diastolique</label>
                  <Input
                    type="number"
                    value={newVital.diastolic}
                    onChange={(e) => setNewVital({ ...newVital, diastolic: e.target.value })}
                    placeholder="80"
                  />
                </div>
                <div>
                  <label className="text-sm">Frequence cardiaque</label>
                  <Input
                    type="number"
                    value={newVital.heart_rate}
                    onChange={(e) => setNewVital({ ...newVital, heart_rate: e.target.value })}
                    placeholder="70"
                  />
                </div>
                <div>
                  <label className="text-sm">SpO2 (%)</label>
                  <Input
                    type="number"
                    value={newVital.sp02}
                    onChange={(e) => setNewVital({ ...newVital, sp02: e.target.value })}
                    placeholder="98"
                  />
                </div>
                <div>
                  <label className="text-sm">Poids (kg)</label>
                  <Input
                    type="number"
                    value={newVital.weight}
                    onChange={(e) => setNewVital({ ...newVital, weight: e.target.value })}
                    placeholder="70"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm">Note</label>
                <Input
                  value={newVital.note}
                  onChange={(e) => setNewVital({ ...newVital, note: e.target.value })}
                  placeholder="Note optionnelle..."
                />
              </div>
              <Button onClick={addVital} className="w-full">Enregistrer constante</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dernieres constantes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(vitals || []).slice(0, 5).map((v: any) => (
                  <div key={v.id} className="rounded-lg border border-border p-3">
                    <div className="text-xs text-muted-foreground">
                      {new Date(v.recorded_at).toLocaleString()}
                    </div>
                    <div className="mt-1 grid grid-cols-2 gap-2 text-sm">
                      <div>TA: {v.systolic}/{v.diastolic} mmHg</div>
                      <div>FC: {v.heart_rate} bpm</div>
                      <div>SpO2: {v.sp02}%</div>
                      <div>Poids: {v.weight} kg</div>
                    </div>
                    {v.note && <div className="mt-2 text-xs text-muted-foreground">{v.note}</div>}
                  </div>
                ))}
                {(vitals || []).length === 0 && (
                  <div className="text-sm text-muted-foreground">Aucune constante enregistree</div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Dernieres consultations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(consultations || []).slice(0, 5).map((c: any) => (
                  <div key={c.id} className="rounded-lg border border-border p-3">
                    <div className="text-xs text-muted-foreground">
                      {new Date(c.created_at).toLocaleString()} - {c.author || "Medecin"}
                    </div>
                    <div className="mt-1 font-medium">{c.motif || c.reason || "Consultation"}</div>
                    {c.ecole ? <div className="text-xs text-muted-foreground mt-0.5">Ecole: {c.ecole}</div> : null}
                    {c.diagnostic && <div className="text-sm text-muted-foreground">Diagnostic: {c.diagnostic}</div>}
                    {c.traitement && <div className="text-sm text-muted-foreground">Traitement: {c.traitement}</div>}
                  </div>
                ))}
                {(consultations || []).length === 0 && (
                  <div className="text-sm text-muted-foreground">Aucune consultation enregistree</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
