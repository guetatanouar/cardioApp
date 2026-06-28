"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { getSession, clearSession } from "@/lib/auth/storage";
import { LogOut } from "lucide-react";
import NavbarLogo from "@/components/NavbarLogo";

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

  React.useEffect(() => {
    if (mounted && session && (session.role === "admin" || session.role === "secretaire")) {
      router.replace("/dashboard");
    }
  }, [mounted, session, router]);

  if (!mounted) {
    return <div className="min-h-screen bg-background" />;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="h-14 bg-green-600 flex items-center justify-between px-6 shadow-sm">
        <NavbarLogo href="/patient" inverted />
        <button
          onClick={() => { clearSession(); router.replace("/patient/login"); }}
          className="flex items-center gap-2 text-white/90 hover:text-white text-sm font-medium transition"
        >
          <LogOut className="h-4 w-4" />
          Déconnexion
        </button>
      </div>
      {children}
    </div>
  );
}
