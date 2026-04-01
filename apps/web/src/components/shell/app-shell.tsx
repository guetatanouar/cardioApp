"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  Bell,
  CalendarDays,
  ChevronDown,
  FileText,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Moon,
  Search,
  Settings,
  Sun,
  UserCircle2,
  Users
} from "lucide-react";
import { useTheme } from "next-themes";

import { cn } from "@/lib/cn";
import { clearSession, getSession } from "@/lib/auth/storage";
import { useI18n } from "@/lib/i18n/client";
import { getDir, locales } from "@/lib/i18n/messages";
import { apiFetch } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const staffNav = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/patients", icon: Users, label: "Patients" },
  { href: "/agenda", icon: CalendarDays, label: "Agenda" },
  { href: "/suivi", icon: Activity, label: "Suivi médical" },
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
  const { locale, setLocale } = useI18n();

  const session = typeof window !== "undefined" ? getSession() : null;
  const isAuthRoute = pathname?.startsWith("/login") || pathname?.startsWith("/patient/login");
  const isPatientRoute = pathname?.startsWith("/patient");

  const [search, setSearch] = React.useState("");
  const [notifOpen, setNotifOpen] = React.useState(false);
  const [profileOpen, setProfileOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<Array<{ id: string; title: string; detail: string }>>([]);
  const [chatUnreadCount, setChatUnreadCount] = React.useState(0);

  async function refreshHeaderData() {
    if (!session || isAuthRoute) return;

    if (session.role === "patient") {
      const channel = `patient:${session.userId}`;
      const chat = await apiFetch<{ items: Array<{ id: string; sender_role: string; content: string; is_read: boolean }> }>(
        `/api/chat?channel=${encodeURIComponent(channel)}`
      );
      const unread = chat.items.filter((m) => !m.is_read && m.sender_role !== "patient").length;
      setChatUnreadCount(unread);
      setNotifications(
        chat.items
          .filter((m) => m.sender_role !== "patient")
          .slice(-5)
          .reverse()
          .map((m) => ({
            id: m.id,
            title: "Nouveau message médecin",
            detail: m.content
          }))
      );
      return;
    }

    const summary = await apiFetch<{
      unreadStaffMessages: number;
      criticalAlerts: Array<{ patient_id: string; first_name: string; last_name: string; spo2: number | null; heart_rate: number | null }>;
      appointmentsToday: Array<{ id: string; first_name: string; last_name: string; starts_at: string; status: string }>;
    }>("/api/dashboard/summary");

    setChatUnreadCount(summary.unreadStaffMessages);

    const alertRows = summary.criticalAlerts.slice(0, 3).map((x) => ({
      id: `alert-${x.patient_id}`,
      title: `Alerte: ${x.last_name} ${x.first_name}`,
      detail: `${typeof x.spo2 === "number" ? `SpO2 ${x.spo2}%` : ""} ${typeof x.heart_rate === "number" ? `FC ${x.heart_rate} bpm` : ""}`.trim()
    }));

    const urgentRows = summary.appointmentsToday
      .filter((a) => a.status === "urgent")
      .slice(0, 2)
      .map((a) => ({
        id: `rdv-${a.id}`,
        title: `RDV urgent: ${a.last_name} ${a.first_name}`,
        detail: new Date(a.starts_at).toLocaleTimeString()
      }));

    const messageRow = {
      id: "staff-unread",
      title: "Messages staff non lus",
      detail: `${summary.unreadStaffMessages}`
    };

    setNotifications([messageRow, ...alertRows, ...urgentRows]);
  }

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

  React.useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;

    refreshHeaderData().catch(() => undefined);
    if (!session || isAuthRoute) return;

    timer = setInterval(() => {
      refreshHeaderData().catch(() => undefined);
    }, 15000);

    return () => {
      if (timer) clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.role, session?.userId, isAuthRoute]);

  if (!session && !isAuthRoute) {
    return <div className="min-h-screen" />;
  }

  if (isAuthRoute) {
    return <div className="min-h-screen">{children}</div>;
  }

  const navItems = session?.role === "patient" ? patientNav : staffNav;
  const totalNotif = notifications.length;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,hsl(var(--secondary))_0%,transparent_35%),radial-gradient(circle_at_90%_0%,hsl(var(--accent))_0%,transparent_25%)]">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 flex-col border-r border-border bg-card/90 backdrop-blur md:flex">
          <div className="flex items-center gap-2 p-4">
            <div className="h-9 w-9 rounded-md bg-primary shadow-sm" />
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
                  <span className="flex-1">{item.label}</span>
                  {item.href.includes("chat") && chatUnreadCount > 0 ? (
                    <span className="rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      {chatUnreadCount}
                    </span>
                  ) : null}
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
          <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border bg-card/90 px-4 py-3 backdrop-blur">
            <div className="w-full max-w-md">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const q = search.trim();
                  if (!q) return;
                  router.push(`/patients?q=${encodeURIComponent(q)}`);
                }}
              >
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher un patient..."
                    className="pl-9"
                  />
                </div>
              </form>
            </div>

            <div className="relative flex items-center gap-2">
              <select
                value={locale}
                onChange={(e) => setLocale(e.target.value as "fr" | "en" | "ar")}
                className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
              >
                {locales.map((l) => (
                  <option key={l} value={l}>
                    {l === "fr" ? "FR" : l === "en" ? "EN" : "AR"}
                  </option>
                ))}
              </select>

              <Button variant="outline" size="sm" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>

              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setNotifOpen((v) => !v);
                    setProfileOpen(false);
                  }}
                >
                  <Bell className="h-4 w-4" />
                  {totalNotif > 0 ? (
                    <span className="rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-semibold text-white">{totalNotif}</span>
                  ) : null}
                </Button>

                {notifOpen ? (
                  <div className="absolute right-0 top-11 z-50 w-80 rounded-lg border border-border bg-card p-2 shadow-lg">
                    <div className="px-2 pb-2 text-sm font-medium">Notifications</div>
                    <div className="max-h-72 space-y-1 overflow-auto">
                      {notifications.map((n) => (
                        <div key={n.id} className="rounded-md border border-border p-2">
                          <div className="text-sm font-medium">{n.title}</div>
                          <div className="text-xs text-muted-foreground">{n.detail}</div>
                        </div>
                      ))}
                      {notifications.length === 0 ? <div className="px-2 py-4 text-sm text-muted-foreground">Aucune notification</div> : null}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="relative">
                <button
                  className="flex h-9 items-center gap-2 rounded-md border border-input px-2 text-sm"
                  onClick={() => {
                    setProfileOpen((v) => !v);
                    setNotifOpen(false);
                  }}
                  type="button"
                >
                  <UserCircle2 className="h-5 w-5" />
                  <span className="hidden sm:inline">{session?.role ?? "staff"}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>

                {profileOpen ? (
                  <div className="absolute right-0 top-11 z-50 w-52 rounded-lg border border-border bg-card p-1 shadow-lg">
                    <Link href="/settings" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent">
                      <Settings className="h-4 w-4" />
                      Paramètres
                    </Link>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-accent"
                      onClick={() => {
                        clearSession();
                        router.replace("/login");
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                      Déconnexion
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </header>
          <main className="flex-1 p-4">{children}</main>
        </div>
      </div>
    </div>
  );
}
