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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { clearSession, getSession } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

const staffNav = [
  { href: "/dashboard", icon: LayoutDashboard, labelKey: "dashboard" },
  { href: "/patients", icon: Users, labelKey: "patients" },
  { href: "/agenda", icon: CalendarDays, labelKey: "agenda" },
  { href: "/prescriptions", icon: FileText, labelKey: "prescriptions" },
  { href: "/chat", icon: MessageSquare, labelKey: "chat" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useI18n();
  const session = typeof window !== "undefined" ? getSession() : null;

  if (session?.role === "patient") return null;

  return (
    <aside className="hidden w-60 flex-col bg-gradient-to-b from-slate-900 to-indigo-900 text-white md:flex">
      <div className="flex items-center gap-2 p-4">
        <div className="h-9 w-9 rounded-md bg-white/15 shadow-sm" />
        <div className="leading-tight">
          <div className="text-sm font-semibold">CardioManager</div>
          <div className="text-xs text-white/70">Gestion de cabinet</div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 p-2">
        {staffNav.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/90 hover:bg-white/10",
                active && "bg-white/15"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1">{t(item.labelKey as any)}</span>
            </Link>
          );
        })}
      </nav>
      <div className="space-y-1 p-2">
        <Link
          href="/parametres"
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/90 hover:bg-white/10"
        >
          <Settings className="h-4 w-4" />
          <span>{t("settings")}</span>
        </Link>
        <Button
          variant="ghost"
          className="w-full justify-start text-white hover:bg-white/10 hover:text-white"
          onClick={() => {
            clearSession();
            router.replace("/login");
          }}
        >
          <LogOut className="h-4 w-4" />
          <span>{t("logout")}</span>
        </Button>
      </div>
    </aside>
  );
}
