"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import NavbarLogo from "@/components/NavbarLogo";
import {
  Bell,
  CalendarDays,
  ChevronDown,
  FileText,
  Heart,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Settings,
  Users,
  Microscope,
  Upload,
  UserPlus,
  Stethoscope,
  Activity,
  FileUp,
  Pill,
  MessageCircle
} from "lucide-react";
import { Toaster } from "sonner";

import { cn } from "@/lib/cn";
import { clearSession, getSession } from "@/lib/auth/storage";
import { useI18n } from "@/lib/i18n/client";
import { getDir } from "@/lib/i18n/messages";
import { apiFetch } from "@/lib/api/client";
import { addNotificationListener } from "@/lib/notifications";
import NavbarLogo from "@/components/NavbarLogo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

type HeaderNotification = { id: string; title: string; detail: string; type?: string; is_read?: boolean; patient_id?: string; related_id?: string };

const allStaffNav = [
  { href: "/dashboard", icon: LayoutDashboard, labelKey: "Tableau de bord", permKey: undefined },
  { href: "/dashboard/patients", icon: Users, labelKey: "patients", permKey: "can_view_patients" },
  { href: "/dashboard/agenda", icon: CalendarDays, labelKey: "agenda", permKey: "can_view_appointments" },
  { href: "/dashboard/suive", icon: HeartPulse, labelKey: "suivi", permKey: "can_view_suive" },
  { href: "/dashboard/analyse", icon: Microscope, labelKey: "analyse", permKey: "can_view_documents" },
  { href: "/dashboard/prescriptions", icon: FileText, labelKey: "prescriptions", permKey: "can_view_prescriptions" },
  { href: "/dashboard/chat", icon: MessageSquare, labelKey: "chat", permKey: "can_view_chat" }
];

