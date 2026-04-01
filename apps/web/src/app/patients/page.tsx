"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { apiFetch } from "@/lib/api/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

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
      const res = await apiFetch<{ items: PatientListItem[]; total: number }>(
        `/api/patients?page=${customPage}&pageSize=${pageSize}&q=${encodeURIComponent(customQ)}`
      );
      setItems(res.items);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  React.useEffect(() => {
    const initial = searchParams.get("q") ?? "";
    setQ(initial);
    setPage(1);
    load(initial, 1).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const filteredItems = items.filter((p) => {
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
        ...createForm,
        bloodType: createForm.bloodType || undefined,
        phone: createForm.phone || undefined,
        email: createForm.email || undefined,
        address: createForm.address || undefined,
        pathology: createForm.pathology || undefined
      };

      await apiFetch<{ id: string }>("/api/patients", {
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
            <DialogContent className="max-w-2xl p-0">
              <div className="rounded-t-2xl bg-gradient-to-r from-indigo-600 to-blue-700 px-6 py-4 text-white">
                <div className="text-sm opacity-90">1/2 — Informations personnelles</div>
                <div className="text-lg font-semibold">Nouveau patient</div>
              </div>
              <div className="p-6">
                <DialogHeader className="sr-only">
                  <DialogTitle>Nouveau patient</DialogTitle>
                </DialogHeader>
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
                    <Button type="submit" disabled={creating}>{creating ? "Creation..." : "Suivant"}</Button>
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
              <Link key={p.id} href={`/patients/${p.id}`} className="rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:bg-accent/30">
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
              </Link>
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
    </div>
  );
}
