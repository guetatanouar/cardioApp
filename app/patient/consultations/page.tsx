"use client";

import * as React from "react";

import { apiFetch } from "@/lib/api/client";
import { getSession } from "@/lib/auth/storage";
import { useI18n } from "@/lib/i18n/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PatientHeader } from "@/components/patient/patient-header";

export default function PatientConsultationsPage() {
  const { t } = useI18n();
  const session = typeof window !== "undefined" ? getSession() : null;
  const patientId = session?.userId;

  const [items, setItems] = React.useState<any[]>([]);

  React.useEffect(() => {
    async function load() {
      if (!patientId) return;
      const res = await apiFetch<{ items: any[] }>(`/api/patients/${patientId}/consultations`);
      setItems(res.items);
    }
    load();
  }, [patientId]);

  return (
    <div className="min-h-full bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-sm border">
        <PatientHeader />
        <div className="p-4 md:p-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("consultations" as any)}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {items.map((c) => (
                  <div key={c.id} className="rounded-md border border-border p-3">
                    <div className="text-sm text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</div>
                    <div className="font-medium">{c.reason ?? "—"}</div>
                    {c.ecole ? <div className="text-xs text-muted-foreground mt-0.5">Ecole: {c.ecole}</div> : null}
                    <div className="text-sm text-muted-foreground">{c.diagnosis ?? ""}</div>
                  </div>
                ))}
                {items.length === 0 ? <div className="text-sm text-muted-foreground">{t("noData" as any)}</div> : null}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
