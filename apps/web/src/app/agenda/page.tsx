"use client";

import * as React from "react";

import { apiFetch } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function AgendaPage() {
  const [items, setItems] = React.useState<any[]>([]);
  const [patients, setPatients] = React.useState<Array<{ id: string; first_name: string; last_name: string }>>([]);
  const [loading, setLoading] = React.useState(false);

  const [statusFilter, setStatusFilter] = React.useState("all");
  const [typeFilter, setTypeFilter] = React.useState("all");

  const [cursorMonth, setCursorMonth] = React.useState(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [selectedDay, setSelectedDay] = React.useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [form, setForm] = React.useState({
    patientId: "",
    startsAt: "",
    durationMinutes: "30",
    type: "suivi",
    status: "planifie",
    reason: "",
    notes: ""
  });

  function startOfMonth(d: Date) {
    const x = new Date(d);
    x.setDate(1);
    x.setHours(0, 0, 0, 0);
    return x;
  }

  function endOfMonth(d: Date) {
    const x = new Date(d);
    x.setMonth(x.getMonth() + 1);
    x.setDate(0);
    x.setHours(23, 59, 59, 999);
    return x;
  }

  function startOfGrid(d: Date) {
    const first = startOfMonth(d);
    const day = first.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const gridStart = new Date(first);
    gridStart.setDate(first.getDate() + diff);
    gridStart.setHours(0, 0, 0, 0);
    return gridStart;
  }

  async function loadAppointments() {
    setLoading(true);
    try {
      const from = startOfMonth(cursorMonth).toISOString();
      const to = endOfMonth(cursorMonth).toISOString();
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

  React.useEffect(() => {
    loadAppointments().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursorMonth]);

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
    setModalOpen(false);
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
    setModalOpen(true);
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

  const days = React.useMemo(() => {
    const start = startOfGrid(cursorMonth);
    return Array.from({ length: 42 }).map((_, idx) => {
      const d = new Date(start);
      d.setDate(start.getDate() + idx);
      d.setHours(0, 0, 0, 0);
      return d;
    });
  }, [cursorMonth]);

  const apptsForSelectedDay = React.useMemo(() => {
    const start = new Date(selectedDay);
    start.setHours(0, 0, 0, 0);
    const end = new Date(selectedDay);
    end.setHours(23, 59, 59, 999);
    return items
      .filter((a) => {
        const t = new Date(a.starts_at).getTime();
        return t >= start.getTime() && t <= end.getTime();
      })
      .sort((a, b) => +new Date(a.starts_at) - +new Date(b.starts_at));
  }, [items, selectedDay]);

  function openNewModal() {
    setEditingId(null);
    const startsAt = new Date(selectedDay);
    startsAt.setHours(9, 0, 0, 0);
    setForm((s) => ({
      ...s,
      patientId: s.patientId || patients[0]?.id || "",
      startsAt: startsAt.toISOString().slice(0, 16),
      durationMinutes: "30",
      type: "suivi",
      status: "planifie",
      reason: "",
      notes: ""
    }));
    setModalOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xl font-semibold">Agenda</div>
        <div className="flex items-center gap-2">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-2 text-sm">
            <option value="all">Tous statuts</option>
            <option value="planifie">Planifié</option>
            <option value="complete">Terminé</option>
            <option value="annule">Annulé</option>
            <option value="urgent">Urgent</option>
          </select>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-2 text-sm">
            <option value="all">Tous types</option>
            <option value="suivi">Suivi</option>
            <option value="urgence">Urgence</option>
            <option value="bilan">Bilan</option>
            <option value="echographie">Échographie</option>
            <option value="consultation">Consultation</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              {cursorMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const d = new Date(cursorMonth);
                  d.setMonth(d.getMonth() - 1);
                  setCursorMonth(d);
                }}
              >
                ←
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const d = new Date(cursorMonth);
                  d.setMonth(d.getMonth() + 1);
                  setCursorMonth(d);
                }}
              >
                →
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? <div className="mb-3 text-sm text-muted-foreground">Chargement...</div> : null}
            <div className="grid grid-cols-7 gap-2 text-xs text-muted-foreground">
              {["LUN", "MAR", "MER", "JEU", "VEN", "SAM", "DIM"].map((d) => (
                <div key={d} className="px-2">
                  {d}
                </div>
              ))}
            </div>

            <div className="mt-2 grid grid-cols-7 gap-2">
              {days.map((d) => {
                const inMonth = d.getMonth() === cursorMonth.getMonth();
                const isSelected = d.getTime() === selectedDay.getTime();
                const count = items.filter((a) => {
                  const x = new Date(a.starts_at);
                  return x.getFullYear() === d.getFullYear() && x.getMonth() === d.getMonth() && x.getDate() === d.getDate();
                }).length;

                return (
                  <button
                    key={d.toISOString()}
                    type="button"
                    onClick={() => setSelectedDay(new Date(d))}
                    className={
                      `h-16 rounded-xl border p-2 text-left transition ` +
                      `${inMonth ? "bg-background" : "bg-muted/30 text-muted-foreground"} ` +
                      `${isSelected ? "border-primary ring-1 ring-primary/40" : "border-border hover:bg-accent/30"}`
                    }
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">{d.getDate()}</div>
                      {count ? <div className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">{count}</div> : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{selectedDay.toLocaleDateString(undefined, { weekday: "long", day: "2-digit", month: "long" })}</CardTitle>
              <div className="text-sm text-muted-foreground">RDV</div>
            </div>
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={openNewModal}>Nouveau RDV</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingId ? "Modifier RDV" : "Nouveau RDV"}</DialogTitle>
                </DialogHeader>
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
                      placeholder="Durée (min)"
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
                      <option value="echographie">Échographie</option>
                      <option value="consultation">Consultation</option>
                    </select>
                    <select
                      className="h-10 rounded-md border border-input bg-transparent px-3 text-sm"
                      value={form.status}
                      onChange={(e) => setForm((s) => ({ ...s, status: e.target.value }))}
                    >
                      <option value="planifie">Planifié</option>
                      <option value="complete">Terminé</option>
                      <option value="annule">Annulé</option>
                      <option value="urgent">Urgent</option>
                    </select>
                    <Input value={form.reason} onChange={(e) => setForm((s) => ({ ...s, reason: e.target.value }))} placeholder="Motif" />
                  </div>
                  <Input value={form.notes} onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))} placeholder="Notes" />

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditingId(null);
                        setModalOpen(false);
                      }}
                    >
                      Annuler
                    </Button>
                    <Button type="submit">{editingId ? "Mettre à jour" : "Créer RDV"}</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {apptsForSelectedDay.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => pickForEdit(a)}
                  className={`w-full rounded-xl border border-border border-l-4 ${typeClass(a.type)} bg-card p-3 text-left shadow-sm hover:bg-accent/30`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold">{a.last_name} {a.first_name}</div>
                      <div className="text-xs text-muted-foreground">{a.type} • {a.reason || "-"}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">{new Date(a.starts_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                      <div className="text-xs text-muted-foreground">{a.duration_minutes} min</div>
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusClass(a.status)}`}>{a.status}</span>
                  </div>
                </button>
              ))}
              {apptsForSelectedDay.length === 0 ? <div className="py-8 text-sm text-muted-foreground">Aucun rendez-vous</div> : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
