"use client";

import { useState } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { CreditCard, CheckCircle, Clock, Zap, AlertTriangle, Upload, Loader2, ArrowRight } from "lucide-react";

export default function TenantBillingPage({ 
  tenant, 
  paymentMethods 
}: { 
  tenant: any, 
  paymentMethods: any[] 
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>("basic");
  const [file, setFile] = useState<File | null>(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Mohon upload bukti transfer pembayaran");
      return;
    }
    
    setError("");
    setIsSubmitting(true);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append("paket", selectedPlan);
      formData.append("buktiPembayaran", file);

      const res = await fetch("/api/billing/upgrade", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal mengajukan perpanjangan");
      }

      setSuccess(true);
      setFile(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
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
                <Zap className={`w-5 h-5 ${tenant.paket === 'pro' ? 'text-yellow-500' : 'text-[#3B82F6]'}`} />
                {tenant.paket} Plan
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
                  {tenant.status === 'trial' && tenant.trialEndsAt 
                    ? format(new Date(tenant.trialEndsAt), "dd MMMM yyyy (HH:mm)", { locale: id }) 
                    : "-"}
                </span>
              </li>
            </ul>
          </div>
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

                <div>
                  <label className="block text-sm text-[#94A3B8] mb-2">Upload Bukti Transfer</label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-[#94A3B8]
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-[#3B82F6]/10 file:text-[#3B82F6]
                      hover:file:bg-[#3B82F6]/20 cursor-pointer"
                  />
                  {file && <p className="text-xs text-green-500 mt-2 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> File terpilih: {file.name}</p>}
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting || !file}
                  className="w-full py-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium rounded-lg transition-colors flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                >
                  {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin"/> Memproses...</> : <><Upload className="w-4 h-4"/> Kirim Bukti Pembayaran</>}
                </button>
              </form>
            )}
          </div>
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
