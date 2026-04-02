"use client";

import * as React from "react";
import { useTheme } from "next-themes";

import { apiFetch } from "@/lib/api/client";
import { useI18n } from "@/lib/i18n/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ColorTheme = "blue" | "green" | "purple" | "red";

function applyColorTheme(theme: ColorTheme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.remove("theme-blue", "theme-green", "theme-purple", "theme-red");
  root.classList.add(`theme-${theme}`);
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { locale, setLocale } = useI18n();

  const [tab, setTab] = React.useState<"profile" | "notifications" | "security" | "permissions" | "access" | "appearance">("profile");

  const [profile, setProfile] = React.useState({ fullName: "", email: "", role: "" });
  const [profileMessage, setProfileMessage] = React.useState<string | null>(null);

  const [passwordForm, setPasswordForm] = React.useState({ currentPassword: "", newPassword: "" });
  const [passwordMessage, setPasswordMessage] = React.useState<string | null>(null);

  const [items, setItems] = React.useState<any[]>([]);
  const [patients, setPatients] = React.useState<Array<{ id: string; first_name: string; last_name: string }>>([]);
  const [selectedPatientId, setSelectedPatientId] = React.useState("");
  const [patientAccount, setPatientAccount] = React.useState<any | null>(null);
  const [patientAccountForm, setPatientAccountForm] = React.useState({ username: "", password: "", isActive: true, resetPassword: "" });
  const [colorTheme, setColorTheme] = React.useState<ColorTheme>("blue");
  const [notificationsPrefs, setNotificationsPrefs] = React.useState({
    urgentAlerts: true,
    lowSpO2: true,
    medicationReminders: true,
    newPatients: false,
    weeklySummary: false
  });

  async function loadProfile() {
    const res = await apiFetch<{ fullName: string; email: string; role: string }>("/api/settings/profile");
    setProfile({ fullName: res.fullName, email: res.email, role: res.role });
  }

  async function load() {
    const res = await apiFetch<{ items: any[] }>("/api/settings/secretaire-permissions");
    setItems(res.items);
  }

  async function loadPatients() {
    const res = await apiFetch<{ items: Array<{ id: string; first_name: string; last_name: string }> }>(
      "/api/patients?page=1&pageSize=50"
    );
    setPatients(res.items);
    if (!selectedPatientId && res.items[0]) {
      setSelectedPatientId(res.items[0].id);
    }
  }

  async function loadPatientAccount(patientId: string) {
    if (!patientId) return;
    const res = await apiFetch<{ item: any | null }>(`/api/settings/patient-accounts/${patientId}`);
    setPatientAccount(res.item);
    if (res.item) {
      setPatientAccountForm((s) => ({ ...s, username: res.item.username, isActive: res.item.is_active, password: "", resetPassword: "" }));
    } else {
      setPatientAccountForm({ username: "", password: "", isActive: true, resetPassword: "" });
    }
  }

  React.useEffect(() => {
    load().catch(() => undefined);
    loadProfile().catch(() => undefined);
    loadPatients().catch(() => undefined);
    const stored = typeof window !== "undefined" ? window.localStorage.getItem("cardio-color-theme") : null;
    const initialTheme: ColorTheme = stored === "green" || stored === "purple" || stored === "red" ? stored : "blue";
    setColorTheme(initialTheme);
    applyColorTheme(initialTheme);
    const storedNotif = typeof window !== "undefined" ? window.localStorage.getItem("cardio-notification-prefs") : null;
    if (storedNotif) {
      try {
        setNotificationsPrefs(JSON.parse(storedNotif));
      } catch {
        // ignore invalid persisted settings
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    loadPatientAccount(selectedPatientId).catch(() => undefined);
  }, [selectedPatientId]);

  async function saveProfile() {
    await apiFetch("/api/settings/profile", {
      method: "PUT",
      body: JSON.stringify({ fullName: profile.fullName, email: profile.email })
    });
    setProfileMessage("Profil enregistre");
  }

  async function savePassword() {
    try {
      await apiFetch("/api/settings/password", {
        method: "PUT",
        body: JSON.stringify(passwordForm)
      });
      setPasswordForm({ currentPassword: "", newPassword: "" });
      setPasswordMessage("Mot de passe mis a jour");
    } catch {
      setPasswordMessage("Echec de mise a jour");
    }
  }

  async function toggle(userId: string, key: string, value: boolean) {
    await apiFetch(`/api/settings/secretaire-permissions/${userId}`, {
      method: "PUT",
      body: JSON.stringify({ [key]: value })
    });
    await load();
  }

  async function savePatientAccount() {
    if (!selectedPatientId) return;

    if (!patientAccount) {
      await apiFetch("/api/settings/patient-accounts", {
        method: "POST",
        body: JSON.stringify({
          patientId: selectedPatientId,
          username: patientAccountForm.username,
          password: patientAccountForm.password
        })
      });
    } else {
      await apiFetch(`/api/settings/patient-accounts/${selectedPatientId}`, {
        method: "PUT",
        body: JSON.stringify({
          isActive: patientAccountForm.isActive,
          password: patientAccountForm.resetPassword || undefined
        })
      });
    }

    await loadPatientAccount(selectedPatientId);
  }

  function saveColorTheme(nextTheme: ColorTheme) {
    setColorTheme(nextTheme);
    applyColorTheme(nextTheme);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("cardio-color-theme", nextTheme);
    }
  }

  function setNotificationPref(key: keyof typeof notificationsPrefs, value: boolean) {
    const next = { ...notificationsPrefs, [key]: value };
    setNotificationsPrefs(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("cardio-notification-prefs", JSON.stringify(next));
    }
  }

  const permissionRows: Array<{ key: string; label: string; dbKey: string }> = [
    { key: "canViewPatients", label: "Voir patients", dbKey: "can_view_patients" },
    { key: "canEditPatients", label: "Modifier patients", dbKey: "can_edit_patients" },
    { key: "canViewAppointments", label: "Voir agenda", dbKey: "can_view_appointments" },
    { key: "canEditAppointments", label: "Modifier agenda", dbKey: "can_edit_appointments" },
    { key: "canViewChat", label: "Voir chat", dbKey: "can_view_chat" },
    { key: "canViewPrescriptions", label: "Voir ordonnances", dbKey: "can_view_prescriptions" },
    { key: "canEditPrescriptions", label: "Modifier ordonnances", dbKey: "can_edit_prescriptions" }
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Parametres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant={tab === "profile" ? "default" : "outline"} onClick={() => setTab("profile")}>Profil</Button>
            <Button size="sm" variant={tab === "notifications" ? "default" : "outline"} onClick={() => setTab("notifications")}>Notifications</Button>
            <Button size="sm" variant={tab === "security" ? "default" : "outline"} onClick={() => setTab("security")}>Securite</Button>
            <Button size="sm" variant={tab === "permissions" ? "default" : "outline"} onClick={() => setTab("permissions")}>Permissions secretaire</Button>
            <Button size="sm" variant={tab === "access" ? "default" : "outline"} onClick={() => setTab("access")}>Acces patient</Button>
            <Button size="sm" variant={tab === "appearance" ? "default" : "outline"} onClick={() => setTab("appearance")}>Apparence</Button>
          </div>
        </CardContent>
      </Card>

      {tab === "notifications" ? (
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { key: "urgentAlerts", title: "Alertes urgentes", hint: "Tension élevée / SpO2 bas" },
              { key: "lowSpO2", title: "Alertes valeurs critiques", hint: "Selon seuils patient" },
              { key: "medicationReminders", title: "Renouvellement ordonnances", hint: "Rappels automatiques" },
              { key: "newPatients", title: "Nouveaux patients", hint: "Notification d'inscription" },
              { key: "weeklySummary", title: "Rapport hebdomadaire", hint: "Synthèse activité" }
            ].map((item) => (
              <label key={item.key} className="flex items-center justify-between rounded-xl border border-border px-3 py-2">
                <div>
                  <div className="text-sm font-medium">{item.title}</div>
                  <div className="text-xs text-muted-foreground">{item.hint}</div>
                </div>
                <input
                  type="checkbox"
                  checked={Boolean(notificationsPrefs[item.key as keyof typeof notificationsPrefs])}
                  onChange={(e) => setNotificationPref(item.key as keyof typeof notificationsPrefs, e.target.checked)}
                />
              </label>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {tab === "profile" ? (
        <Card>
          <CardHeader>
            <CardTitle>Profil utilisateur</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input value={profile.fullName} onChange={(e) => setProfile((s) => ({ ...s, fullName: e.target.value }))} placeholder="Nom" />
            <Input value={profile.email} onChange={(e) => setProfile((s) => ({ ...s, email: e.target.value }))} placeholder="Email" />
            <Input value={profile.role} disabled placeholder="Role" />
            {profileMessage ? <div className="text-sm text-emerald-700">{profileMessage}</div> : null}
            <div className="flex justify-end">
              <Button onClick={saveProfile}>Enregistrer</Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {tab === "security" ? (
        <Card>
          <CardHeader>
            <CardTitle>Securite</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm((s) => ({ ...s, currentPassword: e.target.value }))}
              placeholder="Mot de passe actuel"
            />
            <Input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm((s) => ({ ...s, newPassword: e.target.value }))}
              placeholder="Nouveau mot de passe"
            />
            {passwordMessage ? <div className="text-sm text-muted-foreground">{passwordMessage}</div> : null}
            <div className="flex justify-end">
              <Button onClick={savePassword}>Mettre a jour</Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {tab === "permissions" ? (
        <Card>
          <CardHeader>
            <CardTitle>Permissions secretaire</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((p) => (
              <div key={p.user_id} className="rounded-md border border-border p-3">
                <div className="font-medium">{p.full_name}</div>
                <div className="mb-3 text-sm text-muted-foreground">{p.email}</div>

                <div className="space-y-2">
                  {permissionRows.map((row) => (
                    <label key={row.key} className="flex items-center justify-between gap-3 rounded border border-border px-3 py-2 text-sm">
                      <span>{row.label}</span>
                      <input
                        type="checkbox"
                        checked={Boolean(p[row.dbKey])}
                        onChange={(e) => toggle(p.user_id, row.key, e.target.checked)}
                      />
                    </label>
                  ))}
                </div>
              </div>
            ))}
            {items.length === 0 ? <div className="text-sm text-muted-foreground">Aucune secretaire</div> : null}
          </CardContent>
        </Card>
      ) : null}

      {tab === "access" ? (
        <Card>
          <CardHeader>
            <CardTitle>Gestion comptes patients</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="h-10 rounded-md border border-input bg-transparent px-3 text-sm"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.last_name} {p.first_name}
                </option>
              ))}
            </select>

            <Input
              placeholder="Username"
              value={patientAccountForm.username}
              onChange={(e) => setPatientAccountForm((s) => ({ ...s, username: e.target.value }))}
              disabled={Boolean(patientAccount)}
            />

            {!patientAccount ? (
              <Input
                type="password"
                placeholder="Mot de passe"
                value={patientAccountForm.password}
                onChange={(e) => setPatientAccountForm((s) => ({ ...s, password: e.target.value }))}
              />
            ) : (
              <>
                <Input
                  type="password"
                  placeholder="Nouveau mot de passe (optionnel)"
                  value={patientAccountForm.resetPassword}
                  onChange={(e) => setPatientAccountForm((s) => ({ ...s, resetPassword: e.target.value }))}
                />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={patientAccountForm.isActive}
                    onChange={(e) => setPatientAccountForm((s) => ({ ...s, isActive: e.target.checked }))}
                  />
                  Compte actif
                </label>
              </>
            )}

            <div className="flex justify-end">
              <Button onClick={savePatientAccount}>{patientAccount ? "Mettre a jour" : "Creer compte"}</Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {tab === "appearance" ? (
        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Theme de couleur</div>
              <div className="flex gap-2">
                {[
                  { key: "blue", label: "Bleu", className: "bg-blue-500" },
                  { key: "green", label: "Vert", className: "bg-emerald-500" },
                  { key: "purple", label: "Violet", className: "bg-violet-500" },
                  { key: "red", label: "Rouge", className: "bg-red-500" }
                ].map((option) => {
                  const active = colorTheme === option.key;
                  return (
                    <button
                      key={option.key}
                      type="button"
                      className={`h-7 w-7 rounded-full border-2 ${option.className} ${active ? "border-foreground" : "border-transparent"}`}
                      onClick={() => saveColorTheme(option.key as ColorTheme)}
                      title={option.label}
                    />
                  );
                })}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Theme</div>
              <div className="flex gap-2">
                <Button size="sm" variant={theme === "light" ? "default" : "outline"} onClick={() => setTheme("light")}>Clair</Button>
                <Button size="sm" variant={theme === "dark" ? "default" : "outline"} onClick={() => setTheme("dark")}>Sombre</Button>
                <Button size="sm" variant={theme === "system" ? "default" : "outline"} onClick={() => setTheme("system")}>Systeme</Button>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Langue</div>
              <div className="flex gap-2">
                <Button size="sm" variant={locale === "fr" ? "default" : "outline"} onClick={() => setLocale("fr")}>FR</Button>
                <Button size="sm" variant={locale === "en" ? "default" : "outline"} onClick={() => setLocale("en")}>EN</Button>
                <Button size="sm" variant={locale === "ar" ? "default" : "outline"} onClick={() => setLocale("ar")}>AR</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
