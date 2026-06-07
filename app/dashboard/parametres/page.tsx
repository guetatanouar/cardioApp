"use client";
import * as React from "react";
import { User, Shield, Users, Bell, Palette, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api/client";
import { dispatchNotification } from "@/lib/notifications";
import { getSession } from "@/lib/auth/storage";
import { useI18n, locales } from "@/lib/i18n/client";
import { useTheme } from "next-themes";
import { PhoneInput } from "@/components/ui/phone-input";

type Tab = "profil" | "securite" | "notifications" | "apparence" | "secretaire";

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

type Secretaire = {
  user_id: number;
  full_name: string;
  email: string;
  can_view_patients: boolean;
  can_edit_patients: boolean;
  can_delete_patients: boolean;
  can_view_appointments: boolean;
  can_edit_appointments: boolean;
  can_delete_appointments: boolean;
  can_view_chat: boolean;
  can_send_chat: boolean;
  can_view_prescriptions: boolean;
  can_edit_prescriptions: boolean;
  can_view_vitals: boolean;
  can_edit_vitals: boolean;
  can_view_documents: boolean;
  can_upload_documents: boolean;
  can_view_consultations: boolean;
};

const permLabels: Record<string, string> = {
  can_view_patients: "Voir patients",
  can_edit_patients: "Modifier patients",
  can_delete_patients: "Supprimer patients",
  can_view_appointments: "Voir RDV",
  can_edit_appointments: "Créer/Modifier RDV",
  can_delete_appointments: "Annuler RDV",
  can_view_chat: "Voir chat",
  can_send_chat: "Envoyer messages",
  can_view_prescriptions: "Voir prescriptions",
  can_edit_prescriptions: "Modifier prescriptions",
  can_view_vitals: "Voir constantes",
  can_edit_vitals: "Ajouter constantes",
  can_view_documents: "Voir documents",
  can_upload_documents: "Uploader documents",
  can_view_consultations: "Voir consultations",
};

export default function SettingsPage() {
  const session = getSession();
  const isAdmin = session?.role === "admin";
  const { locale, setLocale } = useI18n();
  const { theme, setTheme } = useTheme();

  const [tab, setTab] = React.useState<Tab>("profil");
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [loading, setLoading] = React.useState(true);

  const [_fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [rpps, setRpps] = React.useState("");
  const [specialty, setSpecialty] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [changingPwd, setChangingPwd] = React.useState(false);

  const [secretaires, setSecretaires] = React.useState<Secretaire[]>([]);
  const [permSaving, setPermSaving] = React.useState<Record<string, boolean>>({});

  const notifDefaults: Record<string, boolean> = {
    rappelRdv: true,
    urgentPatient: true,
    nouveauPatient: false,
    nouveauMessage: true,
  };
  const [notifPrefs, setNotifPrefs] = React.useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return notifDefaults;
    const saved = localStorage.getItem("cm_notif_prefs");
    return saved ? { ...notifDefaults, ...JSON.parse(saved) } : notifDefaults;
  });

  const notifLabels: Record<string, string> = {
    rappelRdv: "Rappel de rendez-vous",
    urgentPatient: "Alerte patient urgent",
    nouveauPatient: "Nouveau patient inscrit",
    nouveauMessage: "Nouveau message chat",
  };

  React.useEffect(() => {
    async function load() {
      try {
        if (tab === "profil" || tab === "securite") {
          const p = await apiFetch<Profile>("/api/settings/profile");
          setProfile(p);
          setFullName(p.fullName);
          setEmail(p.email);
          setFirstName(p.first_name || "");
          setLastName(p.last_name || "");
          setPhone(p.phone || "");
          setAddress(p.address || "");
          setRpps(p.rpps || "");
          setSpecialty(p.specialty || "");
        }
        if (tab === "secretaire" && isAdmin) {
          const res = await apiFetch<{ items: Secretaire[] }>("/api/settings/secretaire-permissions");
          setSecretaires(res.items);
        }
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    }
    load();
  }, [tab, isAdmin]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const derivedFullName = `${firstName} ${lastName}`.trim() || email;
      await apiFetch("/api/settings/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: derivedFullName, email, firstName, lastName, phone, address, rpps, specialty }),
      });
      const fresh = await apiFetch<Profile>("/api/settings/profile");
      setProfile(fresh);
      setFullName(fresh.fullName);
      setEmail(fresh.email);
      setFirstName(fresh.first_name || "");
      setLastName(fresh.last_name || "");
      setPhone(fresh.phone || "");
      setAddress(fresh.address || "");
      setRpps(fresh.rpps || "");
      setSpecialty(fresh.specialty || "");
      dispatchNotification({ id: "profile-saved", title: "Profil mis à jour", detail: "", type: "success" });
    } catch (error: any) {
      dispatchNotification({ id: "profile-error", title: "Erreur", detail: error?.message, type: "error" });
    }
    setSaving(false);
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      dispatchNotification({ id: "pwd-match", title: "Les mots de passe ne correspondent pas", detail: "", type: "error" });
      return;
    }
    if (newPassword.length < 6) {
      dispatchNotification({ id: "pwd-length", title: "Minimum 6 caractères", detail: "", type: "error" });
      return;
    }
    setChangingPwd(true);
    try {
      await apiFetch("/api/settings/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      dispatchNotification({ id: "pwd-saved", title: "Mot de passe modifié", detail: "", type: "success" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      dispatchNotification({ id: "pwd-error", title: "Erreur", detail: error?.message, type: "error" });
    }
    setChangingPwd(false);
  }

  async function togglePerm(secId: number, permKey: string, value: boolean) {
    const id = `perm-${secId}-${permKey}`;
    setPermSaving((s) => ({ ...s, [id]: true }));
    try {
      await apiFetch(`/api/settings/secretaire-permissions/${secId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [permKey]: value }),
      });
      setSecretaires((prev) =>
        prev.map((s) => (s.user_id === secId ? { ...s, [permKey]: value } : s))
      );
    } catch (error: any) {
      dispatchNotification({ id: "perm-error", title: "Erreur", detail: error?.message, type: "error" });
    }
    setPermSaving((s) => ({ ...s, [id]: false }));
  }

  function toggleNotifPref(key: string) {
    setNotifPrefs((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem("cm_notif_prefs", JSON.stringify(next));
      return next;
    });
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "profil", label: "Profil médecin", icon: <User size={18} /> },
    { key: "notifications", label: "Notifications", icon: <Bell size={18} /> },
    { key: "apparence", label: "Apparence", icon: <Palette size={18} /> },
    { key: "securite", label: "Sécurité", icon: <Shield size={18} /> },
  ];
  if (isAdmin) {
    tabs.push({ key: "secretaire", label: "Accès secrétariat", icon: <Users size={18} /> });
  }

  return (
    <div className="min-h-screen bg-[#f7f7f7] flex">
 <div className="w-[230px] h-fit bg-white border border-gray-200 rounded-2xl p-4 shadow-sm"><div className="space-y-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition ${
                tab === t.key
                  ? "bg-gray-100 text-black font-medium"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-8">
        {loading ? (
         <div className="flex items-center justify-center h-30">
  <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
          </div>
        ) : tab === "profil" ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-4xl">
            <h2 className="text-2xl font-semibold text-gray-800 mb-8">Profil médecin</h2>
              <form onSubmit={saveProfile} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Prénom</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full h-10 rounded-xl border border-gray-200 px-3 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Nom</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full h-10 rounded-xl border border-gray-200 px-3 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-10 rounded-xl border border-gray-200 px-3 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Téléphone cabinet</label>
                <PhoneInput
                  value={phone}
                  onChange={setPhone}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Adresse cabinet</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-2">RPPS</label>
                  <input
                    type="text"
                    value={rpps}
                    onChange={(e) => setRpps(e.target.value)}
                    className="w-full h-10 rounded-xl border border-gray-200 px-3 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Spécialité</label>
                  <input
                    type="text"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className="w-full h-10 rounded-xl border border-gray-200 px-3 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Rôle</label>
                <input
                  type="text"
                  value={profile?.role === "admin" ? "Administrateur" : "Secrétaire"}
                  readOnly
                  className="w-full h-12 rounded-xl border border-gray-200 px-4 outline-none bg-gray-50 text-gray-500"
                />
              </div>
              <div className="flex justify-end pt-6">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-medium transition flex items-center gap-2"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        ) : tab === "securite" ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-4xl">
            <h2 className="text-2xl font-semibold text-gray-800 mb-8">Sécurité</h2>
            <form onSubmit={changePassword} className="space-y-6">
              <div>
                <label className="block text-sm text-gray-600 mb-2">Mot de passe actuel</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full h-10 rounded-xl border border-gray-200 px-3 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Nouveau mot de passe</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full h-10 rounded-xl border border-gray-200 px-3 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Confirmer le mot de passe</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full h-10 rounded-xl border border-gray-200 px-3 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end pt-6">
                <button
                  type="submit"
                  disabled={changingPwd}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-medium transition flex items-center gap-2"
                >
                  {changingPwd && <Loader2 className="h-4 w-4 animate-spin" />}
                  Modifier le mot de passe
                </button>
              </div>
            </form>
          </div>
        ) : tab === "notifications" ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-4xl">
            <h2 className="text-2xl font-semibold text-gray-800 mb-8">Notifications</h2>
            <div className="space-y-6">
              {Object.keys(notifLabels).map((key) => (
                <div key={key} className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-700">{notifLabels[key]}</span>
                  <button
                    type="button"
                    onClick={() => toggleNotifPref(key)}
                    className={`relative w-14 h-8 rounded-full transition flex items-center ${
                      notifPrefs[key] ? "bg-blue-600" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition ${
                        notifPrefs[key] ? "left-7" : "left-1"
                      }`}
                    />
                  </button>
                </div>
              ))}
              <p className="text-xs text-gray-400 pt-4 border-t border-gray-100">
                Les préférences sont sauvegardées dans ce navigateur.
              </p>
            </div>
          </div>
        ) : tab === "apparence" ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-4xl">
            <h2 className="text-2xl font-semibold text-gray-800 mb-8">Apparence</h2>
            <div className="space-y-8">
              <div>
                <label className="block text-sm text-gray-600 mb-3">Thème</label>
                <div className="flex gap-3">
                  {["light", "dark"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTheme(t)}
                      className={`flex-1 h-12 rounded-xl border-2 transition font-medium text-sm ${
                        theme === t
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      {t === "light" ? "Clair" : "Sombre"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-3">Langue</label>
                <div className="flex gap-3">
                  {locales.map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setLocale(l)}
                      className={`flex-1 h-12 rounded-xl border-2 transition font-medium text-sm ${
                        locale === l
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      {{ fr: "Français", en: "English", ar: "العربية" }[l]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : tab === "secretaire" && isAdmin ? (
          <div className="space-y-6 max-w-4xl">
            <h2 className="text-2xl font-semibold text-gray-800">Accès secrétariat</h2>
            {secretaires.length === 0 ? (
              <p className="text-gray-500">Aucun compte secrétaire trouvé.</p>
            ) : (
              secretaires.map((sec) => (
                <div key={sec.user_id} className="bg-white rounded-2xl border border-gray-200 p-8">
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">{sec.full_name}</h3>
                  <p className="text-sm text-gray-400 mb-6">{sec.email}</p>
                  <div className="space-y-3">
                    {Object.keys(permLabels).map((key) => {
                      const permKey = key as keyof Secretaire;
                      const id = `perm-${sec.user_id}-${key}`;
                      const saving = permSaving[id];
                      return (
                        <div key={key} className="flex items-center justify-between py-1">
                          <span className="text-sm text-gray-700">{permLabels[key]}</span>
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => togglePerm(sec.user_id, key, !sec[permKey])}
                            className={`relative w-14 h-8 rounded-full transition flex items-center ${
                              saving ? "opacity-50" : sec[permKey] ? "bg-blue-600" : "bg-gray-300"
                            }`}
                          >
                            {saving ? (
                              <Loader2 className="h-4 w-4 animate-spin mx-auto text-white" />
                            ) : (
                              <span
                                className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition ${
                                  sec[permKey] ? "left-7" : "left-1"
                                }`}
                              />
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
