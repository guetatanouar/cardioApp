"use client";

import * as React from "react";

import { apiFetch } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AgendaPage() {
  const [items, setItems] = React.useState<any[]>([]);
  const [patients, setPatients] = React.useState<Array<{ id: string; first_name: string; last_name: string }>>([]);
  const [loading, setLoading] = React.useState(false);

  const [view, setView] = React.useState<"week" | "list">("week");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [typeFilter, setTypeFilter] = React.useState("all");

  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({
    patientId: "",
    startsAt: "",
    durationMinutes: "30",
    type: "suivi",
    status: "planifie",
    reason: "",
    notes: ""
  });

  function startOfWeek(date = new Date()) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function endOfWeek(date = new Date()) {
    const d = startOfWeek(date);
    d.setDate(d.getDate() + 6);
    d.setHours(23, 59, 59, 999);
    return d;
  }

  async function loadAppointments() {
    setLoading(true);
    try {
      const from = startOfWeek().toISOString();
      const to = endOfWeek().toISOString();
      const params = new URLSearchParams({ from, to });
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (typeFilter !== "all") params.set("type", typeFilter);

      const res = await apiFetch<{ items: any[] }>(`/api/appointments?${params.toString()}`);
      setItems(res.items);
    } finally {
      setLoading(false);
    }
  }

  async function loadPatients() {
    const res = await apiFetch<{ items: Array<{ id: string; first_name: string; last_name: string }> }>(
      "/api/patients?page=1&pageSize=50"
    );
    setPatients(res.items);
    if (!form.patientId && res.items[0]) {
      setForm((s) => ({ ...s, patientId: res.items[0].id }));
    }
  }

  React.useEffect(() => {
    loadAppointments().catch(() => undefined);
    loadPatients().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    loadAppointments().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, typeFilter]);

  async function saveAppointment(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      patientId: form.patientId,
      startsAt: new Date(form.startsAt).toISOString(),
      durationMinutes: Number(form.durationMinutes || 30),
      type: form.type,
      status: form.status as "planifie" | "complete" | "annule" | "urgent",
      reason: form.reason || undefined,
      notes: form.notes || undefined
    };

    if (editingId) {
      await apiFetch(`/api/appointments/${editingId}`, {
        method: "PUT",
        body: JSON.stringify({
          startsAt: payload.startsAt,
          durationMinutes: payload.durationMinutes,
          type: payload.type,
          status: payload.status,
          reason: payload.reason ?? null,
          notes: payload.notes ?? null
        })
      });
    } else {
      await apiFetch("/api/appointments", {
        method: "POST",
        body: JSON.stringify(payload)
      });
    }

    setEditingId(null);
    setForm({
      patientId: patients[0]?.id ?? "",
      startsAt: "",
      durationMinutes: "30",
      type: "suivi",
      status: "planifie",
      reason: "",
      notes: ""
    });

    await loadAppointments();
  }

  function pickForEdit(item: any) {
    setEditingId(item.id);
    setForm({
      patientId: item.patient_id,
      startsAt: new Date(item.starts_at).toISOString().slice(0, 16),
      durationMinutes: String(item.duration_minutes ?? 30),
      type: item.type,
      status: item.status,
      reason: item.reason ?? "",
      notes: item.notes ?? ""
    });
  }

  function statusClass(status: string) {
    if (status === "urgent") return "bg-red-100 text-red-700";
    if (status === "annule") return "bg-slate-100 text-slate-600";
    if (status === "complete") return "bg-emerald-100 text-emerald-700";
    return "bg-blue-100 text-blue-700";
  }

  function typeClass(type: string) {
    if (type === "urgence") return "border-l-red-500";
    if (type === "echographie") return "border-l-violet-500";
    if (type === "bilan") return "border-l-amber-500";
    if (type === "consultation") return "border-l-blue-500";
    return "border-l-emerald-500";
  }

  const groupedByDay = items.reduce<Record<string, any[]>>((acc, item) => {
    const day = new Date(item.starts_at).toLocaleDateString();
    acc[day] = acc[day] || [];
    acc[day].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Modifier rendez-vous" : "Nouveau rendez-vous"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={saveAppointment}>
            <div className="grid gap-3 md:grid-cols-2">
              <select
                className="h-10 rounded-md border border-input bg-transparent px-3 text-sm"
                value={form.patientId}
                onChange={(e) => setForm((s) => ({ ...s, patientId: e.target.value }))}
                required
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.last_name} {p.first_name}
                  </option>
                ))}
              </select>
              <Input
                type="datetime-local"
                value={form.startsAt}
                onChange={(e) => setForm((s) => ({ ...s, startsAt: e.target.value }))}
                required
              />
              <Input
                type="number"
                value={form.durationMinutes}
                onChange={(e) => setForm((s) => ({ ...s, durationMinutes: e.target.value }))}
                placeholder="Duree (min)"
                min={5}
                max={240}
              />
              <select
                className="h-10 rounded-md border border-input bg-transparent px-3 text-sm"
                value={form.type}
                onChange={(e) => setForm((s) => ({ ...s, type: e.target.value }))}
              >
                <option value="suivi">Suivi</option>
                <option value="urgence">Urgence</option>
                <option value="bilan">Bilan</option>
                <option value="echographie">Echographie</option>
                <option value="consultation">Consultation</option>
              </select>
              <select
                className="h-10 rounded-md border border-input bg-transparent px-3 text-sm"
                value={form.status}
                onChange={(e) => setForm((s) => ({ ...s, status: e.target.value }))}
              >
                <option value="planifie">Planifie</option>
                <option value="complete">Complete</option>
                <option value="annule">Annule</option>
                <option value="urgent">Urgent</option>
              </select>
              <Input value={form.reason} onChange={(e) => setForm((s) => ({ ...s, reason: e.target.value }))} placeholder="Motif" />
            </div>
            <Input value={form.notes} onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))} placeholder="Notes" />

            <div className="flex justify-end gap-2">
              {editingId ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingId(null);
                    setForm((s) => ({ ...s, startsAt: "", durationMinutes: "30", type: "suivi", status: "planifie", reason: "", notes: "" }));
                  }}
                >
                  Annuler edition
                </Button>
              ) : null}
              <Button type="submit">{editingId ? "Mettre a jour" : "Creer RDV"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Agenda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Button size="sm" variant={view === "week" ? "default" : "outline"} onClick={() => setView("week")}>Vue semaine</Button>
            <Button size="sm" variant={view === "list" ? "default" : "outline"} onClick={() => setView("list")}>Vue liste</Button>

            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-2 text-sm">
              <option value="all">Tous statuts</option>
              <option value="planifie">Planifie</option>
              <option value="complete">Complete</option>
              <option value="annule">Annule</option>
              <option value="urgent">Urgent</option>
            </select>

            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-2 text-sm">
              <option value="all">Tous types</option>
              <option value="suivi">Suivi</option>
              <option value="urgence">Urgence</option>
              <option value="bilan">Bilan</option>
              <option value="echographie">Echographie</option>
              <option value="consultation">Consultation</option>
            </select>
          </div>

          {loading ? <div className="text-sm text-muted-foreground">Chargement...</div> : null}

          {view === "list" ? (
            <div className="space-y-2">
              {items.map((a) => (
                <div key={a.id} className={`rounded-md border border-border border-l-4 ${typeClass(a.type)} p-3`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-medium">
                        {a.last_name} {a.first_name}
                      </div>
                      <div className="text-sm text-muted-foreground">{new Date(a.starts_at).toLocaleString()} - {a.duration_minutes} min</div>
                      <div className="text-sm text-muted-foreground">{a.type} - {a.reason || "-"}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusClass(a.status)}`}>{a.status}</span>
                      <Button size="sm" variant="outline" onClick={() => pickForEdit(a)}>Modifier</Button>
                    </div>
                  </div>
                </div>
              ))}
              {items.length === 0 ? <div className="py-8 text-sm text-muted-foreground">Aucun rendez-vous</div> : null}
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {Object.entries(groupedByDay).map(([day, rows]) => (
                <div key={day} className="rounded-md border border-border p-3">
                  <div className="mb-2 text-sm font-semibold">{day}</div>
                  <div className="space-y-2">
                    {rows.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => pickForEdit(a)}
                        className={`w-full rounded border border-border border-l-4 ${typeClass(a.type)} p-2 text-left`}
                      >
                        <div className="text-sm font-medium">{a.last_name}</div>
                        <div className="text-xs text-muted-foreground">{new Date(a.starts_at).toLocaleTimeString()} - {a.type}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {!Object.keys(groupedByDay).length ? <div className="py-8 text-sm text-muted-foreground">Aucun rendez-vous cette semaine</div> : null}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
