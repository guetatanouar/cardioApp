"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Bell, ChevronDown, Heart, LogOut, UserPlus, Stethoscope, Activity, FileUp, Pill, MessageCircle, CalendarDays } from "lucide-react";
import { getSession, clearSession } from "@/lib/auth/storage";
import { LogOut } from "lucide-react";

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
