"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  UserCircle,
  Users,
  CalendarDays,
  HeartPulse,
  FileText,
  MessageSquare,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { clearSession, getSession } from "@/lib/auth/storage";
import { useI18n } from "@/lib/i18n/client";

const staffNav = [
  { href: "/dashboard/profil", icon: UserCircle, labelKey: "profile" },
  { href: "/dashboard", icon: LayoutDashboard, labelKey: "dashboard" },
  { href: "/dashboard/patients", icon: Users, labelKey: "patients" },
  { href: "/dashboard/agenda", icon: CalendarDays, labelKey: "agenda" },
  { href: "/dashboard/suive", icon: HeartPulse, labelKey: "suivi", permKey: "can_view_suive" },
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
    <aside className="hidden w-[250px] min-h-screen bg-[#2f3b8f] text-white md:flex flex-col justify-between">
      {/* Top */}
      <div>
        {/* Logo */}
        <div className="p-5 border-b border-white/10">
          <Link href="/dashboard">
            <img src="/logo.svg" alt="CardioManager" className="h-9 w-auto brightness-0 invert" />
          </Link>
        </div>

        {/* Menu */}
        <div className="mt-6 px-4 space-y-2">
          {staffNav.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(item.href + "/");
            const Icon = item.icon;
            const isDashboard = item.href === "/dashboard";
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all",
                  isDashboard
                    ? "text-white/70 hover:bg-white/10"
                    : active
                      ? "bg-white text-[#2f3b8f] font-semibold"
                      : "text-white hover:bg-white/10"
                )}
              >
                <Icon className={cn("h-5 w-5", isDashboard ? "text-white/50" : active ? "text-[#2f3b8f]" : "text-white/70")} />
                <span>{t(item.labelKey as any)}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bottom */}
      <div className="p-4 border-t border-white/10 space-y-2">
        <Link
          href="/dashboard/parametres"
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all",
            pathname === "/dashboard/parametres" || pathname?.startsWith("/dashboard/parametres/")
              ? "bg-white text-[#2f3b8f] font-semibold"
              : "text-white hover:bg-white/10"
          )}
        >
          <Settings className="h-5 w-5 text-white/70" />
          <span>{t("settings")}</span>
        </Link>

        <button
          onClick={() => {
            clearSession();
            router.replace("/login");
          }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 text-sm text-white"
        >
          <LogOut className="h-5 w-5 text-white/70" />
          <span>{t("logout")}</span>
        </button>
      </div>
    </aside>
  );
}
