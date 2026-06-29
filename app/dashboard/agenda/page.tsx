"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus, Clock, Search } from "lucide-react";

import { apiFetch } from "@/lib/api/client";
import { dispatchNotification } from "@/lib/notifications";
import { usePagePermission } from "@/lib/auth/usePermissions";
import { useI18n } from "@/lib/i18n/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/cn";

type Appointment = {
  id: string;
  patient_id: string;
  date: string;
  time: string;
  duration: number;
  type: string;
  status: string;
  reason: string | null;
  first_name: string;
  last_name: string;
};

function parseAppointmentDateTime(a: any) {
  const fullDate = a.date || a.starts_at;
  if (!fullDate) {
    return { dateStr: "", timeStr: "00:00", apptDate: new Date(0) };
  }
  const dateStr = fullDate.includes("T") ? fullDate.split("T")[0] : fullDate;

  let timeStr = a.time;
  if (!timeStr && a.starts_at && a.starts_at.includes("T")) {
    timeStr = a.starts_at.split("T")[1].slice(0, 5);
  }
  if (!timeStr) {
    timeStr = "00:00";
  }

  const apptDate = new Date(`${dateStr}T${timeStr}`);
  return { dateStr, timeStr, apptDate };
}

export default function AgendaPage() {
  const hasAccess = usePagePermission("can_view_appointments");
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const [items, setItems] = React.useState<Appointment[]>([]);
  const [patients, setPatients] = React.useState<Array<{ id: string; first_name: string; last_name: string }>>([]);

  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = React.useState(searchParams.get("q") ?? "");

  const [modalOpen, setModalOpen] = React.useState(false);
  const [detailModalOpen, setDetailModalOpen] = React.useState(false);
  const [detailAppointment, setDetailAppointment] = React.useState<Appointment | null>(null);
  const [form, setForm] = React.useState({
    patientId: "",
    date: "",
    time: "09:00",
    durationMinutes: "30",
    type: "suivi",
    reason: ""
  });

  async function loadAppointments() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const start = new Date(year, month, 1).toISOString();
    const end = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
    const res = await apiFetch<any[] | { items: any[] }>(`/api/appointments?from=${start}&to=${end}`);
    const appts = Array.isArray(res) ? res : (res as any).items ?? [];
    setItems(appts);
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

    if (!form.patientId || !form.date || !form.time) {
      dispatchNotification({
        id: "error-fields",
        title: "Champs obligatoires",
        detail: "Veuillez remplir tous les champs",
        type: "error"
      });

      return;
    }

    try {
      const payload = {
        patientId: form.patientId,
        startsAt: `${form.date}T${form.time}`,
        date: form.date,
        time: form.time,
        durationMinutes: Number(form.durationMinutes),
        type: form.type,
        status: "scheduled",
        reason: form.reason || null
      };

      console.log("Payload envoyé :", payload);

      await apiFetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const patient = patients.find(
        (p) => p.id === form.patientId
      );

      dispatchNotification({
        id: `appt-${Date.now()}`,
        title: "Rendez-vous créé",
        detail: `${patient?.last_name || ""} ${patient?.first_name || ""}`,
        type: "success"
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

    } catch (error: any) {
      console.error("Erreur création RDV :", error);

      dispatchNotification({
        id: "create-error",
        title: `Erreur (${error?.message?.includes("HTTP_") ? error.message.replace("HTTP_", "") : "?"})`,
        detail: error?.message || "Impossible de créer le rendez-vous",
        type: "error"
      });
    }
  }
  async function cancelAppointment(id: string) {
    try {
      await apiFetch(`/api/appointments/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: "cancelled" })
      });
      await loadAppointments();
    } catch (error: any) {
      dispatchNotification({
        id: "cancel-error",
        title: "Erreur",
        detail: error?.message || "Impossible d'annuler le rendez-vous",
        type: "error"
      });
    }
  }

  async function completeAppointment(id: string) {
    try {
      await apiFetch(`/api/appointments/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: "complete" })
      });
      await loadAppointments();
    } catch (error: any) {
      dispatchNotification({
        id: "complete-error",
        title: "Erreur",
        detail: error?.message || "Impossible de terminer le rendez-vous",
        type: "error"
      });
    }
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
    return filteredItems.filter((a) => {
      const { dateStr, apptDate } = parseAppointmentDateTime(a);
      if (!dateStr) return false;

      return (
        apptDate.getDate() === day &&
        apptDate.getMonth() === currentDate.getMonth() &&
        apptDate.getFullYear() === currentDate.getFullYear()
      );
    });
  }

  function getAppointmentsForDate(date: Date) {
    return filteredItems.filter((a) => {
      const { dateStr, apptDate } = parseAppointmentDateTime(a);
      if (!dateStr) return false;

      return (
        apptDate.getDate() === date.getDate() &&
        apptDate.getMonth() === date.getMonth() &&
        apptDate.getFullYear() === date.getFullYear()
      );
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
    if (status === "cancelled") return "bg-gray-100 text-gray-500 line-through";
    if (status === "urgent") return "bg-red-100 text-red-700";
    return "bg-blue-100 text-blue-700";
  }

  function statusLabel(status: string) {
    if (status === "complete") return "Terminé";
    if (status === "cancelled") return "Annulé";
    if (status === "scheduled") return "Prévu";
    return status;
  }

  function typeColorDot(type: string) {
    if (type === "consultation") return "bg-blue-500";
    if (type === "suivi") return "bg-green-500";
    
    return "bg-blue-500";
  }

  const calendarDays = getMonthCalendar();
  const filteredItems = React.useMemo(
    () => searchQuery
      ? items.filter((a) =>
          `${a.last_name} ${a.first_name}`.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : items,
    [items, searchQuery]
  );
  const selectedAppointments = selectedDate ? getAppointmentsForDate(selectedDate) : [];
  const today = new Date();
  const todayString = today.toDateString();
  const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
  const dayNames = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  if (!hasAccess) return null;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2 px-1">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un patient..."
            className="pl-8 h-9 text-sm"
          />
        </div>
        {searchQuery && (
          <span className="text-xs text-muted-foreground">{filteredItems.length} résultat(s)</span>
        )}
      </div>
      <div className="flex gap-5 h-[calc(100vh-6rem)] justify-center -mt-5">
        <div className="flex-1 max-w-4xl h-[550px]">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between px-2">
                <Button variant="ghost" size="icon" onClick={prevMonth} className="hover:bg-blue-50">
                  <ChevronLeft className="h-5 w-5 text-blue-600" />
                </Button>
                <h2 className="text-xl font-bold text-gray-800 tracking-tight">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <Button variant="ghost" size="icon" onClick={nextMonth} className="hover:bg-blue-50">
                  <ChevronRight className="h-5 w-5 text-blue-600" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-7 gap-1 mb-1 border border-gray-200 rounded-md relative -mt-5">            {dayNames.map((d) => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">
                  {d}
                </div>
              ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => {
                  if (day === null) {
                    return <div key={`empty-${index}`} className="h-10" />;
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
                        "h-16 rounded-xl flex flex-col items-center justify-center p-1 transition-all relative group",
                        isToday && "bg-blue-600 text-white shadow-lg shadow-blue-200 scale-105 z-10",
                        isSelected && !isToday && "bg-blue-50 ring-2 ring-blue-500",
                        !isToday && !isSelected && "hover:bg-slate-50"
                      )}
                    >
                      <span className={cn("text-sm font-semibold", isToday ? "text-white" : "text-gray-700")}>{day}</span>
                      {hasAppointments && (
                        <div className="flex gap-1 mt-1 justify-center">
                          {dayAppts.slice(0, 4).map((a, i) => (
                            <div
                              key={i}
                              className={cn(
                                "w-1.5 h-1.5 rounded-full ring-1 ring-white/20",
                                isToday ? "bg-white" : typeColorDot(a.type)
                              )}
                            />
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-end gap-4 text-[10px] px-2 py-2 opacity-80">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  <span>Consultation</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  <span>Suivi</span>
                </div>
            
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="w-80 flex-shrink-0">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  {selectedDate
                    ? selectedDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })
                    : `Rendez-vous - ${monthNames[currentDate.getMonth()]}`}
                </CardTitle>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs" onClick={() => setModalOpen(true)}>
                  <Plus className="h-3 w-3 mr-1" />
                  {t("newAppointment")}
                </Button>
              </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-auto p-3 pt-0">
              {selectedDate ? (
                selectedAppointments.length > 0 ? (
                  <div className="space-y-4 max-h-[calc(100vh-20rem)] overflow-y-auto pr-2 custom-scrollbar">
                    {selectedAppointments.map((a) => {
                      const borderColor =
                        a.type === "consultation"
                          ? "border-l-blue-500"
                          : a.type === "suivi"
                        

                      return (
                        <div
                          key={a.id}
                          className={cn(
                            "rounded-2xl border border-slate-100 border-l-4 bg-white p-4 shadow-sm hover:shadow-md transition-all duration-200",
                            borderColor
                          )}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={cn("w-2.5 h-2.5 rounded-full", typeColorDot(a.type))} />
                                <span className="text-sm font-bold text-slate-800 truncate">
                                  {a.last_name} {a.first_name}
                                </span>
                              </div>
                              <div className="text-xs text-slate-500 mt-1 font-medium capitalize">
                                {a.type}
                              </div>
                              {a.reason && (
                                <div className="text-xs text-slate-400 mt-1 line-clamp-1 italic">
                                  {a.reason}
                                </div>
                              )}
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="text-base font-black text-blue-600">
                                {parseAppointmentDateTime(a).timeStr}
                              </div>
                              <div className={cn("mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", statusBadge(a.status))}>
                                {statusLabel(a.status)}
                              </div>
                            </div>
                          </div>
                          {a.status !== "cancelled" && a.status !== "complete" && (
                            <div className="mt-3 pt-3 border-t border-slate-50 flex justify-end gap-3">
                              <button
                                type="button"
                                className="text-[10px] font-bold text-green-600 hover:text-green-800 uppercase tracking-widest hover:underline"
                                onClick={() => completeAppointment(a.id)}
                              >
                                {t("complete")}
                              </button>
                              <button
                                type="button"
                                className="text-[10px] font-bold text-red-500 hover:text-red-700 uppercase tracking-widest hover:underline"
                                onClick={() => cancelAppointment(a.id)}
                              >
                                {t("cancel")}
                              </button>
                            </div>
                          )}
                          {a.status === "complete" && (
                            <div className="mt-3 pt-3 border-t border-slate-50 flex justify-end">
                              <button
                                type="button"
                                className="text-[10px] font-bold text-blue-600 hover:text-blue-800 uppercase tracking-widest hover:underline"
                                onClick={() => {
                                  setDetailAppointment(a);
                                  setDetailModalOpen(true);
                                }}
                              >
                                {t("details")}
                              </button>
                            </div>
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
                    <p className="text-sm text-muted-foreground">{t("noAppointments")}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t("today")}</p>
                  </div>
                )
              ) : (
                <div className="space-y-2">
                  {filteredItems.length > 0 ? (
                    <>
                      <p className="text-xs text-muted-foreground mb-3">{filteredItems.length} rendez-vous ce mois</p>
                      {filteredItems.slice(0, 10).map((a) => {
                        const { apptDate } = parseAppointmentDateTime(a);
                        return (

                          <button
                            key={a.id}
                            type="button"
                            onClick={() => setSelectedDate(apptDate)}
                            className="w-full text-left rounded-lg border border-border p-2 hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", typeColorDot(a.type))} />
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
                      <p className="text-sm text-muted-foreground">{t("noAppointments")}</p>
                      <p className="text-xs text-muted-foreground mt-1">ce mois</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6 w-full max-w-4xl -mt-16 ml-1">
        <div className="rounded-xl border bg-white p-3 shadow-sm flex items-center gap-4">
          <div className="text-2xl font-bold text-blue-600">
            {filteredItems.length}
          </div>
          <p className="text-xs font-medium text-muted-foreground">
            Total RDV
          </p>
        </div>

        <div className="rounded-xl border bg-white p-3 shadow-sm flex items-center gap-4">
          <div className="text-2xl font-bold text-green-600">
            {filteredItems.filter(a => a.status === "complete").length}
          </div>
          <p className="text-xs font-medium text-muted-foreground">
            Terminés
          </p>
        </div>

    

        <div className="rounded-xl border bg-white p-3 shadow-sm flex items-center gap-4">
          <div className="text-2xl font-bold text-orange-500">
            {filteredItems.filter(a => a.status === "scheduled").length}
          </div>
          <p className="text-xs font-medium text-muted-foreground">
            Planifiés
          </p>
        </div>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("newAppointment")}</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={saveAppointment}>
            <div>
              <label className="text-sm font-medium">{t("patient")}</label>
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
                <label className="text-sm font-medium">{t("date")}</label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((s) => ({ ...s, date: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">{t("time")}</label>
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
                <label className="text-sm font-medium">{t("type")}</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((s) => ({ ...s, type: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="suivi">Suivi</option>
                  <option value="consultation">Consultation</option>
              
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">{t("duration")} (min)</label>
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
              <label className="text-sm font-medium">{t("motif")}</label>
              <Input
                value={form.reason}
                onChange={(e) => setForm((s) => ({ ...s, reason: e.target.value }))}
                placeholder="Motif du rendez-vous"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>{t("cancel")}</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">{t("save")}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("appointmentDetails")}</DialogTitle>
          </DialogHeader>
          {detailAppointment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">{t("patient")}</label>
                  <p className="text-sm font-semibold">{detailAppointment.last_name} {detailAppointment.first_name}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">{t("status")}</label>
                  <p className="text-sm">
                    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", statusBadge(detailAppointment.status))}>
                      {statusLabel(detailAppointment.status)}
                    </span>
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">{t("date")}</label>
                  <p className="text-sm">{detailAppointment.date}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">{t("time")}</label>
                  <p className="text-sm font-semibold text-blue-600">{parseAppointmentDateTime(detailAppointment).timeStr}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">{t("type")}</label>
                  <p className="text-sm capitalize">{detailAppointment.type}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">{t("duration")} (min)</label>
                  <p className="text-sm">{detailAppointment.duration}</p>
                </div>
              </div>
              {detailAppointment.reason && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground">{t("motif")}</label>
                  <p className="text-sm">{detailAppointment.reason}</p>
                </div>
              )}
              <div className="flex justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => setDetailModalOpen(false)}>{t("close")}</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
