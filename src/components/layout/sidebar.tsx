"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  MessageCircle,
  Package,
  Tag,
  ShoppingCart,
  Calendar,
  CreditCard,
  HelpCircle,
  Bot,
  Settings,
  Shield,
  MessageSquare,
  Store,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

const menuItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/whatsapp", icon: MessageCircle, label: "WhatsApp" },
  { href: "/products", icon: Package, label: "Produk" },
  { href: "/promos", icon: Tag, label: "Promo" },
  { href: "/orders", icon: ShoppingCart, label: "Orders" },
  { href: "/consultations", icon: Calendar, label: "Jadwal & Konsultasi" },
  { href: "/payments", icon: CreditCard, label: "Pembayaran" },
  { href: "/faqs", icon: HelpCircle, label: "FAQ" },
  { href: "/ai-settings", icon: Bot, label: "AI Settings" },
  { href: "/bot-settings", icon: Settings, label: "Bot Settings" },
  { href: "/security", icon: Shield, label: "Security" },
  { href: "/chats", icon: MessageSquare, label: "Riwayat Chat" },
  { href: "/profile", icon: Store, label: "Profil Toko" },
  { href: "/account", icon: User, label: "Akun" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 hidden h-screen flex-col transition-all duration-300 md:flex",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-20 items-center justify-between border-b border-[rgba(255,255,255,0.08)] px-4">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#56d6ff,#67a7ff_60%,#9d8cff)] shadow-[0_16px_32px_rgba(86,214,255,0.22)]">
              <span className="font-display text-base font-bold text-[#04101c]">V</span>
            </div>
            <div>
              <p className="font-display text-base font-semibold text-[#F1F5F9]">
                Velora ID
              </p>
              <p className="text-xs uppercase tracking-[0.22em] text-[#56D6FF]">
                Control Room
              </p>
            </div>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-full border border-[rgba(138,180,248,0.12)] p-2 text-[#94A3B8] transition-colors hover:bg-[rgba(255,255,255,0.08)]"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      {!collapsed && (
        <div className="mx-3 mt-4 rounded-[26px] border border-[rgba(138,180,248,0.14)] bg-[linear-gradient(180deg,rgba(86,214,255,0.12),rgba(86,214,255,0.02))] px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[0.7rem] uppercase tracking-[0.24em] text-[#56D6FF]">
                Live ops
              </p>
              <p className="mt-2 font-display text-lg font-semibold text-[#F1F5F9]">
                WA sehat
              </p>
            </div>
            <span className="status-pill bg-[#4ADE80]/10 text-[#4ADE80]">
              <span className="h-2 w-2 rounded-full bg-current" />
              Online
            </span>
          </div>
          <p className="mt-3 text-sm leading-6 text-[#93A8C7]">
            Pusat kontrol untuk katalog, pembayaran manual, dan monitoring percakapan bisnis.
          </p>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto px-2 py-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-3 py-3 transition-all duration-200",
                    isActive
                      ? "bg-[linear-gradient(135deg,rgba(86,214,255,0.18),rgba(103,167,255,0.08))] text-[#F1F5F9] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                      : "text-[#94A3B8] hover:bg-[rgba(255,255,255,0.05)] hover:text-[#F1F5F9]"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl",
                      isActive
                        ? "bg-[rgba(255,255,255,0.08)] text-[#56D6FF]"
                        : "bg-[rgba(255,255,255,0.04)]"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                  </span>
                  {!collapsed && <span className="text-sm">{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-2 border-t border-[rgba(255,255,255,0.08)]">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className={cn(
            "flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-[#94A3B8] transition-colors hover:bg-[rgba(255,255,255,0.05)] hover:text-[#EF4444]",
            collapsed && "justify-center"
          )}
        >
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-[rgba(255,255,255,0.04)]">
            <LogOut className="h-5 w-5" />
          </span>
          {!collapsed && <span className="text-sm">Logout</span>}
        </button>
      </div>
    </aside>
  );
}
