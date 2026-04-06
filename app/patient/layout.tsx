"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/auth/storage";
import { AppShell } from "@/components/shell/app-shell";

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const session = typeof window !== "undefined" ? getSession() : null;
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (mounted && !session) {
      router.replace("/patient/login");
    }
  }, [mounted, session, router]);

  if (!mounted) {
    return <div className="min-h-screen bg-background" />;
  }

  if (!session) {
    return null;
  }

  return <AppShell>{children}</AppShell>;
}
