"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api/client";
import { useI18n } from "@/lib/i18n/client";
import { formatNumber } from "libphonenumber-js";

type Profile = {
  fullName: string;
  email: string;
  role: string;
  phone?: string;
  address?: string;
  rpps?: string;
  specialty?: string;
  first_name?: string;
  last_name?: string;
};

export default function ProfilPage() {
  const { t } = useI18n();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<Profile>("/api/settings/profile")
      .then(setProfile)
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto text-center text-gray-500 py-12">
        {t("loadProfileError")}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">{t("doctorProfile")}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t("personalInfo")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">{t("firstName")}</label>
              <p className="text-base font-medium">{profile.first_name || "—"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">{t("lastName")}</label>
              <p className="text-base font-medium">{profile.last_name || "—"}</p>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">{t("email")}</label>
            <p className="text-base font-medium">{profile.email || "—"}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">{t("cabinetPhone")}</label>
            <p className="text-base font-medium">{profile.phone ? formatNumber(profile.phone, "INTERNATIONAL") : "—"}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">{t("cabinetAddress")}</label>
            <p className="text-base font-medium">{profile.address || "—"}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">RPPS</label>
              <p className="text-base font-medium">{profile.rpps || "—"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">{t("specialty")}</label>
              <p className="text-base font-medium">{profile.specialty || "—"}</p>
            </div>
          </div>
          <div>
              <label className="text-sm font-medium text-muted-foreground">{t("role")}</label>
            <p className="text-base font-medium">
              {profile.role === "admin" ? t("administrator") : profile.role === "secretaire" ? t("secretary") : profile.role || "—"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
