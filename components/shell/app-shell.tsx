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
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Settings,
  Search,
  Users
} from "lucide-react";

import { cn } from "@/lib/cn";
import { clearSession, getSession } from "@/lib/auth/storage";
import { useI18n } from "@/lib/i18n/client";
import { getDir } from "@/lib/i18n/messages";
import { apiFetch } from "@/lib/api/client";
import { addNotificationListener } from "@/lib/notifications";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const allStaffNav = [
  { href: "/dashboard", icon: LayoutDashboard, labelKey: "Tableau de bord", permKey: undefined },
  { href: "/dashboard/patients", icon: Users, labelKey: "patients", permKey: "can_view_patients" },
  { href: "/dashboard/agenda", icon: CalendarDays, labelKey: "agenda", permKey: "can_view_appointments" },
  { href: "/dashboard/prescriptions", icon: FileText, labelKey: "prescriptions", permKey: "can_view_prescriptions" },
  { href: "/dashboard/chat", icon: MessageSquare, labelKey: "chat", permKey: "can_view_chat" }
];

const patientNav = [
  { href: "/patient", icon: LayoutDashboard, labelKey: "Tableau de bord" },
  { href: "/patient/documents", icon: FileText, labelKey: "documents" },
  { href: "/patient/chat", icon: MessageSquare, labelKey: "chat" }
];

const renderFlag = (lang: string) => {
  if (lang === "fr") {
    return (
      <svg viewBox="0 0 30 30" className="h-4 w-4 rounded-full overflow-hidden shadow-sm border border-slate-100 flex-shrink-0">
        <rect x="0" y="0" width="10" height="30" fill="#002654" />
        <rect x="10" y="0" width="10" height="30" fill="#FFFFFF" />
        <rect x="20" y="0" width="10" height="30" fill="#ED2939" />
      </svg>
    );
  }
  if (lang === "en") {
    return (
      <svg viewBox="0 0 30 30" className="h-4 w-4 rounded-full overflow-hidden shadow-sm border border-slate-100 flex-shrink-0">
        <rect width="30" height="30" fill="#012169" />
        <path d="M0 0 L30 30 M30 0 L0 30" stroke="#ffffff" strokeWidth="3" />
        <path d="M0 0 L30 30 M30 0 L0 30" stroke="#C8102E" strokeWidth="1.8" />
        <path d="M15 0 V30 M0 15 H30" stroke="#ffffff" strokeWidth="6" />
        <path d="M15 0 V30 M0 15 H30" stroke="#C8102E" strokeWidth="3.6" />
      </svg>
    );
  }
  if (lang === "ar") {
    return (
      <svg viewBox="0 0 30 30" className="h-4 w-4 rounded-full overflow-hidden shadow-sm border border-slate-100 flex-shrink-0">
        <rect width="30" height="30" fill="#006C35" />
        <path d="M8 11 C10 9, 12 9, 14 11 C16 13, 18 9, 22 11" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <path d="M8 14 C10 12, 12 12, 14 14 C16 16, 18 12, 22 14" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" fill="none" />
        <path d="M7 17 H23 M9 16 V18" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    );
  }
  return null;
};

