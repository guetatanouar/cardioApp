"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/client";
import { setSession } from "@/lib/auth/storage";

export default function PatientLoginPage() {
  const router = useRouter();

  const [username, setUsername] = React.useState("patient1");
  const [password, setPassword] = React.useState("patient123");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await apiFetch<{ token: string; patientId: string }>("/api/auth/patient-login", {
        method: "POST",
        body: JSON.stringify({ username, password })
      });

      setSession({ token: res.token, role: "patient", userId: res.patientId });
      router.replace("/patient");
    } catch {
      setError("Invalid credentials");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Patient</CardTitle>
          <CardDescription>Connexion</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={onSubmit}>
            <div className="space-y-1">
              <div className="text-sm">Username</div>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div className="space-y-1">
              <div className="text-sm">Password</div>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {error ? <div className="text-sm text-red-500">{error}</div> : null}
            <Button className="w-full" disabled={loading} type="submit">
              Sign in
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
