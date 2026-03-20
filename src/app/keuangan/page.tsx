"use client";

import { useEffect, useState } from "react";
import {
  DollarSign, ShoppingCart, Clock, CheckCircle2,
  XCircle, Tag, Loader2, AlertCircle, Search, Download,
  TrendingUp, BarChart3, RefreshCw
} from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import { toast } from "sonner";

type KeuanganStats = {
  totalRevenue: number;
  totalDiskon: number;
  totalPesanan: number;
  pesananLunas: number;
  pesananPending: number;
  pesananBatal: number;
};

type Order = {
  id: string;
  fromNumber: string;
  fromName: string | null;
  produk: string;
  tipe: string;
  jumlah: number;
  hargaAsli: number;
  diskonAmount: number;
  total: number;
  status: string;
  createdAt: string;
};

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: { label: "Menunggu", className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  konfirmasi: { label: "Terkonfirmasi", className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  proses: { label: "Diproses", className: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  selesai: { label: "Selesai", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  batal: { label: "Batal", className: "bg-red-500/10 text-red-400 border-red-500/20" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
  });
}

export default function KeuanganPage() {
  const [stats, setStats] = useState<KeuanganStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (startDate) params.set("start", startDate);
      if (endDate) params.set("end", endDate);
      const res = await fetch(`/api/keuangan?${params}`);
      if (!res.ok) throw new Error("Gagal memuat data");
      const data = await res.json();
      setStats(data.stats);
      setOrders(data.list);
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Gagal update status");
      toast.success("Status pesanan diperbarui");
      fetchData();
    } catch {
      toast.error("Gagal update status pesanan");
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchSearch = !search ||
      o.fromNumber.includes(search) ||
      (o.fromName || "").toLowerCase().includes(search.toLowerCase()) ||
      o.produk.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#3B82F6]" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <p className="text-[#94A3B8]">{error || "Data tidak tersedia."}</p>
        <button onClick={fetchData} className="px-6 py-2 bg-[#3B82F6] text-white rounded-xl text-sm">
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="hero-panel px-6 py-6 md:px-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#F1F5F9]">Keuangan & Pesanan</h1>
          <p className="text-[#94A3B8] text-sm mt-1">Lacak pendapatan, diskon, dan status semua pesanan</p>
        </div>
        <div className="flex items-center gap-3">
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
            className="bg-[rgba(255,255,255,0.05)] border border-white/10 text-[#F1F5F9] text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-[#3B82F6]/50" />
          <span className="text-[#64748B] text-sm">–</span>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
            className="bg-[rgba(255,255,255,0.05)] border border-white/10 text-[#F1F5F9] text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-[#3B82F6]/50" />
          <button onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-sm rounded-xl transition-colors">
            <RefreshCw className="w-4 h-4" />
            Filter
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="metric-card p-5">
          <p className="text-xs uppercase tracking-wider text-[#94A3B8] mb-2 font-bold flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5" /> Total Revenue
          </p>
          <h3 className="text-2xl font-bold text-[#F1F5F9]">{formatRupiah(stats.totalRevenue)}</h3>
          {stats.totalDiskon > 0 && (
            <p className="text-xs text-emerald-400 mt-1">Diskon diberikan: {formatRupiah(stats.totalDiskon)}</p>
          )}
        </div>
        <div className="metric-card p-5">
          <p className="text-xs uppercase tracking-wider text-[#94A3B8] mb-2 font-bold flex items-center gap-2">
            <ShoppingCart className="w-3.5 h-3.5" /> Total Pesanan
          </p>
          <h3 className="text-2xl font-bold text-[#F1F5F9]">{stats.totalPesanan}</h3>
        </div>
        <div className="metric-card p-5">
          <p className="text-xs uppercase tracking-wider text-[#94A3B8] mb-2 font-bold flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5" /> Pesanan Lunas
          </p>
          <h3 className="text-2xl font-bold text-emerald-400">{stats.pesananLunas}</h3>
        </div>
        <div className="metric-card p-5">
          <p className="text-xs uppercase tracking-wider text-[#94A3B8] mb-2 font-bold flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" /> Menunggu Bayar
          </p>
          <h3 className="text-2xl font-bold text-yellow-400">{stats.pesananPending}</h3>
        </div>
        <div className="metric-card p-5">
          <p className="text-xs uppercase tracking-wider text-[#94A3B8] mb-2 font-bold flex items-center gap-2">
            <XCircle className="w-3.5 h-3.5" /> Pesanan Batal
          </p>
          <h3 className="text-2xl font-bold text-red-400">{stats.pesananBatal}</h3>
        </div>
        <div className="metric-card p-5">
          <p className="text-xs uppercase tracking-wider text-[#94A3B8] mb-2 font-bold flex items-center gap-2">
            <Tag className="w-3.5 h-3.5" /> Total Diskon
          </p>
          <h3 className="text-2xl font-bold text-purple-400">{formatRupiah(stats.totalDiskon)}</h3>
        </div>
      </div>

      {/* Orders Table */}
      <div className="glass-card p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
            <input
              type="text"
              placeholder="Cari nama, nomor, atau produk..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[rgba(255,255,255,0.04)] border border-white/[0.08] rounded-xl text-sm text-[#F1F5F9] placeholder-[#475569] focus:outline-none focus:border-[#3B82F6]/50"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-[rgba(255,255,255,0.04)] border border-white/[0.08] rounded-xl text-sm text-[#F1F5F9] focus:outline-none focus:border-[#3B82F6]/50"
          >
            <option value="all">Semua Status</option>
            <option value="pending">Menunggu</option>
            <option value="konfirmasi">Terkonfirmasi</option>
            <option value="proses">Diproses</option>
            <option value="selesai">Selesai</option>
            <option value="batal">Batal</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-white/[0.05]">
                <th className="pb-3 text-[10px] uppercase tracking-widest text-[#64748B] font-bold pr-4">Pelanggan</th>
                <th className="pb-3 text-[10px] uppercase tracking-widest text-[#64748B] font-bold pr-4">Produk</th>
                <th className="pb-3 text-[10px] uppercase tracking-widest text-[#64748B] font-bold pr-4 text-right">Harga</th>
                <th className="pb-3 text-[10px] uppercase tracking-widest text-[#64748B] font-bold pr-4 text-right">Total</th>
                <th className="pb-3 text-[10px] uppercase tracking-widest text-[#64748B] font-bold pr-4">Status</th>
                <th className="pb-3 text-[10px] uppercase tracking-widest text-[#64748B] font-bold pr-4">Waktu</th>
                <th className="pb-3 text-[10px] uppercase tracking-widest text-[#64748B] font-bold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#64748B]">
                    <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    Belum ada pesanan
                  </td>
                </tr>
              ) : filteredOrders.map(o => (
                <tr key={o.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 pr-4">
                    <p className="text-[#F1F5F9] font-medium text-xs">{o.fromName || "—"}</p>
                    <p className="text-[#64748B] text-[11px] font-mono">{o.fromNumber}</p>
                  </td>
                  <td className="py-3.5 pr-4">
                    <p className="text-[#F1F5F9] text-xs">{o.produk}</p>
                    <p className="text-[#64748B] text-[11px]">x{o.jumlah} · {o.tipe}</p>
                  </td>
                  <td className="py-3.5 pr-4 text-right">
                    {o.diskonAmount > 0 ? (
                      <>
                        <p className="text-[#F1F5F9] text-xs line-through opacity-40">{formatRupiah(o.hargaAsli)}</p>
                        <p className="text-emerald-400 text-[11px]">-{formatRupiah(o.diskonAmount)}</p>
                      </>
                    ) : (
                      <p className="text-[#F1F5F9] text-xs">{formatRupiah(o.hargaAsli)}</p>
                    )}
                  </td>
                  <td className="py-3.5 pr-4 text-right">
                    <p className="text-[#F1F5F9] font-bold text-xs">{formatRupiah(o.total)}</p>
                  </td>
                  <td className="py-3.5 pr-4">
                    <span className={`text-[11px] px-2.5 py-1 rounded-full border font-medium ${STATUS_CONFIG[o.status]?.className || "bg-gray-500/10 text-gray-400 border-gray-500/20"}`}>
                      {STATUS_CONFIG[o.status]?.label || o.status}
                    </span>
                  </td>
                  <td className="py-3.5 pr-4">
                    <p className="text-[#64748B] text-[11px]">{formatDate(o.createdAt)}</p>
                  </td>
                  <td className="py-3.5">
                    <select
                      value={o.status}
                      onChange={e => handleUpdateStatus(o.id, e.target.value)}
                      className="text-[11px] bg-[rgba(255,255,255,0.05)] border border-white/[0.08] text-[#94A3B8] rounded-lg px-2 py-1 focus:outline-none"
                    >
                      <option value="pending">Menunggu</option>
                      <option value="konfirmasi">Konfirmasi</option>
                      <option value="proses">Proses</option>
                      <option value="selesai">Selesai</option>
                      <option value="batal">Batal</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
