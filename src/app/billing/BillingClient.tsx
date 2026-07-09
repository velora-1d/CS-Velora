"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  CreditCard, CheckCircle, Clock, Zap, AlertTriangle,
  Loader2, ArrowRight, Eye, X, Wifi, Bot, BarChart3,
  Shield, Sparkles,
} from "lucide-react";

// ─── Modal Preview Paket (dirender via Portal ke body) ────────────────────────
function PaketPreviewModal({ onClose }: { onClose: () => void }) {
  const [selectedPlan, setSelectedPlan] = useState<"basic" | "pro">("basic");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Prevent body scroll when modal open
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const plans = {
    basic: {
      name: "Basic",
      price: "Rp 35.000",
      period: "/ bulan",
      color: "#3B82F6",
      gradientBtn: "linear-gradient(135deg, #3B82F6, #2563EB)",
      badge: "Paket Awal",
      badgeClass: "bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20",
      cardClass: "border-[#3B82F6]/20 from-[#3B82F6]/5",
      highlight: false,
      features: [
        { icon: <Wifi className="w-4 h-4" />, text: "1 Nomor WhatsApp CS" },
        { icon: <Bot className="w-4 h-4" />, text: "AI Chatbot aktif" },
        { icon: <BarChart3 className="w-4 h-4" />, text: "Laporan Dasar" },
        { icon: <CreditCard className="w-4 h-4" />, text: "Integrasi Katalog" },
      ],
    },
    pro: {
      name: "Pro",
      price: "Rp 99.000",
      period: "/ bulan",
      color: "#F59E0B",
      gradientBtn: "linear-gradient(135deg, #F59E0B, #D97706)",
      badge: "Paling Populer",
      badgeClass: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      cardClass: "border-yellow-500/30 from-yellow-500/5",
      highlight: true,
      features: [
        { icon: <Wifi className="w-4 h-4" />, text: "Hingga 3 Nomor WhatsApp CS" },
        { icon: <Bot className="w-4 h-4" />, text: "AI Chatbot Konteks Lanjutan" },
        { icon: <BarChart3 className="w-4 h-4" />, text: "Laporan & Analitik Lengkap" },
        { icon: <CreditCard className="w-4 h-4" />, text: "Semua Fitur Katalog & Promo" },
        { icon: <Sparkles className="w-4 h-4" />, text: "Pengaturan AI Kustom" },
        { icon: <Shield className="w-4 h-4" />, text: "Prioritas Dukungan" },
      ],
    },
  };

  const current = plans[selectedPlan];

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ isolation: "isolate" }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal card */}
      <div
        className="relative z-10 w-full max-w-lg flex flex-col max-h-[90vh]"
        style={{
          background: "linear-gradient(160deg, #0D1526 0%, #0A0F1E 100%)",
          border: "1px solid rgba(255,255,255,0.09)",
          borderRadius: "24px",
          boxShadow: "0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#56D6FF]/10 border border-[#56D6FF]/20 flex items-center justify-center shrink-0">
              <Eye className="w-4 h-4 text-[#56D6FF]" />
            </div>
            <div>
              <h2 className="text-[#F1F5F9] font-bold text-base leading-tight">Preview Tampilan Tenant</h2>
              <p className="text-[#94A3B8] text-[11px] mt-0.5">Tampilan paket persis seperti yang dilihat user</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/[0.05] hover:bg-white/10 flex items-center justify-center text-[#94A3B8] hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {/* Toggle paket */}
          <div className="flex gap-2 p-1 bg-white/[0.03] rounded-2xl border border-white/[0.05]">
            {(["basic", "pro"] as const).map((plan) => (
              <button
                key={plan}
                onClick={() => setSelectedPlan(plan)}
                className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                  selectedPlan === plan
                    ? plan === "pro"
                      ? "bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 shadow-[0_0_12px_rgba(245,158,11,0.12)]"
                      : "bg-[#3B82F6]/10 border border-[#3B82F6]/30 text-[#3B82F6] shadow-[0_0_12px_rgba(59,130,246,0.12)]"
                    : "text-[#94A3B8] hover:text-white"
                }`}
              >
                {plan === "pro" && <Zap className="w-3 h-3 inline mr-1 -mt-0.5" />}
                {plans[plan].name}
              </button>
            ))}
          </div>

          {/* Kartu paket */}
          <div
            className={`rounded-2xl border p-5 bg-gradient-to-br to-transparent ${current.cardClass}`}
          >
            <div className="flex items-start justify-between mb-4">
              <span
                className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-full border ${current.badgeClass}`}
              >
                {current.highlight && <Sparkles className="w-3 h-3" />}
                {current.badge}
              </span>
              {current.highlight && <Zap className="w-5 h-5 text-yellow-500 mt-0.5" />}
            </div>

            <h3 className="text-xl font-black text-white mb-0.5">{current.name}</h3>
            <div className="flex items-baseline gap-1 mb-5">
              <span className="text-3xl font-black" style={{ color: current.color }}>
                {current.price}
              </span>
              <span className="text-[#94A3B8] text-sm">{current.period}</span>
            </div>

            <ul className="space-y-2.5">
              {current.features.map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-sm">
                  <span
                    className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: `${current.color}18`, color: current.color }}
                  >
                    {f.icon}
                  </span>
                  <span className="text-[#CBD5E1]">{f.text}</span>
                </li>
              ))}
            </ul>

            {/* Tombol CTA simulasi */}
            <div
              className="mt-5 w-full py-3 rounded-xl font-bold text-sm text-center text-white flex items-center justify-center gap-2 cursor-not-allowed opacity-90 select-none"
              style={{ background: current.gradientBtn }}
            >
              <CreditCard className="w-4 h-4" />
              Bayar Sekarang &amp; Lengkapi Pembayaran
            </div>
            <p className="text-center text-[10px] text-[#64748B] mt-2">
              Diproses aman melalui <strong className="text-[#94A3B8]">Pakasir Payment Gateway</strong>
            </p>
          </div>

          {/* Ringkasan harga dua paket */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#3B82F6]/[0.04] border border-[#3B82F6]/15 rounded-xl p-3.5 text-center">
              <p className="text-[10px] uppercase tracking-widest text-[#94A3B8] mb-1">Basic</p>
              <p className="text-lg font-black text-[#3B82F6]">Rp 35.000</p>
              <p className="text-[10px] text-[#64748B]">per bulan · 1 nomor WA</p>
            </div>
            <div className="bg-yellow-500/[0.04] border border-yellow-500/15 rounded-xl p-3.5 text-center">
              <p className="text-[10px] uppercase tracking-widest text-[#94A3B8] mb-1">Pro</p>
              <p className="text-lg font-black text-yellow-500">Rp 99.000</p>
              <p className="text-[10px] text-[#64748B]">per bulan · 3 nomor WA</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 pt-2 shrink-0 border-t border-white/[0.05]">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] text-[#94A3B8] hover:text-white text-sm font-medium transition-all"
          >
            Tutup Preview
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Halaman Utama Tenant Billing ─────────────────────────────────────────────
export default function TenantBillingPage({
  tenant,
  paymentMethods,
  isOwner = false,
}: {
  tenant: any;
  paymentMethods: any[];
  isOwner?: boolean;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>("basic");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paket: selectedPlan }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal membuat tagihan");
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error("Checkout URL tidak ditemukan");
      }
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className="px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-sm font-medium flex items-center gap-2 w-fit">
            <CheckCircle className="w-4 h-4" />Aktif
          </span>
        );
      case "trial":
        return (
          <span className="px-3 py-1 bg-yellow-500/10 text-yellow-500 rounded-full text-sm font-medium flex items-center gap-2 w-fit">
            <Clock className="w-4 h-4" />Masa Trial
          </span>
        );
      case "expired":
        return (
          <span className="px-3 py-1 bg-red-500/10 text-red-500 rounded-full text-sm font-medium flex items-center gap-2 w-fit">
            <AlertTriangle className="w-4 h-4" />Kedaluwarsa
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-gray-500/10 text-gray-400 rounded-full text-sm font-medium">
            {status}
          </span>
        );
    }
  };

  return (
    <>
      {/* Modal preview dirender via Portal ke document.body ─ tidak akan terpotong */}
      {showPreview && <PaketPreviewModal onClose={() => setShowPreview(false)} />}

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#56D6FF] mb-1">Akun Anda</p>
            <h1 className="text-2xl font-bold text-[#F1F5F9]">Langganan &amp; Tagihan</h1>
            <p className="text-[#94A3B8] mt-1 text-sm">Kelola paket langganan layanan CS Chatbot Anda</p>
          </div>

          {/* Tombol Preview Paket */}
          <button
            onClick={() => setShowPreview(true)}
            className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[rgba(86,214,255,0.06)] hover:bg-[rgba(86,214,255,0.12)] border border-[#56D6FF]/20 hover:border-[#56D6FF]/40 text-[#56D6FF] text-sm font-semibold transition-all whitespace-nowrap"
          >
            <Eye className="w-4 h-4" />
            Lihat Paket Tersedia
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 glass-card p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-[#94A3B8] text-sm mb-1">Status Saat Ini</p>
                {getStatusBadge(tenant.status)}
              </div>
              <div className="text-right">
                <p className="text-[#94A3B8] text-sm mb-1">Paket Aktif</p>
                <span className="capitalize text-lg font-bold text-[#F1F5F9] inline-flex items-center gap-2">
                  <Zap className={`w-5 h-5 ${tenant.paket === "pro" || isOwner ? "text-yellow-500" : "text-[#3B82F6]"}`} />
                  {isOwner ? "Owner (Gratis Selamanya)" : `${tenant.paket} Plan`}
                </span>
              </div>
            </div>

            <div className="bg-[rgba(15,23,42,0.5)] rounded-lg p-5 border border-[rgba(255,255,255,0.05)] mb-6">
              <h3 className="font-medium text-[#F1F5F9] mb-4">Detail Paket</h3>
              <ul className="space-y-3 text-sm text-[#94A3B8]">
                <li className="flex justify-between border-b border-[rgba(255,255,255,0.05)] pb-3">
                  <span>Batas Nomor WhatsApp CS:</span>
                  <span className="text-[#F1F5F9] font-medium">{tenant.maxWaAccounts} Nomor</span>
                </li>
                <li className="flex justify-between border-b border-[rgba(255,255,255,0.05)] pb-3">
                  <span>Batas Balasan Bot:</span>
                  <span className="text-[#F1F5F9] font-medium">Unlimited</span>
                </li>
                <li className="flex justify-between pb-1">
                  <span>Masa Aktif Berakhir:</span>
                  <span className="text-yellow-500 font-medium">
                    {isOwner
                      ? "Selamanya"
                      : tenant.status === "trial" && tenant.trialEndsAt
                      ? format(new Date(tenant.trialEndsAt), "dd MMMM yyyy (HH:mm)", { locale: id })
                      : "-"}
                  </span>
                </li>
              </ul>
            </div>

            {isOwner ? (
              <div className="bg-yellow-500/10 border border-yellow-500/30 p-5 rounded-lg mt-6">
                <div className="flex items-start gap-3">
                  <Zap className="w-6 h-6 text-yellow-500 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-yellow-500 mb-1">Hak Istimewa Owner</h3>
                    <p className="text-sm text-yellow-500/80">
                      Sebagai Owner, Anda mendapatkan akses penuh ke seluruh fitur platform CS Velora secara gratis selamanya, tanpa perlu melakukan perpanjangan atau upgrade paket.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#0A0F1E] p-5 rounded-lg border border-[rgba(255,255,255,0.05)] mt-6">
                <h3 className="font-medium text-[#F1F5F9] mb-4">Pengajuan Perpanjangan / Upgrade</h3>

                {success ? (
                  <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-lg text-center">
                    <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p className="text-[#F1F5F9] font-medium">Pengajuan Berhasil Terkirim!</p>
                    <p className="text-sm text-[#94A3B8] mt-1">
                      Admin kami akan segera memverifikasi pembayaran Anda max 1x24 jam.
                    </p>
                    <button
                      onClick={() => setSuccess(false)}
                      className="mt-4 text-sm text-[#3B82F6] hover:underline"
                    >
                      Ajukan transaksi lain
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                      <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm">
                        {error}
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm text-[#94A3B8]">Pilih Paket</label>
                        <button
                          type="button"
                          onClick={() => setShowPreview(true)}
                          className="text-xs text-[#56D6FF] hover:underline flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          Bandingkan paket
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <label
                          className={`cursor-pointer rounded-xl border p-4 flex flex-col items-center gap-1.5 transition-all ${
                            selectedPlan === "basic"
                              ? "border-[#3B82F6] bg-[#3B82F6]/10"
                              : "border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.02)]"
                          }`}
                        >
                          <input
                            type="radio"
                            name="paket"
                            value="basic"
                            checked={selectedPlan === "basic"}
                            onChange={() => setSelectedPlan("basic")}
                            className="sr-only"
                          />
                          <div className="font-bold text-[#F1F5F9]">Basic</div>
                          <div className="text-xs text-[#3B82F6] font-semibold">Rp 35.000/bln</div>
                          <div className="text-[10px] text-[#94A3B8]">1 WA CS</div>
                        </label>
                        <label
                          className={`cursor-pointer rounded-xl border p-4 flex flex-col items-center gap-1.5 transition-all ${
                            selectedPlan === "pro"
                              ? "border-yellow-500 bg-yellow-500/10"
                              : "border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.02)]"
                          }`}
                        >
                          <input
                            type="radio"
                            name="paket"
                            value="pro"
                            checked={selectedPlan === "pro"}
                            onChange={() => setSelectedPlan("pro")}
                            className="sr-only"
                          />
                          <div className="font-bold text-yellow-500 flex items-center gap-1">
                            <Zap className="w-3.5 h-3.5" />Pro
                          </div>
                          <div className="text-xs text-yellow-500 font-semibold">Rp 99.000/bln</div>
                          <div className="text-[10px] text-[#94A3B8]">3 WA CS</div>
                        </label>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[rgba(255,255,255,0.05)]">
                      <div className="flex justify-between font-medium mb-4">
                        <span className="text-[#94A3B8]">Total Tagihan:</span>
                        <span className="text-[#F1F5F9] text-lg">
                          {selectedPlan === "basic" ? "Rp 35.000" : "Rp 99.000"} / bulan
                        </span>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white py-3 px-4 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" /> Memproses...
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-5 h-5" /> Bayar Sekarang &amp; Lengkapi Pembayaran{" "}
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                      <p className="text-xs text-center text-[#94A3B8] mt-3">
                        Pembayaran diproses aman melalui <strong>Pakasir Payment Gateway</strong>.
                      </p>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>

          <div className="glass-card p-6">
            <h3 className="font-medium text-[#F1F5F9] mb-4 border-b border-[rgba(255,255,255,0.1)] pb-3">
              Metode Pembayaran Transfer
            </h3>

            <div className="space-y-4 mb-6">
              {paymentMethods.length > 0 ? (
                paymentMethods.map((pm) => (
                  <div key={pm.id} className="bg-[#0A0F1E] p-3 rounded-lg border border-[rgba(255,255,255,0.05)]">
                    <p className="text-xs text-[#94A3B8] font-medium mb-1">{pm.bankName?.toUpperCase()}</p>
                    <p className="text-lg font-bold text-[#F1F5F9] font-mono tracking-wider">{pm.accountNumber}</p>
                    <p className="text-xs text-[#94A3B8]">a.n. {pm.accountName}</p>
                  </div>
                ))
              ) : (
                <div className="bg-[#0A0F1E] p-4 rounded-lg border border-yellow-500/30 text-yellow-500/90 text-sm text-center">
                  Metode pembayaran belum diatur oleh Admin. Hubungi kami melalui WhatsApp.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="glass-card overflow-hidden">
          <div className="p-6 border-b border-[rgba(255,255,255,0.05)]">
            <h2 className="text-lg font-medium text-[#F1F5F9]">Riwayat Pembayaran</h2>
          </div>
          <div className="p-8 text-center text-[#94A3B8]">
            <p>Belum ada riwayat transaksi.</p>
          </div>
        </div>
      </div>
    </>
  );
}
