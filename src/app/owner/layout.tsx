import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Megaphone, 
  Settings, 
  LogOut,
  Activity
} from "lucide-react";

export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user || session.user.role !== "owner") {
    redirect("/dashboard");
  }

  const navItems = [
    { name: "Dashboard", href: "/owner/dashboard", icon: LayoutDashboard },
    { name: "Laporan", href: "/owner/reports", icon: Activity },
    { name: "Manajemen Tenant", href: "/owner/tenants", icon: Users },
    { name: "Billing & Pembayaran", href: "/owner/billing", icon: CreditCard },
    { name: "Pengumuman", href: "/owner/announcements", icon: Megaphone },
    { name: "Pengaturan", href: "/owner/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-[#F1F5F9] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[rgba(15,23,42,0.8)] border-r border-[rgba(255,255,255,0.05)] flex-shrink-0 flex flex-col h-screen sticky top-0">
        <div className="p-6 border-b border-[rgba(255,255,255,0.05)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#3B82F6] to-[#2563EB] flex items-center justify-center font-bold text-white">
              V
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none">Velora ID</h1>
              <p className="text-xs text-[#94A3B8] mt-1">Owner Panel</p>
            </div>
          </div>
        </div>

        <nav className="p-4 flex-1 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[rgba(255,255,255,0.05)] rounded-lg transition-colors group"
            >
              <item.icon className="w-5 h-5 group-hover:text-[#3B82F6] transition-colors" />
              <span className="font-medium">{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-[rgba(255,255,255,0.05)]">
          <div className="px-4 py-3 mb-2 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#1E293B] border border-[rgba(255,255,255,0.1)] flex items-center justify-center text-sm font-medium">
              {(session.user as any).nama?.charAt(0).toUpperCase() || "O"}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{(session.user as any).nama}</p>
              <p className="text-xs text-[#94A3B8] truncate">{session.user.email}</p>
            </div>
          </div>
          
          <Link
            href="/api/auth/signout"
            className="flex items-center gap-3 px-4 py-3 text-[#EF4444] hover:bg-[#EF4444]/10 rounded-lg transition-colors w-full"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Keluar</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Areas */}
      <main className="flex-1 overflow-x-hidden p-8">
        {children}
      </main>
    </div>
  );
}
