"use client";

import * as React from "react";

import { apiFetch } from "@/lib/api/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrescriptionsPage() {
  const [patients, setPatients] = React.useState<Array<{ id: string; first_name: string; last_name: string }>>([]);
  const [patientId, setPatientId] = React.useState("");
  const [items, setItems] = React.useState<any[]>([]);

  const [showNew, setShowNew] = React.useState(false);
  const [generalNotes, setGeneralNotes] = React.useState("");
  const [medicines, setMedicines] = React.useState([
    { name: "", dosage: "", frequency: "", duration: "", instructions: "" }
  ]);

  async function loadPatients() {
    const res = await apiFetch<{ items: Array<{ id: string; first_name: string; last_name: string }> }>(
      "/api/patients?page=1&pageSize=50"
    );
    setPatients(res.items);
    if (!patientId && res.items[0]) {
      setPatientId(res.items[0].id);
    }
  }

  async function load() {
    if (!patientId) return;
    const res = await apiFetch<{ items: any[] }>(`/api/prescriptions?patientId=${encodeURIComponent(patientId)}`);
    setItems(res.items);
  }

  React.useEffect(() => {
    loadPatients().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    load().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  function printPrescription(p: any) {
    const patient = patients.find((x) => x.id === p.patient_id);
    const itemHtml = (Array.isArray(p.items) ? p.items : [])
      .map(
        (m: { name?: string; dosage?: string; frequency?: string; duration?: string; instructions?: string }) => `
          <div style="margin-bottom: 12px;">
            <div><strong>${m.name || ""}</strong> - ${m.dosage || ""}</div>
            <div>${m.frequency || ""} | ${m.duration || ""}</div>
            <div>${m.instructions || ""}</div>
          </div>
        `
      )
      .join("");

    const html = `
      <html>
        <head><title>Ordonnance</title></head>
        <body style="font-family: Arial; padding: 24px;">
          <h2>Ordonnance - CardioManager</h2>
          <p><strong>Patient:</strong> ${patient ? `${patient.last_name} ${patient.first_name}` : p.patient_id}</p>
          <p><strong>Date:</strong> ${new Date(p.created_at).toLocaleDateString()}</p>
          <hr />
          ${itemHtml}
          <hr />
          <p>${p.general_notes || ""}</p>
        </body>
      </html>
    `;

    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.print();
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Ordonnances</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
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
            <Button variant="outline" onClick={load}>Rafraichir</Button>
            <Button onClick={() => setShowNew((v) => !v)}>{showNew ? "Fermer" : "Nouvelle ordonnance"}</Button>
          </div>

          {showNew ? (
            <form className="space-y-3 rounded-md border border-border p-3" onSubmit={createPrescription}>
              <div className="text-sm font-medium">Medications</div>

              {medicines.map((m, idx) => (
                <div key={idx} className="grid gap-2 md:grid-cols-5">
                  <Input
                    value={m.name}
                    onChange={(e) =>
                      setMedicines((arr) => arr.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x)))
                    }
                    placeholder="Nom"
                  />
                  <Input
                    value={m.dosage}
                    onChange={(e) =>
                      setMedicines((arr) => arr.map((x, i) => (i === idx ? { ...x, dosage: e.target.value } : x)))
                    }
                    placeholder="Dosage"
                  />
                  <Input
                    value={m.frequency}
                    onChange={(e) =>
                      setMedicines((arr) => arr.map((x, i) => (i === idx ? { ...x, frequency: e.target.value } : x)))
                    }
                    placeholder="Frequence"
                  />
                  <Input
                    value={m.duration}
                    onChange={(e) =>
                      setMedicines((arr) => arr.map((x, i) => (i === idx ? { ...x, duration: e.target.value } : x)))
                    }
                    placeholder="Duree"
                  />
                  <Input
                    value={m.instructions}
                    onChange={(e) =>
                      setMedicines((arr) => arr.map((x, i) => (i === idx ? { ...x, instructions: e.target.value } : x)))
                    }
                    placeholder="Instructions"
                  />
                </div>
              ))}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setMedicines((arr) => [...arr, { name: "", dosage: "", frequency: "", duration: "", instructions: "" }])
                  }
                >
                  Ajouter medicament
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMedicines((arr) => (arr.length > 1 ? arr.slice(0, -1) : arr))}
                >
                  Retirer
                </Button>
              </div>

              <Input value={generalNotes} onChange={(e) => setGeneralNotes(e.target.value)} placeholder="Notes generales" />

              <div className="flex justify-end">
                <Button type="submit">Creer ordonnance</Button>
              </div>
            </form>
          ) : null}

          <div className="space-y-3">
            {items.map((p) => (
              <div key={p.id} className="rounded-md border border-border p-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-medium">{new Date(p.created_at).toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">{(Array.isArray(p.items) ? p.items.length : 0)} medicament(s)</div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => printPrescription(p)}>
                    Imprimer / PDF
                  </Button>
                </div>

                <div className="mt-2 space-y-2">
                  {(Array.isArray(p.items) ? p.items : []).map((m: any, index: number) => (
                    <div key={index} className="rounded border border-border p-2 text-sm">
                      <div className="font-medium">{m.name} - {m.dosage}</div>
                      <div className="text-muted-foreground">{m.frequency} - {m.duration}</div>
                      <div className="text-muted-foreground">{m.instructions || ""}</div>
                    </div>
                  ))}
                  {p.general_notes ? <div className="text-sm text-muted-foreground">Notes: {p.general_notes}</div> : null}
                </div>
              </div>
            ))}
            {items.length === 0 ? <div className="text-sm text-muted-foreground">Aucune ordonnance</div> : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
