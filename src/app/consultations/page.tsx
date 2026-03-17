"use client";

import { useState, useEffect } from "react";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  MoreVertical,
  CalendarDays,
  User,
  Phone,
  MessageSquare,
  Filter,
  Package
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

const tabItems = [
  { id: "slots", label: "Slot Jadwal", icon: CalendarDays },
  { id: "requests", label: "Permintaan Booking", icon: MessageSquare },
];

const statusColors: Record<string, string> = {
  tersedia: "bg-[#10B981]/10 text-[#10B981]",
  terbooking: "bg-[#3B82F6]/10 text-[#3B82F6]",
  diblokir: "bg-[#EF4444]/10 text-[#EF4444]",
  pending: "bg-[#F59E0B]/10 text-[#F59E0B]",
  approved: "bg-[#10B981]/10 text-[#10B981]",
  rejected: "bg-[#EF4444]/10 text-[#EF4444]",
};

export default function ConsultationsPage() {
  const [activeTab, setActiveTab] = useState("slots");
  const [slots, setSlots] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Form state for new slot
  const [newSlot, setNewSlot] = useState({
    productId: "",
    tanggal: format(new Date(), "yyyy-MM-dd"),
    jamMulai: "09:00",
    jamSelesai: "10:00",
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [resSlots, resRequests, resProducts] = await Promise.all([
        fetch("/api/consultations/slots"),
        fetch("/api/consultations/requests"),
        fetch("/api/products?type=konsultasi"),
      ]);

      if (resSlots.ok) setSlots(await resSlots.json());
      if (resRequests.ok) setRequests(await resRequests.json());
      if (resProducts.ok) {
        const prodData = await resProducts.json();
        setProducts(prodData);
        if (prodData.length > 0) {
          setNewSlot(prev => ({ ...prev, productId: prodData[0].id }));
        }
      }
    } catch (error) {
      toast.error("Gagal mengambil data konsultasi");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/consultations/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSlot),
      });

      if (res.ok) {
        toast.success("Slot jadwal berhasil ditambahkan");
        setIsModalOpen(false);
        fetchInitialData();
      } else {
        toast.error("Gagal menambah slot");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setLoading(false);
    }
  };

  const filteredSlots = slots.filter(s => {
    const matchesStatus = filterStatus === "all" || s.status === filterStatus;
    const matchesSearch = !search || 
      (s.productName?.toLowerCase().includes(search.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const filteredRequests = requests.filter(r => {
    const matchesStatus = filterStatus === "all" || r.status === filterStatus;
    const matchesSearch = !search || 
      (r.fromNumber?.includes(search));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <section className="hero-panel px-6 py-7 md:px-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <span className="section-kicker text-xs uppercase tracking-[0.2em] text-[#56D6FF]">
              Consultation Orchestration
            </span>
            <h1 className="mt-5 font-display text-4xl font-semibold text-[#F1F5F9] md:text-5xl">
              Atur ketersediaan dan booking konsultasi dalam satu dashboard.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-[#93A8C7] md:text-base">
              Kelola slot waktu, setujui permintaan pelanggan, dan pantau jadwal harian dengan presisi.
            </p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="app-button-primary h-fit self-start md:self-center"
          >
            <Plus className="w-5 h-5" />
            Tambah Slot
          </button>
        </div>
      </section>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-[#1E293B]/40 rounded-2xl w-fit border border-[rgba(255,255,255,0.05)]">
          {tabItems.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setFilterStatus("all");
                setSearch("");
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all ${
                activeTab === tab.id 
                  ? "bg-[linear-gradient(135deg,rgba(86,214,255,0.2),rgba(103,167,255,0.1))] text-[#56D6FF] border border-[#56D6FF]/30" 
                  : "text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-white/5"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              placeholder={activeTab === 'slots' ? "Cari produk..." : "Cari nomor WA..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-4 pr-4 py-2.5 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-xl text-[#F1F5F9] focus:outline-none focus:border-[#3B82F6]/50 transition-all text-sm"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full sm:w-40 px-3 py-2.5 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-xl text-[#F1F5F9] focus:outline-none focus:border-[#3B82F6]/50 transition-all text-sm"
          >
            <option value="all" className="bg-[#0A0F1E]">Semua Status</option>
            {activeTab === 'slots' ? (
              <>
                <option value="tersedia" className="bg-[#0A0F1E]">Tersedia</option>
                <option value="terbooking" className="bg-[#0A0F1E]">Terbooking</option>
                <option value="diblokir" className="bg-[#0A0F1E]">Diblokir</option>
              </>
            ) : (
              <>
                <option value="pending" className="bg-[#0A0F1E]">Pending</option>
                <option value="approved" className="bg-[#0A0F1E]">Disetujui</option>
                <option value="rejected" className="bg-[#0A0F1E]">Ditolak</option>
              </>
            )}
          </select>
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 text-[#93A8C7]">
          <Loader2 className="w-10 h-10 animate-spin mb-4 text-[#56D6FF]" />
          <p>Sinkronisasi data jadwal...</p>
        </div>
      )}

      {!loading && activeTab === "slots" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredSlots.length === 0 ? (
            <div className="col-span-full py-20 text-center glass-card border-dashed">
              <CalendarIcon className="w-12 h-12 mx-auto text-[#334155] mb-4" />
              <p className="text-[#93A8C7]">Tidak ada slot jadwal ditemukan.</p>
            </div>
          ) : (
            filteredSlots.map((slot) => (
              <div key={slot.id} className="panel-shell p-5 group flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`status-pill ${statusColors[slot.status] || "bg-white/10 text-white"}`}>
                      {slot.status}
                    </span>
                    <button className="text-[#94A3B8] hover:text-[#F1F5F9]">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                  <h3 className="font-display text-lg font-medium text-[#F1F5F9] mb-1">
                    {format(new Date(slot.tanggal), "eeee, d MMMM yyyy", { locale: localeId })}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-[#93A8C7]">
                    <Clock className="w-4 h-4" />
                    <span>{slot.jamMulai.slice(0, 5)} - {slot.jamSelesai.slice(0, 5)}</span>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-[rgba(255,255,255,0.05)]">
                  <div className="flex items-center gap-2 text-xs text-[#56D6FF] opacity-70">
                    <Package className="w-3 h-3" />
                    <span>Layanan Konsultasi</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {!loading && activeTab === "requests" && (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.08)] bg-white/5">
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[#93A8C7]">Pelanggan</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[#93A8C7]">Jadwal Request</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[#93A8C7]">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[#93A8C7]">Dibuat Pada</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[#93A8C7]">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(255,255,255,0.05)]">
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center text-[#93A8C7]">
                      Belum ada permintaan booking yang masuk.
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#56D6FF]/10 text-[#56D6FF]">
                            <User className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-medium text-[#F1F5F9]">{req.fromNumber}</p>
                            <p className="text-xs text-[#93A8C7]">Via WhatsApp</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#F1F5F9]">
                        {req.jadwalRequest}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`status-pill ${statusColors[req.status] || "bg-white/10 text-white"}`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#93A8C7]">
                        {format(new Date(req.createdAt), "d MMM yyyy, HH:mm", { locale: localeId })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button className="p-2 text-[#94A3B8] hover:text-[#10B981] hover:bg-[#10B981]/10 rounded-lg transition-colors">
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <button className="p-2 text-[#94A3B8] hover:text-[#EF4444] hover:bg-[#EF4444]/10 rounded-lg transition-colors">
                            <XCircle className="w-5 h-5" />
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
      )}

      {/* Modal Tambah Slot */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-card w-full max-w-lg p-6 animate-in fade-in zoom-in duration-300">
            <h2 className="font-display text-2xl text-[#F1F5F9] mb-6">Tambah Slot Jadwal</h2>
            <form onSubmit={handleAddSlot} className="space-y-4">
              <div>
                <label className="block text-sm text-[#93A8C7] mb-2">Pilih Layanan Konsultasi</label>
                <select 
                  className="app-input"
                  value={newSlot.productId}
                  onChange={(e) => setNewSlot({...newSlot, productId: e.target.value})}
                  required
                >
                  <option value="">Pilih Produk...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.nama}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-[#93A8C7] mb-2">Tanggal</label>
                <input 
                  type="date"
                  className="app-input"
                  value={newSlot.tanggal}
                  onChange={(e) => setNewSlot({...newSlot, tanggal: e.target.value})}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#93A8C7] mb-2">Jam Mulai</label>
                  <input 
                    type="time"
                    className="app-input"
                    value={newSlot.jamMulai}
                    onChange={(e) => setNewSlot({...newSlot, jamMulai: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#93A8C7] mb-2">Jam Selesai</label>
                  <input 
                    type="time"
                    className="app-input"
                    value={newSlot.jamSelesai}
                    onChange={(e) => setNewSlot({...newSlot, jamSelesai: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="app-button-secondary flex-1"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="app-button-primary flex-1"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Simpan Slot"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
