"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  ChevronDown,
  Moon,
  Search,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";
import { clearSession, getSession } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { locales } from "@/lib/i18n";
import { apiFetch } from "@/lib/api";
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
  const { locale, setLocale, t } = useI18n();

  const session = typeof window !== "undefined" ? getSession() : null;

  const [search, setSearch] = React.useState("");
  const [notifications, setNotifications] = React.useState<HeaderNotification[]>([]);

  async function refreshHeaderData() {
    if (!session) return;

    try {
      if (session.role === "patient") {
        const channel = `patient:${session.userId}`;
        const chat = await apiFetch<{ items: Array<{ id: string; sender_role: string; content: string; is_read: boolean }> }>(
          `/api/chat?channel=${encodeURIComponent(channel)}`
        );
        setNotifications(
          chat.items
            .filter((m) => m.sender_role !== "patient" && !m.is_read)
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

      setNotifications([...alertRows, ...urgentRows]);
    } catch (error) {
      console.error("Failed to refresh header data", error);
    }
  }

  React.useEffect(() => {
    refreshHeaderData();
    const timer = setInterval(refreshHeaderData, 30000);
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
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-border bg-card/90 px-4 backdrop-blur">
      <div className="flex items-center gap-4 w-full max-w-md">
        {isPatientPortal && (
          <div className="flex items-center gap-2 mr-4">
            <div className="h-8 w-8 rounded-md bg-primary shadow-sm" />
            <span className="font-semibold text-sm hidden sm:inline">CardioManager</span>
          </div>
        )}
        {!isPatientPortal && (
          <form
            className="w-full"
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
                className="pl-9 h-9"
              />
            </div>
          </form>
        )}
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 h-9">
              <span className="text-base leading-none">{locale === "fr" ? "🇫🇷" : locale === "en" ? "🇬🇧" : "🇸🇦"}</span>
              <ChevronDown className="h-4 w-4 opacity-70" />
            </Button>
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

        <Button variant="outline" size="sm" className="h-9 w-9 p-0" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 h-9 relative">
              <Bell className="h-4 w-4" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-white">
                  {notifications.length}
                </span>
              )}
            </Button>
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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-md border border-input bg-background hover:bg-accent px-2 h-9 transition-colors">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">{initials}</AvatarFallback>
              </Avatar>
              <span className="text-xs font-medium hidden sm:inline">{shortName}</span>
              <ChevronDown className="h-3 w-3 opacity-50" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="text-xs font-semibold">{fullName}</div>
              <div className="text-[10px] text-muted-foreground capitalize">{session?.role}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push(isPatientPortal ? "/patient" : "/parametres")}>
              Mon profil
            </DropdownMenuItem>
            {!isPatientPortal && (
              <DropdownMenuItem onClick={() => router.push("/parametres")}>
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
