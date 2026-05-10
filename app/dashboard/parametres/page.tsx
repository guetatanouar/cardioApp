"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { apiFetch } from "@/lib/api/client";
import { getSession } from "@/lib/auth/storage";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/cn";

type ColorTheme = "blue" | "green" | "purple" | "red";

function applyColorTheme(theme: ColorTheme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.remove("theme-blue", "theme-green", "theme-purple", "theme-red");
  root.classList.add(`theme-${theme}`);
}

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { locale, setLocale } = useI18n();
  const [profile, setProfile] = React.useState({ fullName: "", email: "", role: "" });
  const [permissions, setPermissions] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [colorTheme, setColorTheme] = React.useState<ColorTheme>("blue");

  React.useEffect(() => {
    const session = getSession();
    if (session?.role === "secretaire") {
      router.replace("/dashboard");
    }
  }, [router]);

  React.useEffect(() => {
    const stored = window.localStorage.getItem("cardio-color-theme") as ColorTheme | null;
    if (stored && ["blue", "green", "purple", "red"].includes(stored)) {
      setColorTheme(stored);
    }
  }, []);

  React.useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [profileRes, permRes] = await Promise.all([
          apiFetch<{ fullName: string; email: string; role: string }>("/api/settings/profile"),
          apiFetch<any[] | { items: any[] }>("/api/settings/secretaire-permissions")
        ]);
        setProfile(profileRes);
        const perms = Array.isArray(permRes) ? permRes : (permRes as any).items ?? [];
        setPermissions(perms);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = new FormData(form);
    await apiFetch("/api/settings/profile", {
      method: "PUT",
      body: JSON.stringify({
        fullName: data.get("fullName"),
        email: data.get("email")
      })
    });
    alert("Profil enregistré");
  }

  async function togglePermission(userId: string, permKey: string, current: boolean) {
    const permMap: Record<string, string> = {
      can_view_patients: 'canViewPatients',
      can_edit_patients: 'canEditPatients',
      can_delete_patients: 'canDeletePatients',
      can_view_appointments: 'canViewAppointments',
      can_edit_appointments: 'canEditAppointments',
      can_delete_appointments: 'canDeleteAppointments',
      can_view_chat: 'canViewChat',
      can_send_chat: 'canSendChat',
      can_view_prescriptions: 'canViewPrescriptions',
      can_edit_prescriptions: 'canEditPrescriptions',
      can_view_vitals: 'canViewVitals',
      can_edit_vitals: 'canEditVitals',
      can_view_documents: 'canViewDocuments',
      can_upload_documents: 'canUploadDocuments',
      can_view_consultations: 'canViewConsultations'
    };
    const key = permMap[permKey] || permKey;
    await apiFetch(`/api/settings/secretaire-permissions/${userId}`, {
      method: "PUT",
      body: JSON.stringify({ [key]: !current })
    });
    setPermissions((prev) =>
      prev.map((u) =>
        u.user_id === userId ? { ...u, [permKey]: !current } : u
      )
    );
  }

  function handleColorTheme(color: ColorTheme) {
    setColorTheme(color);
    applyColorTheme(color);
    window.localStorage.setItem("cardio-color-theme", color);
  }

  const permissionRows = [
    { key: "can_view_patients", label: "Voir patients" },
    { key: "can_edit_patients", label: "Modifier patients" },
    { key: "can_delete_patients", label: "Supprimer patients" },
    { key: "can_view_appointments", label: "Voir agenda" },
    { key: "can_edit_appointments", label: "Modifier agenda" },
    { key: "can_delete_appointments", label: "Supprimer agenda" },
    { key: "can_view_chat", label: "Voir chat" },
    { key: "can_send_chat", label: "Envoyer messages" },
    { key: "can_view_prescriptions", label: "Voir ordonnances" },
    { key: "can_edit_prescriptions", label: "Créer/Modifier ordonnances" },
    { key: "can_view_vitals", label: "Voir constantes vitales" },
    { key: "can_edit_vitals", label: "Saisir constantes vitales" },
    { key: "can_view_documents", label: "Voir documents" },
    { key: "can_upload_documents", label: "Télécharger documents" },
    { key: "can_view_consultations", label: "Voir consultations" }
  ];

  if (loading) {
    return <div className="p-4">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Apparence</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-sm font-medium mb-3">Thème</h3>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all",
                  theme === "light" ? "border-primary" : "border-border hover:border-muted-foreground/30"
                )}
              >
                <div className="w-12 h-8 rounded bg-white border shadow-sm flex items-center justify-center">
                  <div className="w-8 h-1 bg-gray-300 rounded" />
                </div>
                <span className="text-xs">Clair</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all",
                  theme === "dark" ? "border-primary" : "border-border hover:border-muted-foreground/30"
                )}
              >
                <div className="w-12 h-8 rounded bg-slate-800 border border-slate-700 shadow-sm flex items-center justify-center">
                  <div className="w-8 h-1 bg-slate-600 rounded" />
                </div>
                <span className="text-xs">Sombre</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme("system")}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all",
                  theme === "system" ? "border-primary" : "border-border hover:border-muted-foreground/30"
                )}
              >
                <div className="w-12 h-8 rounded bg-gradient-to-r from-white to-slate-800 border shadow-sm flex items-center justify-center">
                  <div className="w-8 h-1 bg-gradient-to-r from-gray-300 to-slate-600 rounded" />
                </div>
                <span className="text-xs">Système</span>
              </button>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-medium mb-3">Couleur d&apos;accent</h3>
            <div className="flex gap-3">
              {[
                { color: "blue" as ColorTheme, hex: "#3b82f6", label: "Bleu" },
                { color: "green" as ColorTheme, hex: "#22c55e", label: "Vert" },
                { color: "purple" as ColorTheme, hex: "#a855f7", label: "Violet" },
                { color: "red" as ColorTheme, hex: "#ef4444", label: "Rouge" }
              ].map(({ color, hex, label }) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleColorTheme(color)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-all",
                    colorTheme === color ? "border-primary" : "border-border hover:border-muted-foreground/30"
                  )}
                >
                  <div
                    className="w-8 h-8 rounded-full shadow-sm"
                    style={{ backgroundColor: hex }}
                  />
                  <span className="text-xs">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Langue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            {[
              { code: "fr", label: "Français", flag: "🇫🇷" },
              { code: "en", label: "English", flag: "🇬🇧" },
              { code: "ar", label: "العربية", flag: "🇸🇦" }
            ].map(({ code, label, flag }) => (
              <button
                key={code}
                type="button"
                onClick={() => setLocale(code as "fr" | "en" | "ar")}
                className={cn(
                  "flex items-center gap-2 rounded-lg border-2 px-4 py-3 transition-all",
                  locale === code ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
                )}
              >
                <span className="text-2xl">{flag}</span>
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mon profil</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={saveProfile}>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm">Nom complet</label>
                <Input name="fullName" defaultValue={profile.fullName} />
              </div>
              <div>
                <label className="text-sm">Email</label>
                <Input name="email" type="email" defaultValue={profile.email} />
              </div>
            </div>
            <Button type="submit">Enregistrer</Button>
          </form>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Permissions secrétaire</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {permissions.map((user) => (
              <div key={user.user_id} className="space-y-2">
                <div className="font-medium">{user.full_name}</div>
                <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
                  {permissionRows.map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between rounded-lg border border-border p-2">
                      <span className="text-sm">{label}</span>
                      <Switch
                        checked={user[key] || false}
                        onCheckedChange={() => togglePermission(user.user_id, key, user[key])}
                      />
                    </div>
                  ))}
                </div>
                <Separator />
              </div>
            ))}
            {permissions.length === 0 && (
              <div className="text-sm text-muted-foreground">Aucun secrétaire configuré</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
