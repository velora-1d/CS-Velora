"use client";
import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

const statusColors: Record<string, string> = {
  pending: "bg-[#F59E0B]/10 text-[#F59E0B]",
  konfirmasi: "bg-[#3B82F6]/10 text-[#3B82F6]",
  proses: "bg-[#8B5CF6]/10 text-[#8B5CF6]",
  selesai: "bg-[#10B981]/10 text-[#10B981]",
  batal: "bg-[#EF4444]/10 text-[#EF4444]",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/orders");
      const data = await res.json();
      if (res.ok) {
        setOrders(data);
      } else {
        toast.error("Gagal memuat orders: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      toast.error("Gagal memuat data orders.");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        toast.success(`Order ${newStatus}`);
        fetchOrders();
      } else {
        const data = await res.json();
        toast.error("Gagal update status: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat update status.");
    }
  };

  const filtered = filter === "all" ? orders : orders.filter(o => o.status === filter);

  return (
    <div className="space-y-6">
      <section className="hero-panel px-6 py-7 md:px-8">
        <h1 className="text-2xl font-bold text-[#F1F5F9]">Orders</h1>
        <p className="text-[#94A3B8] text-sm mt-1">Kelola pesanan dan konfirmasi pembayaran</p>
      </section>

      <div className="px-6 md:px-8 space-y-4">
        <div className="flex gap-2 flex-wrap">
        {["all", "pending", "konfirmasi", "proses", "selesai", "batal"].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-lg text-sm ${filter === s ? "bg-[#3B82F6] text-white" : "bg-[rgba(255,255,255,0.05)] text-[#94A3B8] hover:text-white"}`}>
            {s === "all" ? "Semua" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[rgba(255,255,255,0.08)]">
              <th className="text-left px-4 py-3 text-[#94A3B8] font-medium text-sm">Pemesan</th>
              <th className="text-left px-4 py-3 text-[#94A3B8] font-medium text-sm">Produk</th>
              <th className="text-left px-4 py-3 text-[#94A3B8] font-medium text-sm">Total</th>
              <th className="text-left px-4 py-3 text-[#94A3B8] font-medium text-sm">Status</th>
              <th className="text-left px-4 py-3 text-[#94A3B8] font-medium text-sm">Tanggal</th>
              <th className="text-right px-4 py-3 text-[#94A3B8] font-medium text-sm">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-[#3B82F6]" />
                    <p className="text-[#94A3B8]">Memuat data pesanan...</p>
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center text-[#94A3B8]">
                  Tidak ada pesanan ditemukan.
                </td>
              </tr>
            ) : (
              filtered.map(order => (
                <tr key={order.id} className="border-b border-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.02)]">
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-[#F1F5F9] font-medium">{order.fromName || "Unknown"}</p>
                      <p className="text-[#94A3B8] text-sm">{order.fromNumber}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#F1F5F9]">{order.produk} x{order.jumlah}</td>
                  <td className="px-4 py-3 text-[#10B981]">Rp {order.total.toLocaleString("id-ID")}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${statusColors[order.status] || "bg-gray-500/10 text-gray-500"}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#94A3B8]">
                    {format(new Date(order.createdAt), "dd MMM yyyy, HH:mm", { locale: localeId })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 hover:bg-[rgba(255,255,255,0.05)] rounded-lg text-[#94A3B8]"><Eye className="w-4 h-4" /></button>
                      {order.status === "pending" && (
                        <>
                          <button 
                            onClick={() => updateStatus(order.id, "konfirmasi")}
                            className="p-2 hover:bg-[#10B981]/10 rounded-lg text-[#10B981]"
                            title="Konfirmasi Pembayaran"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => updateStatus(order.id, "batal")}
                            className="p-2 hover:bg-[#EF4444]/10 rounded-lg text-[#EF4444]"
                            title="Batalkan Pesanan"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
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
