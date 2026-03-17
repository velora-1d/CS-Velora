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
  Calendar,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

type PromoItem = {
  id: string;
  judul: string;
  deskripsi: string;
  tipe: "produk" | "voucher";
  kodeVoucher: string | null;
  diskonTipe: "persen" | "nominal";
  diskonValue: number;
  minPembelian: number | null;
  maxPotongan: number | null;
  targetTipe: "all" | "pilihan";
  tanggalMulai: string;
  tanggalBerakhir: string;
  aktif: boolean;
  selectedProducts?: string[];
};

type PromoForm = {
  judul: string;
  deskripsi: string;
  tipe: "produk" | "voucher";
  kodeVoucher: string;
  diskonTipe: "persen" | "nominal";
  diskonValue: string;
  minPembelian: string;
  maxPotongan: string;
  targetTipe: "all" | "pilihan";
  tanggalMulai: string;
  tanggalBerakhir: string;
  selectedProducts: string[];
};

const initialFormData: PromoForm = {
  judul: "",
  deskripsi: "",
  tipe: "produk",
  kodeVoucher: "",
  diskonTipe: "persen",
  diskonValue: "",
  minPembelian: "",
  maxPotongan: "",
  targetTipe: "all",
  tanggalMulai: format(new Date(), "yyyy-MM-dd"),
  tanggalBerakhir: "",
  selectedProducts: [],
};

