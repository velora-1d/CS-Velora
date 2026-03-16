"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  HelpCircle,
  Plus,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Loader2,
  Search,
} from "lucide-react";

type FaqItem = {
  id: string;
  pertanyaan: string;
  jawaban: string;
  aktif: boolean;
};

type FaqForm = {
  pertanyaan: string;
  jawaban: string;
};

const initialFormData: FaqForm = { pertanyaan: "", jawaban: "" };

export default function FaqsPage() {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showDrawer, setShowDrawer] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FaqItem | null>(null);
  const [formData, setFormData] = useState<FaqForm>(initialFormData);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/faqs");
      const data = await res.json();
      if (res.ok) {
        setFaqs(data);
      } else {
        toast.error("Gagal memuat FAQ: " + (data.error || "Unknown error"));
      }
    } catch {
      toast.error("Gagal memuat data FAQ.");
    } finally {
      setLoading(false);
    }
  };

  const filtered = faqs.filter((f) =>
    f.pertanyaan.toLowerCase().includes(search.toLowerCase()) ||
    f.jawaban.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenDrawer = (faq?: FaqItem) => {
    if (faq) {
      setEditingFaq(faq);
      setFormData({ pertanyaan: faq.pertanyaan, jawaban: faq.jawaban });
    } else {
      setEditingFaq(null);
      setFormData(initialFormData);
    }
    setShowDrawer(true);
  };

  const handleCloseDrawer = () => {
    setShowDrawer(false);
    setEditingFaq(null);
  };

  const handleSave = async () => {
    if (!formData.pertanyaan.trim() || !formData.jawaban.trim()) {
      toast.error("Pertanyaan dan jawaban wajib diisi.");
      return;
    }
    try {
      setIsSaving(true);
      const url = editingFaq ? `/api/faqs/${editingFaq.id}` : "/api/faqs";
      const method = editingFaq ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(editingFaq ? "FAQ diperbarui" : "FAQ ditambahkan");
        fetchFaqs();
        handleCloseDrawer();
      } else {
        toast.error("Gagal menyimpan: " + (data.error || "Unknown error"));
      }
    } catch {
      toast.error("Gagal menyimpan FAQ.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      const res = await fetch(`/api/faqs/${id}/toggle`, { method: "PATCH" });
      if (res.ok) {
        toast.success("Status FAQ diperbarui");
        fetchFaqs();
      } else {
        const data = await res.json();
        toast.error("Gagal mengubah status: " + (data.error || "Unknown error"));
      }
    } catch {
      toast.error("Terjadi kesalahan saat mengubah status.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus FAQ ini?")) return;
    try {
      const res = await fetch(`/api/faqs/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("FAQ dihapus");
        fetchFaqs();
      } else {
        const data = await res.json();
        toast.error("Gagal menghapus: " + (data.error || "Unknown error"));
      }
    } catch {
      toast.error("Terjadi kesalahan saat menghapus FAQ.");
    }
  };

  const activeCount = faqs.filter((f) => f.aktif).length;

  return (
    <div className="space-y-6">
      <section className="hero-panel px-6 py-7 md:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <span className="section-kicker">Knowledge orchestration</span>
            <h1 className="mt-5 font-display text-4xl font-semibold text-[#F1F5F9] md:text-5xl">
              FAQ — basis pengetahuan yang langsung di-inject ke AI.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-[#93A8C7] md:text-base">
              Setiap FAQ aktif otomatis menjadi bagian dari knowledge base bot. Tambah, edit, atau nonaktifkan tanpa perlu restart.
            </p>
          </div>
          <div className="panel-shell p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-[#56D6FF]">FAQ pulse</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="metric-card p-4">
                <p className="text-2xl font-semibold text-[#F1F5F9]">{faqs.length}</p>
                <p className="mt-1 text-xs leading-5 text-[#93A8C7]">Total FAQ</p>
              </div>
              <div className="metric-card p-4">
                <p className="text-2xl font-semibold text-[#4ADE80]">{activeCount}</p>
                <p className="mt-1 text-xs leading-5 text-[#93A8C7]">Aktif di AI</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="glass-card p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative min-w-[260px]">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#69809F]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari FAQ..."
              className="app-input pl-12"
            />
          </div>
          <button onClick={() => handleOpenDrawer()} className="app-button-primary whitespace-nowrap">
            <Plus className="h-4 w-4" /> Tambah FAQ
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#93A8C7]">
            <Loader2 className="h-10 w-10 animate-spin mb-4 text-[#56D6FF]" />
            <p>Memuat FAQ...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card py-20 text-center">
            <HelpCircle className="mx-auto h-12 w-12 text-[#334155] mb-4" />
            <p className="text-[#93A8C7]">Belum ada FAQ. Klik tombol "Tambah FAQ" untuk mulai.</p>
          </div>
        ) : (
          filtered.map((faq) => (
            <div key={faq.id} className="glass-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="font-medium text-[#F1F5F9]">{faq.pertanyaan}</p>
                  <p className="mt-2 text-sm text-[#93A8C7] leading-relaxed">{faq.jawaban}</p>
                </div>
                <div className="flex items-center gap-2 ml-4 shrink-0">
                  <button
                    onClick={() => handleToggle(faq.id)}
                    className={faq.aktif ? "text-[#4ADE80]" : "text-[#69809F]"}
                    title={faq.aktif ? "Nonaktifkan" : "Aktifkan"}
                  >
                    {faq.aktif ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6" />}
                  </button>
                  <button
                    onClick={() => handleOpenDrawer(faq)}
                    className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[rgba(138,180,248,0.12)] text-[#93A8C7] transition-colors hover:bg-[rgba(255,255,255,0.05)] hover:text-[#F1F5F9]"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(faq.id)}
                    className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[rgba(255,107,122,0.12)] text-[#93A8C7] transition-colors hover:bg-[rgba(255,107,122,0.08)] hover:text-[#FF9DA7]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Drawer */}
      <div className={`fixed inset-0 z-50 transition-opacity ${showDrawer ? "opacity-100" : "pointer-events-none opacity-0"}`}>
        <div className="absolute inset-0 bg-[rgba(2,8,15,0.78)] backdrop-blur-sm" onClick={handleCloseDrawer} />
        <div className={`drawer-shell absolute right-0 top-0 h-full w-full max-w-lg border-l border-[rgba(138,180,248,0.12)] transition-transform duration-300 ${showDrawer ? "translate-x-0" : "translate-x-full"}`}>
          <div className="flex h-full flex-col">
            <div className="border-b border-[rgba(255,255,255,0.08)] px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-[#56D6FF]">FAQ editor</p>
                  <h2 className="mt-2 font-display text-3xl text-[#F1F5F9]">
                    {editingFaq ? "Edit FAQ" : "Tambah FAQ"}
                  </h2>
                </div>
                <button onClick={handleCloseDrawer} className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[rgba(138,180,248,0.12)] text-[#93A8C7] hover:bg-[rgba(255,255,255,0.05)]">
                  ✕
                </button>
              </div>
            </div>
            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
              <div>
                <label className="mb-2 block text-sm text-[#93A8C7]">Pertanyaan *</label>
                <input
                  type="text"
                  value={formData.pertanyaan}
                  onChange={(e) => setFormData((c) => ({ ...c, pertanyaan: e.target.value }))}
                  className="app-input"
                  placeholder="Contoh: Berapa jam operasional toko?"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-[#93A8C7]">Jawaban *</label>
                <textarea
                  value={formData.jawaban}
                  onChange={(e) => setFormData((c) => ({ ...c, jawaban: e.target.value }))}
                  className="app-input min-h-[120px] resize-none"
                  placeholder="Tuliskan jawaban lengkap..."
                  rows={5}
                />
              </div>
            </div>
            <div className="flex gap-3 border-t border-[rgba(255,255,255,0.08)] px-6 py-5">
              <button onClick={handleCloseDrawer} className="app-button-secondary flex-1">Batal</button>
              <button
                onClick={handleSave}
                disabled={!formData.pertanyaan.trim() || !formData.jawaban.trim() || isSaving}
                className="app-button-primary flex-1 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
