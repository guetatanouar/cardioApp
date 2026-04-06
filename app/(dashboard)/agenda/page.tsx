"use client";

import * as React from "react";

import { apiFetch } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/cn";

export default function AgendaPage() {
  const [items, setItems] = React.useState<any[]>([]);
  const [patients, setPatients] = React.useState<Array<{ id: string; first_name: string; last_name: string }>>([]);
  const [loading, setLoading] = React.useState(false);

  const [statusFilter, setStatusFilter] = React.useState("all");
  const [typeFilter, setTypeFilter] = React.useState("all");

  const [view, setView] = React.useState<"month" | "week" | "list">("week");
  const [cursorMonth, setCursorMonth] = React.useState(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [cursorWeek, setCursorWeek] = React.useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
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

  function startOfWeek(d: Date) {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    date.setDate(diff);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  function endOfWeek(d: Date) {
    const s = startOfWeek(d);
    const e = new Date(s);
    e.setDate(s.getDate() + 6);
    e.setHours(23, 59, 59, 999);
    return e;
  }

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
      const params = new URLSearchParams();
      if (view === "week") {
        const s = startOfWeek(cursorWeek).toISOString();
        const e = endOfWeek(cursorWeek).toISOString();
        params.set("from", s);
        params.set("to", e);
      } else {
        const from = startOfMonth(cursorMonth).toISOString();
        const to = endOfMonth(cursorMonth).toISOString();
        params.set("from", from);
        params.set("to", to);
      }
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (typeFilter !== "all") params.set("type", typeFilter);

      const res = await apiFetch<any[] | { items: any[] }>(`/api/appointments?${params.toString()}`);
      const items = Array.isArray(res) ? res : (res as any).items ?? [];
      setItems(items);
    } finally {
      setLoading(false);
    }
  }

  async function loadPatients() {
    const res = await apiFetch<any[] | { items: Array<{ id: string; first_name: string; last_name: string }> }>(
      "/api/patients?page=1&pageSize=50"
    );
    const items = Array.isArray(res) ? res : (res as any).items ?? [];
    setPatients(items);
    if (!form.patientId && items[0]) {
      setForm((s) => ({ ...s, patientId: items[0].id }));
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
  }, [statusFilter, typeFilter, view, cursorMonth, cursorWeek]);

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

  const weekDays = React.useMemo(() => {
    const start = startOfWeek(cursorWeek);
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      d.setHours(0, 0, 0, 0);
      return d;
    });
  }, [cursorWeek]);

  const hours = Array.from({ length: 12 }).map((_, i) => 8 + i);

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
          <div className="flex overflow-hidden rounded-md border border-input">
            {[
              ["month", "Mois"],
              ["week", "Semaine"],
              ["list", "Liste"]
            ].map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setView(k as any)}
                className={cn(
                  "px-3 py-1.5 text-sm",
                  view === k ? "bg-primary text-primary-foreground" : "bg-background"
                )}
              >
                {label}
              </button>
            ))}
          </div>
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

      {view === "month" ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{cursorMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</CardTitle>
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
                    className={cn(
                      "h-16 rounded-xl border p-2 text-left transition",
                      inMonth ? "bg-background" : "bg-muted/30 text-muted-foreground",
                      isSelected ? "border-primary ring-1 ring-primary/40" : "border-border hover:bg-accent/30"
                    )}
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
      ) : view === "week" ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              Semaine du {weekDays[0]?.toLocaleDateString()} au {weekDays[6]?.toLocaleDateString()}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const d = new Date(cursorWeek);
                  d.setDate(d.getDate() - 7);
                  setCursorWeek(d);
                }}
              >
                ←
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const d = new Date();
                  const day = d.getDay();
                  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
                  d.setDate(diff);
                  d.setHours(0, 0, 0, 0);
                  setCursorWeek(d);
                }}
              >
                Aujourd'hui
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const d = new Date(cursorWeek);
                  d.setDate(d.getDate() + 7);
                  setCursorWeek(d);
                }}
              >
                →
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? <div className="mb-3 text-sm text-muted-foreground">Chargement...</div> : null}
            <div className="grid grid-cols-8 gap-1 text-xs">
              <div className="text-muted-foreground"></div>
              {weekDays.map((d) => (
                <div key={d.toISOString()} className={cn("px-2 py-1 text-center font-medium", d.toDateString() === new Date().toDateString() ? "text-primary" : "text-muted-foreground")}>
                  {d.toLocaleDateString(undefined, { weekday: "short", day: "numeric" })}
                </div>
              ))}
            </div>
            <div className="mt-2 space-y-1">
              {hours.map((h) => (
                <div key={h} className="grid grid-cols-8 gap-1">
                  <div className="flex items-center justify-end pr-2 text-xs text-muted-foreground">{h}h</div>
                  {weekDays.map((d) => {
                    const cellStart = new Date(d);
                    cellStart.setHours(h, 0, 0, 0);
                    const cellEnd = new Date(d);
                    cellEnd.setHours(h, 59, 59, 999);
                    const appts = items.filter((a) => {
                      const t = new Date(a.starts_at);
                      return t >= cellStart && t <= cellEnd;
                    });
                    return (
                      <button
                        key={d.toISOString() + h}
                        type="button"
                        onClick={() => {
                          setSelectedDay(new Date(d));
                          const startsAt = new Date(d);
                          startsAt.setHours(h, 0, 0, 0);
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
                          setEditingId(null);
                          setModalOpen(true);
                        }}
                        className="relative h-14 rounded-md border border-border bg-muted/30 p-1 text-left hover:bg-accent/30"
                      >
                        <div className="flex flex-col gap-0.5">
                          {appts.slice(0, 2).map((a) => (
                            <div
                              key={a.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                pickForEdit(a);
                              }}
                              className={cn(
                                "truncate rounded px-1 text-[10px] font-medium",
                                a.status === "urgent" ? "bg-red-100 text-red-700" : "bg-primary/10 text-primary"
                              )}
                            >
                              {a.last_name} {a.type}
                            </div>
                          ))}
                          {appts.length > 2 ? <div className="text-[10px] text-muted-foreground">+{appts.length - 2}</div> : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Liste des rendez-vous</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setCursorMonth((d) => { const x = new Date(d); x.setMonth(x.getMonth() - 1); return x; })}>←</Button>
              <Button variant="outline" size="sm" onClick={() => setCursorMonth(new Date())}>Aujourd'hui</Button>
              <Button variant="outline" size="sm" onClick={() => setCursorMonth((d) => { const x = new Date(d); x.setMonth(x.getMonth() + 1); return x; })}>→</Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? <div className="mb-3 text-sm text-muted-foreground">Chargement...</div> : null}
            <div className="space-y-2">
              {items
                .slice()
                .sort((a, b) => +new Date(a.starts_at) - +new Date(b.starts_at))
                .map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => pickForEdit(a)}
                    className={`w-full rounded-xl border border-border border-l-4 ${typeClass(a.type)} bg-card p-3 text-left shadow-sm hover:bg-accent/30`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-sm font-semibold">{new Date(a.starts_at).toLocaleDateString()} {new Date(a.starts_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                        <div className="text-xs text-muted-foreground">{a.last_name} {a.first_name} • {a.type}</div>
                      </div>
                      <div className="text-right">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusClass(a.status)}`}>{a.status}</span>
                        <div className="text-xs text-muted-foreground">{a.duration_minutes} min</div>
                      </div>
                    </div>
                  </button>
                ))}
              {items.length === 0 ? <div className="py-8 text-sm text-muted-foreground">Aucun rendez-vous</div> : null}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
