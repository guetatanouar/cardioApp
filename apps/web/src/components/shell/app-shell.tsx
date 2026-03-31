"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CalendarDays, LayoutDashboard, LogOut, MessageSquare, Moon, Settings, Sun, Users, FileText } from "lucide-react";
import { useTheme } from "next-themes";

import { cn } from "@/lib/cn";
import { clearSession, getSession } from "@/lib/auth/storage";
import { useI18n } from "@/lib/i18n/client";
import { getDir, locales } from "@/lib/i18n/messages";
import { Button } from "@/components/ui/button";

const staffNav = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/patients", icon: Users, label: "Patients" },
  { href: "/agenda", icon: CalendarDays, label: "Agenda" },
  { href: "/chat", icon: MessageSquare, label: "Chat" },
  { href: "/prescriptions", icon: FileText, label: "Ordonnances" },
  { href: "/settings", icon: Settings, label: "Paramètres" }
];

const patientNav = [
  { href: "/patient", icon: LayoutDashboard, label: "Mes constantes" },
  { href: "/patient/documents", icon: FileText, label: "Mes documents" },
  { href: "/patient/chat", icon: MessageSquare, label: "Chat médecin" },
  { href: "/patient/consultations", icon: Users, label: "Consultations" }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { locale, setLocale, t } = useI18n();

  const session = typeof window !== "undefined" ? getSession() : null;
  const isAuthRoute = pathname?.startsWith("/login") || pathname?.startsWith("/patient/login");
  const isPatientRoute = pathname?.startsWith("/patient");

  React.useEffect(() => {
    if (!session && !isAuthRoute) {
      router.replace("/login");
    }
  }, [session, isAuthRoute, router]);

  React.useEffect(() => {
    if (!session || isAuthRoute) return;

    if (session.role === "patient") {
      if (!isPatientRoute) router.replace("/patient");
    } else {
      if (isPatientRoute) router.replace("/dashboard");
    }
  }, [session, isAuthRoute, isPatientRoute, router]);

  React.useEffect(() => {
    document.documentElement.dir = getDir(locale);
    document.documentElement.lang = locale;
  }, [locale]);

  if (!session && !isAuthRoute) {
    return <div className="min-h-screen" />;
  }

  if (isAuthRoute) {
    return <div className="min-h-screen">{children}</div>;
  }

  const navItems = session?.role === "patient" ? patientNav : staffNav;

  return (
    <div className="min-h-screen">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 flex-col border-r border-border bg-card md:flex">
          <div className="flex items-center gap-2 p-4">
            <div className="h-9 w-9 rounded-md bg-primary" />
            <div className="leading-tight">
              <div className="text-sm font-semibold">CardioManager</div>
              <div className="text-xs text-muted-foreground">Cabinet</div>
            </div>
          </div>
          <nav className="flex-1 space-y-1 p-2">
            {navItems.map((item) => {
              const active = pathname === item.href || pathname?.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent",
                    active && "bg-accent"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="p-2">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => {
                clearSession();
                router.replace("/login");
              }}
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </div>
        </aside>

        <div className="flex flex-1 flex-col">
          <header className="flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-3">
            <div className="text-sm text-muted-foreground">{pathname}</div>
            <div className="flex items-center gap-2">
              <select
                value={locale}
                onChange={(e) => setLocale(e.target.value as any)}
                className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
              >
                {locales.map((l) => (
                  <option key={l} value={l}>
                    {l.toUpperCase()}
                  </option>
                ))}
              </select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>
          </header>
          <main className="flex-1 p-4">{children}</main>
        </div>
      </div>
    </div>
  );
}
