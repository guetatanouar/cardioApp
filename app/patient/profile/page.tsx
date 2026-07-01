"use client";

import * as React from "react";
import {
  Phone,
  Mail,
  AlertCircle,
  History,
  Save,
} from "lucide-react";

import { apiFetch } from "@/lib/api/client";
import { getSession } from "@/lib/auth/storage";
import { getCountryByCode } from "@/lib/countries";
import { useI18n } from "@/lib/i18n/client";
import { PatientHeader } from "@/components/patient/patient-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function PatientProfile() {
  const { t } = useI18n();
  const session = typeof window !== "undefined" ? getSession() : null;
  const patientId = session?.userId;

  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [editPhone, setEditPhone] = React.useState("");
  const [editEmail, setEditEmail] = React.useState("");
  const [editAddress, setEditAddress] = React.useState("");
  const [editEmergency, setEditEmergency] = React.useState("");
  const [editAllergies, setEditAllergies] = React.useState("");
  const [editMedicalHistory, setEditMedicalHistory] = React.useState("");

  React.useEffect(() => {
    if (!patientId) return;
    apiFetch<any>(`/api/patients/${patientId}`)
      .then((res) => {
        setData(res);
        const p = res.patient;
        setEditPhone(p?.phone || "");
        setEditEmail(p?.email || "");
        setEditAddress(p?.address || "");
        setEditEmergency(p?.emergency_contact || "");
        setEditAllergies(Array.isArray(p?.allergies) ? p.allergies.join(", ") : "");
        setEditMedicalHistory(Array.isArray(p?.medical_history) ? p.medical_history.join(", ") : "");
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [patientId]);

  async function handleSave() {
    if (!patientId) return;
    setSaving(true);
    try {
      await apiFetch(`/api/patients/${patientId}/self`, {
        method: "PUT",
        body: JSON.stringify({
          phone: editPhone,
          email: editEmail,
          address: editAddress,
          emergency_contact: editEmergency,
          allergies: editAllergies.split(",").map((s: string) => s.trim()).filter(Boolean),
          medical_history: editMedicalHistory.split(",").map((s: string) => s.trim()).filter(Boolean),
        }),
      });
      const res = await apiFetch<any>(`/api/patients/${patientId}`);
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <p className="text-gray-500">{t("loading" as any)}</p>
      </div>
    );
  }

  if (!data?.patient) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <p className="text-gray-500">{t("loadProfileError" as any)}</p>
      </div>
    );
  }

  const p = data.patient;
  const consultations = data.consultations || [];
  const birthDate = p.date_of_birth
    ? new Date(p.date_of_birth).toLocaleDateString("fr-FR")
    : "14/03/1965";
  const countryInfo = p.country ? getCountryByCode(p.country) : null;
  const country = countryInfo ? `${countryInfo.name} (${countryInfo.code})` : (p.country || "France");
  const mappedConsultations = consultations.length > 0
    ? consultations
    : [
        { title: "Contrôle tension artérielle mensuel", date: "30/03/2025", doctor: "Dr. Étienne Tremblay" },
        { title: "Résultats bilan biologique", date: "28/02/2025", doctor: "Dr. Étienne Tremblay" },
      ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-sm border">
        <PatientHeader />

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                <Phone size={16} /> {t("phone" as any)}
              </div>
              <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                <Mail size={16} /> {t("email" as any)}
              </div>
              <Input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-gray-500 text-sm mb-2">{t("birthDate" as any)}</p>
              <p className="mt-2 font-medium">{birthDate}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-gray-500 text-sm mb-2">{t("emergencyContact" as any)}</p>
              <Input value={editEmergency} onChange={(e) => setEditEmergency(e.target.value)} />
            </div>
            <div className="bg-gray-50 rounded-xl p-4 md:col-span-2">
              <p className="text-gray-500 text-sm mb-2">{t("address" as any)}</p>
              <Input value={editAddress} onChange={(e) => setEditAddress(e.target.value)} />
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-gray-500 text-sm mb-2">{t("country" as any)}</p>
              <p className="mt-2 font-medium">{country}</p>
            </div>
          </div>

          <div>
            <h3 className="flex items-center gap-2 font-semibold text-red-600 mb-3">
              <AlertCircle size={18} /> {t("allergies" as any)}
            </h3>
            <Input value={editAllergies} onChange={(e) => setEditAllergies(e.target.value)} placeholder={t("separateWithCommas" as any)} />
          </div>

          <div>
            <h3 className="font-semibold mb-3">{t("medicalHistory" as any)}</h3>
            <Input value={editMedicalHistory} onChange={(e) => setEditMedicalHistory(e.target.value)} placeholder={t("separateWithCommas" as any)} />
          </div>

          <Button onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700">
            <Save className="h-4 w-4 mr-2" />
            {saving ? t("saving" as any) : t("save" as any)}
          </Button>

          <div>
            <h3 className="flex items-center gap-2 font-semibold mb-3">
              <History size={18} /> {t("history" as any)}
            </h3>
            <div className="space-y-3">
              {mappedConsultations.map((consultation: any, index: number) => (
                <div
                  key={index}
                  className="border rounded-xl p-4 hover:bg-gray-50 transition"
                >
                  <h4 className="font-medium">
                    {consultation.title || consultation.motif}
                  </h4>
                  {consultation.ecole ? <p className="text-xs text-gray-400 mt-0.5">Ecole: {consultation.ecole}</p> : null}
                  <p className="text-sm text-gray-500 mt-1">
                    {consultation.date ? new Date(consultation.date).toLocaleDateString("fr-FR") : consultation.date} · {consultation.doctor || consultation.author || "Dr. Étienne Tremblay"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
