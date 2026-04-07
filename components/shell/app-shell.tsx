"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  CalendarDays,
  ChevronDown,
  FileText,
  Heart,
  Home,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Settings,
  Users
} from "lucide-react";

import { cn } from "@/lib/cn";
import { clearSession, getSession } from "@/lib/auth/storage";
import { useI18n } from "@/lib/i18n/client";
import { getDir } from "@/lib/i18n/messages";
import { apiFetch } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

type HeaderNotification = { id: string; title: string; detail: string };

const staffNav = [
  { href: "/dashboard", icon: Home, labelKey: "accueil" },
  { href: "/dashboard/patients", icon: Users, labelKey: "patients" },
  { href: "/dashboard/agenda", icon: CalendarDays, labelKey: "agenda" },
  { href: "/dashboard/prescriptions", icon: FileText, labelKey: "prescriptions" },
  { href: "/dashboard/chat", icon: MessageSquare, labelKey: "chat" },
  { href: "/dashboard/parametres", icon: Settings, labelKey: "settings" }
];

const patientNav = [
  { href: "/patient", icon: Home, labelKey: "accueil" },
  { href: "/patient/documents", icon: FileText, labelKey: "documents" },
  { href: "/patient/chat", icon: MessageSquare, labelKey: "chat" }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useI18n();

  const session = typeof window !== "undefined" ? getSession() : null;
  const isAuthRoute = pathname?.startsWith("/login") || pathname?.startsWith("/patient/login");
  const isPatientRoute = pathname?.startsWith("/patient");

  const [notifications, setNotifications] = React.useState<HeaderNotification[]>([]);
  const [chatUnreadCount, setChatUnreadCount] = React.useState(0);

  async function refreshHeaderData() {
    if (!session || isAuthRoute) return;

    if (session.role === "patient") {
      const channel = `patient:${session.userId}`;
      const chat = await apiFetch<any[] | { items: Array<{ id: string; sender_role: string; text: string; content: string; is_read: boolean }> }>(
        `/api/chat?channel=${encodeURIComponent(channel)}`
      );
      const chatItems = Array.isArray(chat) ? chat : (chat as any).items ?? [];
      const unread = chatItems.filter((m: any) => !m.is_read && m.sender_role !== "patient").length;
      setChatUnreadCount(unread);
      setNotifications(
        chatItems
          .filter((m: any) => m.sender_role !== "patient")
          .slice(-5)
          .reverse()
          .map((m: any) => ({
            id: m.id,
            title: "Nouveau message",
            detail: m.text || m.content || ""
          }))
      );
      return;
    }

    const [summary, staffChat] = await Promise.all([
      apiFetch<{
        unreadStaffMessages: number;
        criticalAlerts: Array<{ patient_id: string; first_name: string; last_name: string; spo2: number | null; heart_rate: number | null }>;
        appointmentsToday: Array<{ id: string; first_name: string; last_name: string; starts_at: string; status: string }>;
      }>("/api/dashboard/summary"),
      apiFetch<any[] | { items: Array<{ id: string; from_role: string; from_name: string; text: string; content: string; is_read: boolean }> }>("/api/chat?channel=staff")
    ]);

    const chatItems = Array.isArray(staffChat) ? staffChat : (staffChat as any).items ?? [];
    const unreadMessages = chatItems.filter((m: any) => m.from_role !== session.role && !m.is_read);
    setChatUnreadCount(unreadMessages.length);

    const alertRows = (summary.criticalAlerts || []).slice(0, 3).map((x) => ({
      id: `alert-${x.patient_id}`,
      title: `Alerte: ${x.last_name} ${x.first_name}`,
      detail: `${typeof x.spo2 === "number" ? `SpO2 ${x.spo2}%` : ""} ${typeof x.heart_rate === "number" ? `FC ${x.heart_rate} bpm` : ""}`.trim()
    }));

    const urgentRows = (summary.appointmentsToday || [])
      .filter((a) => a.status === "urgent")
      .slice(0, 2)
      .map((a) => ({
        id: `rdv-${a.id}`,
        title: `RDV urgent: ${a.last_name} ${a.first_name}`,
        detail: new Date(a.starts_at).toLocaleTimeString()
      }));

    const messageRows = unreadMessages.slice(-3).reverse().map((m: any) => ({
      id: `msg-${m.id}`,
      title: `Message de ${m.from_name || m.from_role}`,
      detail: (m.text || m.content || "").substring(0, 50)
    }));

    setNotifications([...alertRows, ...messageRows, ...urgentRows]);
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
    document.documentElement.dir = getDir("fr");
    document.documentElement.lang = "fr";
  }, []);

  React.useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;

    refreshHeaderData().catch(() => undefined);
    if (!session || isAuthRoute) return;

    timer = setInterval(() => {
      refreshHeaderData().catch(() => undefined);
    }, 10000);

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [session?.role, session?.userId, isAuthRoute]);

  if (!session && !isAuthRoute) {
    return <div className="min-h-screen bg-background" />;
  }

  if (isAuthRoute) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  const navItems = session?.role === "patient" ? patientNav : staffNav;
  const totalNotif = notifications.length;

  const fullName = session?.fullName ?? (session?.role === "patient" ? "Espace patient" : "Personnel médical");
  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0])
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <aside className="fixed inset-y-0 left-0 z-50 w-60 bg-gradient-to-b from-blue-600 to-blue-800 border-r border-blue-700">
          <div className="flex h-16 items-center gap-2 border-b border-blue-700/50 px-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm">
              <Heart className="h-5 w-5 text-red-500 fill-red-500" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-white">CardioManager</div>
              <div className="text-xs text-white/70">Cabinet cardiaque</div>
            </div>
          </div>
          <nav className="flex-1 space-y-1 p-3">
            {navItems.map((item) => {
              const active = pathname === item.href || pathname?.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                    active ? "bg-white/20 text-white font-medium" : "text-white/80 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{t(item.labelKey as any)}</span>
                  {item.href.includes("chat") && chatUnreadCount > 0 ? (
                    <span className="ml-auto rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-medium text-white">
                      {chatUnreadCount}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-blue-700/50 p-3">
            <Button
              variant="ghost"
              className="w-full justify-start text-white/80 hover:bg-white/10 hover:text-white"
              onClick={() => {
                clearSession();
                router.replace("/login");
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </Button>
          </div>
        </aside>

        <div className="flex flex-1 flex-col pl-60">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border/50 bg-background/95 px-6 backdrop-blur">
            <div />
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0 relative">
                    <Bell className="h-5 w-5" />
                    {totalNotif > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-medium text-white">
                        {totalNotif}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Notifications</span>
                    {totalNotif > 0 && (
                      <button type="button" className="text-[10px] font-medium text-primary" onClick={() => setNotifications([])}>
                        Tout marquer comme lu
                      </button>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="max-h-72 overflow-auto">
                    {notifications.length === 0 ? (
                      <div className="px-2 py-4 text-center text-sm text-muted-foreground">Aucune notification</div>
                    ) : (
                      notifications.map((n: HeaderNotification) => (
                        <div key={n.id} className="rounded-md border border-border/50 p-2 m-1">
                          <div className="text-sm font-medium">{n.title}</div>
                          <div className="text-xs text-muted-foreground">{n.detail}</div>
                        </div>
                      ))
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="h-8 w-8 cursor-pointer">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">{initials || "U"}</AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="text-sm font-semibold">{fullName}</div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {session?.role === "patient" ? "Patient" : session?.role === "admin" ? "Cardiologue" : "Secrétaire"}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push(session?.role === "patient" ? "/patient" : "/dashboard/parametres")}>
                    Mon profil
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => {
                      clearSession();
                      router.replace("/login");
                    }}
                  >
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main className="p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
