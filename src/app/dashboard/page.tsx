import { auth } from "@/auth";
import { db } from "@/lib/db";
import { orders, products, promos, consultationSlots } from "@/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { formatRupiah } from "@/lib/utils";
import {
  MessageCircle,
  ShoppingCart,
  Package,
  Tag,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";

async function getStats(tenantId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Today's orders
  const todayOrders = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.tenantId, tenantId),
        gte(orders.createdAt, today),
        lte(orders.createdAt, tomorrow)
      )
    );

  // Total orders
  const totalOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.tenantId, tenantId));

  // Active products
  const activeProducts = await db
    .select()
    .from(products)
    .where(and(eq(products.tenantId, tenantId), eq(products.aktif, true)));

  // Active promos
  const activePromos = await db
    .select()
    .from(promos)
    .where(and(eq(promos.tenantId, tenantId), eq(promos.aktif, true)));

  // Today's slots
  const todayStr = today.toISOString().split("T")[0];
  const todaySlots = await db
    .select()
    .from(consultationSlots)
    .where(
      and(
        eq(consultationSlots.tenantId, tenantId),
        eq(consultationSlots.tanggal, todayStr)
      )
    );

  // Pending orders
  const pendingOrders = todayOrders.filter((o) => o.status === "pending");

  return {
    todayOrders: todayOrders.length,
    totalOrders: totalOrders.length,
    activeProducts: activeProducts.length,
    activePromos: activePromos.length,
    todaySlots: todaySlots.length,
    pendingOrders: pendingOrders.length,
    totalRevenue: totalOrders.reduce((sum, o) => sum + o.totalHarga, 0),
  };
}

