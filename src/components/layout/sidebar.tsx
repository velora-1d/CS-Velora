"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import Image from "next/image";
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
  ShieldAlert,
  X,
  TrendingUp,
} from "lucide-react";
import { useState, useEffect } from "react";

const menuItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/whatsapp", icon: MessageCircle, label: "WhatsApp" },
  { href: "/products", icon: Package, label: "Produk" },
  { href: "/promos", icon: Tag, label: "Promo" },
  { href: "/orders", icon: ShoppingCart, label: "Orders" },
  { href: "/reports", icon: TrendingUp, label: "Laporan" },
  { href: "/consultations", icon: Calendar, label: "Jadwal & Konsultasi" },
  { href: "/payments", icon: CreditCard, label: "Pembayaran" },
  { href: "/billing", icon: CreditCard, label: "Langganan & Billing" },
  { href: "/faqs", icon: HelpCircle, label: "FAQ" },
  { href: "/ai-settings", icon: Bot, label: "AI Settings" },
  { href: "/bot-settings", icon: Settings, label: "Bot Settings" },
  { href: "/security", icon: Shield, label: "Security" },
  { href: "/chats", icon: MessageSquare, label: "Riwayat Chat" },
  { href: "/profile", icon: Store, label: "Profil Toko" },
  { href: "/account", icon: User, label: "Akun" },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);

  // Close sidebar on path change (mobile)
  useEffect(() => {
    if (onClose && isOpen) {
      onClose();
    }
  }, [pathname, onClose, isOpen]);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen flex-col bg-[#0A0F1E] border-r border-[rgba(255,255,255,0.08)] transition-all duration-300 flex",
          collapsed ? "w-16" : "w-64",
          // Drawer behavior for mobile
          isOpen ? "translate-x-0 shadow-[20px_0_40px_rgba(0,0,0,0.4)]" : "-translate-x-full md:translate-x-0",
          !isOpen && "hidden md:flex"
        )}
      >
        <div className="flex h-20 items-center justify-between border-b border-[rgba(255,255,255,0.08)] px-4">
          {(!collapsed || isOpen) ? (
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="relative w-10 h-10 flex-shrink-0">
                <Image src="/logo-velora.png" alt="Velora Logo" fill className="object-contain" priority />
              </div>
              <div className={cn("transition-opacity duration-300", collapsed && !isOpen ? "opacity-0 w-0 overflow-hidden" : "opacity-100")}>
                <p className="font-display text-base font-semibold text-[#F1F5F9] whitespace-nowrap">
                  Velora ID
                </p>
                <p className="text-[10px] uppercase tracking-[0.22em] text-[#56D6FF] font-bold">
                  Control Room
                </p>
              </div>
            </Link>
          ) : (
            <div className="flex w-full justify-center">
              <div className="relative w-8 h-8">
                <Image src="/logo-velora.png" alt="Velora Logo" fill className="object-contain" priority />
              </div>
            </div>
          )}

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden md:flex rounded-full border border-[rgba(138,180,248,0.12)] p-2 text-[#94A3B8] transition-colors hover:bg-[rgba(255,255,255,0.08)]"
            >
              {collapsed ? (
                <ChevronRight className="w-5 h-5" />
              ) : (
                <ChevronLeft className="w-5 h-5" />
              )}
            </button>
            {isOpen && (
              <button
                onClick={onClose}
                className="md:hidden rounded-lg bg-red-500/10 border border-red-500/20 p-2 text-red-500 transition-colors hover:bg-red-500/20"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {(!collapsed || isOpen) && (
          <div className="mx-3 mt-4 rounded-[26px] border border-[rgba(138,180,248,0.14)] bg-[linear-gradient(180deg,rgba(86,214,255,0.12),rgba(86,214,255,0.02))] px-4 py-4 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.24em] text-[#56D6FF]">
                  Live ops
                </p>
                <p className="mt-2 font-display text-base font-bold text-[#F1F5F9]">
                  WA sehat
                </p>
              </div>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#4ADE80]/10 text-[#4ADE80] text-[10px] font-bold border border-[#4ADE80]/20">
                <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                Online
              </span>
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-[#93A8C7] font-medium opacity-80">
              Pusat kontrol untuk katalog, pembayaran, dan monitoring bisnis.
            </p>
          </div>
        )}

        <nav 
          id="sidebar-nav"
          className="flex-1 overflow-y-auto px-2 py-6 custom-scrollbar"
          onScroll={(e) => {
            sessionStorage.setItem("sidebar-scroll", e.currentTarget.scrollTop.toString());
          }}
        >
          <script dangerouslySetInnerHTML={{ __html: `
            (function() {
              const nav = document.getElementById('sidebar-nav');
              const saved = sessionStorage.getItem('sidebar-scroll');
              if (nav && saved) {
                nav.scrollTop = parseInt(saved);
              }
            })();
          `}} />
          <ul className="space-y-1.5">
            {menuItems.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <li key={item.href} className="relative px-2">
                  {isActive && (
                    <div className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-[#56D6FF] shadow-[0_0_12px_#56D6FF]" />
                  )}
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-3 py-3 transition-all duration-300 group overflow-hidden",
                      isActive
                        ? "bg-[linear-gradient(135deg,rgba(86,214,255,0.22),rgba(103,167,255,0.12))] text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.12),0_10px_20px_-10px_rgba(86,214,255,0.3)]"
                        : "text-[#94A3B8] hover:bg-[rgba(255,255,255,0.05)] hover:text-[#F1F5F9]"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl transition-all duration-300",
                        isActive
                          ? "bg-[#56D6FF] text-[#04101c] shadow-[0_0_15px_rgba(86,214,255,0.4)]"
                          : "bg-[rgba(255,255,255,0.04)] group-hover:scale-110"
                      )}
                    >
                      <item.icon className={cn("h-5 w-5", isActive && "scale-110")} />
                    </span>
                    {(!collapsed || isOpen) && (
                      <span className={cn(
                        "text-sm font-bold tracking-tight transition-colors",
                        isActive ? "text-[#F1F5F9]" : "text-[#94A3B8]"
                      )}>
                        {item.label}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-3 border-t border-[rgba(255,255,255,0.08)] flex flex-col gap-2 bg-[rgba(15,23,42,0.4)]">
          {(session?.user as any)?.role === 'owner' && (
            <Link
              href="/owner/dashboard"
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-[#94A3B8] transition-colors hover:bg-[rgba(255,255,255,0.05)] hover:text-[#3B82F6]",
                collapsed && !isOpen && "justify-center"
              )}
            >
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-[rgba(255,255,255,0.04)] text-yellow-500">
                <ShieldAlert className="h-5 w-5" />
              </span>
              {(!collapsed || isOpen) && <span className="text-sm font-bold">Owner Panel</span>}
            </Link>
          )}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className={cn(
              "flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-[#94A3B8] transition-colors hover:bg-[rgba(255,255,255,0.05)] hover:text-[#EF4444]",
              collapsed && !isOpen && "justify-center"
            )}
          >
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-[rgba(255,255,255,0.04)]">
              <LogOut className="h-5 w-5" />
            </span>
            {(!collapsed || isOpen) && <span className="text-sm font-bold">Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
