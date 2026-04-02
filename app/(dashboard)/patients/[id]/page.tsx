"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { apiFetch, apiUpload } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type PatientData = {
  patient: {
    id: string;
    first_name: string;
    last_name: string;
    date_of_birth: string;
    blood_type: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
    allergies: string | null;
    medical_history: string | null;
    pathology: string | null;
    severity_status: "critique" | "surveillance" | "stable";
  };
  vitals: Array<{
    id: string;
    recorded_at: string;
    systolic_bp: number | null;
    diastolic_bp: number | null;
    heart_rate: number | null;
    spo2: number | null;
    weight_kg: number | null;
    note: string | null;
  }>;
  consultations: Array<{
    id: string;
    created_at: string;
    reason: string | null;
    exam: string | null;
    diagnosis: string | null;
    treatment: string | null;
    note: string | null;
  }>;
  documents: Array<{
    id: string;
    created_at: string;
    category: string;
    file_name: string;
    file_url: string;
  }>;
};

type PatientAccount = {
  id: string;
  patient_id: string;
  username: string;
  is_active: boolean;
  created_at: string;
};

type TabId = "dossier" | "consultations" | "vitals" | "documents" | "chat" | "access";

const tabs: Array<{ id: TabId; label: string }> = [
  { id: "dossier", label: "Dossier" },
  { id: "consultations", label: "Consultations" },
  { id: "vitals", label: "Constantes" },
  { id: "documents", label: "Documents" },
  { id: "chat", label: "Messagerie" },
  { id: "access", label: "Acces patient" }
];

