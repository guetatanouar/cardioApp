"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  FileText,
  MessageSquare,
  Settings,
  LogOut,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { clearSession, getSession } from "@/lib/auth/storage";
import { useI18n } from "@/lib/i18n/client";
import { Button } from "@/components/ui/button";

const staffNav = [
  { href: "/dashboard", icon: LayoutDashboard, labelKey: "dashboard" },
  { href: "/dashboard/patients", icon: Users, labelKey: "patients" },
  { href: "/dashboard/agenda", icon: CalendarDays, labelKey: "agenda" },
  { href: "/dashboard/prescriptions", icon: FileText, labelKey: "prescriptions" },
  { href: "/dashboard/chat", icon: MessageSquare, labelKey: "chat" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useI18n();
  const session = typeof window !== "undefined" ? getSession() : null;

  if (session?.role === "patient") return null;

  return (
    <aside className="hidden w-64 flex-col bg-[#0b1120] border-r border-[#1e293b] text-white md:flex transition-all duration-300">
      <div className="flex items-center gap-3 p-5 border-b border-white/5 bg-[#0b1120]">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.5)]">
          <Activity className="h-6 w-6 text-white" />
        </div>
        <div className="leading-tight">
          <div className="text-base font-bold tracking-tight">CardioManager</div>
          <div className="text-[10px] uppercase tracking-wider text-white/50 font-medium">Cabinet Médical</div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-6 px-3 custom-scrollbar">
        <div className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3 px-3">Menu Principal</div>
        <nav className="space-y-1 mb-8">
          {staffNav.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  active 
                    ? "bg-blue-600/15 text-blue-400 shadow-[inset_4px_0_0_0_rgba(37,99,235,1)]" 
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon className={cn("h-5 w-5 transition-colors", active ? "text-blue-400" : "text-white/50 group-hover:text-white")} />
                <span className="flex-1">{t(item.labelKey as any)}</span>
              </Link>
            );
          })}
        </nav>

        <div className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3 px-3">Système</div>
        <div className="space-y-1">
          <Link
            href="/dashboard/parametres"
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
              (pathname === "/dashboard/parametres" || pathname?.startsWith("/dashboard/parametres/"))
                ? "bg-blue-600/15 text-blue-400 shadow-[inset_4px_0_0_0_rgba(37,99,235,1)]" 
                : "text-white/70 hover:bg-white/5 hover:text-white"
            )}
          >
            <Settings className={cn("h-5 w-5", (pathname === "/dashboard/parametres" || pathname?.startsWith("/dashboard/parametres/")) ? "text-blue-400" : "text-white/50 group-hover:text-white")} />
            <span>{t("settings")}</span>
          </Link>
        </div>
      </div>
      <div className="p-4 border-t border-white/5 bg-gradient-to-t from-[#050811] to-transparent">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-white/70 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all h-11"
          onClick={() => {
            clearSession();
            router.replace("/login");
          }}
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">{t("logout")}</span>
        </Button>
      </div>
    </aside>
  );
}
