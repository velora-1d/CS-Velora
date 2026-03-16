"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Building,
  QrCode,
  Plus,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Loader2,
  CreditCard,
} from "lucide-react";

type PaymentItem = {
  id: string;
  tipe: "transfer" | "qris";
  namaBank: string | null;
  nomorRekening: string | null;
  namaPemilik: string | null;
  gambarQris: string | null;
  urutan: number;
  aktif: boolean;
};

type PaymentForm = {
  tipe: "transfer" | "qris";
  namaBank: string;
  nomorRekening: string;
  namaPemilik: string;
  gambarQris: string;
  urutan: string;
};

const initialFormData: PaymentForm = {
  tipe: "transfer",
  namaBank: "",
  nomorRekening: "",
  namaPemilik: "",
  gambarQris: "",
  urutan: "0",
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDrawer, setShowDrawer] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentItem | null>(null);
  const [formData, setFormData] = useState<PaymentForm>(initialFormData);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/bank-accounts");
      const data = await res.json();
      if (res.ok) {
        setPayments(data);
      } else {
        toast.error("Gagal memuat data: " + (data.error || "Unknown error"));
      }
    } catch {
      toast.error("Gagal memuat data pembayaran.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDrawer = (payment?: PaymentItem) => {
    if (payment) {
      setEditingPayment(payment);
      setFormData({
        tipe: payment.tipe,
        namaBank: payment.namaBank || "",
        nomorRekening: payment.nomorRekening || "",
        namaPemilik: payment.namaPemilik || "",
        gambarQris: payment.gambarQris || "",
        urutan: payment.urutan.toString(),
      });
    } else {
      setEditingPayment(null);
      setFormData(initialFormData);
    }
    setShowDrawer(true);
  };

  const handleCloseDrawer = () => {
    setShowDrawer(false);
    setEditingPayment(null);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const url = editingPayment ? `/api/bank-accounts/${editingPayment.id}` : "/api/bank-accounts";
      const method = editingPayment ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(editingPayment ? "Metode pembayaran diperbarui" : "Metode pembayaran ditambahkan");
        fetchPayments();
        handleCloseDrawer();
      } else {
        toast.error("Gagal menyimpan: " + (data.error || "Unknown error"));
      }
    } catch {
      toast.error("Gagal menyimpan.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      const res = await fetch(`/api/bank-accounts/${id}/toggle`, { method: "PATCH" });
      if (res.ok) {
        toast.success("Status diperbarui");
        fetchPayments();
      } else {
        const data = await res.json();
        toast.error("Gagal: " + (data.error || "Unknown error"));
      }
    } catch {
      toast.error("Terjadi kesalahan.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus metode pembayaran ini?")) return;
    try {
      const res = await fetch(`/api/bank-accounts/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Metode pembayaran dihapus");
        fetchPayments();
      } else {
        const data = await res.json();
        toast.error("Gagal: " + (data.error || "Unknown error"));
      }
    } catch {
      toast.error("Terjadi kesalahan.");
    }
  };

  const activeCount = payments.filter((p) => p.aktif).length;

  return (
    <div className="space-y-6">
      <section className="hero-panel px-6 py-7 md:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <span className="section-kicker">Payment orchestration</span>
            <h1 className="mt-5 font-display text-4xl font-semibold text-[#F1F5F9] md:text-5xl">
              Kelola rekening bank dan QRIS yang diinfokan bot ke pelanggan.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-[#93A8C7] md:text-base">
              Metode pembayaran aktif otomatis disertakan saat bot memrespons pertanyaan soal pembayaran.
            </p>
          </div>
          <div className="panel-shell p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-[#56D6FF]">Payment pulse</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="metric-card p-4">
                <p className="text-2xl font-semibold text-[#F1F5F9]">{payments.length}</p>
                <p className="mt-1 text-xs leading-5 text-[#93A8C7]">Total metode</p>
              </div>
              <div className="metric-card p-4">
                <p className="text-2xl font-semibold text-[#4ADE80]">{activeCount}</p>
                <p className="mt-1 text-xs leading-5 text-[#93A8C7]">Aktif</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="glass-card p-5 md:p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-[#93A8C7]">Tambah rekening bank atau QRIS statis untuk pembayaran manual.</p>
          <button onClick={() => handleOpenDrawer()} className="app-button-primary whitespace-nowrap">
            <Plus className="h-4 w-4" /> Tambah Metode
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#93A8C7]">
          <Loader2 className="h-10 w-10 animate-spin mb-4 text-[#56D6FF]" />
          <p>Memuat metode pembayaran...</p>
        </div>
      ) : payments.length === 0 ? (
        <div className="glass-card py-20 text-center">
          <CreditCard className="mx-auto h-12 w-12 text-[#334155] mb-4" />
          <p className="text-[#93A8C7]">Belum ada metode pembayaran. Klik "Tambah Metode" untuk mulai.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {payments.sort((a, b) => a.urutan - b.urutan).map((p) => (
            <div key={p.id} className="glass-card p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(255,255,255,0.05)]">
                  {p.tipe === "transfer" ? (
                    <Building className="h-6 w-6 text-[#67A7FF]" />
                  ) : (
                    <QrCode className="h-6 w-6 text-[#4ADE80]" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-[#F1F5F9]">
                    {p.tipe === "transfer" ? p.namaBank : "QRIS"}
                  </p>
                  <p className="text-sm text-[#93A8C7]">
                    {p.tipe === "transfer" ? `${p.nomorRekening} (${p.namaPemilik})` : "Scan QRIS untuk pembayaran"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-[#69809F]">#{p.urutan}</span>
                <button onClick={() => handleToggle(p.id)} className={p.aktif ? "text-[#4ADE80]" : "text-[#69809F]"}>
                  {p.aktif ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6" />}
                </button>
                <button onClick={() => handleOpenDrawer(p)} className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[rgba(138,180,248,0.12)] text-[#93A8C7] hover:bg-[rgba(255,255,255,0.05)] hover:text-[#F1F5F9]">
                  <Edit className="h-4 w-4" />
                </button>
                <button onClick={() => handleDelete(p.id)} className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[rgba(255,107,122,0.12)] text-[#93A8C7] hover:bg-[rgba(255,107,122,0.08)] hover:text-[#FF9DA7]">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drawer */}
      <div className={`fixed inset-0 z-50 transition-opacity ${showDrawer ? "opacity-100" : "pointer-events-none opacity-0"}`}>
        <div className="absolute inset-0 bg-[rgba(2,8,15,0.78)] backdrop-blur-sm" onClick={handleCloseDrawer} />
        <div className={`drawer-shell absolute right-0 top-0 h-full w-full max-w-lg border-l border-[rgba(138,180,248,0.12)] transition-transform duration-300 ${showDrawer ? "translate-x-0" : "translate-x-full"}`}>
          <div className="flex h-full flex-col">
            <div className="border-b border-[rgba(255,255,255,0.08)] px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-[#56D6FF]">Payment editor</p>
                  <h2 className="mt-2 font-display text-3xl text-[#F1F5F9]">{editingPayment ? "Edit Metode" : "Tambah Metode"}</h2>
                </div>
                <button onClick={handleCloseDrawer} className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[rgba(138,180,248,0.12)] text-[#93A8C7] hover:bg-[rgba(255,255,255,0.05)]">✕</button>
              </div>
            </div>
            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
              <div>
                <label className="mb-2 block text-sm text-[#93A8C7]">Tipe *</label>
                <select value={formData.tipe} onChange={(e) => setFormData((c) => ({ ...c, tipe: e.target.value as "transfer" | "qris" }))} className="app-select">
                  <option value="transfer">Transfer Bank</option>
                  <option value="qris">QRIS</option>
                </select>
              </div>
              {formData.tipe === "transfer" && (
                <>
                  <div>
                    <label className="mb-2 block text-sm text-[#93A8C7]">Nama Bank *</label>
                    <input type="text" value={formData.namaBank} onChange={(e) => setFormData((c) => ({ ...c, namaBank: e.target.value }))} className="app-input" placeholder="BCA, Mandiri, BNI, dll" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-[#93A8C7]">Nomor Rekening *</label>
                    <input type="text" value={formData.nomorRekening} onChange={(e) => setFormData((c) => ({ ...c, nomorRekening: e.target.value }))} className="app-input" placeholder="1234567890" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-[#93A8C7]">Nama Pemilik *</label>
                    <input type="text" value={formData.namaPemilik} onChange={(e) => setFormData((c) => ({ ...c, namaPemilik: e.target.value }))} className="app-input" placeholder="Nama sesuai rekening" />
                  </div>
                </>
              )}
              <div>
                <label className="mb-2 block text-sm text-[#93A8C7]">Urutan Tampil</label>
                <input type="number" value={formData.urutan} onChange={(e) => setFormData((c) => ({ ...c, urutan: e.target.value }))} className="app-input" placeholder="0" />
              </div>
            </div>
            <div className="flex gap-3 border-t border-[rgba(255,255,255,0.08)] px-6 py-5">
              <button onClick={handleCloseDrawer} className="app-button-secondary flex-1">Batal</button>
              <button onClick={handleSave} disabled={isSaving} className="app-button-primary flex-1 disabled:cursor-not-allowed disabled:opacity-50">
                {isSaving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
