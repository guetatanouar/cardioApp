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

  const [view, setView] = React.useState<"month" | "week" | "list">("list");
  const [selectedDate, setSelectedDate] = React.useState(new Date());

  const [modalOpen, setModalOpen] = React.useState(false);
  const [form, setForm] = React.useState({
    patientId: "",
    date: "",
    time: "09:00",
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

  async function loadAppointments() {
    setLoading(true);
    try {
      const s = startOfWeek(selectedDate).toISOString();
      const e = endOfWeek(selectedDate).toISOString();
      const res = await apiFetch<any[] | { items: any[] }>(`/api/appointments?from=${s}&to=${e}`);
      const appts = Array.isArray(res) ? res : (res as any).items ?? [];
      setItems(appts);
    } finally {
      setLoading(false);
    }
  }

  async function loadPatients() {
    const res = await apiFetch<any[] | { items: any[] }>("/api/patients?page=1&pageSize=100");
    const patientList = Array.isArray(res) ? res : (res as any).items ?? [];
    setPatients(patientList);
    if (!form.patientId && patientList[0]) {
      setForm((s) => ({ ...s, patientId: patientList[0].id }));
    }
  }

  React.useEffect(() => {
    loadAppointments().catch(() => undefined);
    loadPatients().catch(() => undefined);
  }, [selectedDate]);

  async function saveAppointment(e: React.FormEvent) {
    e.preventDefault();
    const startsAt = `${form.date}T${form.time}:00`;
    const payload = {
      patientId: form.patientId,
      startsAt: new Date(startsAt).toISOString(),
      durationMinutes: Number(form.durationMinutes || 30),
      type: form.type,
      status: form.status,
      reason: form.reason || undefined,
      notes: form.notes || undefined
    };

    await apiFetch("/api/appointments", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    setModalOpen(false);
    setForm({
      patientId: patients[0]?.id || "",
      date: "",
      time: "09:00",
      durationMinutes: "30",
      type: "suivi",
      status: "planifie",
      reason: "",
      notes: ""
    });
    await loadAppointments();
  }

  async function cancelAppointment(id: string) {
    await apiFetch(`/api/appointments/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status: "annule" })
    });
    await loadAppointments();
  }

  function getWeekDays() {
    const start = startOfWeek(selectedDate);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
    return days;
  }

  function getAppointmentsForDay(day: Date) {
    return (items || []).filter((a) => {
      const apptDate = new Date(a.starts_at);
      return apptDate.toDateString() === day.toDateString();
    });
  }

  function prevWeek() {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 7);
    setSelectedDate(d);
  }

  function nextWeek() {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 7);
    setSelectedDate(d);
  }

  function statusBadge(status: string) {
    if (status === "complete") return "bg-green-100 text-green-700";
    if (status === "annule") return "bg-gray-100 text-gray-700";
    if (status === "urgent") return "bg-red-100 text-red-700";
    return "bg-blue-100 text-blue-700";
  }

  const weekDays = getWeekDays();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={prevWeek}>&lt;</Button>
          <span className="min-w-[180px] text-center font-medium">
            {selectedDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
          </span>
          <Button variant="outline" size="sm" onClick={nextWeek}>&gt;</Button>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
          >
            <option value="all">Tous statuts</option>
            <option value="planifie">Planifie</option>
            <option value="complete">Complete</option>
            <option value="annule">Annule</option>
          </select>

          <Dialog open={modalOpen} onOpenChange={setModalOpen}>
            <DialogTrigger asChild>
              <Button>Nouveau RDV</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouveau rendez-vous</DialogTitle>
              </DialogHeader>
              <form className="space-y-4" onSubmit={saveAppointment}>
                <div>
                  <label className="text-sm">Patient</label>
                  <select
                    value={form.patientId}
                    onChange={(e) => setForm((s) => ({ ...s, patientId: e.target.value }))}
                    className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                    required
                  >
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>{p.last_name} {p.first_name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm">Date</label>
                    <Input
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm((s) => ({ ...s, date: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm">Heure</label>
                    <Input
                      type="time"
                      value={form.time}
                      onChange={(e) => setForm((s) => ({ ...s, time: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm">Type</label>
                    <select
                      value={form.type}
                      onChange={(e) => setForm((s) => ({ ...s, type: e.target.value }))}
                      className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                    >
                      <option value="suivi">Suivi</option>
                      <option value="consultation">Consultation</option>
                      <option value="controle">Controle</option>
                      <option value="urgence">Urgence</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm">Duree (min)</label>
                    <Input
                      type="number"
                      value={form.durationMinutes}
                      onChange={(e) => setForm((s) => ({ ...s, durationMinutes: e.target.value }))}
                      min="15"
                      max="120"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm">Motif</label>
                  <Input
                    value={form.reason}
                    onChange={(e) => setForm((s) => ({ ...s, reason: e.target.value }))}
                    placeholder="Motif du rendez-vous"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Annuler</Button>
                  <Button type="submit">Creer</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-7 border-b border-border">
            {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
              <div key={d} className="border-r border-border px-2 py-2 text-center text-sm font-medium">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {weekDays.map((day) => {
              const dayAppts = getAppointmentsForDay(day);
              const isToday = day.toDateString() === new Date().toDateString();
              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "min-h-[120px] border-r border-border p-2",
                    isToday && "bg-primary/5"
                  )}
                >
                  <div className={cn(
                    "mb-2 text-sm",
                    isToday ? "font-bold text-primary" : "text-muted-foreground"
                  )}>
                    {day.getDate()}
                  </div>
                  <div className="space-y-1">
                    {dayAppts.map((a) => {
                      const apptDate = new Date(a.starts_at);
                      return (
                        <div
                          key={a.id}
                          className={cn(
                            "rounded px-1 py-0.5 text-[10px]",
                            statusBadge(a.status)
                          )}
                        >
                          <div className="font-medium truncate">{apptDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</div>
                          <div className="truncate">{a.first_name} {a.last_name}</div>
                          {a.status !== "annule" && (
                            <button
                              type="button"
                              className="mt-1 text-[10px] underline hover:text-destructive"
                              onClick={() => cancelAppointment(a.id)}
                            >
                              Annuler
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rendez-vous du {selectedDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {(items || []).map((a) => {
              const apptDate = new Date(a.starts_at);
              return (
                <div key={a.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-medium">
                      {apptDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                    <div>
                      <div className="font-medium">{a.first_name} {a.last_name}</div>
                      <div className="text-sm text-muted-foreground">{a.type} - {a.reason || "Sans motif"}</div>
                    </div>
                  </div>
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", statusBadge(a.status))}>
                    {a.status}
                  </span>
                </div>
              );
            })}
            {(items || []).length === 0 ? (
              <div className="text-sm text-muted-foreground">Aucun rendez-vous cette semaine</div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
