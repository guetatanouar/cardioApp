"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Activity, Lock, Mail, User, Shield, Calendar, FileText, MessageSquare, Heart } from "lucide-react";

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

  const [login, setLogin] = React.useState("admin");
  const [password, setPassword] = React.useState("admin123");

  const [patientUsername, setPatientUsername] = React.useState("");
  const [patientPassword, setPatientPassword] = React.useState("");

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setLogin(staffProfile);
    setPassword("");
  }, [staffProfile]);

  async function onSubmitStaff(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await apiFetch<{
        token: string;
        user: { id: string; role: "admin" | "secretaire"; fullName: string; email: string };
      }>(
        "/api/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: login, password })
        }
      );

      setSession({
        token: res.token,
        role: res.user.role,
        userId: res.user.id,
        fullName: res.user.fullName,
        email: res.user.email
      });
      router.replace("/dashboard");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (/fetch failed|failed to fetch|econnrefused|network/i.test(msg)) {
        setError(`API offline: start backend on ${config.api.baseUrl}`);
      } else {
        setError("Identifiants incorrects");
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
      setError("Identifiants incorrects");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* Left Panel - Branding */}
      <div className="relative flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-600 via-blue-700 to-indigo-900 p-8">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -left-10 -top-10 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-10 -right-10 h-96 w-96 rounded-full bg-indigo-400/20 blur-3xl" />
          <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/10 blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-md text-center text-white">
          {/* Logo */}
          <div className="mb-8 flex items-center justify-center gap-4">
            <div className="relative">
              <div className="absolute -left-1/2 -top-1/2 h-[200px] w-[200px] -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />
              <div className="relative flex h-40 w-40 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
                <Heart className="h-24 w-24 text-red-500 fill-red-500" />
              </div>
            </div>
          </div>

          <h1 className="mb-3 text-4xl font-bold tracking-tight">CardioManager</h1>
          <p className="mb-8 text-lg text-white/80">Gestion de cabinet cardiologique</p>

          {/* Features */}
          <div className="mb-8 grid grid-cols-2 gap-4 text-left">
            {[
              { icon: User, label: "25+ Patients", desc: "Dossiers medical" },
              { icon: Calendar, label: "Agenda", desc: "Rendez-vous" },
              { icon: FileText, label: "Ordonnances", desc: "Generation PDF" },
              { icon: MessageSquare, label: "Messagerie", desc: "Chat patient" }
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl bg-white/10 p-3 backdrop-blur-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
                  <feature.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold">{feature.label}</div>
                  <div className="text-xs text-white/70">{feature.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Security Badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm backdrop-blur-sm">
            <Shield className="h-4 w-4" />
            <span>Donnees medicales securisees</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="text-xl font-bold">CardioManager</div>
              <div className="text-sm text-muted-foreground">Gestion de cabinet</div>
            </div>
          </div>

          {/* Mode Tabs */}
          <div className="mb-6 flex rounded-xl border border-border bg-muted/30 p-1">
            <button
              type="button"
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${mode === "staff" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => setMode("staff")}
            >
              <Shield className="h-4 w-4" />
              Personnel medical
            </button>
            <button
              type="button"
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${mode === "patient" ? "bg-emerald-500 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => setMode("patient")}
            >
              <User className="h-4 w-4" />
              Espace patient
            </button>
          </div>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              {mode === "staff" ? (
                <form className="space-y-5" onSubmit={onSubmitStaff}>
                  <div className="text-center">
                    <h2 className="text-xl font-semibold">Bienvenue</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Connectez-vous a votre espace</p>
                  </div>

                  {/* Profile Selection */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      className={`group relative rounded-xl border-2 p-4 text-left transition-all ${staffProfile === "admin" ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30" : "border-border hover:border-indigo-200"}`}
                      onClick={() => setStaffProfile("admin")}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300">
                        <User className="h-5 w-5" />
                      </div>
                      <div className="mt-2 text-sm font-semibold">Dr. Pierre Moreau</div>
                      <div className="text-xs text-muted-foreground">Cardiologue</div>
                      {staffProfile === "admin" && (
                        <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500 text-white">
                          <Shield className="h-3 w-3" />
                        </div>
                      )}
                    </button>
                    <button
                      type="button"
                      className={`group relative rounded-xl border-2 p-4 text-left transition-all ${staffProfile === "secretaire" ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30" : "border-border hover:border-indigo-200"}`}
                      onClick={() => setStaffProfile("secretaire")}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300">
                        <User className="h-5 w-5" />
                      </div>
                      <div className="mt-2 text-sm font-semibold">Sophie Dubois</div>
                      <div className="text-xs text-muted-foreground">Secretaires</div>
                      {staffProfile === "secretaire" && (
                        <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500 text-white">
                          <Shield className="h-3 w-3" />
                        </div>
                      )}
                    </button>
                  </div>

                  {/* Form Fields */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Identifiant</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          className="pl-10"
                          value={login}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLogin(e.target.value)}
                          placeholder={staffProfile === "admin" ? "admin" : "secretaire"}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Mot de passe</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          className="pl-10"
                          type="password"
                          value={password}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
                      {error}
                    </div>
                  )}

                  <Button className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700" disabled={loading} type="submit">
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Connexion...
                      </span>
                    ) : (
                      `Se connecter — ${staffProfile === "admin" ? "Dr. Moreau" : "S. Dubois"}`
                    )}
                  </Button>
                </form>
              ) : (
                <form className="space-y-5" onSubmit={onSubmitPatient}>
                  <div className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300">
                      <User className="h-8 w-8" />
                    </div>
                    <h2 className="text-xl font-semibold">Portail Patient</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Accedez a votre espace personnel</p>
                  </div>

                  <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                    <Shield className="mr-2 inline h-4 w-4" />
                    Acces securise a vos donnees medicales
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Identifiant</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          className="pl-10"
                          value={patientUsername}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPatientUsername(e.target.value)}
                          placeholder="Votre identifiant"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Mot de passe</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          className="pl-10"
                          type="password"
                          value={patientPassword}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPatientPassword(e.target.value)}
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
                      {error}
                    </div>
                  )}

                  <Button className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700" disabled={loading} type="submit">
                    {loading ? "Connexion..." : "Se connecter"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Footer */}
          <p className="mt-6 text-center text-xs text-muted-foreground">
            CardioManager v1.0 — Cabinet de Cardiologie
          </p>
        </div>
      </div>
    </div>
  );
}
