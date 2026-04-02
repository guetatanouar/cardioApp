"use client";

import * as React from "react";

import { apiFetch } from "@/lib/api/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Trash2, Printer, User } from "lucide-react";

export default function PrescriptionsPage() {
  const [patients, setPatients] = React.useState<Array<{ id: string; first_name: string; last_name: string; date_of_birth: string }>>([]);
  const [patientId, setPatientId] = React.useState("");
  const [items, setItems] = React.useState<any[]>([]);

  const [showNew, setShowNew] = React.useState(false);
  const [generalNotes, setGeneralNotes] = React.useState("");
  const [medicines, setMedicines] = React.useState([
    { name: "", dosage: "", frequency: "", duration: "", instructions: "" }
  ]);

  async function loadPatients() {
    const res = await apiFetch<{ items: Array<{ id: string; first_name: string; last_name: string; date_of_birth: string }> }>(
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

  const printPrescription = (p: any) => {
    const patient = patients.find(pat => pat.id === p.patient_id);
    const win = window.open("", "_blank");
    if (!win) return;
    
    const itemsHtml = p.items.map((item: any) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>${item.name}</strong><br/><small>${item.instructions || ""}</small></td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.dosage}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.frequency}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.duration}</td>
      </tr>
    `).join("");

    win.document.write(`
      <html>
        <head>
          <title>Ordonnance - ${patient?.last_name || ""}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; line-height: 1.6; }
            .header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; }
            .doctor-info { font-weight: bold; }
            .prescription-title { text-align: center; font-size: 24px; text-transform: uppercase; margin: 30px 0; color: #3b82f6; }
            .patient-info { margin-bottom: 30px; background: #f9fafb; padding: 15px; border-radius: 8px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { text-align: left; background: #f3f4f6; padding: 8px; }
            .footer { margin-top: 50px; text-align: right; }
            .signature { margin-top: 60px; border-top: 1px solid #000; width: 200px; display: inline-block; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="doctor-info">
              DR. CABINET CARDIOLOGIE<br/>
              123 Avenue de la Santé<br/>
              Alger, Algérie
            </div>
            <div class="date">Alger, le ${new Date(p.created_at).toLocaleDateString()}</div>
          </div>
          
          <div class="patient-info">
            <strong>Patient :</strong> ${patient?.last_name || ""} ${patient?.first_name || ""}<br/>
            <strong>Né(e) le :</strong> ${patient ? new Date(patient.date_of_birth).toLocaleDateString() : ""}
          </div>

          <div class="prescription-title">Ordonnance médical</div>

          <table>
            <thead>
              <tr>
                <th>Médicament</th>
                <th>Dosage</th>
                <th>Fréquence</th>
                <th>Durée</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          ${p.general_notes ? `<div style="margin-top: 20px;"><strong>Notes :</strong><br/>${p.general_notes}</div>` : ""}

          <div class="footer">
            <div class="signature">Signature et Cachet</div>
          </div>
          <button class="no-print" onclick="window.print()" style="margin-top: 20px; padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 5px; cursor: pointer;">Imprimer</button>
        </body>
      </html>
    `);
    win.document.close();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          Ordonnances
        </h1>
        <Button onClick={() => setShowNew(!showNew)}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle Ordonnance
        </Button>
      </div>

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
                <div key={p.id} className="flex items-center justify-between rounded-lg border p-4 transition-hover hover:bg-accent/50">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">
                        {patients.find((pat) => pat.id === p.patient_id)?.last_name}{" "}
                        {patients.find((pat) => pat.id === p.patient_id)?.first_name}
                      </span>
                      <Badge variant="outline">{new Date(p.created_at).toLocaleDateString()}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground italic">
                      {p.items.length} médicament(s) prescrit(s)
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => printPrescription(p)}>
                      <Printer className="h-4 w-4 mr-2" />
                      Imprimer
                    </Button>
                  </div>
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
