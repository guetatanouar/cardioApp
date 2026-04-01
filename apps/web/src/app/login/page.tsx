"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/client";
import { setSession } from "@/lib/auth/storage";
import { useI18n } from "@/lib/i18n/client";
import { config } from "@/lib/config";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useI18n();

  const [mode, setMode] = React.useState<"staff" | "patient">("staff");
  const [staffProfile, setStaffProfile] = React.useState<"admin" | "secretaire">("admin");

  const [login, setLogin] = React.useState("");
  const [password, setPassword] = React.useState("");

  const [patientUsername, setPatientUsername] = React.useState("");
  const [patientPassword, setPatientPassword] = React.useState("");

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (mode !== "staff") return;
    // Clear the form when switching to staff mode to prevent auto-filling
    setLogin("");
    setPassword("");
  }, [mode, staffProfile]);

  async function onSubmitStaff(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await apiFetch<{ token: string; user: { id: string; role: "admin" | "secretaire"; fullName: string } }>(
        "/api/auth/login",
        {
          method: "POST",
          body: JSON.stringify({ login, password })
        }
      );

      setSession({ token: res.token, role: res.user.role, userId: res.user.id, fullName: res.user.fullName });
      router.replace("/dashboard");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (/fetch failed|failed to fetch|econnrefused|network/i.test(msg)) {
        setError(`API offline: start backend on ${config.api.baseUrl}`);
      } else {
        setError("Invalid credentials");
      }
    } finally {
      setLoading(false);
    }
  }

  async function onSubmitPatient(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await apiFetch<{ token: string; patientId: string }>("/api/auth/patient-login", {
        method: "POST",
        body: JSON.stringify({ username: patientUsername, password: patientPassword })
      });

      setSession({ token: res.token, role: "patient", userId: res.patientId, fullName: "Espace patient" });
      router.replace("/patient");
    } catch {
      setError("Invalid credentials");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="relative hidden items-center justify-center overflow-hidden bg-gradient-to-b from-indigo-600 to-blue-800 p-10 lg:flex">
        <div className="absolute inset-0 opacity-30 [background:radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35)_0%,transparent_55%)]" />
        <div className="relative max-w-md text-white">
          <div className="mb-6 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/15" />
            <div>
              <div className="text-lg font-semibold">CardioManager</div>
              <div className="text-sm text-white/80">Gestion de cabinet</div>
            </div>
          </div>
          <div className="text-3xl font-bold leading-tight">Votre cabinet cardiologique</div>
          <div className="mt-3 text-sm text-white/80">Gérez patients, rendez-vous et ordonnances depuis une seule plateforme sécurisée.</div>
        </div>
      </div>

      <div className="flex items-center justify-center bg-background p-6">
        <Card className="w-full max-w-lg">
          <CardContent className="p-6">
            <div className="mb-4 flex rounded-xl border border-border bg-muted/30 p-1">
              <button
                type="button"
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${mode === "staff" ? "bg-background shadow" : "text-muted-foreground"}`}
                onClick={() => setMode("staff")}
              >
                Personnel médical
              </button>
              <button
                type="button"
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${mode === "patient" ? "bg-background shadow" : "text-muted-foreground"}`}
                onClick={() => setMode("patient")}
              >
                Espace patient
              </button>
            </div>

            {mode === "staff" ? (
              <form className="space-y-4" onSubmit={onSubmitStaff}>
                <div>
                  <div className="text-lg font-semibold">Connexion</div>
                  <div className="text-sm text-muted-foreground">Choisissez votre profil</div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <button
                    type="button"
                    className={`rounded-xl border p-4 text-left ${staffProfile === "admin" ? "border-primary bg-primary/5" : "border-border"}`}
                    onClick={() => setStaffProfile("admin")}
                  >
                    <div className="text-sm font-semibold">Dr. Pierre Moreau</div>
                    <div className="text-xs text-muted-foreground">Cardiologue</div>
                    <div className="mt-2 inline-flex rounded-full bg-muted px-2 py-0.5 text-xs">Sélectionné</div>
                  </button>
                  <button
                    type="button"
                    className={`rounded-xl border p-4 text-left ${staffProfile === "secretaire" ? "border-primary bg-primary/5" : "border-border"}`}
                    onClick={() => setStaffProfile("secretaire")}
                  >
                    <div className="text-sm font-semibold">Sophie Dubois</div>
                    <div className="text-xs text-muted-foreground">Secrétaire médicale</div>
                    {staffProfile === "secretaire" ? <div className="mt-2 inline-flex rounded-full bg-muted px-2 py-0.5 text-xs">Sélectionné</div> : null}
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="text-sm">{t("login")}</div>
                  <Input value={login} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLogin(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <div className="text-sm">{t("password")}</div>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  />
                </div>

                {error ? <div className="text-sm text-red-500">{error}</div> : null}

                <Button className="w-full" disabled={loading} type="submit">
                  Se connecter — {staffProfile === "admin" ? "Dr. Pierre Moreau" : "Sophie Dubois"}
                </Button>
              </form>
            ) : (
              <form className="space-y-4" onSubmit={onSubmitPatient}>
                <div>
                  <div className="text-lg font-semibold">Connexion</div>
                  <div className="text-sm text-muted-foreground">Accédez à votre espace personnel</div>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-sm text-emerald-700">
                  Accès sécurisé patient
                </div>
                <div className="space-y-2">
                  <div className="text-sm">Identifiant</div>
                  <Input
                    value={patientUsername}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPatientUsername(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <div className="text-sm">Mot de passe</div>
                  <Input
                    type="password"
                    value={patientPassword}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPatientPassword(e.target.value)}
                  />
                </div>

                {error ? <div className="text-sm text-red-500">{error}</div> : null}
                <Button className="w-full bg-emerald-500 hover:bg-emerald-600" disabled={loading} type="submit">
                  Se connecter
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
