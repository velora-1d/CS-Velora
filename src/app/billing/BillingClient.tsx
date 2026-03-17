"use client";

import { useState } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { CreditCard, CheckCircle, Clock, Zap, AlertTriangle, Upload, Loader2, ArrowRight } from "lucide-react";

export default function TenantBillingPage({ 
  tenant, 
  paymentMethods,
  isOwner = false
}: { 
  tenant: any, 
  paymentMethods: any[],
  isOwner?: boolean
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>("basic");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

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
         window.location.href = data.checkoutUrl; // Redirect ke Pakasir Gateway
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
      case 'active':
        return <span className="px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-sm font-medium flex items-center gap-2 w-fit"><CheckCircle className="w-4 h-4"/>Aktif</span>;
      case 'trial':
        return <span className="px-3 py-1 bg-yellow-500/10 text-yellow-500 rounded-full text-sm font-medium flex items-center gap-2 w-fit"><Clock className="w-4 h-4"/>Masa Trial</span>;
      case 'expired':
        return <span className="px-3 py-1 bg-red-500/10 text-red-500 rounded-full text-sm font-medium flex items-center gap-2 w-fit"><AlertTriangle className="w-4 h-4"/>Kedaluwarsa</span>;
      default:
        return <span className="px-3 py-1 bg-gray-500/10 text-gray-400 rounded-full text-sm font-medium">{status}</span>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#F1F5F9]">Langganan & Tagihan</h1>
          <p className="text-[#94A3B8] mt-1">Kelola paket langganan layanan CS Chatbot Anda</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-2 glass-card p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-[#94A3B8] text-sm mb-1">Status Saat Ini</p>
              {getStatusBadge(tenant.status)}
            </div>
            <div className="text-right">
              <p className="text-[#94A3B8] text-sm mb-1">Paket Aktif</p>
              <span className="capitalize text-lg font-bold text-[#F1F5F9] inline-flex items-center gap-2">
                <Zap className={`w-5 h-5 ${tenant.paket === 'pro' || isOwner ? 'text-yellow-500' : 'text-[#3B82F6]'}`} />
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
                  {isOwner ? "Selamanya" : (tenant.status === 'trial' && tenant.trialEndsAt 
                    ? format(new Date(tenant.trialEndsAt), "dd MMMM yyyy (HH:mm)", { locale: id }) 
                    : "-")}
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
                <p className="text-sm text-[#94A3B8] mt-1">Admin kami akan segera memverifikasi pembayaran Anda max 1x24 jam.</p>
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
                  <label className="block text-sm text-[#94A3B8] mb-2">Pilih Paket</label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className={`cursor-pointer rounded-lg border p-3 flex flex-col items-center gap-2 transition-colors ${selectedPlan === 'basic' ? 'border-[#3B82F6] bg-[#3B82F6]/10' : 'border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.02)]'}`}>
                      <input type="radio" name="paket" value="basic" checked={selectedPlan === 'basic'} onChange={() => setSelectedPlan('basic')} className="sr-only" />
                      <div className="font-medium text-[#F1F5F9]">Basic</div>
                      <div className="text-xs text-[#94A3B8]">1 WA CS</div>
                    </label>
                    <label className={`cursor-pointer rounded-lg border p-3 flex flex-col items-center gap-2 transition-colors ${selectedPlan === 'pro' ? 'border-yellow-500 bg-yellow-500/10' : 'border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.02)]'}`}>
                      <input type="radio" name="paket" value="pro" checked={selectedPlan === 'pro'} onChange={() => setSelectedPlan('pro')} className="sr-only" />
                      <div className="font-medium text-yellow-500">Pro</div>
                      <div className="text-xs text-[#94A3B8]">3 WA CS</div>
                    </label>
                  </div>
                </div>


                <div className="pt-4 border-t border-[rgba(255,255,255,0.05)]">
                  <div className="flex justify-between font-medium mb-4">
                    <span className="text-[#94A3B8]">Total Tagihan:</span>
                    <span className="text-[#F1F5F9] text-lg">
                      {selectedPlan === 'basic' ? 'Rp 35.000' : 'Rp 99.000'} / bulan
                    </span>
                  </div>
                  
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                  >
                    {isSubmitting ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> Memproses...</>
                    ) : (
                      <><CreditCard className="w-5 h-5"/> Bayar Sekarang & Lengkapi Pembayaran <ArrowRight className="w-4 h-4" /></>
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
          <h3 className="font-medium text-[#F1F5F9] mb-4 border-b border-[rgba(255,255,255,0.1)] pb-3">Metode Pembayaran Transfer</h3>
          
          <div className="space-y-4 mb-6">
            {paymentMethods.length > 0 ? (
              paymentMethods.map(pm => (
                <div key={pm.id} className="bg-[#0A0F1E] p-3 rounded-lg border border-[rgba(255,255,255,0.05)]">
                  <p className="text-xs text-[#94A3B8] font-medium mb-1">{pm.bankName.toUpperCase()}</p>
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

          {/* Removed duplicate upload box since it's in the form now */}
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
  );
}
