"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { getSession, clearSession } from "@/lib/auth/storage";
import { useI18n } from "@/lib/i18n/client";
import { getDir } from "@/lib/i18n/messages";
import { cn } from "@/lib/cn";

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { locale } = useI18n();
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

  React.useEffect(() => {
    document.documentElement.dir = getDir(locale);
    document.documentElement.lang = locale;
  }, [locale]);

  if (!mounted) {
    return <div className="min-h-screen bg-background" />;
  }

  if (!session) {
    return null;
  }

  const isRTL = locale === "ar";

  return (
    <div className={cn("min-h-screen bg-background", isRTL && "rtl")}>
      <div className="h-14 bg-green-600 flex items-center justify-between px-6 shadow-sm">
        <span className="text-white font-bold text-lg">CardioManager</span>
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
