import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { subscriptions, tenants } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { CreditCard, CheckCircle, Clock, Search, Eye, XCircle } from "lucide-react";

export default async function OwnerBillingPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "owner") {
    redirect("/dashboard");
  }

  // Fetch stats
  const pendingSubs = await db.query.subscriptions.findMany({
    where: eq(subscriptions.status, "pending"),
    with: {
      tenant: true
    },
    orderBy: [desc(subscriptions.createdAt)],
  });

  const [totalSuccess] = await db
    .select({ count: sql<number>`count(*)` })
    .from(subscriptions)
    .where(eq(subscriptions.status, "active"));

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#F1F5F9]">Billing & Pembayaran</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="glass-card p-6 border-l-4 border-yellow-500">
          <p className="text-[#94A3B8] text-sm mb-2">Menunggu Konfirmasi</p>
          <div className="text-3xl font-bold text-[#F1F5F9]">{pendingSubs.length}</div>
        </div>
        <div className="glass-card p-6 border-l-4 border-green-500">
          <p className="text-[#94A3B8] text-sm mb-2">Total Transaksi Berhasil</p>
          <div className="text-3xl font-bold text-[#F1F5F9]">{totalSuccess?.count || 0}</div>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-[rgba(255,255,255,0.05)] flex flex-col sm:flex-row gap-4 items-center justify-between">
          <h2 className="text-lg font-medium text-[#F1F5F9]">Menunggu Konfirmasi</h2>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Cari tenant..."
              className="w-full pl-9 pr-4 py-2 bg-[#0A0F1E] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#F1F5F9] focus:outline-none focus:border-[#3B82F6] text-sm"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#94A3B8]">
            <thead className="text-xs text-[#94A3B8] uppercase bg-[rgba(255,255,255,0.02)] border-b border-[rgba(255,255,255,0.05)]">
              <tr>
                <th className="px-6 py-4 font-medium">Tanggal</th>
                <th className="px-6 py-4 font-medium">Tenant</th>
                <th className="px-6 py-4 font-medium">Paket</th>
                <th className="px-6 py-4 font-medium">Nominal</th>
                <th className="px-6 py-4 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(255,255,255,0.05)]">
              {pendingSubs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-[#94A3B8]">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50 text-green-500" />
                    <p>Tidak ada tagihan yang menunggu konfirmasi.</p>
                  </td>
                </tr>
              ) : (
                pendingSubs.map((sub: any) => (
                  <tr key={sub.id} className="hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {format(new Date(sub.createdAt), "dd MMM yyyy, HH:mm", { locale: id })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-[#F1F5F9]">{sub.tenant?.namaToko || "Unknown"}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="capitalize text-[#F1F5F9] inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#3B82F6]/10 border border-[#3B82F6]/20">
                        {sub.paket}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-[#F1F5F9] font-medium">
                      Rp {Number(sub.amount).toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-2">
                        {sub.paymentProofUrl && (
                          <a 
                            href={sub.paymentProofUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            className="p-2 bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-[#94A3B8] hover:text-[#F1F5F9] rounded"
                            title="Lihat Bukti Transfer"
                          >
                            <Eye className="w-4 h-4" />
                          </a>
                        )}
                        <button className="p-2 bg-green-500/10 hover:bg-green-500/20 text-green-500 rounded" title="Konfirmasi & Aktifkan">
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded" title="Tolak">
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
