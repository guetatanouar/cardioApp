"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  ChevronDown,
  Moon,
  Search,
  Sun,
  Activity,
} from "lucide-react";
import { useTheme } from "next-themes";

import { clearSession, getSession } from "@/lib/auth/storage";
import { useI18n, locales } from "@/lib/i18n/client";
import { apiFetch } from "@/lib/api/client";
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

interface HeaderProps {
  isPatientPortal?: boolean;
}

export function Header({ isPatientPortal = false }: HeaderProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { locale, setLocale } = useI18n();

  const session = typeof window !== "undefined" ? getSession() : null;

  const [search, setSearch] = React.useState("");
  const [notifications, setNotifications] = React.useState<HeaderNotification[]>([]);

  async function refreshHeaderData() {
    if (!session) return;

    try {
      if (session.role === "patient") {
        const channel = `patient:${session.userId}`;
        const chat = await apiFetch<any[] | { items: Array<{ id: string; sender_role: string; content: string; is_read: boolean }> }>(
          `/api/chat?channel=${encodeURIComponent(channel)}`
        );
        const chatItems = Array.isArray(chat) ? chat : (chat as any).items ?? [];
        setNotifications(
          chatItems
            .filter((m) => m.sender_role !== "patient" && !m.is_read)
            .slice(-5)
            .reverse()
            .map((m) => ({
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
        apiFetch<any[] | { items: Array<{ id: string; from_role: string; from_name: string; text: string; is_read: boolean }> }>("/api/chat?channel=staff")
      ]);

      const chatItems = Array.isArray(staffChat) ? staffChat : (staffChat as any).items ?? [];
      const unreadMessages = chatItems.filter((m) => m.from_role !== session.role && !m.is_read);

      const alertRows = (summary.criticalAlerts || []).slice(0, 3).map((x) => ({
        id: `alert-${x.patient_id}`,
        title: `Alerte: ${x.last_name} ${x.first_name}`,
        detail: `${typeof x.spo2 === "number" ? `SpO2 ${x.spo2}%` : ""} ${typeof x.heart_rate === "number" ? `FC ${x.heart_rate} bpm` : ""}`.trim()
      }));

      const messageRows = unreadMessages.slice(-3).reverse().map((m) => ({
        id: `msg-${m.id}`,
        title: `Message de ${m.from_name || m.from_role}`,
        detail: (m.text || m.content || "").substring(0, 50)
      }));

      const urgentRows = (summary.appointmentsToday || [])
        .filter((a) => a.status === "urgent")
        .slice(0, 2)
        .map((a) => ({
          id: `rdv-${a.id}`,
          title: `RDV urgent: ${a.last_name} ${a.first_name}`,
          detail: new Date(a.starts_at).toLocaleTimeString()
        }));

      setNotifications([...alertRows, ...messageRows, ...urgentRows]);
    } catch (error) {
      console.error("Failed to refresh header data", error);
    }
  }

  React.useEffect(() => {
    refreshHeaderData();
    const timer = setInterval(refreshHeaderData, 10000);
    return () => clearInterval(timer);
  }, [session]);

  const fullName = session?.fullName ?? (session?.role === "patient" ? "Espace patient" : "Personnel médical");
  const shortName = fullName.split(" ").slice(-1)[0] ?? fullName;
  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0])
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-border/50 bg-background/80 px-6 backdrop-blur-xl shadow-sm transition-all">
      <div className="flex items-center gap-4 w-full max-w-md">
        {isPatientPortal && (
          <div className="flex items-center gap-3 mr-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 shadow-md">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold tracking-tight text-lg hidden sm:inline text-foreground">CardioManager</span>
          </div>
        )}
        {!isPatientPortal && (
          <form
            className="w-full"
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
                className="pl-9 h-9"
              />
            </div>
          </form>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Language selector (FR) styled as a squircle */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex h-9 w-9 items-center justify-center rounded-xl border border-input bg-background text-xs font-bold text-foreground shadow-sm transition-all hover:bg-accent hover:text-accent-foreground focus:outline-none active:scale-95">
              {locale.toUpperCase()}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-44">
            <DropdownMenuLabel>Langue</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {locales.map((l) => (
              <DropdownMenuItem key={l} onClick={() => setLocale(l)}>
                <span className="mr-2">{l === "fr" ? "🇫🇷" : l === "en" ? "🇬🇧" : "🇸🇦"}</span>
                {l === "fr" ? "Français" : l === "en" ? "English" : "العربية"}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme Toggle styled consistently */}
        <Button 
          variant="outline" 
          size="sm" 
          className="h-9 w-9 p-0 rounded-xl hover:bg-accent active:scale-95 transition-all" 
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {/* Notification Bell with red badge */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="relative flex h-9 w-9 items-center justify-center rounded-full text-foreground hover:bg-accent transition-all focus:outline-none active:scale-95">
              <Bell className="h-5 w-5 stroke-[1.8]" />
              {notifications.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-background">
                  {notifications.length}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              {notifications.length > 0 && (
                <button className="text-[10px] text-primary hover:underline" onClick={() => setNotifications([])}>
                  Tout marquer comme lu
                </button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">Aucune notification</div>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className="p-3 hover:bg-muted/50 transition-colors border-b last:border-0">
                    <div className="text-xs font-semibold">{n.title}</div>
                    <div className="text-[10px] text-muted-foreground mt-1">{n.detail}</div>
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
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="text-xs font-semibold">{fullName}</div>
              <div className="text-[10px] text-muted-foreground capitalize">{session?.role}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push(isPatientPortal ? "/patient" : "/dashboard/parametres")}>
              Mon profil
            </DropdownMenuItem>
            {!isPatientPortal && (
              <DropdownMenuItem onClick={() => router.push("/dashboard/parametres")}>
                Paramètres
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
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
  );
}
