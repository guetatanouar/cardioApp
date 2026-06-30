"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Bell, ChevronDown, Heart, LogOut, UserPlus, Stethoscope, Activity, FileUp, Pill, MessageCircle, CalendarDays } from "lucide-react";
import { getSession, clearSession } from "@/lib/auth/storage";
import { useI18n } from "@/lib/i18n/client";
import { getDir } from "@/lib/i18n/messages";
import { apiFetch } from "@/lib/api/client";
import { addNotificationListener } from "@/lib/notifications";
import { cn } from "@/lib/cn";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

type HeaderNotification = { id: string; title: string; detail: string; type?: string; is_read?: boolean };

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

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { locale, setLocale, t } = useI18n();
  const session = typeof window !== "undefined" ? getSession() : null;
  const [mounted, setMounted] = React.useState(false);
  const [notifications, setNotifications] = React.useState<HeaderNotification[]>([]);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (mounted && !session) {
      router.replace("/login");
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

  async function refreshNotifications() {
    if (!session) return;
    const channel = `patient:${session.userId}`;
    const [chat, serverNotifs] = await Promise.all([
      apiFetch<any[] | { items: Array<{ id: string; sender_role: string; text: string; content: string; is_read: boolean }> }>(
        `/api/chat?channel=${encodeURIComponent(channel)}`
      ),
      apiFetch<any[]>("/api/notifications").catch(() => []),
    ]);
    const chatItems = Array.isArray(chat) ? chat : (chat as any).items ?? [];
    const notifRows = (serverNotifs || []).slice(0, 10).map((n: any) => ({
      id: `notif-${n.id}`,
      title: n.title,
      detail: n.message || "",
      type: n.type,
      is_read: n.is_read
    }));
    const messageRows = chatItems
      .filter((m: any) => m.sender_role !== "patient")
      .slice(-5)
      .reverse()
      .map((m: any) => ({
        id: `msg-${m.id}`,
        title: "Nouveau message",
        detail: m.text || m.content || "",
        type: "chat_message"
      }));
    setNotifications([...notifRows, ...messageRows]);
  }

  React.useEffect(() => {
    if (!mounted || !session) return;
    refreshNotifications().catch(() => undefined);
    const timer = setInterval(() => {
      refreshNotifications().catch(() => undefined);
    }, 10000);
    return () => clearInterval(timer);
  }, [mounted, session?.userId]);

  React.useEffect(() => {
    const cleanup = addNotificationListener((notification) => {
      setNotifications((prev) => {
        const exists = prev.some((n) => n.id === notification.id);
        if (exists) return prev;
        return [{ id: notification.id, title: notification.title, detail: notification.detail, type: notification.type }, ...prev.slice(0, 9)];
      });
    });
    return cleanup;
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-background" />;
  }

  if (!session) {
    return null;
  }

  const totalNotif = notifications.length;

  const isRTL = locale === "ar";

  return (
    <div className={cn("min-h-screen bg-background", isRTL && "rtl")}>
      <div className="h-14 bg-green-600 flex items-center justify-between px-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-green-600">
            <Heart className="h-5 w-5 fill-green-600" strokeWidth={0} />
          </div>
          <span className="text-white font-bold text-lg">CardioManager</span>
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
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-green-600">
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
          <button
            onClick={() => { clearSession(); router.replace("/login"); }}
            className="flex items-center gap-2 text-white/90 hover:text-white text-sm font-medium transition"
          >
            <LogOut className="h-4 w-4" />
            {t("logout" as any)}
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}