const getHeaderTitleInfo = (pathname: string) => {
  if (pathname.includes("/dashboard/agenda")) {
    return { title: "Agenda", subtitle: "Gestion des rendez-vous" };
  }
  if (pathname.includes("/dashboard/patients")) {
    return { title: "Patients", subtitle: "Suivi et dossiers médicaux" };
  }
  if (pathname.includes("/dashboard/prescriptions")) {
    return { title: "Suivi médical", subtitle: "Constantes vitales et évolution" };
  }
  if (pathname.includes("/dashboard/chat")) {
    return { title: "Messagerie", subtitle: "Discussions d'équipe" };
  }
  if (pathname.includes("/dashboard/parametres")) {
    return { title: "Paramètres", subtitle: "Configuration du cabinet" };
  }
  if (pathname === "/dashboard") {
    return { title: "Tableau de bord", subtitle: "Tableau de bord général" };
  }
  if (pathname.includes("/patient/documents")) {
    return { title: "Mes Documents", subtitle: "Consultez vos ordonnances" };
  }
  if (pathname.includes("/patient/chat")) {
    return { title: "Mon Cardiologue", subtitle: "Discutez en direct avec le cabinet" };
  }
  if (pathname.includes("/patient")) {
    return { title: "Espace Patient", subtitle: "Suivi de votre santé" };
  }
  return { title: "CardioManager", subtitle: "Cabinet de cardiologie" };
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const headerInfo = React.useMemo(() => {
    return getHeaderTitleInfo(pathname || "");
  }, [pathname]);
  const router = useRouter();
  const { locale, setLocale, t } = useI18n();

  const session = typeof window !== "undefined" ? getSession() : null;
  const isAuthRoute = pathname?.startsWith("/login") || pathname?.startsWith("/patient/login");
  const isPatientRoute = pathname?.startsWith("/patient");

  const navItems = React.useMemo(() => {
    if (!session) return patientNav;
    if (session.role === "patient") return patientNav;
    if (session.role === "admin") return allStaffNav;
    return allStaffNav.filter(item => {
      if (!item.permKey) return true;
      if (item.permKey === "is_admin") return false;
      return session?.permissions?.[item.permKey as keyof typeof session.permissions];
    });
  }, [session, patientNav, allStaffNav]);

  const [notifications, setNotifications] = React.useState<HeaderNotification[]>([]);
  const [chatUnreadCount, setChatUnreadCount] = React.useState(0);
  const [search, setSearch] = React.useState("");

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
    if (!session || session.role === "admin" || session.role === "patient" || isAuthRoute) return;
    if (!session.permissions) return;
    const path = pathname || "";
    const isAllowed = allStaffNav.some(item => {
      if (path !== item.href && !path.startsWith(item.href + "/")) return false;
      if (!item.permKey) return true;
      if (item.permKey === "is_admin") return false;
      return session.permissions?.[item.permKey as keyof typeof session.permissions];
    });
    if (!isAllowed) router.replace("/dashboard");
  }, [session, pathname, isAuthRoute, router]);

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
    }, 10000);

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [session?.role, session?.userId, isAuthRoute]);

  React.useEffect(() => {
    const cleanup = addNotificationListener((notification) => {
      setNotifications((prev) => {
        const exists = prev.some((n) => n.id === notification.id);
        if (exists) return prev;
        return [
          {
            id: notification.id,
            title: notification.title,
            detail: notification.detail
          },
          ...prev.slice(0, 9)
        ];
      });
    });
    return cleanup;
  }, []);

  if (!session && !isAuthRoute) {
    return <div className="min-h-screen bg-background" />;
  }

  if (isAuthRoute) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  const totalNotif = notifications.length;

  const fullName = session?.fullName ?? (session?.role === "patient" ? "Espace patient" : "Personnel médical");
  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0])
    .join("")
    .toUpperCase();

  const isRTL = locale === "ar";

  return (
    <div className="min-h-screen bg-background">
      <div className={cn("flex", isRTL && "flex-row-reverse")}>
        <aside className={cn(
          "fixed inset-y-0 z-50 w-60 bg-gradient-to-b from-blue-600 to-blue-800 border-blue-700",
          isRTL ? "right-0 border-l" : "left-0 border-r"
        )}>
          <div className={cn("flex h-16 items-center gap-2 border-b border-blue-700/50 px-4", isRTL && "flex-row-reverse")}>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm">
              <Heart className="h-5 w-5 text-red-500 fill-red-500" />
            </div>
            <div className={cn("leading-tight", isRTL && "text-right")}>
              <div className="text-sm font-semibold text-white">{t("appName")}</div>
              <div className="text-xs text-white/70">{t("cabinetCardio")}</div>
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
                    isRTL ? "flex-row-reverse" : "",
                    active ? "bg-white/20 text-white font-medium" : "text-white/80 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{t(item.labelKey as any)}</span>
                  {item.href.includes("chat") && chatUnreadCount > 0 ? (
                    <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-medium text-white">
                      {chatUnreadCount}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-blue-700/50 p-3 space-y-1">
            {session?.role !== "patient" && (
              <Button
                variant="ghost"
                className={cn(
                  "w-full text-white/80 hover:bg-white/10 hover:text-white",
                  isRTL ? "justify-end flex-row-reverse" : "justify-start"
                )}
                onClick={() => router.push("/dashboard/parametres")}
              >
                <Settings className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                {t("settings")}
              </Button>
            )}
            <Button
              variant="ghost"
              className={cn(
                "w-full text-white/80 hover:bg-white/10 hover:text-white",
                isRTL ? "justify-end flex-row-reverse" : "justify-start"
              )}
              onClick={() => {
                clearSession();
                router.replace("/login");
              }}
            >
              <LogOut className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
              {t("logout")}
            </Button>
          </div>
        </aside>

        <div className={cn("flex flex-1 flex-col", isRTL ? "pr-60" : "pl-60")}>
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border/50 bg-background/95 px-6 backdrop-blur">
            {/* Left side: Page Title and Subtitle */}
            <div className={cn("flex flex-col justify-center select-none", isRTL ? "text-right" : "text-left")}>
              <h1 className="text-sm sm:text-base font-bold text-foreground leading-none">
                {headerInfo.title}
              </h1>
              <span className="text-[10px] sm:text-xs text-muted-foreground mt-1.5 font-medium leading-none">
                {headerInfo.subtitle}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Search Box on the Right */}
              {!isPatientRoute && !isAuthRoute && (
                <form
                  className="w-48 sm:w-64 md:w-80"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const q = search.trim();
                    if (!q) return;
                    router.push(`/dashboard/patients?q=${encodeURIComponent(q)}`);
                  }}
                >
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Rechercher un patient..."
                      className="pl-9 h-9 w-full bg-slate-50 border-slate-200 text-sm focus-visible:bg-background rounded-full transition-all focus:border-blue-400"
                    />
                  </div>
                </form>
              )}
              {/* Language Selector (Pill with Flag & Chevron) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex h-8 items-center justify-center gap-1 rounded-full bg-slate-100 pl-1.5 pr-2 text-foreground transition-all hover:bg-slate-200 focus:outline-none active:scale-95">
                    {renderFlag(locale)}
                    <ChevronDown className="h-3 w-3 opacity-60" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-auto">
                  <div className="flex gap-1 p-1">
                    <button
                      type="button"
                      onClick={() => { setLocale("fr"); }}
                      className={cn(
                        "rounded-md p-2 transition-colors flex items-center justify-center",
                        locale === "fr" ? "bg-blue-100 ring-2 ring-blue-500" : "hover:bg-muted"
                      )}
                    >
                      {renderFlag("fr")}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setLocale("en"); }}
                      className={cn(
                        "rounded-md p-2 transition-colors flex items-center justify-center",
                        locale === "en" ? "bg-blue-100 ring-2 ring-blue-500" : "hover:bg-muted"
                      )}
                    >
                      {renderFlag("en")}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setLocale("ar"); }}
                      className={cn(
                        "rounded-md p-2 transition-colors flex items-center justify-center",
                        locale === "ar" ? "bg-blue-100 ring-2 ring-blue-500" : "hover:bg-muted"
                      )}
                    >
                      {renderFlag("ar")}
                    </button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Notification Bell with red badge */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="relative flex h-9 w-9 items-center justify-center rounded-full text-foreground hover:bg-accent transition-all focus:outline-none active:scale-95">
                    <Bell className="h-5 w-5 stroke-[1.8]" />
                    {totalNotif > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-background">
                        {totalNotif}
                      </span>
                    )}
                  </button>
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

              {/* User Avatar with Initials (DP) styled as a blue circle */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex h-9 w-9 items-center justify-center rounded-full overflow-hidden transition-all focus:outline-none active:scale-95">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="text-xs font-bold bg-[#3B82F6] text-white flex items-center justify-center w-full h-full rounded-full select-none tracking-wide">
                        {initials || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </button>
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
