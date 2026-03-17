"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { 
  MoreVertical, Store, Ban, CheckCircle, Clock, 
  Search, Users, Loader2, AlertCircle 
} from "lucide-react";
import { toast } from "sonner";

export default function OwnerTenantsPage() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const res = await fetch("/api/owner/tenants");
      if (res.ok) {
        const data = await res.json();
        setTenants(data);
      } else {
        toast.error("Gagal memuat data tenant");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setLoading(false);
    }
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

  const filteredTenants = tenants.filter(t => {
    const matchesStatus = filterStatus === "all" || t.status === filterStatus;
    const matchesSearch = !search || 
      (t.namaToko?.toLowerCase().includes(search.toLowerCase())) ||
      (t.owner?.email?.toLowerCase().includes(search.toLowerCase())) ||
      (t.subdomain?.toLowerCase().includes(search.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#56D6FF] mb-1">Owner Panel</p>
          <h1 className="text-3xl font-bold text-[#F1F5F9]">Manajemen Tenant</h1>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
          <input
            type="text"
            placeholder="Cari nama toko, subdomain, atau email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-xl text-[#F1F5F9] placeholder-[#64748B] focus:outline-none focus:border-[#3B82F6]/50 transition-all text-sm"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 p-1 bg-[#1E293B]/40 rounded-2xl w-fit border border-[rgba(255,255,255,0.05)]">
          {["all", "active", "trial", "suspended", "expired"].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                filterStatus === s 
                  ? "bg-[linear-gradient(135deg,rgba(86,214,255,0.2),rgba(103,167,255,0.1))] text-[#56D6FF] border border-[#56D6FF]/30" 
                  : "text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-white/5"
              }`}
            >
              {s.toUpperCase()}
            </button>
          ))}
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
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-[#3B82F6] mx-auto mb-2" />
                    <p>Memuat data tenant...</p>
                  </td>
                </tr>
              ) : filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[#94A3B8]">
                    <Store className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>Tidak ada tenant ditemukan.</p>
                  </td>
                </tr>
              ) : (
                filteredTenants.map((t) => (
                  <tr key={t.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4 font-medium text-[#F1F5F9]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#3B82F6]/10 flex items-center justify-center text-[#3B82F6]">
                          <Store className="w-4 h-4" />
                        </div>
                        <div>
                          <p>{t.namaToko}</p>
                          <p className="text-xs text-[#94A3B8]">{t.subdomain}.velora.id</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-[#F1F5F9]">{t.owner?.name || "No Owner"}</p>
                        <p className="text-xs">{t.owner?.email || "-"}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        t.package === 'pro' ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20' : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                      }`}>
                        {t.package || 'basic'}
                      </span>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(t.status)}</td>
                    <td className="px-6 py-4">
                      {format(new Date(t.createdAt), "d MMM yyyy", { locale: id })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-white/5 rounded-lg transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
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