export default async function DashboardPage() {
  const session = await auth();
  const tenantId = session?.user?.tenantId || "";

  // If no tenant, show placeholder
  if (!tenantId) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-[#F1F5F9]">Dashboard</h1>
        <div className="glass-card p-8 text-center">
          <p className="text-[#94A3B8]">Belum ada tenant yang dikonfigurasi.</p>
        </div>
      </div>
    );
  }

  const stats = await getStats(tenantId);

  const statCards = [
    {
      title: "Chat Hari Ini",
      value: stats.todayOrders.toString(),
      icon: MessageCircle,
      color: "text-[#3B82F6]",
      bgColor: "bg-[#3B82F6]/10",
    },
    {
      title: "Total Order",
      value: stats.totalOrders.toString(),
      icon: ShoppingCart,
      color: "text-[#10B981]",
      bgColor: "bg-[#10B981]/10",
    },
    {
      title: "Produk Aktif",
      value: stats.activeProducts.toString(),
      icon: Package,
      color: "text-[#F59E0B]",
      bgColor: "bg-[#F59E0B]/10",
    },
    {
      title: "Promo Aktif",
      value: stats.activePromos.toString(),
      icon: Tag,
      color: "text-[#EF4444]",
      bgColor: "bg-[#EF4444]/10",
    },
    {
      title: "Slot Hari Ini",
      value: stats.todaySlots.toString(),
      icon: Calendar,
      color: "text-[#8B5CF6]",
      bgColor: "bg-[#8B5CF6]/10",
    },
    {
      title: "Pending Actions",
      value: stats.pendingOrders.toString(),
      icon: AlertCircle,
      color: "text-[#F59E0B]",
      bgColor: "bg-[#F59E0B]/10",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="hero-panel relative overflow-hidden px-6 py-7 md:px-8 md:py-9">
        <div className="absolute inset-y-0 right-0 hidden w-72 bg-[radial-gradient(circle_at_center,rgba(86,214,255,0.18),transparent_70%)] blur-2xl lg:block" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="section-kicker">Velora operations grid</span>
            <h1 className="mt-5 font-display text-4xl font-semibold tracking-[-0.06em] text-[#F1F5F9] md:text-5xl">
              Dashboard admin untuk membaca pulsa bisnis dalam satu pandangan.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-[#93A8C7] md:text-base">
              Pantau order masuk, kesehatan WhatsApp, slot konsultasi, dan workload admin tanpa harus pindah tab.
            </p>
          </div>
          <div className="panel-shell flex min-w-[280px] flex-col gap-4 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#56D6FF]">
                  Snapshot
                </p>
                <p className="mt-2 font-display text-2xl text-[#F1F5F9]">
                  Hari aktif
                </p>
              </div>
              <span className="status-pill bg-[#4ADE80]/10 text-[#4ADE80]">
                <span className="h-2 w-2 rounded-full bg-current" />
                Live
              </span>
            </div>
            <p className="text-sm text-[#93A8C7]">
              {new Date().toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="metric-card p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-[#69809F]">
                  Revenue
                </p>
                <p className="mt-2 text-lg font-semibold text-[#4ADE80]">
                  {formatRupiah(stats.totalRevenue)}
                </p>
              </div>
              <div className="metric-card p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-[#69809F]">
                  Pending
                </p>
                <p className="mt-2 text-lg font-semibold text-[#FFBF69]">
                  {stats.pendingOrders} aksi
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#56D6FF]">
            Overview statistik
          </p>
          <p className="mt-2 text-sm text-[#93A8C7]">
            Ringkasan performa operasional dan beban admin real-time.
          </p>
        </div>
        <div className="status-pill bg-[#67A7FF]/10 text-[#67A7FF]">
          <CheckCircle className="h-4 w-4" />
          Provider terhubung
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {statCards.map((stat) => (
          <div key={stat.title} className="metric-card metric-orb p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-[#69809F]">
                  {stat.title}
                </p>
                <p className="mt-3 text-3xl font-semibold text-[#F1F5F9]">
                  {stat.value}
                </p>
              </div>
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-[20px] ${stat.bgColor} ${stat.color}`}
              >
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[#56D6FF]">
                WhatsApp health
              </p>
              <h2 className="mt-2 font-display text-2xl text-[#F1F5F9]">
                Pusat koneksi aktif
              </h2>
            </div>
            <div className="status-pill bg-[#4ADE80]/10 text-[#4ADE80]">
              <MessageCircle className="h-4 w-4" />
              Stable
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
            <div className="panel-shell p-5">
              <p className="text-sm text-[#93A8C7]">Status provider saat ini</p>
              <div className="mt-5 flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#10B981]/12 text-[#10B981]">
                  <MessageCircle className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-display text-2xl text-[#F1F5F9]">Terhubung</p>
                  <p className="text-sm text-[#93A8C7]">Terakhir diperbarui: baru saja</p>
                </div>
              </div>
            </div>
            <div className="panel-shell p-5">
              <p className="text-sm text-[#93A8C7]">Distribusi workload</p>
              <div className="mt-4 space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-[#93A8C7]">Order pending</span>
                    <span className="text-[#F1F5F9]">{stats.pendingOrders}</span>
                  </div>
                  <div className="h-2 rounded-full bg-[rgba(255,255,255,0.06)]">
                    <div className="h-2 rounded-full bg-[#FFBF69]" style={{ width: `${Math.min(stats.pendingOrders * 18, 100)}%` }} />
                  </div>
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-[#93A8C7]">Slot hari ini</span>
                    <span className="text-[#F1F5F9]">{stats.todaySlots}</span>
                  </div>
                  <div className="h-2 rounded-full bg-[rgba(255,255,255,0.06)]">
                    <div className="h-2 rounded-full bg-[#67A7FF]" style={{ width: `${Math.min(stats.todaySlots * 20, 100)}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-[#56D6FF]">
            Action queue
          </p>
          <h2 className="mt-2 font-display text-2xl text-[#F1F5F9]">
            Fokus admin berikutnya
          </h2>
          <div className="mt-6 space-y-4">
            {stats.pendingOrders > 0 ? (
              <div className="panel-shell flex items-center gap-4 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFBF69]/12 text-[#FFBF69]">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-[#69809F]">Pembayaran pending</p>
                  <p className="mt-1 text-base font-semibold text-[#F1F5F9]">
                    {stats.pendingOrders} order menunggu konfirmasi
                  </p>
                </div>
              </div>
            ) : (
              <div className="panel-shell flex items-center gap-4 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#4ADE80]/12 text-[#4ADE80]">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-[#69809F]">Pembayaran pending</p>
                  <p className="mt-1 text-base font-semibold text-[#F1F5F9]">
                    Semua order sudah bersih
                  </p>
                </div>
              </div>
            )}

            {stats.todaySlots > 0 ? (
              <div className="panel-shell flex items-center gap-4 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#67A7FF]/12 text-[#67A7FF]">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-[#69809F]">Konsultasi aktif</p>
                  <p className="mt-1 text-base font-semibold text-[#F1F5F9]">
                    {stats.todaySlots} slot tersedia hari ini
                  </p>
                </div>
              </div>
            ) : (
              <div className="panel-shell flex items-center gap-4 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EF4444]/12 text-[#EF4444]">
                  <XCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-[#69809F]">Konsultasi aktif</p>
                  <p className="mt-1 text-base font-semibold text-[#F1F5F9]">
                    Belum ada slot hari ini
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="hidden">
        <div className="text-right">
          <p className="text-[#94A3B8] text-sm">
            {new Date().toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
