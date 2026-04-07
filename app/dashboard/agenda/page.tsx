"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Plus, Clock, User } from "lucide-react";

import { apiFetch } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/cn";

type Appointment = {
  id: string;
  patient_id: string;
  starts_at: string;
  duration_minutes: number;
  type: string;
  status: string;
  reason: string | null;
  first_name: string;
  last_name: string;
};

export default function AgendaPage() {
  const [items, setItems] = React.useState<Appointment[]>([]);
  const [patients, setPatients] = React.useState<Array<{ id: string; first_name: string; last_name: string }>>([]);
  const [loading, setLoading] = React.useState(false);

  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);

  const [modalOpen, setModalOpen] = React.useState(false);
  const [form, setForm] = React.useState({
    patientId: "",
    date: "",
    time: "09:00",
    durationMinutes: "30",
    type: "suivi",
    reason: ""
  });

  async function loadAppointments() {
    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const start = new Date(year, month, 1).toISOString();
      const end = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
      const res = await apiFetch<any[] | { items: any[] }>(`/api/appointments?from=${start}&to=${end}`);
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
    loadAppointments();
  }, [currentDate]);

  React.useEffect(() => {
    loadPatients();
  }, []);

  async function saveAppointment(e: React.FormEvent) {
    e.preventDefault();
    const startsAt = `${form.date}T${form.time}:00`;
    await apiFetch("/api/appointments", {
      method: "POST",
      body: JSON.stringify({
        patientId: form.patientId,
        startsAt: new Date(startsAt).toISOString(),
        durationMinutes: Number(form.durationMinutes || 30),
        type: form.type,
        status: "planifie",
        reason: form.reason || undefined
      })
    });

    setModalOpen(false);
    setForm({
      patientId: patients[0]?.id || "",
      date: "",
      time: "09:00",
      durationMinutes: "30",
      type: "suivi",
      reason: ""
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

  function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
  }

  function getFirstDayOfMonth(year: number, month: number) {
    return new Date(year, month, 1).getDay();
  }

  function getMonthCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days: (number | null)[] = [];

    const startDay = firstDay === 0 ? 6 : firstDay - 1;
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  }

  function getAppointmentsForDay(day: number) {
    return items.filter((a) => {
      const apptDate = new Date(a.starts_at);
      return apptDate.getDate() === day &&
             apptDate.getMonth() === currentDate.getMonth() &&
             apptDate.getFullYear() === currentDate.getFullYear();
    });
  }

  function getAppointmentsForDate(date: Date) {
    return items.filter((a) => {
      const apptDate = new Date(a.starts_at);
      return apptDate.toDateString() === date.toDateString();
    });
  }

  function prevMonth() {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  }

  function nextMonth() {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  }

  function statusBadge(status: string) {
    if (status === "complete") return "bg-green-100 text-green-700";
    if (status === "annule") return "bg-gray-100 text-gray-500 line-through";
    if (status === "urgent") return "bg-red-100 text-red-700";
    return "bg-blue-100 text-blue-700";
  }

  function statusBadgeDot(status: string) {
    if (status === "complete") return "bg-green-500";
    if (status === "annule") return "bg-gray-400";
    if (status === "urgent") return "bg-red-500";
    return "bg-blue-500";
  }

  const calendarDays = getMonthCalendar();
  const selectedAppointments = selectedDate ? getAppointmentsForDate(selectedDate) : [];
  const today = new Date();
  const todayString = today.toDateString();
  const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
  const dayNames = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  return (
    <div className="flex gap-6 h-[calc(100vh-8rem)]">
      <div className="flex-1">
        <Card className="h-full">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={prevMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-lg font-semibold min-w-[180px] text-center">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <Button variant="outline" size="icon" onClick={nextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentDate(new Date())}
                >
                  Aujourd'hui
                </Button>
                <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="h-4 w-4 mr-1" />
                      Nouveau
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Nouveau rendez-vous</DialogTitle>
                    </DialogHeader>
                    <form className="space-y-4" onSubmit={saveAppointment}>
                      <div>
                        <label className="text-sm font-medium">Patient</label>
                        <select
                          value={form.patientId}
                          onChange={(e) => setForm((s) => ({ ...s, patientId: e.target.value }))}
                          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          required
                        >
                          {patients.map((p) => (
                            <option key={p.id} value={p.id}>{p.last_name} {p.first_name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium">Date</label>
                          <Input
                            type="date"
                            value={form.date}
                            onChange={(e) => setForm((s) => ({ ...s, date: e.target.value }))}
                            required
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Heure</label>
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
                          <label className="text-sm font-medium">Type</label>
                          <select
                            value={form.type}
                            onChange={(e) => setForm((s) => ({ ...s, type: e.target.value }))}
                            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            <option value="suivi">Suivi</option>
                            <option value="consultation">Consultation</option>
                            <option value="controle">Contrôle</option>
                            <option value="echographie">Échographie</option>
                            <option value="urgence">Urgence</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Durée (min)</label>
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
                        <label className="text-sm font-medium">Motif</label>
                        <Input
                          value={form.reason}
                          onChange={(e) => setForm((s) => ({ ...s, reason: e.target.value }))}
                          placeholder="Motif du rendez-vous"
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Annuler</Button>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Créer</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-7 gap-1 mb-1">
              {dayNames.map((d) => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => {
                if (day === null) {
                  return <div key={`empty-${index}`} className="aspect-square" />;
                }
                const dayAppts = getAppointmentsForDay(day);
                const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                const isToday = dateObj.toDateString() === todayString;
                const isSelected = selectedDate && dateObj.toDateString() === selectedDate.toDateString();
                const hasAppointments = dayAppts.length > 0;

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setSelectedDate(dateObj)}
                    className={cn(
                      "aspect-square rounded-lg flex flex-col items-center justify-start p-1 transition-colors relative",
                      isToday && "bg-blue-600 text-white",
                      isSelected && !isToday && "bg-blue-100 ring-2 ring-blue-500",
                      !isToday && !isSelected && "hover:bg-muted"
                    )}
                  >
                    <span className={cn("text-sm font-medium", isToday ? "text-white" : "")}>{day}</span>
                    {hasAppointments && (
                      <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                        {dayAppts.slice(0, 3).map((a, i) => (
                          <div
                            key={i}
                            className={cn("w-1.5 h-1.5 rounded-full", isToday ? "bg-white" : statusBadgeDot(a.status))}
                          />
                        ))}
                        {dayAppts.length > 3 && (
                          <span className={cn("text-[8px]", isToday ? "text-white/80" : "text-muted-foreground")}>
                            +{dayAppts.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="w-80 flex-shrink-0">
        <Card className="h-full flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              {selectedDate
                ? selectedDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })
                : `Rendez-vous - ${monthNames[currentDate.getMonth()]}`}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto p-3 pt-0">
            {selectedDate ? (
              selectedAppointments.length > 0 ? (
                <div className="space-y-2">
                  {selectedAppointments.map((a) => {
                    const apptDate = new Date(a.starts_at);
                    return (
                      <div key={a.id} className="rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className={cn("w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0", statusBadgeDot(a.status))} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{apptDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
                              <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", statusBadge(a.status))}>
                                {a.status}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 mt-1 text-sm">
                              <User className="h-3 w-3 text-muted-foreground" />
                              <span className="truncate">{a.last_name} {a.first_name}</span>
                            </div>
                            {a.type && (
                              <div className="text-xs text-muted-foreground mt-1 capitalize">{a.type}</div>
                            )}
                            {a.reason && (
                              <div className="text-xs text-muted-foreground mt-0.5 truncate">{a.reason}</div>
                            )}
                          </div>
                        </div>
                        {a.status !== "annule" && a.status !== "complete" && (
                          <button
                            type="button"
                            className="mt-2 text-xs text-red-600 hover:text-red-700 hover:underline"
                            onClick={() => cancelAppointment(a.id)}
                          >
                            Annuler
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                    <Clock className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">Aucun rendez-vous</p>
                  <p className="text-xs text-muted-foreground mt-1">ce jour</p>
                </div>
              )
            ) : (
              <div className="space-y-2">
                {items.length > 0 ? (
                  <>
                    <p className="text-xs text-muted-foreground mb-3">{items.length} rendez-vous ce mois</p>
                    {items.slice(0, 10).map((a) => {
                      const apptDate = new Date(a.starts_at);
                      return (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => setSelectedDate(apptDate)}
                          className="w-full text-left rounded-lg border border-border p-2 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", statusBadgeDot(a.status))} />
                            <span className="text-xs font-medium">
                              {apptDate.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {apptDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5 ml-3.5 truncate">
                            {a.last_name} {a.first_name}
                          </div>
                        </button>
                      );
                    })}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                      <Clock className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">Aucun rendez-vous</p>
                    <p className="text-xs text-muted-foreground mt-1">ce mois</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
