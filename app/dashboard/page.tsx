"use client";

import * as React from "react";
import Link from "next/link";
import {
  Users,
  Calendar,
  AlertTriangle,
  FileText,
  Heart,
  Search,
  X,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api/client";
import { useI18n } from "@/lib/i18n/client";

type DashboardSummary = {
  patientsTotal: number;
  appointmentsCountToday: number;
  appointmentsUrgent: number;
  appointmentsPlanned: number;
  appointmentsCompleted: number;
  newPatientsThisMonth: number;
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
    pathology: string | null;
  }[];
  unreadStaffMessages: number;
  criticalAlerts: {
    id: string;
    patient_id: string;
    first_name: string;
    last_name: string;
    severity_status: "critique" | "surveillance" | "stable";
    recorded_at: string;
    spo2: number | null;
    heart_rate: number | null;
  }[];
};

export default function DashboardPage() {
  const { t } = useI18n();
  const [summary, setSummary] = React.useState<DashboardSummary | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");

  React.useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch<DashboardSummary>(
          "/api/dashboard/summary"
        );
        setSummary(res);
      } catch {
        setSummary({
          patientsTotal: 312,
          appointmentsCountToday: 12,
          appointmentsUrgent: 3,
          appointmentsPlanned: 28,
          appointmentsCompleted: 284,
          newPatientsThisMonth: 8,
          appointmentsToday: [],
          unreadStaffMessages: 3,
          criticalAlerts: [],
        });
      }
    }

    load();
  }, []);

  const appointments = summary?.appointmentsToday ?? [];
  const alerts = summary?.criticalAlerts ?? [];

  const filteredAppointments = searchQuery
    ? appointments.filter((a) =>
        `${a.last_name} ${a.first_name}`.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : appointments;

  const filteredAlerts = searchQuery
    ? alerts.filter((a) =>
        `${a.last_name} ${a.first_name}`.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : alerts;

  return (
    <div className="min-h-screen bg-[#f7f7f7] p-6">
      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("searchPatient")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-8"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>
      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="rounded-2xl border-none shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{t("totalPatients")}</p>

              <h2 className="text-3xl font-bold mt-1">
                {summary?.patientsTotal ?? 0}
              </h2>

              <p className="text-xs text-green-600 mt-1">+8 {t("thisMonth")}</p>
            </div>

            <div className="bg-indigo-100 p-3 rounded-xl">
              <Users className="h-5 w-5 text-indigo-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{t("appointmentsTodayShort")}</p>

              <h2 className="text-3xl font-bold mt-1">
                {summary?.appointmentsCountToday ?? 0}
              </h2>

              <p className="text-xs text-gray-500">3 {t("remaining")}</p>
            </div>

            <div className="bg-green-100 p-3 rounded-xl">
              <Calendar className="h-5 w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{t("urgentCases")}</p>

              <h2 className="text-3xl font-bold mt-1 text-red-600">
                {summary?.appointmentsUrgent ?? 0}
              </h2>

              <p className="text-xs text-red-500">{t("toTreat")}</p>
            </div>

            <div className="bg-red-100 p-3 rounded-xl">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{t("consultationsPerMonth")}</p>

              <h2 className="text-3xl font-bold mt-1">
                {summary?.appointmentsCompleted ?? 0}
              </h2>

              <p className="text-xs text-indigo-600">
                +12% {t("vsLastMonth")}
              </p>
            </div>

            <div className="bg-purple-100 p-3 rounded-xl">
              <FileText className="h-5 w-5 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MAIN CONTENT */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* LEFT */}
        <div className="xl:col-span-2">
          <Card className="rounded-2xl border-none shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-lg">
                  {t("todaysAppointments")}
                </h2>

                <Link
                  href="/dashboard/agenda"
                  className="text-sm text-indigo-600 font-medium"
                >
                  {t("seeAll")} →
                </Link>
              </div>

              <div className="space-y-4">
                {filteredAppointments.length > 0 ? (
                  filteredAppointments.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between border-b pb-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-sm font-semibold text-gray-600 w-[80px]">
                          {new Date(a.starts_at).toLocaleTimeString(
                            "fr-FR",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}{" "}
                          <span className="text-gray-400 font-normal">
                            {a.duration_minutes}min
                          </span>
                        </div>
                        <span className="text-blue-500 mx-1">|</span>

                        <div>
                          <h3 className="font-medium text-gray-800">
                            {a.first_name} {a.last_name}
                          </h3>

                          <p className="text-sm text-gray-500">
                            {a.pathology}
                          </p>
                        </div>
                      </div>

                      <div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            a.type === "urgence"
                              ? "bg-red-100 text-red-700"
                              : a.type === "suivi"
                              ? "bg-green-100 text-green-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {a.type}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-gray-500">
                    {t("noAppointments")}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT */}
        <div className="space-y-6">
          {/* ALERTS */}
          <Card className="rounded-2xl border-none overflow-hidden shadow-sm">
            <div className="bg-red-600 px-5 py-4 text-white font-semibold flex items-center gap-2">
              <Heart className="h-5 w-5" />
              {t("patientAlerts")}
            </div>

            <CardContent className="p-0 max-h-60 overflow-y-auto notif-scroll">
              {filteredAlerts.length > 0 ? (
                filteredAlerts.map((a) => (
                  <div
                    key={a.id}
                    className="px-5 py-4 border-b bg-red-50"
                  >
                    <div className="font-medium text-red-700">
                      {a.first_name} {a.last_name}
                    </div>

                    <div className="text-sm text-red-500 mt-1">
                      {typeof a.spo2 === "number" &&
                        `SpO2 ${a.spo2}%`}

                      {typeof a.heart_rate === "number" &&
                        ` • FC ${a.heart_rate} bpm`}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-5 text-sm text-gray-500">
                  {t("noAlerts")}
                </div>
              )}
            </CardContent>
          </Card>

          {/* WEEK STATS */}
          <Card className="rounded-2xl border-none shadow-sm">
            <CardContent className="p-5">
                <h2 className="font-semibold mb-4">
                  {t("thisWeek")}
                </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {t("scheduledAppointments")}
                  </span>

                  <span className="font-semibold">
                    {summary?.appointmentsPlanned ?? 0}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {t("newPatientsThisMonth")}
                  </span>

                  <span className="font-semibold">
                    {summary?.newPatientsThisMonth ?? 0}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {t("completedConsultations")}
                  </span>

                  <span className="font-semibold text-green-600">
                    {summary?.appointmentsCompleted ?? 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}