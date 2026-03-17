import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { subscriptions } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { CreditCard } from "lucide-react";
import BillingActions from "./BillingActions";

export default async function OwnerBillingPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "owner") {
    redirect("/dashboard");
  }

  const pendingSubs = await db.query.subscriptions.findMany({
    where: eq(subscriptions.status, "pending"),
    with: { tenant: { columns: { namaToko: true } } },
    orderBy: [desc(subscriptions.createdAt)],
  });

  const [totalSuccess] = await db
    .select({ count: sql<number>`count(*)` })
    .from(subscriptions)
    .where(eq(subscriptions.status, "active"));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-[#56D6FF]">Owner Panel</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-[#F1F5F9]">
          Billing &amp; Pembayaran
        </h1>
        <p className="mt-1 text-sm text-[#93A8C7]">
          Verifikasi tagihan berlangganan Tenant dan upgrade paket secara otomatis.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="glass-card border-l-4 border-[#FFBF69] p-6">
          <p className="text-[#94A3B8] text-sm mb-2">Menunggu Konfirmasi</p>
          <div className="text-3xl font-bold text-[#F1F5F9]">{pendingSubs.length}</div>
        </div>
        <div className="glass-card border-l-4 border-[#4ADE80] p-6">
          <p className="text-[#94A3B8] text-sm mb-2">Total Transaksi Berhasil</p>
          <div className="text-3xl font-bold text-[#F1F5F9]">{totalSuccess?.count || 0}</div>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <BillingActions subs={pendingSubs as any} />
      </div>
    </div>
  );
}
