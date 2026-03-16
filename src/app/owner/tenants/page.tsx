import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { tenants, users } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Search, MoreVertical, Store, Ban, CheckCircle, Clock } from "lucide-react";

export default async function OwnerTenantsPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "owner") {
    redirect("/dashboard");
  }

  // Fetch all tenants with their owner user
  const allTenants = await db.query.tenants.findMany({
    orderBy: [desc(tenants.createdAt)],
  });

  // Get owners for each tenant
  const tenantIds = allTenants.map(t => t.id);
  const tenantOwners = await db.query.users.findMany({
    where: (users, { inArray, eq, and }) => 
      and(inArray(users.tenantId, tenantIds), eq(users.role, "tenant"))
  });

  const getOwnerForTenant = (tId: string) => {
    return tenantOwners.find(u => u.tenantId === tId);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-1 bg-green-500/10 text-green-500 rounded-full text-xs flex items-center gap-1 w-fit"><CheckCircle className="w-3 h-3"/>Aktif</span>;
      case 'trial':
        return <span className="px-2 py-1 bg-yellow-500/10 text-yellow-500 rounded-full text-xs flex items-center gap-1 w-fit"><Clock className="w-3 h-3"/>Trial</span>;
      case 'suspended':
        return <span className="px-2 py-1 bg-red-500/10 text-red-500 rounded-full text-xs flex items-center gap-1 w-fit"><Ban className="w-3 h-3"/>Suspend</span>;
      case 'expired':
        return <span className="px-2 py-1 bg-gray-500/10 text-gray-400 rounded-full text-xs flex items-center gap-1 w-fit"><Clock className="w-3 h-3"/>Expired</span>;
      default:
        return <span className="px-2 py-1 bg-gray-500/10 text-gray-400 rounded-full text-xs">{status}</span>;
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#F1F5F9]">Manajemen Tenant</h1>
      </div>

      <div className="glass-card mb-6 p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Cari nama toko atau email..."
            className="w-full pl-9 pr-4 py-2 bg-[#0A0F1E] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#F1F5F9] focus:outline-none focus:border-[#3B82F6] text-sm"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button className="px-4 py-2 bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-[#F1F5F9] text-sm rounded-lg whitespace-nowrap">
            Semua
          </button>
          <button className="px-4 py-2 bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-[#F1F5F9] text-sm rounded-lg whitespace-nowrap">
            Aktif
          </button>
          <button className="px-4 py-2 bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-[#F1F5F9] text-sm rounded-lg whitespace-nowrap">
            Trial
          </button>
          <button className="px-4 py-2 bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-[#F1F5F9] text-sm rounded-lg whitespace-nowrap">
            Suspend
          </button>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#94A3B8]">
            <thead className="text-xs text-[#94A3B8] uppercase bg-[rgba(255,255,255,0.02)] border-b border-[rgba(255,255,255,0.05)]">
              <tr>
                <th className="px-6 py-4 font-medium">Toko</th>
                <th className="px-6 py-4 font-medium">Pemilik / Email</th>
                <th className="px-6 py-4 font-medium">Paket</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Terdaftar</th>
                <th className="px-6 py-4 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(255,255,255,0.05)]">
              {allTenants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-[#94A3B8]">
                    Belum ada tenant yang terdaftar.
                  </td>
                </tr>
              ) : (
                allTenants.map((t) => {
                  const owner = getOwnerForTenant(t.id);
                  // Hide platform owner from tenant list
                  if (t.namaToko === "CS Velora Platform") return null;
                  
                  return (
                    <tr key={t.id} className="hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-[#1E293B] flex items-center justify-center text-[#94A3B8]">
                            <Store className="w-4 h-4" />
                          </div>
                          <span className="font-medium text-[#F1F5F9]">{t.namaToko}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-[#F1F5F9]">{owner?.nama || "-"}</div>
                        <div className="text-xs">{owner?.email || "-"}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="capitalize text-[#F1F5F9] inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#3B82F6]/10 border border-[#3B82F6]/20">
                          {t.paket}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(t.status)}
                        {t.status === 'trial' && t.trialEndsAt && (
                          <div className="text-[10px] mt-1 text-yellow-500/70">
                            S/d {format(new Date(t.trialEndsAt), "dd MMM yyyy", { locale: id })}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs">
                        {format(new Date(t.createdAt), "dd MMM yyyy", { locale: id })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button className="text-[#94A3B8] hover:text-[#F1F5F9] p-2 rounded hover:bg-[rgba(255,255,255,0.05)] transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
