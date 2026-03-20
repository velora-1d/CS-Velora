"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Megaphone, 
  Settings, 
  LogOut,
  Activity,
  MessageCircle,
  Package,
  Tag,
  ShoppingCart,
  Calendar,
  HelpCircle,
  Bot,
  Shield,
  MessageSquare,
  Store,
  User,
  X
} from "lucide-react";
import { useEffect } from "react";

interface OwnerSidebarProps {
  user: {
    nama?: string;
    email?: string;
  };
  isOpen?: boolean;
  onClose?: () => void;
}

export function OwnerSidebar({ user, isOpen, onClose }: OwnerSidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/owner/dashboard", icon: LayoutDashboard },
    { name: "Laporan", href: "/owner/reports", icon: Activity },
    { name: "Manajemen Tenant", href: "/owner/tenants", icon: Users },
    { name: "Billing & Pembayaran", href: "/owner/billing", icon: CreditCard },
    { name: "Pengumuman", href: "/owner/announcements", icon: Megaphone },
    { name: "Pengaturan", href: "/owner/settings", icon: Settings },
  ];

  const tenantNavItems = [
    { name: "WhatsApp", href: "/dashboard/whatsapp", icon: MessageCircle },
    { name: "Produk", href: "/products", icon: Package },
    { name: "Promo", href: "/promos", icon: Tag },
    { name: "Orders", href: "/orders", icon: ShoppingCart },
    { name: "Jadwal & Konsultasi", href: "/consultations", icon: Calendar },
    { name: "Pembayaran", href: "/payments", icon: CreditCard },
    { name: "Langganan & Billing", href: "/billing", icon: CreditCard },
    { name: "FAQ", href: "/faqs", icon: HelpCircle },
    { name: "AI Settings", href: "/ai-settings", icon: Bot },
    { name: "Bot Settings", href: "/bot-settings", icon: Settings },
    { name: "Security", href: "/security", icon: Shield },
    { name: "Riwayat Chat", href: "/chats", icon: MessageSquare },
    { name: "Profil Toko", href: "/profile", icon: Store },
    { name: "Akun", href: "/account", icon: User },
  ];

  const checkActive = (href: string) => {
    if (href === "/owner/dashboard") return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  };

  // Close sidebar on path change (mobile)
  useEffect(() => {
    if (onClose && isOpen) {
      onClose();
    }
  }, [pathname, onClose, isOpen]);

  // Auto-scroll to active menu item on mount / path change
  useEffect(() => {
    const activeItem = document.getElementById("active-owner-menu-item");
    if (activeItem) {
      activeItem.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [pathname]);

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
          "fixed left-0 top-0 z-50 h-screen flex-col bg-[rgba(15,23,42,0.95)] border-r border-[rgba(255,255,255,0.08)] transition-all duration-300 flex w-64",
          // Drawer behavior for mobile
          isOpen ? "translate-x-0 shadow-[20px_0_40px_rgba(0,0,0,0.4)]" : "-translate-x-full md:translate-x-0",
          !isOpen && "hidden md:flex"
        )}
      >
        <div className="p-6 border-b border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center shrink-0">
              <Image src="/logo-velora.png" alt="Velora Logo" width={40} height={40} className="object-contain" priority />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none text-white tracking-tight">Velora ID</h1>
              <p className="text-[10px] text-[#3B82F6] font-black uppercase tracking-widest mt-1.5 opacity-80">Owner Panel</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="md:hidden rounded-lg bg-red-500/10 border border-red-500/20 p-2 text-red-500 transition-colors hover:bg-red-500/20"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav 
          id="owner-sidebar-nav"
          className="flex-1 overflow-y-auto p-4 custom-scrollbar"
        >
          <div className="mb-8">
            <div className="px-4 mb-4">
              <p className="text-[10px] font-black text-[#475569] uppercase tracking-[0.2em]">Sistem Core</p>
            </div>
            <div className="space-y-1.5">
              {navItems.map((item) => {
                const isActive = checkActive(item.href);
                return (
                  <Link
                    key={item.href}
                    id={isActive ? "active-owner-menu-item" : undefined}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group relative overflow-hidden",
                      isActive 
                        ? "bg-[linear-gradient(135deg,rgba(59,130,246,0.3),rgba(37,99,235,0.2))] text-white shadow-[0_4px_15px_rgba(59,130,246,0.2)] border border-[rgba(59,130,246,0.2)]" 
                        : "text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[rgba(255,255,255,0.05)] border border-transparent"
                    )}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#3B82F6] shadow-[2px_0_15px_rgba(59,130,246,1)] z-10" />
                    )}
                    <item.icon className={cn(
                      "w-5 h-5 transition-transform duration-300 relative z-10",
                      isActive ? "text-[#56D6FF] scale-110 drop-shadow-[0_0_8px_rgba(86,214,255,0.5)]" : "group-hover:scale-110 group-hover:text-[#F1F5F9]"
                    )} />
                    <span className={cn(
                      "font-bold text-sm tracking-wide relative z-10",
                      isActive ? "text-white" : ""
                    )}>{item.name}</span>
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-[#3B82F6]/10 to-transparent opacity-50" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          <div>
            <div className="px-4 mb-4">
              <p className="text-[10px] font-black text-[#475569] uppercase tracking-[0.2em]">Tenant OPS Simulation</p>
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {tenantNavItems.map((item) => {
                const isActive = checkActive(item.href);
                return (
                  <Link
                    key={item.href}
                    id={isActive ? "active-owner-menu-item" : undefined}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 group relative overflow-hidden",
                      isActive 
                        ? "bg-[linear-gradient(135deg,rgba(59,130,246,0.25),rgba(37,99,235,0.12))] text-[#56D6FF] shadow-[0_2px_10px_rgba(59,130,246,0.15)] border border-[rgba(59,130,246,0.1)]" 
                        : "text-[#64748B] hover:text-[#F1F5F9] hover:bg-[rgba(255,255,255,0.04)] border border-transparent"
                    )}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#3B82F6] shadow-[1px_0_10px_rgba(59,130,246,0.8)] z-10" />
                    )}
                    <item.icon className={cn(
                      "w-4 h-4 transition-all relative z-10",
                      isActive ? "text-[#56D6FF] scale-110 drop-shadow-[0_0_5px_rgba(86,214,255,0.4)]" : "group-hover:scale-110 group-hover:text-[#F1F5F9]"
                    )} />
                    <span className={cn(
                      "font-bold text-xs tracking-tight relative z-10",
                      isActive ? "text-[#F8FAFC]" : ""
                    )}>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-[rgba(255,255,255,0.08)] bg-[rgba(15,23,42,0.8)]">
          <div className="px-4 py-3 mb-3 flex items-center gap-3 bg-[rgba(255,255,255,0.03)] rounded-2xl border border-[rgba(255,255,255,0.05)] shadow-xl">
            <div className="w-10 h-10 rounded-xl bg-[#1E293B] border border-[rgba(255,255,255,0.1)] flex items-center justify-center text-sm font-black text-[#3B82F6] shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]">
              {user.nama?.charAt(0).toUpperCase() || "O"}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-black text-white truncate tracking-tight">{user.nama}</p>
              <p className="text-[10px] text-[#64748B] truncate font-bold tracking-tighter opacity-70">{user.email}</p>
            </div>
          </div>
          
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-3 px-4 py-3 text-[#EF4444] hover:bg-[#EF4444]/10 rounded-xl transition-all duration-300 w-full group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-red-500/0 group-hover:bg-red-500/5 transition-colors" />
            <LogOut className="w-5 h-5 group-hover:scale-110 group-hover:-translate-x-1 transition-all duration-300 relative z-10" />
            <span className="font-black text-xs uppercase tracking-widest relative z-10">Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
