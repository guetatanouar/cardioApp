"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/client";
import { setSession } from "@/lib/auth/storage";
import { useI18n } from "@/lib/i18n/client";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useI18n();

  const [login, setLogin] = React.useState("prenom@cabinet-cardio.fr");
  const [password, setPassword] = React.useState("admin123");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await apiFetch<{ token: string; user: { id: string; role: "admin" | "secretaire" } }>(
        "/api/auth/login",
        {
          method: "POST",
          body: JSON.stringify({ login, password })
        }
      );

      setSession({ token: res.token, role: res.user.role, userId: res.user.id });
      router.replace("/dashboard");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (/fetch failed|failed to fetch|econnrefused|network/i.test(msg)) {
        setError("API offline: start backend on http://localhost:4000");
      } else {
        setError("Invalid credentials");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t("loginTitle")}</CardTitle>
          <CardDescription>{t("loginSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={onSubmit}>
            <div className="space-y-1">
              <div className="text-sm">{t("login")}</div>
              <Input value={login} onChange={(e) => setLogin(e.target.value)} />
            </div>
            <div className="space-y-1">
              <div className="text-sm">{t("password")}</div>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {error ? <div className="text-sm text-red-500">{error}</div> : null}
            <Button className="w-full" disabled={loading} type="submit">
              {t("signIn")}
            </Button>
            <Link className="block text-center text-sm text-muted-foreground underline" href="/patient/login">
              Patient
            </Link>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
