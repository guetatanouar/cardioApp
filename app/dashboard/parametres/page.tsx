"use client";

import * as React from "react";
import { apiFetch } from "@/lib/api/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

export default function SettingsPage() {
  const [profile, setProfile] = React.useState({ fullName: "", email: "", role: "" });
  const [permissions, setPermissions] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

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
    alert("Profil enregistre");
  }

  async function togglePermission(userId: string, permKey: string, current: boolean) {
    const key = permKey.replace(/_([a-z])/g, (_, l) => l.toUpperCase());
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

  const permissionRows = [
    { key: "can_view_patients", label: "Voir patients" },
    { key: "can_edit_patients", label: "Modifier patients" },
    { key: "can_delete_patients", label: "Supprimer patients" },
    { key: "can_view_appointments", label: "Voir agenda" },
    { key: "can_edit_appointments", label: "Modifier agenda" },
    { key: "can_view_chat", label: "Voir chat" },
    { key: "can_send_chat", label: "Envoyer messages" },
    { key: "can_view_prescriptions", label: "Voir ordonnances" },
    { key: "can_edit_prescriptions", label: "Creer/Modifier ordonnances" },
    { key: "can_view_vitals", label: "Voir constantes vitales" },
    { key: "can_edit_vitals", label: "Saisir constantes vitales" },
    { key: "can_view_documents", label: "Voir documents" },
    { key: "can_upload_documents", label: "Telecharger documents" },
    { key: "can_view_consultations", label: "Voir consultations" }
  ];

  if (loading) {
    return <div className="p-4">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
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
          <CardTitle>Permissions secretaire</CardTitle>
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
              <div className="text-sm text-muted-foreground">Aucun secretaire configure</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
