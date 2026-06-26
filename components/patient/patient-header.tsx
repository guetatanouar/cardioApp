"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { Activity, MessageCircle } from "lucide-react";
import { apiFetch } from "@/lib/api/client";
import { getSession } from "@/lib/auth/storage";
import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/cn";

const tabs = [
  { href: "/patient/profile", key: "myFile" },
  { href: "/patient/documents", key: "documents" },
  { href: "/patient", key: "myVitals", icon: Activity },
  { href: "/patient/chat", key: "doctorChat", icon: MessageCircle },
];

export function PatientHeader() {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const session = typeof window !== "undefined" ? getSession() : null;
  const patientId = session?.userId;
  const [data, setData] = React.useState<any>(null);

  React.useEffect(() => {
    if (!patientId) return;
    apiFetch<any>(`/api/patients/${patientId}`).then(setData).catch(() => {});
  }, [patientId]);

  const p = data?.patient;
  const consultations = data?.consultations || [];
  const fullName = p ? `${p.first_name || ""} ${p.last_name || ""}`.trim() : "";
  const initials = p ? `${(p.first_name || "")[0] || ""}${(p.last_name || "")[0] || ""}`.toUpperCase() || "P" : "P";
  const age = p?.date_of_birth
    ? Math.floor((Date.now() - new Date(p.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;
  const gender = p?.gender === "M" ? "Homme" : p?.gender === "F" ? "Femme" : p?.gender || "-";
  const bloodGroup = p?.blood_type || "A+";
  const phone = p?.phone || "+1-514-555-0101";
  const email = p?.email || "gerard.bouchard@email.ca";
  const allergies: string[] = Array.isArray(p?.allergies) && p.allergies.length > 0 ? p.allergies : ["Pénicilline", "Aspirine"];
  const mappedConsultations = consultations.length > 0 ? consultations : [];

  return (
    <>
      <div className="p-6 border-b">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-green-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
              {initials}
            </div>
            <div>
              <h1 className="text-xl font-semibold">{fullName}</h1>
              <p className="text-sm text-gray-500">
                {age !== null ? `${age} ans` : ""} • {gender} • {bloodGroup}
              </p>
              <p className="text-sm text-gray-400">{phone} · {email}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="px-3 py-1 rounded-full bg-red-50 text-red-600 text-sm font-medium">
              {allergies.length} {t("allergiesCount" as any)}
            </span>
            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm font-medium">
              {mappedConsultations.length} {t("consultationsCount" as any)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex border-b">
        {tabs.map((tab) => {
          const active = pathname === tab.href;
          const Icon = tab.icon;
          return (
            <button
              key={tab.href}
              onClick={() => router.push(tab.href)}
              className={cn(
                "px-6 py-4 flex items-center gap-2 text-sm",
                active
                  ? "border-b-2 border-green-600 text-green-700 font-medium"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              {Icon && <Icon size={18} />}
              {t(tab.key as any)}
            </button>
          );
        })}
      </div>
    </>
  );
}