const patientNav = [
  { href: "/patient/profile", icon: FileText, labelKey: "myFile" },
  { href: "/patient", icon: Activity, labelKey: "myVitals" },
  { href: "/patient/documents", icon: Upload, labelKey: "documents" },
  { href: "/patient/consultations", icon: Stethoscope, labelKey: "consultations" },
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
  if (pathname.includes("/dashboard/suive")) {
    return { title: "Suivi médical", subtitle: "Constantes vitales et évolution" };
  }
  if (pathname.includes("/dashboard/prescriptions")) {
    return { title: "Prescriptions", subtitle: "Gestion des ordonnances" };
  }
  if (pathname.includes("/dashboard/chat")) {
    return { title: "Messagerie", subtitle: "Discussions d'équipe" };
  }
  if (pathname.includes("/dashboard/analyse")) {
    return { title: "Analyse", subtitle: "Analyse des documents patients" };
  }
  if (pathname.includes("/dashboard/parametres")) {
    return { title: "Paramètres", subtitle: "Configuration du cabinet" };
  }
  if (pathname === "/dashboard") {
    return { title: "Tableau de bord", subtitle: "Tableau de bord général" };
  }
  if (pathname.includes("/patient/documents")) {
    return { title: "myDocs", subtitle: "uploadViewDocs" };
  }
  if (pathname.includes("/patient/chat")) {
    return { title: "myChat", subtitle: "chatWithDoctor" };
  }
  if (pathname.includes("/patient/profile")) {
    return { title: "myInfo", subtitle: "personalInfo" };
  }
  if (pathname.includes("/patient/consultations")) {
    return { title: "consultations", subtitle: "consultationHistory" };
  }
  if (pathname.includes("/patient")) {
    return { title: "patientSpace", subtitle: "healthFollowUp" };
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

    const [summary, staffChat, serverNotifs] = await Promise.all([
      apiFetch<{
        unreadStaffMessages: number;
        criticalAlerts: Array<{ patient_id: string; first_name: string; last_name: string; spo2: number | null; heart_rate: number | null }>;
        appointmentsToday: Array<{ id: string; first_name: string; last_name: string; starts_at: string; status: string }>;
      }>("/api/dashboard/summary"),
      apiFetch<any[] | { items: Array<{ id: string; sender_role: string; sender_id: string; content: string; is_read: boolean }> }>("/api/chat?channel=staff"),
      apiFetch<any[]>("/api/notifications")
    ]);

    const chatItems = Array.isArray(staffChat) ? staffChat : (staffChat as any).items ?? [];
    const unreadMessages = chatItems.filter((m: any) => m.sender_role !== session.role && !m.is_read);
    setChatUnreadCount(unreadMessages.length);

    const notifRows = (serverNotifs || []).slice(0, 10).map((n: any) => ({
      id: `notif-${n.id}`,
      title: n.title,
      detail: n.message || "",
      type: n.type,
      is_read: n.is_read,
      patient_id: n.patient_id,
      related_id: n.related_id
    }));

    const alertRows = (summary.criticalAlerts || []).slice(0, 3).map((x) => ({
      id: `alert-${x.patient_id}`,
      title: `Alerte: ${x.last_name} ${x.first_name}`,
      detail: `${typeof x.spo2 === "number" ? `SpO2 ${x.spo2}%` : ""} ${typeof x.heart_rate === "number" ? `FC ${x.heart_rate} bpm` : ""}`.trim(),
      type: "critical_alert",
      patient_id: x.patient_id
    }));

    const urgentRows = (summary.appointmentsToday || [])
      .filter((a) => a.status === "urgent")
      .slice(0, 2)
      .map((a) => ({
        id: `rdv-${a.id}`,
        title: `RDV urgent: ${a.last_name} ${a.first_name}`,
        detail: new Date(a.starts_at).toLocaleTimeString(),
        type: "urgent_appointment"
      }));

    const messageRows = unreadMessages.slice(-3).reverse().map((m: any) => ({
      id: `msg-${m.id}`,
      title: `Message de ${m.sender_role === "admin" ? "Dr. Tremblay" : "Secrétaire"}`,
      detail: (m.content || "").substring(0, 50),
      type: "chat_message"
    }));

    setNotifications([...notifRows, ...alertRows, ...messageRows, ...urgentRows]);
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
            detail: notification.detail,
            type: notification.type
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
        {!isPatientRoute && (
        <aside className={cn(
          "fixed inset-y-0 z-50 w-[250px] bg-[#2f3b8f] flex flex-col",
          isRTL ? "right-0 border-l border-white/10" : "left-0 border-r border-white/10"
        )}>
          <div className="flex flex-col flex-1 min-h-0">
            <div className="p-5 border-b border-white/10">
              <NavbarLogo href="/dashboard" />
            </div>

            <nav className="sidebar-nav mt-6 px-4 space-y-0.5 overflow-y-auto flex-1">
              {navItems.map((item) => {
                const active = pathname === item.href || pathname?.startsWith(item.href + "/");
                const Icon = item.icon;
                const isDashboard = item.href === "/dashboard";
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm transition-all",
                      isRTL ? "flex-row-reverse" : "",
                      isDashboard
                        ? "text-white/70 hover:bg-white/10"
                        : active
                          ? "bg-white text-[#2f3b8f] font-semibold"
                          : "text-white hover:bg-white/10"
                    )}
                  >
                    <Icon className={cn("h-5 w-5", isDashboard ? "text-white/50" : active ? "text-[#2f3b8f]" : "text-white/70")} />
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
          </div>

          <div className="p-4 border-t border-white/10 space-y-2 mt-auto">
            {session?.role !== "patient" && (
              <button
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all",
                  isRTL ? "flex-row-reverse" : "",
                  pathname === "/dashboard/parametres" || pathname?.startsWith("/dashboard/parametres/")
                    ? "bg-white text-[#2f3b8f] font-semibold"
                    : "text-white hover:bg-white/10"
                )}
                onClick={() => router.push("/dashboard/parametres")}
              >
                <Settings className="h-5 w-5 text-white/70" />
                <span>{t("settings")}</span>
              </button>
            )}
            <button
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all text-white hover:bg-white/10",
                isRTL ? "flex-row-reverse" : ""
              )}
              onClick={() => {
                clearSession();
                router.replace("/login");
              }}
            >
              <LogOut className="h-5 w-5 text-white/70" />
              <span>{t("logout")}</span>
            </button>
          </div>
        </aside>
        )}

        <div className={cn("flex flex-1 flex-col", isRTL ? "pr-[250px]" : "pl-[250px]", isPatientRoute && "!pl-0 !pr-0")}>
          {isPatientRoute && (
            <div className="bg-emerald-600 text-white px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <NavbarLogo href="/patient" inverted />
              </div>
              <div className="flex items-center gap-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex h-8 items-center justify-center gap-1 rounded-full bg-white/20 pl-1.5 pr-2 text-white transition-all hover:bg-white/30 focus:outline-none active:scale-95">
                      {renderFlag(locale)}
                      <ChevronDown className="h-3 w-3 opacity-80" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-auto">
                    <div className="flex gap-1 p-1">
                      <button type="button" onClick={() => { setLocale("fr"); }} className={cn("rounded-md p-2 transition-colors flex items-center justify-center", locale === "fr" ? "bg-blue-100 ring-2 ring-blue-500" : "hover:bg-muted")}>{renderFlag("fr")}</button>
                      <button type="button" onClick={() => { setLocale("en"); }} className={cn("rounded-md p-2 transition-colors flex items-center justify-center", locale === "en" ? "bg-blue-100 ring-2 ring-blue-500" : "hover:bg-muted")}>{renderFlag("en")}</button>
                      <button type="button" onClick={() => { setLocale("ar"); }} className={cn("rounded-md p-2 transition-colors flex items-center justify-center", locale === "ar" ? "bg-blue-100 ring-2 ring-blue-500" : "hover:bg-muted")}>{renderFlag("ar")}</button>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="relative flex h-8 w-8 items-center justify-center rounded-full text-white/80 hover:bg-white/20 transition-all focus:outline-none active:scale-95">
                      <Bell className="h-5 w-5" />
                      {totalNotif > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-emerald-600">
                          {totalNotif}
                        </span>
                      )}
                    </button>
                  </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 overflow-visible">
                    <DropdownMenuLabel className="flex items-center justify-between">
                      <span>Notifications</span>
                      {totalNotif > 0 && (
                        <button type="button" className="text-[10px] font-medium text-primary" onClick={async () => { await apiFetch("/api/notifications/mark-read", { method: "POST" }).catch(() => {}); setNotifications([]); }}>
                          Tout marquer comme lu
                        </button>
                      )}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <div className="max-h-72 overflow-y-auto notif-scroll">
                    {notifications.length === 0 ? (
                      <div className="px-2 py-4 text-center text-sm text-muted-foreground">Aucune notification</div>
                    ) : (
                      notifications.map((n: HeaderNotification) => {
                        let Icon = Bell;
                        if (n.type === "patient_created") Icon = UserPlus;
                        else if (n.type === "consultation_added") Icon = Stethoscope;
                        else if (n.type === "vitals_added") Icon = Activity;
                        else if (n.type === "document_uploaded") Icon = FileUp;
                        else if (n.type === "prescription_created") Icon = Pill;
                        else if (n.type === "chat_message") Icon = MessageCircle;
                        else if (n.type === "critical_alert") Icon = Heart;
                        else if (n.type === "urgent_appointment") Icon = CalendarDays;
                        return (
                          <div
                            key={n.id}
                            className="rounded-md border border-border/50 p-2 m-1 flex items-start gap-2 cursor-pointer hover:bg-accent transition-colors"
                            onClick={() => {
                              switch (n.type) {
                                case "patient_created":
                                case "vitals_added":
                                  router.push("/dashboard/patients");
                                  break;
                                case "consultation_added":
                                  router.push(`/dashboard/patients?patientId=${n.patient_id || ""}&tab=consultations`);
                                  break;
                                case "document_uploaded":
                                  router.push(`/dashboard/patients?patientId=${n.patient_id || ""}&tab=documents`);
                                  break;
                                case "prescription_created":
                                  router.push(`/dashboard/patients?patientId=${n.patient_id || ""}&tab=ordonnances`);
                                  break;
                                case "chat_message":
                                  router.push("/dashboard/chat");
                                  break;
                                case "appointment_created":
                                case "urgent_appointment":
                                  router.push("/dashboard/agenda");
                                  break;
                                case "critical_alert":
                                  router.push("/dashboard");
                                  break;
                              }
                            }}
                          >
                            <Icon className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0" />
                            <div className="min-w-0">
                              <div className="text-sm font-medium">{n.title}</div>
                              <div className="text-xs text-muted-foreground truncate">{n.detail}</div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </DropdownMenuContent>
                </DropdownMenu>
                <button
                  className="flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors"
                  onClick={() => { clearSession(); router.replace("/login"); }}
                >
                  <LogOut className="h-4 w-4" />
                  {t("logout" as any)}
                </button>
              </div>
            </div>
          )}
          {!isPatientRoute && (
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border/50 bg-background/95 px-6 backdrop-blur">
            {/* Left side: Logo + Page Title and Subtitle */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex">
                <NavbarLogo href="/dashboard" />
              </div>
              <div className="flex sm:hidden">
                <NavbarLogo href="/dashboard" iconOnly />
              </div>
              <div className="hidden sm:block w-px h-8 bg-border/60" />
              <div className={cn("flex flex-col justify-center select-none", isRTL ? "text-right" : "text-left")}>
                <h1 className="text-sm sm:text-base font-bold text-foreground leading-none">{headerInfo.title}</h1>
                <span className="text-[10px] sm:text-xs text-muted-foreground mt-1.5 font-medium leading-none">{headerInfo.subtitle}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
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
                    <button type="button" onClick={() => { setLocale("fr"); }} className={cn("rounded-md p-2 transition-colors flex items-center justify-center", locale === "fr" ? "bg-blue-100 ring-2 ring-blue-500" : "hover:bg-muted")}>{renderFlag("fr")}</button>
                    <button type="button" onClick={() => { setLocale("en"); }} className={cn("rounded-md p-2 transition-colors flex items-center justify-center", locale === "en" ? "bg-blue-100 ring-2 ring-blue-500" : "hover:bg-muted")}>{renderFlag("en")}</button>
                    <button type="button" onClick={() => { setLocale("ar"); }} className={cn("rounded-md p-2 transition-colors flex items-center justify-center", locale === "ar" ? "bg-blue-100 ring-2 ring-blue-500" : "hover:bg-muted")}>{renderFlag("ar")}</button>
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
                      <button type="button" className="text-[10px] font-medium text-primary" onClick={async () => { await apiFetch("/api/notifications/mark-read", { method: "POST" }).catch(() => {}); setNotifications([]); }}>
                        Tout marquer comme lu
                      </button>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="max-h-72 overflow-auto">
                    {notifications.length === 0 ? (
                      <div className="px-2 py-4 text-center text-sm text-muted-foreground">Aucune notification</div>
                    ) : (
                      notifications.map((n: HeaderNotification) => {
                        let Icon = Bell;
                        if (n.type === "patient_created") Icon = UserPlus;
                        else if (n.type === "consultation_added") Icon = Stethoscope;
                        else if (n.type === "vitals_added") Icon = Activity;
                        else if (n.type === "document_uploaded") Icon = FileUp;
                        else if (n.type === "prescription_created") Icon = Pill;
                        else if (n.type === "chat_message") Icon = MessageCircle;
                        else if (n.type === "critical_alert") Icon = Heart;
                        else if (n.type === "urgent_appointment") Icon = CalendarDays;
                        return (
                          <div key={n.id} className="rounded-md border border-border/50 p-2 m-1 flex items-start gap-2">
                            <Icon className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0" />
                            <div className="min-w-0">
                              <div className="text-sm font-medium">{n.title}</div>
                              <div className="text-xs text-muted-foreground truncate">{n.detail}</div>
                            </div>
                          </div>
                        );
                      })
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
                  <DropdownMenuItem className="text-destructive" onClick={() => { clearSession(); router.replace("/login"); }}>
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          )}

          <main className="p-6">
            <Toaster position="top-right" richColors />
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
