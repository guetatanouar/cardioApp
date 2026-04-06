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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/cn";

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
};

export default function PatientsPage() {
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
  const [tab, setTab] = React.useState<"dossier" | "consultations" | "vitals" | "documents" | "messages" | "access">("dossier");
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

  const [newConsultation, setNewConsultation] = React.useState({ reason: "", exam: "", diagnosis: "", treatment: "", note: "" });
  const [consultationSaving, setConsultationSaving] = React.useState(false);

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
    setNewConsultation({ reason: "", exam: "", diagnosis: "", treatment: "", note: "" });
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
                          <div className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleString()}</div>
                          <div className="mt-1 font-medium text-sm">{c.motif ?? "—"}</div>
                          <div className="text-sm text-muted-foreground">{c.diagnostic ?? ""}</div>
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
                    <Input
                      placeholder="Motif"
                      value={newConsultation.reason}
                      onChange={(e) => setNewConsultation((s) => ({ ...s, reason: e.target.value }))}
                    />
                    <Input
                      placeholder="Examen"
                      value={newConsultation.exam}
                      onChange={(e) => setNewConsultation((s) => ({ ...s, exam: e.target.value }))}
                    />
                    <Input
                      placeholder="Diagnostic"
                      value={newConsultation.diagnosis}
                      onChange={(e) => setNewConsultation((s) => ({ ...s, diagnosis: e.target.value }))}
                    />
                    <Input
                      placeholder="Traitement"
                      value={newConsultation.treatment}
                      onChange={(e) => setNewConsultation((s) => ({ ...s, treatment: e.target.value }))}
                    />
                    <Input
                      placeholder="Note"
                      value={newConsultation.note}
                      onChange={(e) => setNewConsultation((s) => ({ ...s, note: e.target.value }))}
                    />

                    <div className="flex justify-end">
                      <Button
                        disabled={consultationSaving}
                        onClick={async () => {
                          if (!selectedId) return;
                          setConsultationSaving(true);
                          try {
                            await apiFetch(`/api/patients/${selectedId}/consultations`, {
                              method: "POST",
                              body: JSON.stringify({
                                motif: newConsultation.reason || undefined,
                                examen: newConsultation.exam || undefined,
                                diagnostic: newConsultation.diagnosis || undefined,
                                traitement: newConsultation.treatment || undefined,
                                note: newConsultation.note || undefined
                              })
                            });
                            setNewConsultation({ reason: "", exam: "", diagnosis: "", treatment: "", note: "" });
                            await loadDetail(selectedId);
                          } finally {
                            setConsultationSaving(false);
                          }
                        }}
                      >
                        Ajouter
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
            ) : tab === "messages" ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Messagerie patient</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">Ouvrez la messagerie generale pour contacter ce patient</div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Acces patient</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">Aucun compte patient configure</div>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
