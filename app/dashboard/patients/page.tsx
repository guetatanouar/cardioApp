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

import { apiFetch } from "@/lib/api/client";
import { dispatchNotification } from "@/lib/notifications";
import { usePagePermission } from "@/lib/auth/usePermissions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/cn";
import { FileText, Plus, Trash2, Download } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type PatientListItem = {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  severity_status: "critique" | "surveillance" | "stable";
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
  const [severityFilter, setSeverityFilter] = React.useState<"all" | "critique" | "surveillance" | "stable">("all");
  const [pathologyFilter, setPathologyFilter] = React.useState("");
  const [page, setPage] = React.useState(1);
  const pageSize = 12;

  const [items, setItems] = React.useState<PatientListItem[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(false);

  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [tab, setTab] = React.useState<"dossier" | "consultations" | "vitals" | "documents" | "messages" | "access" | "ordonnances">("dossier");
  const [detail, setDetail] = React.useState<PatientDetailRes | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [detailError, setDetailError] = React.useState<string | null>(null);

  const [vitalsPeriod, setVitalsPeriod] = React.useState<"1M" | "3M" | "6M" | "1Y">("3M");

  const [chatItems, setChatItems] = React.useState<any[]>([]);
  const [chatText, setChatText] = React.useState("");
  const [chatLoading, setChatLoading] = React.useState(false);
  const [chatUnread, setChatUnread] = React.useState(0);

  const [account, setAccount] = React.useState<any | null>(null);
  const [accountLoading, setAccountLoading] = React.useState(false);
  const [accountError, setAccountError] = React.useState<string | null>(null);
  const [accountForm, setAccountForm] = React.useState({ username: "", password: "" });
  const [resetPassword, setResetPassword] = React.useState("");
  const [accountSaving, setAccountSaving] = React.useState(false);

  const [newConsultation, setNewConsultation] = React.useState({ date: new Date().toISOString().split('T')[0], reason: "", exam: "", diagnosis: "", treatment: "", note: "" });
  const [consultationSaving, setConsultationSaving] = React.useState(false);
  const [consultationError, setConsultationError] = React.useState<string | null>(null);

  const [docFile, setDocFile] = React.useState<File | null>(null);
  const [docCategory, setDocCategory] = React.useState("Analyse");
  const [docUploading, setDocUploading] = React.useState(false);

  const [showCreate, setShowCreate] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [createError, setCreateError] = React.useState<string | null>(null);
  const [createForm, setCreateForm] = React.useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    bloodType: "",
    phone: "",
    email: "",
    address: "",
    pathology: "",
    severityStatus: "stable" as "critique" | "surveillance" | "stable"
  });

  async function load(customQ = q, customPage = page) {
    setLoading(true);
    try {
      const res = await apiFetch<PatientListItem[] | { items: PatientListItem[]; total: number }>(
        `/api/patients?page=${customPage}&pageSize=${pageSize}&q=${encodeURIComponent(customQ)}`
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
    load();
  }, [page]);

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
    setNewConsultation({ date: new Date().toISOString().split('T')[0], reason: "", exam: "", diagnosis: "", treatment: "", note: "" });
    setDocFile(null);
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
          text
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
    setQ(initial);
    setPage(1);
    load(initial, 1).catch(() => undefined);
  }, [searchParams]);

  const filteredItems = (items || []).filter((p) => {
    if (severityFilter !== "all" && p.severity_status !== severityFilter) return false;
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
    setCreateError(null);
    setCreating(true);
    try {
      const payload = {
        first_name: createForm.firstName,
        last_name: createForm.lastName,
        date_of_birth: createForm.dateOfBirth,
        gender: "M" as const,
        blood_type: createForm.bloodType || undefined,
        phone: createForm.phone || undefined,
        email: createForm.email || undefined,
        address: createForm.address || undefined,
        pathology: createForm.pathology || undefined,
        severity_status: createForm.severityStatus
      };

      await apiFetch("/api/patients", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      dispatchNotification({
        id: `patient-created-${Date.now()}`,
        title: "Patient créé",
        detail: `${createForm.lastName} ${createForm.firstName}`,
        type: "success"
      });

      setShowCreate(false);
      setCreateForm({
        firstName: "",
        lastName: "",
        dateOfBirth: "",
        bloodType: "",
        phone: "",
        email: "",
        address: "",
        pathology: "",
        severityStatus: "stable"
      });
      await load();
    } catch {
      setCreateError("Impossible de creer le patient");
    } finally {
      setCreating(false);
    }
  }

  function severityClass(status: PatientListItem["severity_status"]) {
    if (status === "critique") return "bg-red-100 text-red-700";
    if (status === "surveillance") return "bg-amber-100 text-amber-700";
    return "bg-emerald-100 text-emerald-700";
  }

  function exportCsv() {
    const header = ["id", "last_name", "first_name", "date_of_birth", "severity_status", "pathology", "phone", "email"];
    const rows = filteredItems.map((p) => [
      p.id,
      p.last_name,
      p.first_name,
      p.date_of_birth,
      p.severity_status,
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
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as "all" | "critique" | "surveillance" | "stable")}
            className="h-10 rounded-md border border-input bg-transparent px-3 text-sm md:w-44"
          >
            <option value="all">Toutes severites</option>
            <option value="critique">Critique</option>
            <option value="surveillance">Surveillance</option>
            <option value="stable">Stable</option>
          </select>
          <Button variant="outline" onClick={() => { setPage(1); load(); }} disabled={loading}>Chercher</Button>
        </div>

        <div className="flex items-center gap-2 md:ml-auto">
          <Button variant="outline" onClick={exportCsv}>Exporter CSV</Button>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button>Nouveau patient</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl p-0" title="Nouveau patient">
              <div className="rounded-t-2xl bg-gradient-to-r from-indigo-600 to-blue-700 px-6 py-4 text-white">
                <div className="text-sm opacity-90">1/2</div>
                <div className="text-lg font-semibold">Nouveau patient</div>
              </div>
              <div className="p-6">
                <form className="space-y-3" onSubmit={createPatient}>
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
                    <Input
                      placeholder="Groupe sanguin"
                      value={createForm.bloodType}
                      onChange={(e) => setCreateForm((s) => ({ ...s, bloodType: e.target.value }))}
                    />
                    <Input
                      placeholder="Telephone"
                      value={createForm.phone}
                      onChange={(e) => setCreateForm((s) => ({ ...s, phone: e.target.value }))}
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
                    <select
                      value={createForm.severityStatus}
                      onChange={(e) => setCreateForm((s) => ({ ...s, severityStatus: e.target.value as "critique" | "surveillance" | "stable" }))}
                      className="h-10 rounded-md border border-input bg-transparent px-3 text-sm"
                    >
                      <option value="stable">Stable</option>
                      <option value="surveillance">Surveillance</option>
                      <option value="critique">Critique</option>
                    </select>
                  </div>

                  <Input
                    placeholder="Adresse"
                    value={createForm.address}
                    onChange={(e) => setCreateForm((s) => ({ ...s, address: e.target.value }))}
                  />

                  {createError ? <div className="text-sm text-destructive">{createError}</div> : null}

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Annuler</Button>
                    <Button type="submit" disabled={creating}>{creating ? "Creation..." : "Creer"}</Button>
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
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${severityClass(p.severity_status)}`}>
                    {p.severity_status}
                  </span>
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

      <Dialog open={Boolean(selectedId)} onOpenChange={(open) => (!open ? setSelectedId(null) : undefined)}>
        <DialogContent className="max-w-4xl p-0">
          <div className="rounded-t-2xl bg-gradient-to-r from-indigo-600 to-blue-700 px-6 py-4 text-white">
            <DialogHeader className="space-y-0">
              <DialogTitle className="text-lg font-semibold">
                {detail?.patient ? `${detail.patient.last_name} ${detail.patient.first_name}` : "Fiche patient"}
              </DialogTitle>
              <div className="text-sm text-white/80">{detail?.patient?.blood_type ? `Groupe ${detail.patient.blood_type}` : ""}</div>
            </DialogHeader>
          </div>

          <div className="p-6">
            {detailLoading ? <div className="text-sm text-muted-foreground">Chargement...</div> : null}
            {detailError ? <div className="text-sm text-destructive">{detailError}</div> : null}

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

            {!detail ? null : tab === "dossier" ? (
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
            ) : tab === "consultations" ? (
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Historique</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {(detail.consultations || []).map((c: any) => (
                        <div key={c.id} className="rounded-xl border border-border p-3">
                          <div className="text-xs text-muted-foreground">{new Date(c.date).toLocaleDateString("fr-FR")}</div>
                          <div className="mt-1 font-medium text-sm">{c.motif ?? "—"}</div>
                          {c.diagnostic && <div className="text-sm text-muted-foreground">{c.diagnostic}</div>}
                          {c.traitement && <div className="text-xs text-blue-600 mt-1">Traitement: {c.traitement}</div>}
                        </div>
                      ))}
                      {!detail.consultations?.length ? <div className="text-sm text-muted-foreground">Aucune consultation</div> : null}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Nouvelle consultation</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Date</label>
                      <Input
                        type="date"
                        value={newConsultation.date}
                        onChange={(e) => setNewConsultation((s) => ({ ...s, date: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Motif</label>
                      <textarea
                        className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[60px] resize-none"
                        placeholder="Motif de la consultation"
                        value={newConsultation.reason}
                        onChange={(e) => setNewConsultation((s) => ({ ...s, reason: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Examen</label>
                      <textarea
                        className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[60px] resize-none"
                        placeholder="Résultats de l'examen"
                        value={newConsultation.exam}
                        onChange={(e) => setNewConsultation((s) => ({ ...s, exam: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Diagnostic</label>
                      <textarea
                        className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[60px] resize-none"
                        placeholder="Diagnostic"
                        value={newConsultation.diagnosis}
                        onChange={(e) => setNewConsultation((s) => ({ ...s, diagnosis: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Traitement</label>
                      <textarea
                        className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[60px] resize-none"
                        placeholder="Traitement prescrit"
                        value={newConsultation.treatment}
                        onChange={(e) => setNewConsultation((s) => ({ ...s, treatment: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Note optionnelle</label>
                      <textarea
                        className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[40px] resize-none"
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
                            setNewConsultation({ date: new Date().toISOString().split('T')[0], reason: "", exam: "", diagnosis: "", treatment: "", note: "" });
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

                    {rows.length === 0 ? <div className="text-sm text-muted-foreground">Aucune donnee</div> : null}
                  </div>
                );
              })()
            ) : tab === "documents" ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">Aucun document</div>
                </CardContent>
              </Card>
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
                        chatItems.map((m: any) => (
                          <div
                            key={m.id}
                            className={cn(
                              "rounded-lg p-3 max-w-[80%]",
                              m.from_role === "patient" ? "bg-blue-100 text-blue-900 ml-auto" : "bg-gray-100 text-gray-900 mr-auto"
                            )}
                          >
                            <div className="text-xs font-medium mb-1">{m.from_name}</div>
                            <div className="text-sm">{m.text || m.content}</div>
                            <div className="text-[10px] text-muted-foreground mt-1">
                              {new Date(m.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                            </div>
                          </div>
                        ))
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
                        <Input
                          type="password"
                          placeholder="Nouveau mot de passe"
                          value={resetPassword}
                          onChange={(e) => setResetPassword(e.target.value)}
                        />
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
                              alert("Mot de passe réinitialisé avec succès");
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
                          <Input
                            type="password"
                            placeholder="Mot de passe"
                            value={accountForm.password}
                            onChange={(e) => setAccountForm((s) => ({ ...s, password: e.target.value }))}
                          />
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
          </div>
        </DialogContent>
      </Dialog>
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
    </div>
  );
}
