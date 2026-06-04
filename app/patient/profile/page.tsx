"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Activity,
  MessageCircle,
  Phone,
  Mail,
  AlertCircle,
  History,
} from "lucide-react";

import { apiFetch } from "@/lib/api/client";
import { getSession } from "@/lib/auth/storage";

export default function PatientProfile() {
  const router = useRouter();
  const session = typeof window !== "undefined" ? getSession() : null;
  const patientId = session?.userId;

  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!patientId) return;
    apiFetch<any>(`/api/patients/${patientId}`)
      .then((res) => setData(res))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [patientId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <p className="text-gray-500">Chargement...</p>
      </div>
    );
  }

  if (!data?.patient) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <p className="text-gray-500">Impossible de charger le profil.</p>
      </div>
    );
  }

  const p = data.patient;
  const consultations = data.consultations || [];
  const fullName = `${p.first_name || ""} ${p.last_name || ""}`.trim();
  const initials = `${(p.first_name || "")[0] || ""}${(p.last_name || "")[0] || ""}`.toUpperCase() || "P";
  const age = p.date_of_birth
    ? Math.floor((Date.now() - new Date(p.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;
  const gender = p.gender === "M" ? "Homme" : p.gender === "F" ? "Femme" : p.gender || "-";
  const bloodGroup = p.blood_type || "A+";
  const phone = p.phone || "0661234567";
  const email = p.email || "jean.dupont@email.com";
  const birthDate = p.date_of_birth
    ? new Date(p.date_of_birth).toLocaleDateString("fr-FR")
    : "14/03/1965";
  const address = p.address || "12 Rue des Lilas, Lyon";
  const country = p.country || "France";
  const emergencyContact = p.emergency_contact || "Marie Dupont - 0661234568";
  const allergies: string[] = Array.isArray(p.allergies) && p.allergies.length > 0
    ? p.allergies
    : ["Pénicilline", "Aspirine"];
  const medicalHistory: string[] = Array.isArray(p.medical_history) && p.medical_history.length > 0
    ? p.medical_history
    : ["Hypertension artérielle", "Diabète type 2"];
  const mappedConsultations = consultations.length > 0
    ? consultations
    : [
        { title: "Contrôle tension artérielle mensuel", date: "30/03/2025", doctor: "Dr. Pierre Moreau" },
        { title: "Résultats bilan biologique", date: "28/02/2025", doctor: "Dr. Pierre Moreau" },
      ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-sm border">

        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-green-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                {initials}
              </div>

              <div>
                <h1 className="text-xl font-semibold">
                  {fullName}
                </h1>

                <p className="text-sm text-gray-500">
                  {age !== null ? `${age} ans` : "61 ans"} • {gender} • {bloodGroup}
                </p>

                <p className="text-sm text-gray-400">
                  {phone} · {email}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="px-3 py-1 rounded-full bg-red-50 text-red-600 text-sm font-medium">
                {allergies.length} allergie(s)
              </span>

              <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm font-medium">
                {mappedConsultations.length} consultation(s)
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button className="px-6 py-4 border-b-2 border-green-600 text-green-700 font-medium">
            Mon dossier
          </button>

          <button onClick={() => router.push("/patient/documents")} className="px-6 py-4 text-gray-600 flex items-center gap-2 hover:text-gray-900">
            <FileText size={18} />
            Mes documents
          </button>

          <button onClick={() => router.push("/patient")} className="px-6 py-4 text-gray-600 flex items-center gap-2 hover:text-gray-900">
            <Activity size={18} />
            Mes constantes
          </button>

          <button onClick={() => router.push("/patient/chat")} className="px-6 py-4 text-gray-600 flex items-center gap-2 hover:text-gray-900">
            <MessageCircle size={18} />
            Chat médecin
            <span className="bg-red-500 text-white text-xs rounded-full px-2">
              1
            </span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">

          {/* Infos */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <Phone size={16} />
                Téléphone
              </div>

              <p className="mt-2 font-medium">
                {phone}
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <Mail size={16} />
                Email
              </div>

              <p className="mt-2 font-medium">
                {email}
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-gray-500 text-sm">
                Date de naissance
              </p>

              <p className="mt-2 font-medium">
                {birthDate}
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-gray-500 text-sm">
                Contact urgence
              </p>

              <p className="mt-2 font-medium">
                {emergencyContact}
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 md:col-span-2">
              <p className="text-gray-500 text-sm">
                Adresse
              </p>

              <p className="mt-2 font-medium">
                {address}
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-gray-500 text-sm">
                Pays
              </p>

              <p className="mt-2 font-medium">
                {country}
              </p>
            </div>
          </div>

          {/* Allergies */}
          <div>
            <h3 className="flex items-center gap-2 font-semibold text-red-600 mb-3">
              <AlertCircle size={18} />
              Allergies
            </h3>

            <div className="flex gap-2 flex-wrap">
              {allergies.map((item) => (
                <span
                  key={item}
                  className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-sm"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Antécédents */}
          <div>
            <h3 className="font-semibold mb-3">
              Antécédents médicaux
            </h3>

            <div className="space-y-3">
              {medicalHistory.map((item) => (
                <div
                  key={item}
                  className="bg-yellow-50 border border-yellow-100 rounded-xl p-4"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Consultations */}
          <div>
            <h3 className="flex items-center gap-2 font-semibold mb-3">
              <History size={18} />
              Dernières consultations
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

                  <p className="text-sm text-gray-500 mt-1">
                    {consultation.date ? new Date(consultation.date).toLocaleDateString("fr-FR") : consultation.date} · {consultation.doctor || consultation.author || "Dr. Pierre Moreau"}
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
