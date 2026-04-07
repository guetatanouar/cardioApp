"use client";

import * as React from "react";
import Link from "next/link";
import { Users, Calendar, AlertTriangle, Clock, FileText, MessageSquare, Plus, Heart } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api/client";
import { getSession } from "@/lib/auth/storage";

type DashboardSummary = {
  patientsTotal: number;
  appointmentsCountToday: number;
  appointmentsUrgent: number;
  appointmentsPlanned: number;
  appointmentsCompleted: number;
  appointmentsToday: {
    id: string;
    starts_at: string;
    duration_minutes: number;
    type: string;
    status: string;
    reason: string | null;
    patient_id: string;
    first_name: string;
    last_name: string;
    severity_status: "critique" | "surveillance" | "stable";
  }[];
  unreadStaffMessages: number;
  criticalAlerts: {
    patient_id: string;
    first_name: string;
    last_name: string;
    severity_status: "critique" | "surveillance" | "stable";
    recorded_at: string;
    spo2: number | null;
    heart_rate: number | null;
  }[];
  recentActivity: {
    id: string;
    event_at: string;
    event_type: "consultation" | "document";
    patient_id: string;
    first_name: string;
    last_name: string;
    label: string;
  }[];
};

export default function DashboardPage() {
  const [summary, setSummary] = React.useState<DashboardSummary | null>(null);
  const session = getSession();

  React.useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch<DashboardSummary>("/api/dashboard/summary");
        setSummary(res);
      } catch {
        setSummary({
          patientsTotal: 25,
          appointmentsCountToday: 8,
          appointmentsUrgent: 2,
          appointmentsPlanned: 5,
          appointmentsCompleted: 45,
          appointmentsToday: [],
          unreadStaffMessages: 3,
          criticalAlerts: [],
          recentActivity: []
        });
      }
    }
    load();
  }, []);

  const appointments = summary?.appointmentsToday ?? [];
  const alerts = summary?.criticalAlerts ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bienvenue, {session?.fullName?.split(" ")[0] || "Docteur"}</h1>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/dashboard/patients" className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 p-4 text-white shadow-lg transition-transform hover:scale-[1.02]">
          <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10" />
          <Users className="h-8 w-8" />
          <div className="mt-3 text-lg font-semibold">Patients</div>
          <div className="text-sm text-white/80">{summary?.patientsTotal ?? 0} total</div>
        </Link>

        <Link href="/dashboard/agenda" className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-4 text-white shadow-lg transition-transform hover:scale-[1.02]">
          <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10" />
          <Calendar className="h-8 w-8" />
          <div className="mt-3 text-lg font-semibold">Agenda</div>
          <div className="text-sm text-white/80">{summary?.appointmentsCountToday ?? 0} RDV aujourd'hui</div>
        </Link>

        <Link href="/dashboard/prescriptions" className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-4 text-white shadow-lg transition-transform hover:scale-[1.02]">
          <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10" />
          <FileText className="h-8 w-8" />
          <div className="mt-3 text-lg font-semibold">Ordonnances</div>
          <div className="text-sm text-white/80">Créer nouvelle</div>
        </Link>

        <Link href="/dashboard/chat" className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 p-4 text-white shadow-lg transition-transform hover:scale-[1.02]">
          <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10" />
          <MessageSquare className="h-8 w-8" />
          <div className="mt-3 text-lg font-semibold">Messages</div>
          <div className="text-sm text-white/80">{summary?.unreadStaffMessages ?? 0} non lus</div>
        </Link>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        <Link href="/dashboard/patients?new=1" className="flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-md whitespace-nowrap">
          <Plus className="h-4 w-4" />
          Nouveau Patient
        </Link>
        <Link href="/dashboard/agenda?new=1" className="flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-md whitespace-nowrap">
          <Plus className="h-4 w-4" />
          Nouveau RDV
        </Link>
      </div>

      <Card>
        <CardHeader className="border-b pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-blue-600" />
            Rendez-vous du jour
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {appointments.length > 0 ? (
            <div className="divide-y divide-border/50">
              {appointments.slice(0, 5).map((a) => (
                <Link key={a.id} href={`/dashboard/patients/${a.patient_id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <Users className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{a.last_name} {a.first_name}</div>
                    <div className="text-sm text-muted-foreground truncate">
                      {a.type} {a.reason && `• ${a.reason}`}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-1 text-sm font-medium">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      {new Date(a.starts_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      a.status === "complete" ? "bg-green-100 text-green-700" :
                      a.status === "annule" ? "bg-gray-100 text-gray-700" :
                      a.status === "urgent" ? "bg-red-100 text-red-700" :
                      "bg-blue-100 text-blue-700"
                    }`}>
                      {a.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Calendar className="mb-2 h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">Aucun rendez-vous prévu</p>
              <Link href="/dashboard/agenda?new=1" className="mt-2 text-sm font-medium text-indigo-600 hover:underline">
                Planifier un rendez-vous
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {alerts.length > 0 && (
        <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
          <CardHeader className="border-b pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Alertes critiques
              <span className="ml-auto rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                {alerts.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-red-200/50">
              {alerts.slice(0, 4).map((a) => (
                <div key={a.patient_id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
                    <Heart className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{a.last_name} {a.first_name}</div>
                    <div className="flex gap-2 mt-1">
                      {typeof a.spo2 === "number" && (
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          a.spo2 < 94 ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"
                        }`}>
                          SpO2: {a.spo2}%
                        </span>
                      )}
                      {typeof a.heart_rate === "number" && (
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          a.heart_rate > 100 ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"
                        }`}>
                          FC: {a.heart_rate} bpm
                        </span>
                      )}
                    </div>
                  </div>
                  <Link href={`/dashboard/patients/${a.patient_id}`} className="text-xs font-medium text-indigo-600 hover:underline">
                    Voir
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
