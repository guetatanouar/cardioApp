"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import { apiFetch, apiUpload } from "@/lib/api/client";
import { config } from "@/lib/config";
import { dispatchNotification } from "@/lib/notifications";
import { usePagePermission } from "@/lib/auth/usePermissions";
import { getSession } from "@/lib/auth/storage";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { CountrySelect } from "@/components/ui/country-select";
import { getCountryByCode } from "@/lib/countries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/cn";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DocumentPreview } from "@/components/ui/document-preview";
import { FileText, Plus, Trash2, Download, Upload, Eye, EyeOff } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type PatientListItem = {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  pathology: string | null;
  phone: string | null;
  email: string | null;
};

type PatientDetailRes = {
  patient: any;
  vitals: any[];
  consultations: any[];
  documents: any[];
  prescriptions: any[];
};

export default function PatientsPage() {
  const hasAccess = usePagePermission("can_view_patients");
  const searchParams = useSearchParams();
  const [q, setQ] = React.useState(searchParams.get("q") ?? "");
  const [pathologyFilter, setPathologyFilter] = React.useState("");
  const [consultationDate, setConsultationDate] = React.useState("");
  const [page, setPage] = React.useState(1);
  const pageSize = 12;

  const [items, setItems] = React.useState<PatientListItem[]>([]);
  const [total, setTotal] = React.useState(0);
  const [, setLoading] = React.useState(false);

  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [tab, setTab] = React.useState<"dossier" | "consultations" | "vitals" | "documents" | "messages" | "access" | "ordonnances">("dossier");
  const [detail, setDetail] = React.useState<PatientDetailRes | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [detailError, setDetailError] = React.useState<string | null>(null);

  const [vitalsPeriod, setVitalsPeriod] = React.useState<"1M" | "3M" | "6M" | "1Y">("3M");
  const [editVitalId, setEditVitalId] = React.useState<string | null>(null);
  const [editVitalForm, setEditVitalForm] = React.useState({
    systolic: "", diastolic: "", heart_rate: "", sp02: "", weight: "", note: ""
  });
  const [deletingVitalId, setDeletingVitalId] = React.useState<string | null>(null);
  const [confirmVitalDeleteId, setConfirmVitalDeleteId] = React.useState<string | null>(null);

  async function deleteVital(id: string) {
    if (!selectedId) return;
    setDeletingVitalId(id);
    try {
      await apiFetch(`/api/patients/${selectedId}/vitals/${id}`, { method: "DELETE" });
      dispatchNotification({ id: `vital-del-${Date.now()}`, title: "Mesure supprimée", detail: "Valeur supprimée", type: "success" });
      if (selectedId) await loadDetail(selectedId);
    } catch {
      dispatchNotification({ id: `vital-del-err-${Date.now()}`, title: "Erreur", detail: "Impossible de supprimer", type: "error" });
    } finally {
      setDeletingVitalId(null);
    }
  }
  const [savingVital, setSavingVital] = React.useState(false);

  const [chatItems, setChatItems] = React.useState<any[]>([]);
  const [chatText, setChatText] = React.useState("");
  const [chatLoading, setChatLoading] = React.useState(false);
  const [chatUnread, setChatUnread] = React.useState(0);

  const [account, setAccount] = React.useState<any | null>(null);
  const [accountLoading, setAccountLoading] = React.useState(false);
  const [accountError, setAccountError] = React.useState<string | null>(null);
  const [accountForm, setAccountForm] = React.useState({ username: "", password: "" });
  const [resetPassword, setResetPassword] = React.useState("");
  const [showResetPassword, setShowResetPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [accountSaving, setAccountSaving] = React.useState(false);

  const [editMode, setEditMode] = React.useState(false);
  const [editForm, setEditForm] = React.useState({
    phone: "", email: "", address: "", country: "", emergency_contact: "", pathology: "", allergies: "", medical_history: ""
  });
  const [editSaving, setEditSaving] = React.useState(false);
  const [editError, setEditError] = React.useState<string | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const [newConsultation, setNewConsultation] = React.useState({ date: new Date().toISOString().split('T')[0], reason: "", ecole: "", exam: "", diagnosis: "", treatment: "", note: "" });
  const [consultationSaving, setConsultationSaving] = React.useState(false);
  const [consultationError, setConsultationError] = React.useState<string | null>(null);
  const [editConsultId, setEditConsultId] = React.useState<string | null>(null);
  const [editConsultForm, setEditConsultForm] = React.useState({ date: "", motif: "", ecole: "", examen: "", diagnostic: "", traitement: "", note: "" });

  const [showCreate, setShowCreate] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [createError, setCreateError] = React.useState<string | null>(null);
  const [step, setStep] = React.useState(1);
  const [createForm, setCreateForm] = React.useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "M" as "M" | "F",
    bloodType: "",
    phone: "",
    email: "",
    address: "",
    pathology: "",
    severityStatus: "stable" as "critique" | "surveillance" | "stable",
    country: ""
  });
  const [newPatientVitals, setNewPatientVitals] = React.useState({
    systolic: "",
    diastolic: "",
    heartRate: "",
    sp02: "",
    weight: ""
  });
  const [newPatientDoc, setNewPatientDoc] = React.useState<File | null>(null);
  const [newPatientDocCategory, setNewPatientDocCategory] = React.useState("analyse");
  const [newPatientMeds, setNewPatientMeds] = React.useState<{ name: string; dosage: string; frequency: string; duration: string }[]>([]);
  const [newPatientAccount, setNewPatientAccount] = React.useState({ username: "", password: "" });

  async function load(customQ = q, customPage = page) {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(customPage), pageSize: String(pageSize), q: customQ });
    if (consultationDate) params.set('consultationDate', consultationDate);
    const res = await apiFetch<PatientListItem[] | { items: PatientListItem[]; total: number }>(
        `/api/patients?${params}`
      );
      const patientItems = Array.isArray(res) ? res : (res as any).items ?? [];
      const patientTotal = Array.isArray(res) ? res.length : (res as any).total ?? 0;
      setItems(patientItems);
      setTotal(patientTotal);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    const timer = setTimeout(() => load(), 300);
    return () => clearTimeout(timer);
  }, [page, q, consultationDate]);

  async function loadDetail(patientId: string) {
    setDetailLoading(true);
    setDetailError(null);
    try {
      const res = await apiFetch<PatientDetailRes>(`/api/patients/${patientId}`);
      setDetail(res);
    } catch {
      setDetail(null);
      setDetailError("Impossible de charger la fiche patient");
    } finally {
      setDetailLoading(false);
    }
  }

  async function loadAccount(patientId: string) {
    setAccountLoading(true);
    setAccountError(null);
    try {
      const res = await apiFetch<{ item: any | null }>(`/api/settings/patient-accounts/${patientId}`);
      setAccount(res.item);
      setAccountForm({ username: res.item?.username ?? "", password: "" });
      setResetPassword("");
    } catch {
      setAccount(null);
      setAccountError("Impossible de charger l'accès patient");
    } finally {
      setAccountLoading(false);
    }
  }

  React.useEffect(() => {
    if (!selectedId) return;
    setTab("dossier");
    setDetail(null);
    setAccount(null);
    setVitalsPeriod("3M");
    setChatItems([]);
    setChatText("");
    setChatUnread(0);
    setEditMode(false);
    setNewConsultation({ date: new Date().toISOString().split('T')[0], reason: "", ecole: "", exam: "", diagnosis: "", treatment: "", note: "" });
    setResetPassword("");
    loadDetail(selectedId).catch(() => undefined);
    loadAccount(selectedId).catch(() => undefined);
  }, [selectedId]);

  async function loadChat(patientId: string) {
    const channel = `patient:${patientId}`;
    setChatLoading(true);
    try {
      const res = await apiFetch<any[] | { items: any[] }>(`/api/chat?channel=${encodeURIComponent(channel)}`);
      const chatItems = Array.isArray(res) ? res : (res as any).items ?? [];
      setChatItems(chatItems);
      const unread = chatItems.filter((m: any) => !m.is_read && m.sender_role === "patient").length;
      setChatUnread(unread);
    } finally {
      setChatLoading(false);
    }
  }

  async function markChatRead(patientId: string) {
    const channel = `patient:${patientId}`;
    await apiFetch("/api/chat/mark-read", {
      method: "POST",
      body: JSON.stringify({ channel })
    });
  }

  async function sendMessage() {
    if (!chatText.trim() || !selectedId) return;
    const text = chatText.trim();
    setChatText("");
    setChatLoading(true);
    try {
      await apiFetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          channel: `patient:${selectedId}`,
          content: text
        })
      });
      await loadChat(selectedId);
    } finally {
      setChatLoading(false);
    }
  }

  React.useEffect(() => {
    if (!selectedId) return;
    if (tab !== "messages") return;

    let timer: ReturnType<typeof setInterval> | null = null;

    (async () => {
      await loadChat(selectedId);
      if (chatUnread > 0) {
        await markChatRead(selectedId);
        await loadChat(selectedId);
      }
    })().catch(() => undefined);

    timer = setInterval(() => {
      loadChat(selectedId).catch(() => undefined);
    }, 2500);

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [selectedId, tab]);

  function withinPeriod(dateIso: string, period: "1M" | "3M" | "6M" | "1Y") {
    const d = new Date(dateIso);
    const now = new Date();
    const cutoff = new Date(now);
    if (period === "1M") cutoff.setMonth(now.getMonth() - 1);
    else if (period === "3M") cutoff.setMonth(now.getMonth() - 3);
    else if (period === "6M") cutoff.setMonth(now.getMonth() - 6);
    else cutoff.setFullYear(now.getFullYear() - 1);
    return d >= cutoff;
  }

  React.useEffect(() => {
    const initial = searchParams.get("q") ?? "";
    const patientId = searchParams.get("patientId");
    setQ(initial);
    setPage(1);
    load(initial, 1).catch(() => undefined);
    if (patientId) {
      setSelectedId(patientId);
    }
  }, [searchParams]);

  React.useEffect(() => {
    if (!selectedId) return;
    const urlTab = searchParams.get("tab") as "dossier" | "consultations" | "vitals" | "documents" | "messages" | "access" | "ordonnances" | null;
    if (urlTab) {
      setTab(urlTab);
    }
  }, [selectedId, searchParams]);

  const filteredItems = (items || []).filter((p) => {
    if (pathologyFilter.trim() && !(p.pathology ?? "").toLowerCase().includes(pathologyFilter.trim().toLowerCase())) return false;
    if (q.trim()) {
      const search = q.toLowerCase();
      const searchable = [
        p.first_name,
        p.last_name,
        p.phone,
        p.email,
        p.pathology,
        p.id
      ].filter(Boolean).join(" ").toLowerCase();
      if (!searchable.includes(search)) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  async function createPatient(e: React.FormEvent) {
    e.preventDefault();
    if (step === 1) {
      const form = e.target as HTMLFormElement;
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      setStep(3);
      return;
    }
    setCreateError(null);
    setCreating(true);
    try {
      const payload = {
        first_name: createForm.firstName,
        last_name: createForm.lastName,
        date_of_birth: createForm.dateOfBirth,
        gender: createForm.gender,
        blood_type: createForm.bloodType || undefined,
        phone: createForm.phone || undefined,
        email: createForm.email || undefined,
        address: createForm.address || undefined,
        country: createForm.country || undefined,
        pathology: createForm.pathology || undefined,
        severity_status: createForm.severityStatus
      };

      const res = await apiFetch<{ id: string }>("/api/patients", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      const patientId = (res as any).id || (res as any).patientId;

      try {
        if (newPatientVitals.systolic || newPatientVitals.diastolic || newPatientVitals.heartRate || newPatientVitals.weight || newPatientVitals.sp02) {
          await apiFetch(`/api/patients/${patientId}/vitals`, {
            method: "POST",
            body: JSON.stringify({
              systolic: newPatientVitals.systolic ? Number(newPatientVitals.systolic) : undefined,
              diastolic: newPatientVitals.diastolic ? Number(newPatientVitals.diastolic) : undefined,
              heart_rate: newPatientVitals.heartRate ? Number(newPatientVitals.heartRate) : undefined,
              weight: newPatientVitals.weight ? Number(newPatientVitals.weight) : undefined,
              sp02: newPatientVitals.sp02 ? Number(newPatientVitals.sp02) : undefined
            })
          });
        }
      } catch { /* non bloquant */ }

      try {
        if (newPatientDoc) {
          const formData = new FormData();
          formData.append("file", newPatientDoc);
          formData.append("category", newPatientDocCategory.toLowerCase());
          await apiFetch(`/api/documents/${patientId}`, {
            method: "POST",
            body: formData
          });
        }
      } catch { /* non bloquant */ }

      try {
        if (newPatientMeds.length > 0) {
          const validMeds = newPatientMeds.filter((m) => m.name && m.dosage);
          if (validMeds.length > 0) {
            await apiFetch("/api/prescriptions", {
              method: "POST",
              body: JSON.stringify({
                patientId,
                items: validMeds.map((m) => ({
                  name: m.name,
                  dosage: m.dosage,
                  frequency: m.frequency || undefined,
                  duration: m.duration || undefined
                }))
              })
            });
          }
        }
      } catch { /* non bloquant */ }

      try {
        if (newPatientAccount.username && newPatientAccount.password) {
          await apiFetch("/api/settings/patient-accounts", {
            method: "POST",
            body: JSON.stringify({
              patientId,
              username: newPatientAccount.username,
              password: newPatientAccount.password
            })
          });
        }
      } catch { /* non bloquant */ }

      dispatchNotification({
        id: `patient-created-${Date.now()}`,
        title: "Patient créé",
        detail: `${createForm.lastName} ${createForm.firstName}`,
        type: "success"
      });

      setSelectedId(patientId);
      setShowCreate(false);
      setStep(1);
      setCreateForm({
        firstName: "",
        lastName: "",
        dateOfBirth: "",
        gender: "M",
        bloodType: "",
        phone: "",
        email: "",
        address: "",
        pathology: "",
        severityStatus: "stable",
        country: ""
      });
      setNewPatientVitals({ systolic: "", diastolic: "", heartRate: "", sp02: "", weight: "" });
      setNewPatientDoc(null);
      setNewPatientDocCategory("Analyse");
      setNewPatientMeds([]);
      setNewPatientAccount({ username: "", password: "" });
      await load();
    } catch (e: any) {
      try { const msg = JSON.parse(e.message); setCreateError(msg.message); } catch { setCreateError("Impossible de créer le patient"); }
    } finally {
      setCreating(false);
    }
  }

  function startEdit() {
    if (!detail?.patient) return;
    setEditForm({
      phone: detail.patient.phone || "",
      email: detail.patient.email || "",
      address: detail.patient.address || "",
      country: detail.patient.country || "",
      emergency_contact: detail.patient.emergency_contact || "",
      pathology: detail.patient.pathology || "",
      allergies: Array.isArray(detail.patient.allergies) ? detail.patient.allergies.join(", ") : (detail.patient.allergies || ""),
      medical_history: Array.isArray(detail.patient.medical_history) ? detail.patient.medical_history.join(", ") : (detail.patient.medical_history || ""),
    });
    setEditError(null);
    setEditMode(true);
  }

  async function saveEdit() {
    if (!selectedId || !detail?.patient) return;
    setEditSaving(true);
    setEditError(null);
    try {
      await apiFetch(`/api/patients/${selectedId}`, {
        method: "PUT",
        body: JSON.stringify({
          first_name: detail.patient.first_name,
          last_name: detail.patient.last_name,
          date_of_birth: detail.patient.date_of_birth,
          gender: detail.patient.gender,
          blood_type: detail.patient.blood_type,
          phone: editForm.phone || undefined,
          email: editForm.email || undefined,
          address: editForm.address || undefined,
          country: editForm.country || undefined,
          emergency_contact: editForm.emergency_contact || undefined,
          pathology: editForm.pathology || undefined,
          allergies: editForm.allergies || null,
          medical_history: editForm.medical_history || null,
          severity_status: detail.patient.severity_status,
        })
      });
      setEditMode(false);
      dispatchNotification({
        id: `edit-${Date.now()}`,
        title: "Patient modifié",
        detail: "Informations mises à jour",
        type: "success"
      });
      await loadDetail(selectedId);
    } catch (e: any) {
      try { const msg = JSON.parse(e.message); setEditError(msg.message); } catch { setEditError("Erreur lors de la modification"); }
    } finally {
      setEditSaving(false);
    }
  }

  function cancelEdit() {
    setEditMode(false);
    setEditError(null);
  }

  async function deletePatient() {
    if (!selectedId) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/patients/${selectedId}`, { method: "DELETE" });
      setShowDeleteConfirm(false);
      setSelectedId(null);
      dispatchNotification({
        id: `delete-${Date.now()}`,
        title: "Patient supprimé",
        detail: "Le patient a été supprimé avec succès",
        type: "success"
      });
      await load();
    } catch {
      dispatchNotification({
        id: `delete-error-${Date.now()}`,
        title: "Erreur",
        detail: "Impossible de supprimer le patient",
        type: "error"
      });
    } finally {
      setDeleting(false);
    }
  }

  function exportCsv() {
    const header = ["id", "last_name", "first_name", "date_of_birth", "pathology", "phone", "email"];
    const rows = filteredItems.map((p) => [
      p.id,
      p.last_name,
      p.first_name,
      p.date_of_birth,
      p.pathology ?? "",
      p.phone ?? "",
      p.email ?? ""
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((x) => `"${String(x).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "patients.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!hasAccess) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="flex flex-1 flex-col gap-2 md:flex-row md:items-center">
          <Input
            placeholder="Rechercher par nom"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setPage(1);
                load();
              }
            }}
          />
          <Input
            placeholder="Filtre pathologie"
            value={pathologyFilter}
            onChange={(e) => setPathologyFilter(e.target.value)}
            className="md:max-w-56"
          />
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Date consultation</span>
            <Input
              type="date"
              value={consultationDate}
              onChange={(e) => { setConsultationDate(e.target.value); setPage(1); }}
              className="md:w-44"
            />
            {consultationDate && (
              <button onClick={() => { setConsultationDate(""); setPage(1); }} className="text-xs text-blue-600 hover:underline whitespace-nowrap">Effacer</button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 md:ml-auto">
          <Button variant="outline" onClick={exportCsv}>Exporter CSV</Button>
          <Dialog open={showCreate} onOpenChange={(open) => { setShowCreate(open); if (!open) setStep(1); }}>
            <DialogTrigger asChild>
              <Button>Nouveau patient</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl p-0" title="Nouveau patient">
              <div className="rounded-t-2xl bg-gradient-to-r from-indigo-600 to-blue-700 px-6 py-4 text-white">
                <div className="text-sm opacity-90">{step}/3</div>
                <div className="text-lg font-semibold">
                  {step === 1 ? "Information personnelle" : step === 2 ? "Constantes & Documents" : "Acces & Medicaments"}
                </div>
              </div>
              <div className="p-6">
                <form className="space-y-3" onSubmit={createPatient}>
                  {step === 1 ? (
                    <>
                      <div className="grid gap-3 md:grid-cols-2">
                        <Input
                          placeholder="Prenom"
                          value={createForm.firstName}
                          onChange={(e) => setCreateForm((s) => ({ ...s, firstName: e.target.value }))}
                          required
                        />
                        <Input
                          placeholder="Nom"
                          value={createForm.lastName}
                          onChange={(e) => setCreateForm((s) => ({ ...s, lastName: e.target.value }))}
                          required
                        />
                        <Input
                          type="date"
                          value={createForm.dateOfBirth}
                          onChange={(e) => setCreateForm((s) => ({ ...s, dateOfBirth: e.target.value }))}
                          required
                        />
                        <select
                          value={createForm.gender}
                          onChange={(e) => setCreateForm((s) => ({ ...s, gender: e.target.value as "M" | "F" }))}
                          className="h-10 rounded-md border border-input bg-transparent px-3 text-sm"
                        >
                          <option value="M">Homme</option>
                          <option value="F">Femme</option>
                        </select>
                        
                        <PhoneInput
                          defaultCountry="CA"
                          value={createForm.phone}
                          onChange={(v) => setCreateForm((s) => ({ ...s, phone: v }))}
                          className="w-full"
                        />
                        <Input
                          type="email"
                          placeholder="Email"
                          value={createForm.email}
                          onChange={(e) => setCreateForm((s) => ({ ...s, email: e.target.value }))}
                        />
                      <Input
                         placeholder="Pathologie"
                         value={createForm.pathology}
                         onChange={(e) => setCreateForm((s) => ({ ...s, pathology: e.target.value }))}
                       />
                     </div>

                     <div className="grid gap-3 md:grid-cols-2">
                       <div>
                         <label className="text-sm text-muted-foreground mb-1 block">Pays</label>
                         <CountrySelect
                           value={createForm.country}
                           onChange={(v) => setCreateForm((s) => ({ ...s, country: v }))}
                         />
                       </div>
                       <div>
                         <label className="text-sm text-muted-foreground mb-1 block">Adresse</label>
                         <Input
                           placeholder="Adresse"
                           value={createForm.address}
                           onChange={(e) => setCreateForm((s) => ({ ...s, address: e.target.value }))}
                         />
                       </div>
                     </div>
                    </>
                  ) : step === 2 ? (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Groupe sanguin</label>
                        <div className="flex flex-wrap gap-2">
                          {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                            <button
                              key={bg}
                              type="button"
                              onClick={() => setCreateForm((s) => ({ ...s, bloodType: s.bloodType === bg ? "" : bg }))}
                              className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                                createForm.bloodType === bg
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border bg-card text-card-foreground hover:bg-accent"
                              }`}
                            >
                              {bg}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="text-sm text-muted-foreground mb-1 block">Tension systolique</label>
                          <Input
                            type="number"
                            min={60}
                            max={250}
                            placeholder="mm Hg (60-250)"
                            value={newPatientVitals.systolic}
                            onChange={(e) => setNewPatientVitals((s) => ({ ...s, systolic: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground mb-1 block">Tension diastolique</label>
                          <Input
                            type="number"
                            min={30}
                            max={150}
                            placeholder="mm Hg (30-150)"
                            value={newPatientVitals.diastolic}
                            onChange={(e) => setNewPatientVitals((s) => ({ ...s, diastolic: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground mb-1 block">Frequence cardiaque</label>
                          <Input
                            type="number"
                            min={20}
                            max={250}
                            placeholder="bpm (20-250)"
                            value={newPatientVitals.heartRate}
                            onChange={(e) => setNewPatientVitals((s) => ({ ...s, heartRate: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground mb-1 block">SpO2</label>
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            placeholder="% (0-100)"
                            value={newPatientVitals.sp02}
                            onChange={(e) => setNewPatientVitals((s) => ({ ...s, sp02: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground mb-1 block">Poids</label>
                          <Input
                            type="number"
                            min={0}
                            max={500}
                            step="0.1"
                            placeholder="kg"
                            value={newPatientVitals.weight}
                            onChange={(e) => setNewPatientVitals((s) => ({ ...s, weight: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-sm text-muted-foreground mb-1 block">Document</label>
                        <div className="flex items-center gap-2">
                          {newPatientDoc ? (
                            <div className="flex-1 flex items-center gap-2 rounded-md border border-input bg-background/80 px-3 py-2 text-sm">
                              <FileText className="h-4 w-4 text-primary shrink-0" />
                              <span className="truncate flex-1">{newPatientDoc.name}</span>
                              <button
                                type="button"
                                onClick={() => setNewPatientDoc(null)}
                                className="text-destructive hover:text-destructive/80 shrink-0"
                              >
                                X
                              </button>
                            </div>
                          ) : (
                            <Input
                              type="file"
                              onChange={(e) => setNewPatientDoc(e.target.files?.[0] ?? null)}
                              className="flex-1"
                            />
                          )}
                          <select
                            value={newPatientDocCategory}
                            onChange={(e) => setNewPatientDocCategory(e.target.value)}
                            className="h-10 rounded-md border border-input bg-transparent px-3 text-sm w-36"
                          >
                            <option value="analyse">Analyse</option>
                            <option value="radio">Radio</option>
                            <option value="echographie">Echographie</option>
                            <option value="autre">Autre</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-muted-foreground mb-1 block">Acces patient (optionnel)</label>
                        <div className="grid gap-3 md:grid-cols-2">
                          <Input
                            placeholder="Nom d'utilisateur"
                            value={newPatientAccount.username}
                            onChange={(e) => setNewPatientAccount((s) => ({ ...s, username: e.target.value }))}
                          />
                          <Input
                            type="password"
                            placeholder="Mot de passe"
                            value={newPatientAccount.password}
                            onChange={(e) => setNewPatientAccount((s) => ({ ...s, password: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-sm text-muted-foreground mb-1 block">Medicaments</label>
                        <div className="space-y-2">
                          {newPatientMeds.map((med, i) => (
                            <div key={i} className="flex gap-2 items-start">
                              <Input
                                placeholder="Nom"
                                value={med.name}
                                onChange={(e) => {
                                  const updated = [...newPatientMeds];
                                  updated[i] = { ...updated[i], name: e.target.value };
                                  setNewPatientMeds(updated);
                                }}
                                className="flex-1"
                              />
                              <Input
                                placeholder="Dosage"
                                value={med.dosage}
                                onChange={(e) => {
                                  const updated = [...newPatientMeds];
                                  updated[i] = { ...updated[i], dosage: e.target.value };
                                  setNewPatientMeds(updated);
                                }}
                                className="w-24"
                              />
                              <Input
                                placeholder="Freq"
                                value={med.frequency}
                                onChange={(e) => {
                                  const updated = [...newPatientMeds];
                                  updated[i] = { ...updated[i], frequency: e.target.value };
                                  setNewPatientMeds(updated);
                                }}
                                className="w-24"
                              />
                              <Input
                                placeholder="Duree"
                                value={med.duration}
                                onChange={(e) => {
                                  const updated = [...newPatientMeds];
                                  updated[i] = { ...updated[i], duration: e.target.value };
                                  setNewPatientMeds(updated);
                                }}
                                className="w-24"
                              />
                              {newPatientMeds.length > 1 && (
                                <Button type="button" variant="ghost" size="sm" onClick={() => setNewPatientMeds(newPatientMeds.filter((_, idx) => idx !== i))}>
                                  X
                                </Button>
                              )}
                            </div>
                          ))}
                          <Button type="button" variant="outline" size="sm" onClick={() => setNewPatientMeds([...newPatientMeds, { name: "", dosage: "", frequency: "", duration: "" }])}>
                            + Ajouter medicament
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {createError ? <div className="text-sm text-destructive">{createError}</div> : null}

                  <div className="flex justify-end gap-2">
                    {step === 1 ? (
                      <>
                        <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Annuler</Button>
                        <Button type="submit">Suivant</Button>
                      </>
                    ) : step === 2 ? (
                      <>
                        <Button type="button" variant="outline" onClick={() => setStep(1)}>Retour</Button>
                        <Button type="submit">Suivant</Button>
                      </>
                    ) : (
                      <>
                        <Button type="button" variant="outline" onClick={() => setStep(2)}>Retour</Button>
                        <Button type="submit" disabled={creating}>{creating ? "Creation..." : "Creer"}</Button>
                      </>
                    )}
                  </div>
                </form>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Patients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredItems.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedId(p.id)}
                className="rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition hover:bg-accent/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">
                      {p.last_name} {p.first_name}
                    </div>
                    <div className="text-xs text-muted-foreground">{new Date(p.date_of_birth).toLocaleDateString()}</div>
                  </div>
                </div>

                <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                  <div>{p.pathology ?? "Pathologie non renseignee"}</div>
                  <div>{p.phone ?? "-"}</div>
                  <div>{p.email ?? "-"}</div>
                </div>
              </button>
            ))}
            {filteredItems.length === 0 ? <div className="py-8 text-sm text-muted-foreground">Aucun patient</div> : null}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Page {page} / {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                Precedent
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                Suivant
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={Boolean(selectedId)} onOpenChange={(open) => (!open ? (setSelectedId(null), setShowDeleteConfirm(false)) : undefined)}>
        <DialogContent className="max-w-4xl p-0 max-h-[85vh] overflow-y-auto">
          <div className="rounded-t-2xl bg-gradient-to-r from-indigo-600 to-blue-700 px-6 py-4 text-white">
            <DialogHeader className="space-y-0">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-lg font-semibold">
                  {detail?.patient ? `${detail.patient.last_name} ${detail.patient.first_name}` : "Fiche patient"}
                </DialogTitle>
                {detail?.patient && !editMode && !showDeleteConfirm ? (
                  <div className="flex gap-2">
                    <Button type="button" variant="secondary" size="sm" onClick={startEdit}>Modifier</Button>
                    <Button type="button" variant="destructive" size="sm" onClick={() => setShowDeleteConfirm(true)}>Supprimer</Button>
                  </div>
                ) : null}
              </div>
              <div className="text-sm text-white/80">{detail?.patient?.blood_type ? `Groupe ${detail.patient.blood_type}` : ""}</div>
            </DialogHeader>
          </div>

          <div className="p-6">
            {showDeleteConfirm ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {detail?.patient
                    ? `Supprimer ${detail.patient.first_name} ${detail.patient.last_name} ? Cette action est irreversible.`
                    : "Voulez-vous supprimer ce patient ? Cette action est irreversible."}
                </p>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowDeleteConfirm(false)} disabled={deleting}>
                    Annuler
                  </Button>
                  <Button type="button" variant="destructive" onClick={deletePatient} disabled={deleting}>
                    {deleting ? "Suppression..." : "Supprimer"}
                  </Button>
                </div>
              </div>
            ) : detailLoading ? <div className="text-sm text-muted-foreground">Chargement...</div> : null}
            {!showDeleteConfirm && detailError ? <div className="text-sm text-destructive">{detailError}</div> : null}

            {!showDeleteConfirm && detail ? (<>
            <div className="mb-4 flex flex-wrap gap-2">
              {(
                [
                  ["dossier", "Dossier medical"],
                  ["consultations", "Consultations"],
                  ["vitals", "Vitaux"],
                  ["documents", "Documents"],
                  ["ordonnances", "Ordonnances"],
                  ["messages", "Messagerie"],
                  ["access", "Acces patient"]
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={cn(
                    "rounded-full px-3 py-1 text-sm",
                    tab === key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}
                >
                  <span className="inline-flex items-center gap-2">
                    <span>{label}</span>
                    {key === "messages" && chatUnread > 0 ? (
                      <span className="rounded-full bg-destructive px-2 py-0.5 text-xs font-semibold text-white">{chatUnread}</span>
                    ) : null}
                  </span>
                </button>
              ))}
            </div>

            {tab === "dossier" ? (
              editMode ? (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Telephone</label>
                      <PhoneInput
                        value={editForm.phone}
                        onChange={(v) => setEditForm((s) => ({ ...s, phone: v }))}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Email</label>
                      <Input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm((s) => ({ ...s, email: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Adresse</label>
                      <Input value={editForm.address} onChange={(e) => setEditForm((s) => ({ ...s, address: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Pays</label>
                      <CountrySelect
                        value={editForm.country}
                        onChange={(v) => setEditForm((s) => ({ ...s, country: v }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Contact urgence</label>
                      <Input value={editForm.emergency_contact} onChange={(e) => setEditForm((s) => ({ ...s, emergency_contact: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Pathologie</label>
                      <Input value={editForm.pathology} onChange={(e) => setEditForm((s) => ({ ...s, pathology: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Allergies (separees par virgules)</label>
                      <Input value={editForm.allergies} onChange={(e) => setEditForm((s) => ({ ...s, allergies: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Historique medical (separe par virgules)</label>
                      <Input value={editForm.medical_history} onChange={(e) => setEditForm((s) => ({ ...s, medical_history: e.target.value }))} />
                    </div>
                  </div>
                  {editError ? <div className="text-sm text-destructive">{editError}</div> : null}
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={cancelEdit}>Annuler</Button>
                    <Button type="button" onClick={saveEdit} disabled={editSaving}>{editSaving ? "Sauvegarde..." : "Sauvegarder"}</Button>
                  </div>
                </div>
              ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Informations</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3 text-sm">
                    <div>
                      <div className="text-muted-foreground">Telephone</div>
                      <div>{detail.patient.phone ?? "—"}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Email</div>
                      <div>{detail.patient.email ?? "—"}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Adresse</div>
                      <div>{detail.patient.address ?? "—"}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Pays</div>
                      <div>{(() => { const c = getCountryByCode(detail.patient.country); return c ? <><img src={`https://flagcdn.com/w40/${c.code.toLowerCase()}.png`} alt={c.code} className="inline-block h-4 w-6 rounded-sm object-cover mr-1.5 align-middle" />{c.name} <span className="text-xs text-muted-foreground">({c.code})</span></> : (detail.patient.country ?? "—"); })()}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Contact urgence</div>
                      <div>{detail.patient.emergency_contact ?? "—"}</div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Antecedents</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div>
                      <div className="text-muted-foreground">Allergies</div>
                      <div>{Array.isArray(detail.patient.allergies) ? detail.patient.allergies.join(", ") : (detail.patient.allergies || "—")}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Historique</div>
                      <div>{Array.isArray(detail.patient.medical_history) ? detail.patient.medical_history.join(", ") : (detail.patient.medical_history || "—")}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Pathologie</div>
                      <div>{detail.patient.pathology || "—"}</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              )
            ) : tab === "consultations" ? (
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Historique</CardTitle>
                  </CardHeader>
                  <CardContent className="max-h-[360px] overflow-y-auto">
                    <div className="space-y-3">
                      {(detail.consultations || []).map((c: any) => (
                        editConsultId === c.id ? (
                          <div key={c.id} className="rounded-xl border border-border p-3 space-y-2">
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <label className="text-xs text-muted-foreground mb-0.5 block">Date</label>
                                <Input type="date" value={editConsultForm.date} onChange={(e) => setEditConsultForm((s) => ({ ...s, date: e.target.value }))} />
                              </div>
                              <div>
                                <label className="text-xs text-muted-foreground mb-0.5 block">Motif</label>
                                <Input value={editConsultForm.motif} onChange={(e) => setEditConsultForm((s) => ({ ...s, motif: e.target.value }))} />
                              </div>
                              <div>
                                <label className="text-xs text-muted-foreground mb-0.5 block">Ecole</label>
                                <Input value={editConsultForm.ecole} onChange={(e) => setEditConsultForm((s) => ({ ...s, ecole: e.target.value }))} />
                              </div>
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground mb-0.5 block">Examen</label>
                              <textarea className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[36px] resize-none" value={editConsultForm.examen} onChange={(e) => setEditConsultForm((s) => ({ ...s, examen: e.target.value }))} />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-xs text-muted-foreground mb-0.5 block">Diagnostic</label>
                                <textarea className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[36px] resize-none" value={editConsultForm.diagnostic} onChange={(e) => setEditConsultForm((s) => ({ ...s, diagnostic: e.target.value }))} />
                              </div>
                              <div>
                                <label className="text-xs text-muted-foreground mb-0.5 block">Traitement</label>
                                <textarea className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[36px] resize-none" value={editConsultForm.traitement} onChange={(e) => setEditConsultForm((s) => ({ ...s, traitement: e.target.value }))} />
                              </div>
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground mb-0.5 block">Note</label>
                              <textarea className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[36px] resize-none" value={editConsultForm.note} onChange={(e) => setEditConsultForm((s) => ({ ...s, note: e.target.value }))} />
                            </div>
                            <div className="flex justify-end gap-2 pt-1">
                              <Button type="button" variant="outline" size="sm" onClick={() => setEditConsultId(null)}>Annuler</Button>
                              <Button type="button" size="sm" disabled={consultationSaving} onClick={async () => {
                                if (!selectedId) return;
                                setConsultationSaving(true);
                                try {
                                  await apiFetch(`/api/patients/${selectedId}/consultations/${c.id}`, {
                                    method: "PUT",
                                    body: JSON.stringify(editConsultForm)
                                  });
                                  setEditConsultId(null);
                                  dispatchNotification({ id: `consult-edit-${Date.now()}`, title: "Consultation modifiée", detail: editConsultForm.motif || "Consultation mise à jour", type: "success" });
                                  await loadDetail(selectedId);
                                } catch {
                                  setConsultationError("Erreur lors de la modification");
                                } finally {
                                  setConsultationSaving(false);
                                }
                              }}>{consultationSaving ? "Sauvegarde..." : "Sauvegarder"}</Button>
                            </div>
                          </div>
                        ) : (
                        <div key={c.id} className="rounded-xl border border-border p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="text-xs text-muted-foreground">{new Date(c.date).toLocaleDateString("fr-FR")}</div>
                              <div className="mt-1 font-medium text-sm">{c.motif ?? "—"}</div>
                              {c.ecole ? <div className="text-xs text-muted-foreground mt-0.5">Ecole: {c.ecole}</div> : null}
                              {c.diagnostic && <div className="text-sm text-muted-foreground">{c.diagnostic}</div>}
                              {c.traitement && <div className="text-xs text-blue-600 mt-1">Traitement: {c.traitement}</div>}
                            </div>
                            <Button type="button" variant="ghost" size="sm" onClick={() => { setEditConsultId(c.id); setEditConsultForm({ date: c.date || "", motif: c.motif || "", ecole: c.ecole || "", examen: c.examen || "", diagnostic: c.diagnostic || "", traitement: c.traitement || "", note: c.note || "" }); }}>
                              Modifier
                            </Button>
                          </div>
                        </div>
                        )
                      ))}
                      {!detail.consultations?.length ? <div className="text-sm text-muted-foreground">Aucune consultation</div> : null}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Nouvelle consultation</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 max-h-[360px] overflow-y-auto">
                    <div>
                      <label className="text-xs text-muted-foreground mb-0.5 block">Date</label>
                      <Input
                        type="date"
                        value={newConsultation.date}
                        onChange={(e) => setNewConsultation((s) => ({ ...s, date: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-0.5 block">Motif</label>
                      <textarea
                        className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[36px] resize-none"
                        placeholder="Motif de la consultation"
                        value={newConsultation.reason}
                        onChange={(e) => setNewConsultation((s) => ({ ...s, reason: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-0.5 block">Ecole</label>
                      <textarea
                        className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[36px] resize-none"
                        placeholder="Ecole"
                        value={newConsultation.ecole}
                        onChange={(e) => setNewConsultation((s) => ({ ...s, ecole: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-0.5 block">Examen</label>
                      <textarea
                        className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[36px] resize-none"
                        placeholder="Résultats de l'examen"
                        value={newConsultation.exam}
                        onChange={(e) => setNewConsultation((s) => ({ ...s, exam: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-0.5 block">Diagnostic</label>
                      <textarea
                        className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[36px] resize-none"
                        placeholder="Diagnostic"
                        value={newConsultation.diagnosis}
                        onChange={(e) => setNewConsultation((s) => ({ ...s, diagnosis: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-0.5 block">Traitement</label>
                      <textarea
                        className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[36px] resize-none"
                        placeholder="Traitement prescrit"
                        value={newConsultation.treatment}
                        onChange={(e) => setNewConsultation((s) => ({ ...s, treatment: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-0.5 block">Note</label>
                      <textarea
                        className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[36px] resize-none"
                        placeholder="Note"
                        value={newConsultation.note}
                        onChange={(e) => setNewConsultation((s) => ({ ...s, note: e.target.value }))}
                      />
                    </div>
                    {consultationError && (
                      <div className="text-sm text-destructive">{consultationError}</div>
                    )}
                    <div className="flex justify-end pt-2">
                      <Button
                        disabled={consultationSaving || !newConsultation.reason.trim()}
                        onClick={async () => {
                          if (!selectedId) return;
                          setConsultationSaving(true);
                          setConsultationError(null);
                          try {
                            await apiFetch(`/api/patients/${selectedId}/consultations`, {
                              method: "POST",
                              body: JSON.stringify({
                                date: newConsultation.date,
                                motif: newConsultation.reason || undefined,
                                ecole: newConsultation.ecole || undefined,
                                examen: newConsultation.exam || undefined,
                                diagnostic: newConsultation.diagnosis || undefined,
                                traitement: newConsultation.treatment || undefined,
                                note: newConsultation.note || undefined
                              })
                            });
                            dispatchNotification({
                              id: `consult-${Date.now()}`,
                              title: "Consultation ajoutée",
                              detail: newConsultation.reason || "Nouvelle consultation",
                              type: "success"
                            });
                            setNewConsultation({ date: new Date().toISOString().split('T')[0], reason: "", ecole: "", exam: "", diagnosis: "", treatment: "", note: "" });
                            await loadDetail(selectedId);
                          } catch {
                            setConsultationError("Erreur lors de l'ajout de la consultation");
                          } finally {
                            setConsultationSaving(false);
                          }
                        }}
                      >
                        {consultationSaving ? "Ajout..." : "Ajouter"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : tab === "vitals" ? (
              (() => {
                const rows = (detail.vitals || [])
                  .filter((v: any) => v?.recorded_at && withinPeriod(v.recorded_at, vitalsPeriod))
                  .slice()
                  .sort((a: any, b: any) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime());

                const chartData = rows.map((v: any) => ({
                  date: new Date(v.recorded_at).toLocaleDateString(),
                  systolic: v.systolic,
                  diastolic: v.diastolic,
                  hr: v.heart_rate,
                  spo2: v.sp02,
                  weight: v.weight ? Number(v.weight) : null
                }));

                return (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-sm text-muted-foreground">Periode</div>
                      <div className="flex flex-wrap gap-2">
                        {(["1M", "3M", "6M", "1Y"] as const).map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setVitalsPeriod(p)}
                            className={cn(
                              "rounded-full px-3 py-1 text-sm",
                              vitalsPeriod === p ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                            )}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Tension arterielle</CardTitle>
                        </CardHeader>
                        <CardContent className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                              <XAxis dataKey="date" hide />
                              <YAxis />
                              <Tooltip />
                              <Line type="monotone" dataKey="systolic" stroke="hsl(var(--primary))" dot={false} />
                              <Line type="monotone" dataKey="diastolic" stroke="#60a5fa" dot={false} />
                            </LineChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">FC / SpO2</CardTitle>
                        </CardHeader>
                        <CardContent className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                              <XAxis dataKey="date" hide />
                              <YAxis />
                              <Tooltip />
                              <Line type="monotone" dataKey="hr" stroke="hsl(var(--primary))" dot={false} />
                              <Line type="monotone" dataKey="spo2" stroke="#10b981" dot={false} />
                            </LineChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Donnees detaillees</CardTitle>
                      </CardHeader>
                      <CardContent className="max-h-72 overflow-y-auto">
                        {rows.length === 0 ? (
                          <div className="text-sm text-muted-foreground py-4 text-center">Aucune donnee</div>
                        ) : (
                          <div className="space-y-2">
                            {[...rows].reverse().map((v: any) => (
                              editVitalId === v.id ? (
                                <div key={v.id} className="rounded-lg border border-border p-3 space-y-2">
                                  <div className="grid grid-cols-5 gap-2">
                                    <div>
                                      <label className="text-xs text-muted-foreground">Sys</label>
                                      <input type="number" value={editVitalForm.systolic} onChange={(e) => setEditVitalForm((s) => ({ ...s, systolic: e.target.value }))} className="w-full rounded border border-input bg-transparent px-2 py-1 text-sm" />
                                    </div>
                                    <div>
                                      <label className="text-xs text-muted-foreground">Dia</label>
                                      <input type="number" value={editVitalForm.diastolic} onChange={(e) => setEditVitalForm((s) => ({ ...s, diastolic: e.target.value }))} className="w-full rounded border border-input bg-transparent px-2 py-1 text-sm" />
                                    </div>
                                    <div>
                                      <label className="text-xs text-muted-foreground">FC</label>
                                      <input type="number" value={editVitalForm.heart_rate} onChange={(e) => setEditVitalForm((s) => ({ ...s, heart_rate: e.target.value }))} className="w-full rounded border border-input bg-transparent px-2 py-1 text-sm" />
                                    </div>
                                    <div>
                                      <label className="text-xs text-muted-foreground">SpO2</label>
                                      <input type="number" value={editVitalForm.sp02} onChange={(e) => setEditVitalForm((s) => ({ ...s, sp02: e.target.value }))} className="w-full rounded border border-input bg-transparent px-2 py-1 text-sm" />
                                    </div>
                                    <div>
                                      <label className="text-xs text-muted-foreground">Poids</label>
                                      <input type="number" step="0.1" value={editVitalForm.weight} onChange={(e) => setEditVitalForm((s) => ({ ...s, weight: e.target.value }))} className="w-full rounded border border-input bg-transparent px-2 py-1 text-sm" />
                                    </div>
                                  </div>
                                  <div className="flex justify-end gap-2">
                                    <Button type="button" variant="outline" size="sm" onClick={() => setEditVitalId(null)}>Annuler</Button>
                                    <Button type="button" size="sm" disabled={savingVital} onClick={async () => {
                                      if (!selectedId) return;
                                      setSavingVital(true);
                                      try {
                                        await apiFetch(`/api/patients/${selectedId}/vitals/${v.id}`, {
                                          method: "PUT",
                                          body: JSON.stringify({
                                            systolic: editVitalForm.systolic ? Number(editVitalForm.systolic) : undefined,
                                            diastolic: editVitalForm.diastolic ? Number(editVitalForm.diastolic) : undefined,
                                            heart_rate: editVitalForm.heart_rate ? Number(editVitalForm.heart_rate) : undefined,
                                            sp02: editVitalForm.sp02 ? Number(editVitalForm.sp02) : undefined,
                                            weight: editVitalForm.weight ? Number(editVitalForm.weight) : undefined,
                                            note: editVitalForm.note || undefined,
                                          })
                                        });
                                        setEditVitalId(null);
                                        dispatchNotification({ id: `vital-edit-${Date.now()}`, title: "Vital modifié", detail: "Mesure mise à jour", type: "success" });
                                        await loadDetail(selectedId);
                                      } catch {
                                        dispatchNotification({ id: `vital-edit-err-${Date.now()}`, title: "Erreur", detail: "Impossible de modifier la mesure", type: "error" });
                                      } finally {
                                        setSavingVital(false);
                                      }
                                    }}>{savingVital ? "..." : "Sauvegarder"}</Button>
                                  </div>
                                </div>
                              ) : (
                                <div key={v.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                                  <div className="flex flex-wrap gap-4 text-sm">
                                    <div><span className="text-muted-foreground text-xs">{new Date(v.recorded_at).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span></div>
                                    <div>Sys: <strong>{v.systolic ?? "—"}</strong></div>
                                    <div>Dia: <strong>{v.diastolic ?? "—"}</strong></div>
                                    <div>FC: <strong>{v.heart_rate ?? "—"}</strong></div>
                                    <div>SpO2: <strong>{v.sp02 ?? "—"}</strong></div>
                                    <div>Poids: <strong>{v.weight ?? "—"}</strong></div>
                                  </div>
                                  <div className="flex gap-1 shrink-0">
                                    <Button type="button" variant="ghost" size="sm" onClick={() => {
                                      setEditVitalId(v.id);
                                      setEditVitalForm({
                                        systolic: v.systolic ?? "",
                                        diastolic: v.diastolic ?? "",
                                        heart_rate: v.heart_rate ?? "",
                                        sp02: v.sp02 ?? "",
                                        weight: v.weight ?? "",
                                        note: v.note ?? "",
                                      });
                                    }}>
                                      Modifier
                                    </Button>
                                    <Button type="button" variant="ghost" size="sm" disabled={deletingVitalId === v.id} onClick={() => setConfirmVitalDeleteId(v.id)}>
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </div>
                                </div>
                              )
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                );
              })()
            ) : tab === "documents" ? (
              <DocumentsTab
                patientId={selectedId!}
                documents={detail?.documents || []}
                onRefresh={() => selectedId && loadDetail(selectedId)}
              />
            ) : tab === "ordonnances" ? (
              <PrescriptionsTab
                patientId={selectedId!}
                patient={detail?.patient}
                prescriptions={detail?.prescriptions || []}
                onRefresh={() => selectedId && loadDetail(selectedId)}
              />
            ) : tab === "messages" ? (
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Messagerie avec {detail?.patient?.first_name} {detail?.patient?.last_name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-3 max-h-96 overflow-y-auto mb-4">
                      {chatItems.length === 0 ? (
                        <div className="text-sm text-muted-foreground text-center py-8">
                          Aucun message. Commencez la conversation.
                        </div>
                      ) : (
                        chatItems.map((m: any) => {
                          const isStaff = m.sender_role === "admin" || m.sender_role === "secretaire";
                          const session = getSession();
                          const isCurrentUser = session && (m.sender_id === session.userId || m.sender_role === session.role);
                          const displayName = m.sender_role === "patient"
                            ? `${detail?.patient?.first_name || ""} ${detail?.patient?.last_name || ""}`.trim() || "Patient"
                            : isCurrentUser ? "Moi" : (m.sender_role === "admin" ? "Dr. Tremblay" : "Secrétaire");
                          return (
                          <div
                            key={m.id}
                            className={cn(
                              "rounded-lg p-3 max-w-[80%]",
                              isStaff ? "bg-blue-100 text-blue-900 ml-auto" : "bg-gray-100 text-gray-900 mr-auto"
                            )}
                          >
                            <div className="text-xs font-medium mb-1">{displayName}</div>
                            <div className="text-sm">{m.content}</div>
                            <div className="text-[10px] text-muted-foreground mt-1">
                              {new Date(m.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                            </div>
                          </div>
                          );
                        })
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Tapez votre message..."
                        value={chatText}
                        onChange={(e) => setChatText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && chatText.trim()) {
                            sendMessage();
                          }
                        }}
                      />
                      <Button onClick={sendMessage} disabled={!chatText.trim() || chatLoading}>
                        Envoyer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Accès patient</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {accountLoading ? (
                    <div className="text-sm text-muted-foreground">Chargement...</div>
                  ) : account ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between rounded-lg border border-border p-4">
                        <div>
                          <div className="font-medium">Compte actif</div>
                          <div className="text-sm text-muted-foreground">Nom d'utilisateur: {account.username}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              setAccountSaving(true);
                              try {
                                await apiFetch(`/api/settings/patient-accounts/${selectedId}`, {
                                  method: "PUT",
                                  body: JSON.stringify({ isActive: !account.is_active })
                                });
                                await loadAccount(selectedId!);
                              } finally {
                                setAccountSaving(false);
                              }
                            }}
                            disabled={accountSaving}
                          >
                            {account.is_active ? "Désactiver" : "Activer"}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="text-sm font-medium">Réinitialiser le mot de passe</div>
                        <div className="relative">
                          <Input
                            type={showResetPassword ? "text" : "password"}
                            placeholder={account ? "********" : "Nouveau mot de passe"}
                            value={resetPassword}
                            onChange={(e) => setResetPassword(e.target.value)}
                            className="pr-10"
                          />
                          <button type="button" onClick={() => setShowResetPassword(!showResetPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                            {showResetPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        <Button
                          size="sm"
                          disabled={!resetPassword.trim() || accountSaving}
                          onClick={async () => {
                            if (!resetPassword.trim()) return;
                            setAccountSaving(true);
                            try {
                              await apiFetch(`/api/settings/patient-accounts/${selectedId}`, {
                                method: "PUT",
                                body: JSON.stringify({ password: resetPassword })
                              });
                              setResetPassword("");
                              dispatchNotification({
                                id: `reset-${Date.now()}`,
                                title: "Mot de passe réinitialisé",
                                detail: "Le mot de passe a été réinitialisé avec succès",
                                type: "success"
                              });
                            } catch {
                              setAccountError("Erreur lors de la réinitialisation");
                            } finally {
                              setAccountSaving(false);
                            }
                          }}
                        >
                          Réinitialiser
                        </Button>
                      </div>

                      <div className="rounded-lg bg-blue-50 p-4 text-sm">
                        <div className="font-medium text-blue-900 mb-2">Portail patient</div>
                        <div className="text-blue-700">Le patient peut accéder à son espace sur:</div>
                        <div className="text-blue-800 font-mono mt-1">/patient/login</div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-sm text-muted-foreground">Ce patient n'a pas encore de compte d'accès.</div>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm text-muted-foreground mb-1 block">Nom d'utilisateur</label>
                          <Input
                            placeholder="jdupont"
                            value={accountForm.username}
                            onChange={(e) => setAccountForm((s) => ({ ...s, username: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground mb-1 block">Mot de passe initial</label>
                          <div className="relative">
                            <Input
                              type={showNewPassword ? "text" : "password"}
                              placeholder="Mot de passe"
                              value={accountForm.password}
                              onChange={(e) => setAccountForm((s) => ({ ...s, password: e.target.value }))}
                              className="pr-10"
                            />
                            <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                              {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                        {accountError && (
                          <div className="text-sm text-destructive">{accountError}</div>
                        )}
                        <Button
                          disabled={!accountForm.username.trim() || !accountForm.password.trim() || accountSaving}
                          onClick={async () => {
                            if (!selectedId) return;
                            setAccountSaving(true);
                            setAccountError(null);
                            try {
                              await apiFetch("/api/settings/patient-accounts", {
                                method: "POST",
                                body: JSON.stringify({
                                  patientId: selectedId,
                                  username: accountForm.username,
                                  password: accountForm.password
                                })
                              });
                              await loadAccount(selectedId);
                              setAccountForm({ username: "", password: "" });
                            } catch {
                              setAccountError("Erreur lors de la création du compte");
                            } finally {
                              setAccountSaving(false);
                            }
                          }}
                        >
                          {accountSaving ? "Création..." : "Créer le compte"}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </>) : null}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmVitalDeleteId !== null}
        onOpenChange={(o) => { if (!o) setConfirmVitalDeleteId(null); }}
        title="Supprimer la mesure"
        description="Voulez-vous vraiment supprimer cette mesure ?"
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="destructive"
        onConfirm={() => { if (confirmVitalDeleteId) deleteVital(confirmVitalDeleteId); }}
      />
    </div>
  );
}

function DocumentsTab({ patientId, documents, onRefresh }: {
  patientId: string;
  documents: any[];
  onRefresh: () => void;
}) {
  const [uploading, setUploading] = React.useState(false);
  const [docFile, setDocFile] = React.useState<File | null>(null);
  const [docCategory, setDocCategory] = React.useState("analyse");
  const [deletingDoc, setDeletingDoc] = React.useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = React.useState<{ filePath: string; fileName: string } | null>(null);
  const [fileInputKey, setFileInputKey] = React.useState(0);

  async function handleUpload() {
    if (!docFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", docFile);
      formData.append("category", docCategory);
      await apiUpload(`/api/documents/${patientId}`, formData);
      setDocFile(null);
      setFileInputKey((k) => k + 1);
      dispatchNotification({
        id: `doc-upload-${Date.now()}`,
        title: "Document ajouté",
        detail: docFile.name,
        type: "success"
      });
      onRefresh();
    } catch {
      dispatchNotification({
        id: `doc-error-${Date.now()}`,
        title: "Erreur",
        detail: "Impossible d'ajouter le document",
        type: "error"
      });
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(docId: string) {
    setDeletingDoc(docId);
    try {
      await apiFetch(`/api/documents/${docId}`, { method: "DELETE" });
      dispatchNotification({
        id: `doc-delete-${Date.now()}`,
        title: "Document supprimé",
        detail: "Document supprimé",
        type: "success"
      });
      onRefresh();
    } catch {
      dispatchNotification({
        id: `doc-del-error-${Date.now()}`,
        title: "Erreur",
        detail: "Impossible de supprimer le document",
        type: "error"
      });
    } finally {
      setDeletingDoc(null);
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Documents ({documents.length})</CardTitle>
        </CardHeader>
        <CardContent className="max-h-[360px] overflow-y-auto">
          {documents.length === 0 ? (
            <div className="text-sm text-muted-foreground">Aucun document</div>
          ) : (
            <div className="space-y-2">
              {documents.map((d: any) => (
                <div key={d.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {d.file_path && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(d.file_path) ? (
                      <img
                        src={`${config.api.baseUrl}/${d.file_path}`}
                        alt={d.name}
                        className="h-10 w-10 shrink-0 rounded object-cover"
                      />
                    ) : (
                      <FileText className="h-8 w-8 text-primary shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{d.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {d.category} {d.size ? `- ${(Number(d.size) / 1024).toFixed(1)} KB` : ""}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {d.file_path ? (
                      <button
                        type="button"
                        onClick={() => setPreviewDoc({ filePath: d.file_path, fileName: d.name })}
                        className="inline-flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    ) : null}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={deletingDoc === d.id}
                      onClick={() => handleDelete(d.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ajouter un document</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-0.5 block">Fichier</label>
            <Input
              key={fileInputKey}
              type="file"
              onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
              className="text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-0.5 block">Categorie</label>
            <select
              value={docCategory}
              onChange={(e) => setDocCategory(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            >
              <option value="analyse">Analyse</option>
              <option value="radio">Radio</option>
              <option value="echographie">Echographie</option>
              <option value="autre">Autre</option>
            </select>
          </div>
          <Button
            type="button"
            className="w-full"
            disabled={!docFile || uploading}
            onClick={handleUpload}
          >
            {uploading ? "Upload..." : <><Upload className="mr-2 h-4 w-4" /> Ajouter</>}
          </Button>
        </CardContent>
      </Card>

      <DocumentPreview
        open={previewDoc !== null}
        onOpenChange={(o) => { if (!o) setPreviewDoc(null); }}
        filePath={previewDoc?.filePath ?? ""}
        fileName={previewDoc?.fileName ?? ""}
      />
    </div>
  );
}

function PrescriptionsTab({ patientId, patient, prescriptions, onRefresh }: {
  patientId: string;
  patient: any;
  prescriptions: any[];
  onRefresh: () => void;
}) {
  const [showNew, setShowNew] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);
  const [generalNotes, setGeneralNotes] = React.useState("");
  const [medicines, setMedicines] = React.useState([
    { name: "", dosage: "", frequency: "", duration: "", instructions: "" }
  ]);

  async function createPrescription(e: React.FormEvent) {
    e.preventDefault();
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

    dispatchNotification({
      id: `presc-${Date.now()}`,
      title: "Ordonnance créée",
      detail: `Pour ${patient?.last_name || ""} ${patient?.first_name || ""}`,
      type: "success"
    });

    setShowNew(false);
    setGeneralNotes("");
    setMedicines([{ name: "", dosage: "", frequency: "", duration: "", instructions: "" }]);
    onRefresh();
  }

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
      onRefresh();
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

  function exportPdfPrescription(p: any) {
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
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Ordonnances</h2>
        <Button size="sm" onClick={() => setShowNew(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle ordonnance
        </Button>
      </div>

      <Card>
        <CardContent>
          <div className="space-y-3">
            {(prescriptions || []).map((p) => {
              const meds = typeof p.medications === 'string' ? JSON.parse(p.medications) : (p.medications || []);
              return (
                <div key={p.id} className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-primary" />
                    <div>
                      <div className="font-medium">{new Date(p.date).toLocaleDateString()}</div>
                      <div className="text-sm text-muted-foreground">
                        {meds.length} medicament(s){p.doctor_name ? ` - ${p.doctor_name}` : ""}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => exportPdfPrescription(p)}>
                      <Download className="mr-1 h-4 w-4" />
                      PDF
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
            {(prescriptions || []).length === 0 && (
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
