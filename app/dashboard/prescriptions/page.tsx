"use client";

import * as React from "react";

import { apiFetch } from "@/lib/api/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Trash2, Printer, Download } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function PrescriptionsPage() {
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

  React.useEffect(() => {
    load().catch(() => undefined);
  }, [patientId]);

  async function createPrescription(e: React.FormEvent) {
    e.preventDefault();
    if (!patientId) return;

    const payloadItems = medicines.filter((m) => m.name && m.dosage && m.frequency && m.duration);
    if (payloadItems.length === 0) return;

    await apiFetch("/api/prescriptions", {
      method: "POST",
      body: JSON.stringify({
        patientId,
        generalNotes,
        items: payloadItems
      })
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

    const meds = typeof p.medications === 'string' ? JSON.parse(p.medications) : (p.medications || []);
    autoTable(doc, {
      startY: 80,
      head: [["Medicament", "Dosage", "Frequence", "Duree"]],
      body: meds.map((item: any) => [item.name, item.dosage, item.frequency, item.duration]),
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [59, 130, 246], textColor: 255 },
      alternateRowStyles: { fillColor: [249, 250, 251] }
    });

    doc.save(`ordonnance_${patient?.last_name || "patient"}.pdf`);
  };

  function addMedicine() {
    setMedicines([...medicines, { name: "", dosage: "", frequency: "", duration: "", instructions: "" }]);
  }

  function removeMedicine(i: number) {
    setMedicines(medicines.filter((_, idx) => idx !== i));
  }

  function updateMedicine(i: number, field: string, value: string) {
    const updated = [...medicines];
    updated[i] = { ...updated[i], [field]: value };
    setMedicines(updated);
  }

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

                <div>
                  <label className="text-sm">Notes generales</label>
                  <Input
                    value={generalNotes}
                    onChange={(e) => setGeneralNotes(e.target.value)}
                    placeholder="Notes additionnelles..."
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowNew(false)}>Annuler</Button>
                  <Button type="submit">Creer ordonnance</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
