"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Megaphone,
  Plus,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Loader2,
  Search,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

type PromoItem = {
  id: string;
  judul: string;
  deskripsi: string;
  tanggalMulai: string;
  tanggalBerakhir: string;
  aktif: boolean;
};

type PromoForm = {
  judul: string;
  deskripsi: string;
  tanggalMulai: string;
  tanggalBerakhir: string;
};

const initialFormData: PromoForm = {
  judul: "",
  deskripsi: "",
  tanggalMulai: format(new Date(), "yyyy-MM-dd"),
  tanggalBerakhir: "",
};

export default function PromosPage() {
  const [promos, setPromos] = useState<PromoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "aktif" | "nonaktif">("all");
  const [showDrawer, setShowDrawer] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoItem | null>(null);
  const [formData, setFormData] = useState<PromoForm>(initialFormData);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchPromos();
  }, []);

  const fetchPromos = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/promos");
      const data = await res.json();
      if (res.ok) {
        setPromos(data);
      } else {
        toast.error("Gagal memuat promo: " + (data.error || "Unknown error"));
      }
    } catch {
      toast.error("Gagal memuat data promo.");
    } finally {
      setLoading(false);
    }
  };

  const isExpired = (endDate: string) => new Date(endDate) < new Date();

  const filtered = promos.filter((p) => {
    const matchSearch = p.judul.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      filterStatus === "all" ||
      (filterStatus === "aktif" && p.aktif && !isExpired(p.tanggalBerakhir)) ||
      (filterStatus === "nonaktif" && (!p.aktif || isExpired(p.tanggalBerakhir)));
    return matchSearch && matchStatus;
  });

  const activeCount = promos.filter((p) => p.aktif && !isExpired(p.tanggalBerakhir)).length;

  const handleOpenDrawer = (promo?: PromoItem) => {
    if (promo) {
      setEditingPromo(promo);
      setFormData({
        judul: promo.judul,
        deskripsi: promo.deskripsi,
        tanggalMulai: promo.tanggalMulai,
        tanggalBerakhir: promo.tanggalBerakhir,
      });
    } else {
      setEditingPromo(null);
      setFormData(initialFormData);
    }
    setShowDrawer(true);
  };

  const handleCloseDrawer = () => {
    setShowDrawer(false);
    setEditingPromo(null);
  };

  const handleSave = async () => {
    if (!formData.judul.trim() || !formData.deskripsi.trim() || !formData.tanggalMulai || !formData.tanggalBerakhir) {
      toast.error("Semua field wajib diisi.");
      return;
    }
    if (formData.tanggalBerakhir <= formData.tanggalMulai) {
      toast.error("Tanggal berakhir harus setelah tanggal mulai.");
      return;
    }
    try {
      setIsSaving(true);
      const url = editingPromo ? `/api/promos/${editingPromo.id}` : "/api/promos";
      const method = editingPromo ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(editingPromo ? "Promo diperbarui" : "Promo ditambahkan");
        fetchPromos();
        handleCloseDrawer();
      } else {
        toast.error("Gagal menyimpan: " + (data.error || "Unknown error"));
      }
    } catch {
      toast.error("Gagal menyimpan promo.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      const res = await fetch(`/api/promos/${id}/toggle`, { method: "PATCH" });
      if (res.ok) {
        toast.success("Status promo diperbarui");
        fetchPromos();
      } else {
        const data = await res.json();
        toast.error("Gagal mengubah status: " + (data.error || "Unknown error"));
      }
    } catch {
      toast.error("Terjadi kesalahan.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus promo ini?")) return;
    try {
      const res = await fetch(`/api/promos/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Promo dihapus");
        fetchPromos();
      } else {
        const data = await res.json();
        toast.error("Gagal menghapus: " + (data.error || "Unknown error"));
      }
    } catch {
      toast.error("Terjadi kesalahan.");
    }
  };

  const formatDate = (d: string) => {
    try { return format(new Date(d), "d MMM yyyy", { locale: localeId }); } catch { return d; }
  };

  return (
    <div className="space-y-6">
      <section className="hero-panel px-6 py-7 md:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <span className="section-kicker">Promotion engine</span>
            <h1 className="mt-5 font-display text-4xl font-semibold text-[#F1F5F9] md:text-5xl">
              Kelola promo yang langsung diketahui bot secara otomatis.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-[#93A8C7] md:text-base">
              Promo aktif otomatis di-inject ke knowledge base AI. Expired otomatis ditandai.
            </p>
          </div>
          <div className="panel-shell p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-[#56D6FF]">Promo pulse</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="metric-card p-4">
                <p className="text-2xl font-semibold text-[#F1F5F9]">{promos.length}</p>
                <p className="mt-1 text-xs leading-5 text-[#93A8C7]">Total promo</p>
              </div>
              <div className="metric-card p-4">
                <p className="text-2xl font-semibold text-[#4ADE80]">{activeCount}</p>
                <p className="mt-1 text-xs leading-5 text-[#93A8C7]">Aktif sekarang</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="glass-card p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative min-w-[260px]">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#69809F]" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari promo..." className="app-input pl-12" />
            </div>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as "all" | "aktif" | "nonaktif")} className="app-select min-w-[160px]">
              <option value="all">Semua Status</option>
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Nonaktif / Expired</option>
            </select>
          </div>
          <button onClick={() => handleOpenDrawer()} className="app-button-primary whitespace-nowrap">
            <Plus className="h-4 w-4" /> Tambah Promo
          </button>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[#56D6FF]">Promo matrix</p>
            <h2 className="mt-2 font-display text-2xl text-[#F1F5F9]">Daftar Promosi</h2>
          </div>
          <span className="status-pill bg-[#67A7FF]/10 text-[#67A7FF]">{filtered.length} item</span>
        </div>
        <div className="overflow-x-auto px-3 py-3">
          <table className="table-shell min-w-full">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left">Judul</th>
                <th className="px-4 py-3 text-left">Deskripsi</th>
                <th className="px-4 py-3 text-left">Periode</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-8 w-8 animate-spin text-[#56D6FF]" />
                      <p className="text-[#93A8C7]">Memuat promo...</p>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center text-[#93A8C7]">
                    Tidak ada promo ditemukan.
                  </td>
                </tr>
              ) : (
                filtered.map((promo) => {
                  const expired = isExpired(promo.tanggalBerakhir);
                  return (
                    <tr key={promo.id}>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(255,255,255,0.05)] text-[#FFBF69]">
                            <Megaphone className="h-5 w-5" />
                          </div>
                          <p className="font-medium text-[#F1F5F9]">{promo.judul}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-[#93A8C7] max-w-[200px] truncate">{promo.deskripsi}</td>
                      <td className="px-4 py-4 text-sm text-[#93A8C7]">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {formatDate(promo.tanggalMulai)} — {formatDate(promo.tanggalBerakhir)}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {expired ? (
                          <span className="status-pill bg-[#EF4444]/10 text-[#EF4444]">Expired</span>
                        ) : promo.aktif ? (
                          <span className="status-pill bg-[#4ADE80]/10 text-[#4ADE80]">Aktif</span>
                        ) : (
                          <span className="status-pill bg-[#94A3B8]/10 text-[#94A3B8]">Nonaktif</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleToggle(promo.id)} className={promo.aktif ? "text-[#4ADE80]" : "text-[#69809F]"}>
                            {promo.aktif ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                          </button>
                          <button onClick={() => handleOpenDrawer(promo)} className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[rgba(138,180,248,0.12)] text-[#93A8C7] hover:bg-[rgba(255,255,255,0.05)] hover:text-[#F1F5F9]">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDelete(promo.id)} className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[rgba(255,107,122,0.12)] text-[#93A8C7] hover:bg-[rgba(255,107,122,0.08)] hover:text-[#FF9DA7]">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer */}
      <div className={`fixed inset-0 z-50 transition-opacity ${showDrawer ? "opacity-100" : "pointer-events-none opacity-0"}`}>
        <div className="absolute inset-0 bg-[rgba(2,8,15,0.78)] backdrop-blur-sm" onClick={handleCloseDrawer} />
        <div className={`drawer-shell absolute right-0 top-0 h-full w-full max-w-lg border-l border-[rgba(138,180,248,0.12)] transition-transform duration-300 ${showDrawer ? "translate-x-0" : "translate-x-full"}`}>
          <div className="flex h-full flex-col">
            <div className="border-b border-[rgba(255,255,255,0.08)] px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-[#56D6FF]">Promo editor</p>
                  <h2 className="mt-2 font-display text-3xl text-[#F1F5F9]">{editingPromo ? "Edit Promo" : "Tambah Promo"}</h2>
                </div>
                <button onClick={handleCloseDrawer} className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[rgba(138,180,248,0.12)] text-[#93A8C7] hover:bg-[rgba(255,255,255,0.05)]">✕</button>
              </div>
            </div>
            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
              <div>
                <label className="mb-2 block text-sm text-[#93A8C7]">Judul Promo *</label>
                <input type="text" value={formData.judul} onChange={(e) => setFormData((c) => ({ ...c, judul: e.target.value }))} className="app-input" placeholder="Contoh: Diskon 20% Semua Produk" />
              </div>
              <div>
                <label className="mb-2 block text-sm text-[#93A8C7]">Deskripsi *</label>
                <textarea value={formData.deskripsi} onChange={(e) => setFormData((c) => ({ ...c, deskripsi: e.target.value }))} className="app-input min-h-[100px] resize-none" rows={4} placeholder="Detail promo..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm text-[#93A8C7]">Tanggal Mulai *</label>
                  <input type="date" value={formData.tanggalMulai} onChange={(e) => setFormData((c) => ({ ...c, tanggalMulai: e.target.value }))} className="app-input" />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-[#93A8C7]">Tanggal Berakhir *</label>
                  <input type="date" value={formData.tanggalBerakhir} onChange={(e) => setFormData((c) => ({ ...c, tanggalBerakhir: e.target.value }))} className="app-input" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 border-t border-[rgba(255,255,255,0.08)] px-6 py-5">
              <button onClick={handleCloseDrawer} className="app-button-secondary flex-1">Batal</button>
              <button onClick={handleSave} disabled={!formData.judul.trim() || !formData.deskripsi.trim() || !formData.tanggalBerakhir || isSaving} className="app-button-primary flex-1 disabled:cursor-not-allowed disabled:opacity-50">
                {isSaving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
