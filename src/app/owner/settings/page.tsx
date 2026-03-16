"use client";

import { useState, useEffect } from "react";
import { CreditCard, Building, ShieldCheck, Save, Loader2, QrCode } from "lucide-react";
import { toast } from "sonner";

export default function OwnerSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    tipe: "transfer",
    namaBank: "",
    nomorRekening: "",
    namaPemilik: "",
    gambarQris: "",
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/owner/settings");
      if (res.ok) {
        const data = await res.json();
        if (data.id) {
          setSettings({
            tipe: data.tipe || "transfer",
            namaBank: data.namaBank || "",
            nomorRekening: data.nomorRekening || "",
            namaPemilik: data.namaPemilik || "",
            gambarQris: data.gambarQris || "",
          });
        }
      }
    } catch (error) {
      console.error("Failed to fetch settings", error);
      toast.error("Gagal memuat pengaturan");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/owner/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        toast.success("Pengaturan berhasil disimpan");
      } else {
        const data = await res.json();
        throw new Error(data.error || "Gagal menyimpan");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#3B82F6]" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#F1F5F9]">Pengaturan Sistem</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-2">
          <button className="w-full flex items-center gap-3 p-4 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-lg text-[#F1F5F9] font-medium transition-colors text-left">
            <CreditCard className="w-5 h-5 text-[#3B82F6]" />
            Metode Pembayaran
          </button>
          
          <button className="w-full flex items-center gap-3 p-4 hover:bg-[rgba(255,255,255,0.02)] border border-transparent rounded-lg text-[#94A3B8] hover:text-[#F1F5F9] font-medium transition-colors text-left">
            <Building className="w-5 h-5" />
            Profil Platform
          </button>
          
          <button className="w-full flex items-center gap-3 p-4 hover:bg-[rgba(255,255,255,0.02)] border border-transparent rounded-lg text-[#94A3B8] hover:text-[#F1F5F9] font-medium transition-colors text-left">
            <ShieldCheck className="w-5 h-5" />
            Keamanan
          </button>
        </div>

        <div className="lg:col-span-2">
          <div className="glass-card p-6">
            <h2 className="text-lg font-bold text-[#F1F5F9] mb-6 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#3B82F6]" />
              Pengaturan Metode Pembayaran
            </h2>

            <div className="space-y-6">
              <div className="bg-[rgba(15,23,42,0.5)] p-6 rounded-lg border border-[rgba(255,255,255,0.05)]">
                <p className="text-[#94A3B8] mb-4">
                  Silakan atur rekening Bank dan QRIS untuk menerima pembayaran langganan dari Tenant.
                </p>
                
                <div className="flex gap-4 mb-6">
                  <button 
                    onClick={() => setSettings({...settings, tipe: 'transfer'})}
                    className={`px-4 py-2 rounded-lg border transition-all ${settings.tipe === 'transfer' ? 'bg-[#3B82F6]/10 border-[#3B82F6] text-[#3B82F6]' : 'border-[rgba(255,255,255,0.08)] text-[#94A3B8]'}`}
                  >
                    Transfer Bank
                  </button>
                  <button 
                    onClick={() => setSettings({...settings, tipe: 'qris'})}
                    className={`px-4 py-2 rounded-lg border transition-all ${settings.tipe === 'qris' ? 'bg-[#3B82F6]/10 border-[#3B82F6] text-[#3B82F6]' : 'border-[rgba(255,255,255,0.08)] text-[#94A3B8]'}`}
                  >
                    QRIS
                  </button>
                </div>

                <div className="space-y-4">
                  {settings.tipe === 'transfer' ? (
                    <>
                      <div>
                        <label className="block text-sm text-[#94A3B8] mb-2">Nama Bank</label>
                        <input 
                          type="text" 
                          value={settings.namaBank}
                          onChange={(e) => setSettings({...settings, namaBank: e.target.value})}
                          className="w-full px-4 py-2 bg-[#0A0F1E] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#F1F5F9] focus:outline-none focus:border-[#3B82F6]" 
                          placeholder="Contoh: BCA / Mandiri / BNI" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-[#94A3B8] mb-2">Nomor Rekening</label>
                        <input 
                          type="text" 
                          value={settings.nomorRekening}
                          onChange={(e) => setSettings({...settings, nomorRekening: e.target.value})}
                          className="w-full px-4 py-2 bg-[#0A0F1E] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#F1F5F9] focus:outline-none focus:border-[#3B82F6]" 
                          placeholder="Cth: 1234567890" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-[#94A3B8] mb-2">Atas Nama</label>
                        <input 
                          type="text" 
                          value={settings.namaPemilik}
                          onChange={(e) => setSettings({...settings, namaPemilik: e.target.value})}
                          className="w-full px-4 py-2 bg-[#0A0F1E] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#F1F5F9] focus:outline-none focus:border-[#3B82F6]" 
                          placeholder="Sesuai buku tabungan" 
                        />
                      </div>
                    </>
                  ) : (
                    <div>
                      <label className="block text-sm text-[#94A3B8] mb-2">URL Gambar QRIS</label>
                      <div className="relative">
                        <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
                        <input 
                          type="text" 
                          value={settings.gambarQris}
                          onChange={(e) => setSettings({...settings, gambarQris: e.target.value})}
                          className="w-full pl-10 pr-4 py-2 bg-[#0A0F1E] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#F1F5F9] focus:outline-none focus:border-[#3B82F6]" 
                          placeholder="https://example.com/qris.jpg" 
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="mt-6 flex justify-end">
                  <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Simpan Pengaturan
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
