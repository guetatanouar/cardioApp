"use client";

import * as React from "react";


import { apiFetch } from "@/lib/api/client";
import { dispatchNotification } from "@/lib/notifications";
import { usePagePermission } from "@/lib/auth/usePermissions";
import { useI18n } from "@/lib/i18n/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FileText, Plus, Trash2, Printer, Download, Search, X } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function PrescriptionsPage() {
  const hasAccess = usePagePermission("can_view_prescriptions");
  const { t } = useI18n();
  const [patients, setPatients] = React.useState<any[]>([]);
  const [patientId, setPatientId] = React.useState("");
  const [items, setItems] = React.useState<any[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);

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

  async function deletePrescription(id: string) {
    setDeletingId(id);
    try {
      await apiFetch(`/api/prescriptions/${id}`, { method: "DELETE" });
      dispatchNotification({
        id: `presc-del-${Date.now()}`,
        title: "Ordonnance supprimée",
        detail: "L'ordonnance a été supprimée",
        type: "success"
      });
      await load();
    } catch {
      dispatchNotification({
        id: `presc-del-err-${Date.now()}`,
        title: "Erreur",
        detail: "Impossible de supprimer l'ordonnance",
        type: "error"
      });
    } finally {
      setDeletingId(null);
    }
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

  const filteredPatients = searchQuery
    ? patients.filter((p) =>
        `${p.last_name} ${p.first_name}`.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : patients;

  const filteredItems = searchQuery
    ? items.filter((p) =>
        `${p.last_name || ""} ${p.first_name || ""}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (p.patient_name || "").toLowerCase().includes(searchQuery.toLowerCase())
      )
    : items;

  if (!hasAccess) return null;

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("searchPatient")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-8"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("prescriptions")}</h1>
        <Button onClick={() => setShowNew(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t("createPrescription")}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("recentPrescriptions")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(filteredItems || []).map((p) => {
              const meds = typeof p.medications === 'string' ? JSON.parse(p.medications) : (p.medications || []);
              return (
                <div key={p.id} className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-primary" />
                    <div>
                      <div className="font-medium">{p.patient_name || "Patient"}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(p.date).toLocaleDateString()} - {meds.length} {t("medicationCount")}
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
                      {t("print")}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={deletingId === p.id}
                      onClick={() => setConfirmDeleteId(p.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              );
            })}
            {(filteredItems || []).length === 0 && (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  {t("noPrescriptions")}
                </div>
            )}
          </div>
        </CardContent>
      </Card>

      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>{t("createPrescription")}</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={createPrescription}>
                <div>
                  <label className="text-sm">{t("patient")}</label>
                  <select
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                    className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                    required
                  >
                    {filteredPatients.map((p) => (
                      <option key={p.id} value={p.id}>{p.last_name} {p.first_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm">{t("medications")}</label>
                  <div className="mt-2 space-y-2">
                    {medicines.map((med, i) => (
                      <div key={i} className="grid gap-2 md:grid-cols-5">
                        <Input
                          placeholder={t("name")}
                          value={med.name}
                          onChange={(e) => updateMedicine(i, "name", e.target.value)}
                          required
                        />
                        <Input
                          placeholder={t("dosage")}
                          value={med.dosage}
                          onChange={(e) => updateMedicine(i, "dosage", e.target.value)}
                          required
                        />
                        <Input
                          placeholder={t("frequency")}
                          value={med.frequency}
                          onChange={(e) => updateMedicine(i, "frequency", e.target.value)}
                          required
                        />
                        <Input
                          placeholder={t("duration")}
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
                      {t("addMedication")}
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm">{t("generalNotes")}</label>
                  <Input
                    value={generalNotes}
                    onChange={(e) => setGeneralNotes(e.target.value)}
                    placeholder={t("additionalNotes")}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowNew(false)}>{t("cancel")}</Button>
                  <Button type="submit">{t("createPrescription")}</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      <ConfirmDialog
        open={confirmDeleteId !== null}
        onOpenChange={(o) => { if (!o) setConfirmDeleteId(null); }}
        title="Supprimer l'ordonnance"
        description="Cette action est irreversible. Voulez-vous vraiment supprimer cette ordonnance ?"
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="destructive"
        onConfirm={() => { if (confirmDeleteId) deletePrescription(confirmDeleteId); }}
      />
    </div>
  );
}