export default function PromosPage() {
  const [promos, setPromos] = useState<PromoItem[]>([]);
  const [products, setProducts] = useState<{ id: string; nama: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "aktif" | "nonaktif">("all");
  const [filterType, setFilterType] = useState<"all" | "produk" | "voucher">("all");
  const [showDrawer, setShowDrawer] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoItem | null>(null);
  const [formData, setFormData] = useState<PromoForm>(initialFormData);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchPromos();
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      if (res.ok) setProducts(data);
    } catch (e) {
      console.error("Gagal memuat produk", e);
    }
  };

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
    const matchSearch = p.judul.toLowerCase().includes(search.toLowerCase()) || 
                       p.deskripsi.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      filterStatus === "all" ||
      (filterStatus === "aktif" && p.aktif && !isExpired(p.tanggalBerakhir)) ||
      (filterStatus === "nonaktif" && (!p.aktif || isExpired(p.tanggalBerakhir)));
    const matchType = filterType === "all" || p.tipe === filterType;
    return matchSearch && matchStatus && matchType;
  });

  const activeCount = promos.filter((p) => p.aktif && !isExpired(p.tanggalBerakhir)).length;

  const handleOpenDrawer = (promo?: PromoItem) => {
    if (promo) {
      setEditingPromo(promo);
      setFormData({
        judul: promo.judul,
        deskripsi: promo.deskripsi,
        tipe: promo.tipe,
        kodeVoucher: promo.kodeVoucher || "",
        diskonTipe: promo.diskonTipe,
        diskonValue: promo.diskonValue.toString(),
        minPembelian: promo.minPembelian?.toString() || "",
        maxPotongan: promo.maxPotongan?.toString() || "",
        targetTipe: promo.targetTipe,
        tanggalMulai: promo.tanggalMulai,
        tanggalBerakhir: promo.tanggalBerakhir,
        selectedProducts: promo.selectedProducts || [],
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
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari promo..." className="app-input" />
            </div>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as "all" | "aktif" | "nonaktif")} className="app-select min-w-[160px]">
              <option value="all">Semua Status</option>
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Nonaktif / Expired</option>
            </select>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value as "all" | "produk" | "voucher")} className="app-select min-w-[160px]">
              <option value="all">Semua Tipe</option>
              <option value="produk">Promo Produk</option>
              <option value="voucher">Voucher Belanja</option>
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
        <div className="overflow-x-auto custom-scrollbar px-3 py-3">
          <table className="table-shell min-w-full">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.08)]">
                <th className="px-4 py-3 text-left whitespace-nowrap">Promo</th>
                <th className="px-4 py-3 text-left whitespace-nowrap">Value</th>
                <th className="px-4 py-3 text-left whitespace-nowrap">Target</th>
                <th className="px-4 py-3 text-left whitespace-nowrap">Periode</th>
                <th className="px-4 py-3 text-left whitespace-nowrap">Status</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-8 w-8 animate-spin text-[#56D6FF]" />
                      <p className="text-[#93A8C7]">Memuat promo...</p>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-[#93A8C7]">
                    Tidak ada promo ditemukan.
                  </td>
                </tr>
              ) : (
                filtered.map((promo) => {
                  const expired = isExpired(promo.tanggalBerakhir);
                  return (
                    <tr key={promo.id} className="border-b border-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-4">
                          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(255,255,255,0.05)] ${promo.tipe === 'voucher' ? 'text-[#A78BFA]' : 'text-[#FFBF69]'}`}>
                            <Megaphone className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium text-[#F1F5F9]">{promo.judul}</p>
                            {promo.kodeVoucher && (
                              <p className="text-[10px] font-mono text-[#56D6FF] uppercase tracking-wider">
                                Kode: {promo.kodeVoucher}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-[#F1F5F9]">
                          {promo.diskonTipe === 'persen' ? `${promo.diskonValue}%` : `Rp ${promo.diskonValue.toLocaleString('id-ID')}`}
                        </div>
                        <div className="text-[10px] text-[#93A8C7]">
                          Min: Rp {promo.minPembelian?.toLocaleString('id-ID') || 0}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${promo.targetTipe === 'all' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>
                          {promo.targetTipe === 'all' ? 'Semua Produk' : 'Pilihan'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs text-[#93A8C7] whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          {formatDate(promo.tanggalMulai)} — {formatDate(promo.tanggalBerakhir)}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm text-[#93A8C7]">Tipe Promo *</label>
                  <select 
                    value={formData.tipe} 
                    onChange={(e) => setFormData((c) => ({ ...c, tipe: e.target.value as any }))}
                    className="app-select w-full"
                  >
                    <option value="produk">Promo Produk</option>
                    <option value="voucher">Voucher / Kode Promo</option>
                  </select>
                </div>
                {formData.tipe === 'voucher' && (
                  <div>
                    <label className="mb-2 block text-sm text-[#93A8C7]">Kode Voucher *</label>
                    <input 
                      type="text" 
                      value={formData.kodeVoucher} 
                      onChange={(e) => setFormData((c) => ({ ...c, kodeVoucher: e.target.value.toUpperCase() }))} 
                      className="app-input uppercase font-mono" 
                      placeholder="CONTOH: HEMAT20" 
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm text-[#93A8C7]">Jenis Diskon *</label>
                  <select 
                    value={formData.diskonTipe} 
                    onChange={(e) => setFormData((c) => ({ ...c, diskonTipe: e.target.value as any }))}
                    className="app-select w-full"
                  >
                    <option value="persen">Persentase (%)</option>
                    <option value="nominal">Nominal (Rp)</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm text-[#93A8C7]">Nilai Diskon *</label>
                  <input 
                    type="number" 
                    value={formData.diskonValue} 
                    onChange={(e) => setFormData((c) => ({ ...c, diskonValue: e.target.value }))} 
                    className="app-input" 
                    placeholder="0" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm text-[#93A8C7]">Min. Pembelian</label>
                  <input 
                    type="number" 
                    value={formData.minPembelian} 
                    onChange={(e) => setFormData((c) => ({ ...c, minPembelian: e.target.value }))} 
                    className="app-input" 
                    placeholder="0" 
                  />
                </div>
                {formData.diskonTipe === 'persen' && (
                  <div>
                    <label className="mb-2 block text-sm text-[#93A8C7]">Maks. Potongan</label>
                    <input 
                      type="number" 
                      value={formData.maxPotongan} 
                      onChange={(e) => setFormData((c) => ({ ...c, maxPotongan: e.target.value }))} 
                      className="app-input" 
                      placeholder="Tanpa batas" 
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm text-[#93A8C7]">Deskripsi *</label>
                <textarea 
                  value={formData.deskripsi} 
                  onChange={(e) => setFormData((c) => ({ ...c, deskripsi: e.target.value }))} 
                  className="app-input min-h-[80px] resize-none" 
                  rows={3} 
                  placeholder="Detail promo..." 
                />
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

              <div className="border-t border-[rgba(255,255,255,0.08)] pt-5">
                <label className="mb-4 block text-sm font-semibold text-[#F1F5F9]">Target Produk</label>
                <div className="flex gap-4 mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      checked={formData.targetTipe === 'all'} 
                      onChange={() => setFormData(c => ({ ...c, targetTipe: 'all' }))}
                      className="accent-[#56D6FF]"
                    />
                    <span className="text-sm text-[#93A8C7]">Semua Produk</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      checked={formData.targetTipe === 'pilihan'} 
                      onChange={() => setFormData(c => ({ ...c, targetTipe: 'pilihan' }))}
                      className="accent-[#56D6FF]"
                    />
                    <span className="text-sm text-[#93A8C7]">Produk Tertentu</span>
                  </label>
                </div>

                {formData.targetTipe === 'pilihan' && (
                  <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto p-3 bg-black/20 rounded-xl border border-white/5">
                    {products.map(p => (
                      <label key={p.id} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={formData.selectedProducts.includes(p.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData(c => ({ ...c, selectedProducts: [...c.selectedProducts, p.id] }));
                            } else {
                              setFormData(c => ({ ...c, selectedProducts: c.selectedProducts.filter(id => id !== p.id) }));
                            }
                          }}
                          className="accent-[#56D6FF]"
                        />
                        <span className="text-sm text-[#F1F5F9]">{p.nama}</span>
                      </label>
                    ))}
                  </div>
                )}
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