export default function PatientDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [activeTab, setActiveTab] = React.useState<TabId>("dossier");

  const [data, setData] = React.useState<PatientData | null>(null);
  const [loading, setLoading] = React.useState(false);

  const [patientForm, setPatientForm] = React.useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    bloodType: "",
    phone: "",
    email: "",
    address: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    allergies: "",
    medicalHistory: "",
    pathology: "",
    severityStatus: "stable" as "critique" | "surveillance" | "stable"
  });

  const [savingPatient, setSavingPatient] = React.useState(false);

  const [consultForm, setConsultForm] = React.useState({ reason: "", exam: "", diagnosis: "", treatment: "", note: "" });
  const [vitalForm, setVitalForm] = React.useState({
    systolicBp: "",
    diastolicBp: "",
    heartRate: "",
    spo2: "",
    weightKg: "",
    note: ""
  });

  const [docFile, setDocFile] = React.useState<File | null>(null);
  const [docCategory, setDocCategory] = React.useState("Analyse");

  const [chatItems, setChatItems] = React.useState<Array<{ id: string; sender_role: string; content: string; created_at: string }>>([]);
  const [chatText, setChatText] = React.useState("");

  const [account, setAccount] = React.useState<PatientAccount | null>(null);
  const [accountForm, setAccountForm] = React.useState({ username: "", password: "", isActive: true, resetPassword: "" });

  async function loadPatient() {
    const res = await apiFetch<PatientData>(`/api/patients/${id}`);
    setData(res);

    setPatientForm({
      firstName: res.patient.first_name,
      lastName: res.patient.last_name,
      dateOfBirth: res.patient.date_of_birth?.slice(0, 10) ?? "",
      bloodType: res.patient.blood_type ?? "",
      phone: res.patient.phone ?? "",
      email: res.patient.email ?? "",
      address: res.patient.address ?? "",
      emergencyContactName: res.patient.emergency_contact_name ?? "",
      emergencyContactPhone: res.patient.emergency_contact_phone ?? "",
      allergies: res.patient.allergies ?? "",
      medicalHistory: res.patient.medical_history ?? "",
      pathology: res.patient.pathology ?? "",
      severityStatus: res.patient.severity_status
    });
  }

  async function loadAccount() {
    try {
      const res = await apiFetch<{ item: PatientAccount | null }>(`/api/settings/patient-accounts/${id}`);
      setAccount(res.item);
      const item = res.item;
      if (item) {
        setAccountForm({
          username: item.username,
          password: "",
          isActive: item.is_active,
          resetPassword: ""
        });
      }
    } catch {
      setAccount(null);
    }
  }

  async function loadChat() {
    try {
      const res = await apiFetch<{ items: Array<{ id: string; sender_role: string; content: string; created_at: string }> }>(
        `/api/chat?channel=${encodeURIComponent(`patient:${id}`)}`
      );
      setChatItems(res.items);
    } catch {
      setChatItems([]);
    }
  }

  React.useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        await Promise.all([loadPatient(), loadAccount(), loadChat()]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  React.useEffect(() => {
    if (activeTab !== "chat") return;
    const timer = setInterval(() => {
      loadChat().catch(() => undefined);
    }, 2500);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, id]);

  async function savePatient() {
    setSavingPatient(true);
    try {
      await apiFetch(`/api/patients/${id}`, {
        method: "PUT",
        body: JSON.stringify(patientForm)
      });
      await loadPatient();
    } finally {
      setSavingPatient(false);
    }
  }

  async function addConsultation() {
    await apiFetch(`/api/patients/${id}/consultations`, {
      method: "POST",
      body: JSON.stringify(consultForm)
    });
    setConsultForm({ reason: "", exam: "", diagnosis: "", treatment: "", note: "" });
    await loadPatient();
  }

  async function addVital() {
    await apiFetch(`/api/patients/${id}/vitals`, {
      method: "POST",
      body: JSON.stringify({
        systolicBp: vitalForm.systolicBp ? Number(vitalForm.systolicBp) : undefined,
        diastolicBp: vitalForm.diastolicBp ? Number(vitalForm.diastolicBp) : undefined,
        heartRate: vitalForm.heartRate ? Number(vitalForm.heartRate) : undefined,
        spo2: vitalForm.spo2 ? Number(vitalForm.spo2) : undefined,
        weightKg: vitalForm.weightKg ? Number(vitalForm.weightKg) : undefined,
        note: vitalForm.note || undefined
      })
    });

    setVitalForm({ systolicBp: "", diastolicBp: "", heartRate: "", spo2: "", weightKg: "", note: "" });
    await loadPatient();
  }

  async function uploadDocument() {
    if (!docFile) return;
    const form = new FormData();
    form.append("file", docFile);
    form.append("category", docCategory);

    await apiUpload(`/api/patients/${id}/documents`, form);
    setDocFile(null);
    await loadPatient();
  }

  async function deleteDocument(docId: string) {
    await apiFetch(`/api/patients/${id}/documents/${docId}`, { method: "DELETE" });
    await loadPatient();
  }

  async function sendChat() {
    const content = chatText.trim();
    if (!content) return;

    await apiFetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({ channel: `patient:${id}`, content })
    });

    setChatText("");
    await loadChat();
  }

  async function saveAccount() {
    if (!account) {
      await apiFetch("/api/settings/patient-accounts", {
        method: "POST",
        body: JSON.stringify({
          patientId: id,
          username: accountForm.username,
          password: accountForm.password
        })
      });
    } else {
      await apiFetch(`/api/settings/patient-accounts/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          isActive: accountForm.isActive,
          password: accountForm.resetPassword || undefined
        })
      });
    }

    setAccountForm((prev) => ({ ...prev, password: "", resetPassword: "" }));
    await loadAccount();
  }

  if (loading && !data) {
    return <div className="text-sm text-muted-foreground">Chargement...</div>;
  }

  if (!data) {
    return <div className="text-sm text-muted-foreground">Patient introuvable</div>;
  }

  const p = data.patient;
  const vitalChartData = [...data.vitals]
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

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>
            {p.last_name} {p.first_name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                size="sm"
                variant={tab.id === activeTab ? "default" : "outline"}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </Button>
            ))}
          </div>

          {activeTab === "dossier" ? (
            <div className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <Input value={patientForm.firstName} onChange={(e) => setPatientForm((s) => ({ ...s, firstName: e.target.value }))} placeholder="Prenom" />
                <Input value={patientForm.lastName} onChange={(e) => setPatientForm((s) => ({ ...s, lastName: e.target.value }))} placeholder="Nom" />
                <Input type="date" value={patientForm.dateOfBirth} onChange={(e) => setPatientForm((s) => ({ ...s, dateOfBirth: e.target.value }))} />
                <Input value={patientForm.bloodType} onChange={(e) => setPatientForm((s) => ({ ...s, bloodType: e.target.value }))} placeholder="Groupe sanguin" />
                <Input value={patientForm.phone} onChange={(e) => setPatientForm((s) => ({ ...s, phone: e.target.value }))} placeholder="Telephone" />
                <Input value={patientForm.email} onChange={(e) => setPatientForm((s) => ({ ...s, email: e.target.value }))} placeholder="Email" />
                <Input value={patientForm.pathology} onChange={(e) => setPatientForm((s) => ({ ...s, pathology: e.target.value }))} placeholder="Pathologie" />
                <select
                  value={patientForm.severityStatus}
                  onChange={(e) =>
                    setPatientForm((s) => ({ ...s, severityStatus: e.target.value as "critique" | "surveillance" | "stable" }))
                  }
                  className="h-10 rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  <option value="stable">Stable</option>
                  <option value="surveillance">Surveillance</option>
                  <option value="critique">Critique</option>
                </select>
                <Input
                  value={patientForm.emergencyContactName}
                  onChange={(e) => setPatientForm((s) => ({ ...s, emergencyContactName: e.target.value }))}
                  placeholder="Contact urgence (nom)"
                />
                <Input
                  value={patientForm.emergencyContactPhone}
                  onChange={(e) => setPatientForm((s) => ({ ...s, emergencyContactPhone: e.target.value }))}
                  placeholder="Contact urgence (telephone)"
                />
              </div>

              <Input value={patientForm.address} onChange={(e) => setPatientForm((s) => ({ ...s, address: e.target.value }))} placeholder="Adresse" />
              <Input value={patientForm.allergies} onChange={(e) => setPatientForm((s) => ({ ...s, allergies: e.target.value }))} placeholder="Allergies" />
              <Input
                value={patientForm.medicalHistory}
                onChange={(e) => setPatientForm((s) => ({ ...s, medicalHistory: e.target.value }))}
                placeholder="Antecedents medicaux"
              />

              <div className="flex justify-end">
                <Button onClick={savePatient} disabled={savingPatient}>{savingPatient ? "Enregistrement..." : "Enregistrer"}</Button>
              </div>
            </div>
          ) : null}

          {activeTab === "consultations" ? (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <Input value={consultForm.reason} onChange={(e) => setConsultForm((s) => ({ ...s, reason: e.target.value }))} placeholder="Motif" />
                <Input value={consultForm.exam} onChange={(e) => setConsultForm((s) => ({ ...s, exam: e.target.value }))} placeholder="Examen" />
                <Input value={consultForm.diagnosis} onChange={(e) => setConsultForm((s) => ({ ...s, diagnosis: e.target.value }))} placeholder="Diagnostic" />
                <Input value={consultForm.treatment} onChange={(e) => setConsultForm((s) => ({ ...s, treatment: e.target.value }))} placeholder="Traitement" />
              </div>
              <Input value={consultForm.note} onChange={(e) => setConsultForm((s) => ({ ...s, note: e.target.value }))} placeholder="Note" />

              <div className="flex justify-end">
                <Button onClick={addConsultation}>Ajouter consultation</Button>
              </div>

              <div className="space-y-3">
                {data.consultations.map((c) => (
                  <div key={c.id} className="rounded-md border border-border p-3">
                    <div className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</div>
                    <div className="font-medium">{c.reason || "-"}</div>
                    <div className="text-sm text-muted-foreground">{c.diagnosis || ""}</div>
                    <div className="mt-1 text-sm">{c.note || ""}</div>
                  </div>
                ))}
                {!data.consultations.length ? <div className="text-sm text-muted-foreground">Aucune consultation</div> : null}
              </div>
            </div>
          ) : null}

          {activeTab === "vitals" ? (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-5">
                <Input value={vitalForm.systolicBp} onChange={(e) => setVitalForm((s) => ({ ...s, systolicBp: e.target.value }))} placeholder="TA systolique" />
                <Input value={vitalForm.diastolicBp} onChange={(e) => setVitalForm((s) => ({ ...s, diastolicBp: e.target.value }))} placeholder="TA diastolique" />
                <Input value={vitalForm.heartRate} onChange={(e) => setVitalForm((s) => ({ ...s, heartRate: e.target.value }))} placeholder="FC" />
                <Input value={vitalForm.spo2} onChange={(e) => setVitalForm((s) => ({ ...s, spo2: e.target.value }))} placeholder="SpO2" />
                <Input value={vitalForm.weightKg} onChange={(e) => setVitalForm((s) => ({ ...s, weightKg: e.target.value }))} placeholder="Poids" />
              </div>
              <Input value={vitalForm.note} onChange={(e) => setVitalForm((s) => ({ ...s, note: e.target.value }))} placeholder="Note" />
              <div className="flex justify-end">
                <Button onClick={addVital}>Ajouter mesure</Button>
              </div>

              <div className="h-72 rounded-md border border-border p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={vitalChartData}>
                    <XAxis dataKey="date" hide />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="systolic" stroke="#ef4444" dot={false} />
                    <Line type="monotone" dataKey="diastolic" stroke="#f97316" dot={false} />
                    <Line type="monotone" dataKey="hr" stroke="#3b82f6" dot={false} />
                    <Line type="monotone" dataKey="spo2" stroke="#22c55e" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : null}

          {activeTab === "documents" ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <select value={docCategory} onChange={(e) => setDocCategory(e.target.value)} className="h-10 rounded-md border border-input bg-transparent px-3 text-sm">
                  <option value="Ordonnance">Ordonnance</option>
                  <option value="Radio">Radio</option>
                  <option value="Analyse">Analyse</option>
                  <option value="Echographie">Echographie</option>
                  <option value="Autre">Autre</option>
                </select>
                <input type="file" onChange={(e) => setDocFile(e.target.files?.[0] ?? null)} />
                <Button onClick={uploadDocument} disabled={!docFile}>Uploader</Button>
              </div>

              <div className="space-y-2">
                {data.documents.map((d) => (
                  <div key={d.id} className="flex items-center justify-between gap-2 rounded-md border border-border p-3">
                    <div>
                      <div className="font-medium">{d.file_name}</div>
                      <div className="text-xs text-muted-foreground">{d.category}</div>
                    </div>
                    <div className="flex gap-2">
                      <a href={d.file_url} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center rounded-md border border-border px-3 text-sm">
                        Ouvrir
                      </a>
                      <Button variant="outline" size="sm" onClick={() => deleteDocument(d.id)}>
                        Supprimer
                      </Button>
                    </div>
                  </div>
                ))}
                {!data.documents.length ? <div className="text-sm text-muted-foreground">Aucun document</div> : null}
              </div>
            </div>
          ) : null}

          {activeTab === "chat" ? (
            <div className="space-y-3">
              <div className="h-[45vh] overflow-auto rounded-md border border-border p-3">
                <div className="space-y-2">
                  {chatItems.map((m) => (
                    <div key={m.id} className="rounded-md border border-border p-2">
                      <div className="text-xs text-muted-foreground">
                        {m.sender_role} - {new Date(m.created_at).toLocaleString()}
                      </div>
                      <div className="text-sm">{m.content}</div>
                    </div>
                  ))}
                  {!chatItems.length ? <div className="text-sm text-muted-foreground">Aucun message</div> : null}
                </div>
              </div>

              <div className="flex gap-2">
                <Input value={chatText} onChange={(e) => setChatText(e.target.value)} placeholder="Ecrire un message..." />
                <Button onClick={sendChat}>Envoyer</Button>
              </div>
            </div>
          ) : null}

          {activeTab === "access" ? (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                {account ? "Compte patient actif" : "Aucun compte patient cree"}
              </div>

              <Input
                placeholder="Nom d'utilisateur"
                value={accountForm.username}
                onChange={(e) => setAccountForm((s) => ({ ...s, username: e.target.value }))}
                disabled={Boolean(account)}
              />

              {!account ? (
                <Input
                  type="password"
                  placeholder="Mot de passe"
                  value={accountForm.password}
                  onChange={(e) => setAccountForm((s) => ({ ...s, password: e.target.value }))}
                />
              ) : (
                <>
                  <Input
                    type="password"
                    placeholder="Nouveau mot de passe (optionnel)"
                    value={accountForm.resetPassword}
                    onChange={(e) => setAccountForm((s) => ({ ...s, resetPassword: e.target.value }))}
                  />
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={accountForm.isActive}
                      onChange={(e) => setAccountForm((s) => ({ ...s, isActive: e.target.checked }))}
                    />
                    Compte actif
                  </label>
                </>
              )}

              <div className="flex justify-end">
                <Button onClick={saveAccount}>{account ? "Mettre a jour l'acces" : "Creer l'acces patient"}</Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
