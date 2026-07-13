"use client";

import { useState, useEffect } from "react";
import { Building, Save, Loader2, Upload, Eye, Activity, CheckCircle, AlertCircle, Terminal, Globe, Trash2, Wifi } from "lucide-react";
import { toast } from "sonner";

export default function OwnerSettingsPage() {
  const [activeTab, setActiveTab] = useState<"platform" | "diagnostics" | "fonnte">("platform");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingFonnte, setTestingFonnte] = useState(false);

  // Platform Branding State
  const [platformSettings, setPlatformSettings] = useState({
    system_login_logo: "/logo-velora.png",
    system_favicon: "/logo-velora.png",
    system_sidebar_logo: "/logo-velora.png",
    owner_fonnte_token: "",
  });
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  // Diagnostics State
  const [testingConn, setTestingConn] = useState(false);
  const [testConnResult, setTestConnResult] = useState<any>(null);
  const [simulating, setSimulating] = useState(false);
  const [simulateResult, setSimulateResult] = useState<any>(null);
  const [simOrderId, setSimOrderId] = useState("");
  const [simType, setSimType] = useState<"sub" | "ord">("sub");

  const [testingRustFS, setTestingRustFS] = useState(false);

  const handleTestRustFS = async () => {
    setTestingRustFS(true);
    const toastId = toast.loading("Menguji koneksi RustFS Storage...");
    try {
      const res = await fetch("/api/storage/test-connection", {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message, { id: toastId });
      } else {
        toast.error(data.error || "Gagal terhubung ke RustFS Storage", { id: toastId });
      }
    } catch {
      toast.error("Terjadi kesalahan koneksi", { id: toastId });
    } finally {
      setTestingRustFS(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      // Fetch platform branding
      const resBrand = await fetch("/api/owner/platform");
      if (resBrand.ok) {
        const data = await resBrand.json();
        setPlatformSettings({
          system_login_logo: data.system_login_logo || "/logo-velora.png",
          system_favicon: data.system_favicon || "/logo-velora.png",
          system_sidebar_logo: data.system_sidebar_logo || "/logo-velora.png",
          owner_fonnte_token: data.owner_fonnte_token || "",
        });
      }
    } catch (error) {
      console.error("Failed to fetch owner settings", error);
      toast.error("Gagal memuat pengaturan");
    } finally {
      setLoading(false);
    }
  };

  const handleSavePlatform = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/owner/platform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(platformSettings),
      });

      if (res.ok) {
        toast.success("Pengaturan platform branding berhasil disimpan");
        // Dispatch event so layout/sidebars sync immediately
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("branding-updated"));
        }
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

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldKey: "system_login_logo" | "system_favicon" | "system_sidebar_logo") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File terlalu besar (Maksimal 2MB)");
      return;
    }

    try {
      setUploadingField(fieldKey);
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setPlatformSettings((prev) => ({ ...prev, [fieldKey]: data.url }));
        toast.success("Gambar branding berhasil diunggah!");
      } else {
        toast.error(data.error || "Gagal mengunggah gambar");
      }
    } catch {
      toast.error("Terjadi kesalahan saat mengunggah");
    } finally {
      setUploadingField(null);
    }
  };

  const handleTestConnection = async () => {
    setTestingConn(true);
    setTestConnResult(null);
    try {
      const res = await fetch("/api/owner/test-pakasir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test-connection" })
      });
      const data = await res.json();
      setTestConnResult(data);
      if (data.success) {
        toast.success("Koneksi Pakasir Sukses!");
      } else {
        toast.error("Koneksi Pakasir Gagal!");
      }
    } catch {
      toast.error("Gagal menghubungi server diagnostik");
    } finally {
      setTestingConn(false);
    }
  };

  const handleTestFonnte = async () => {
    if (!platformSettings.owner_fonnte_token) {
      toast.error("Masukkan token Fonnte terlebih dahulu untuk menguji.");
      return;
    }
    setTestingFonnte(true);
    try {
      const res = await fetch("/api/whatsapp/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "fonnte",
          apiKey: platformSettings.owner_fonnte_token
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Koneksi Fonnte Sukses! " + (data.details || ""));
      } else {
        toast.error(data.message || data.error || "Koneksi Fonnte Gagal");
      }
    } catch {
      toast.error("Gagal menghubungi server Fonnte");
    } finally {
      setTestingFonnte(false);
    }
  };

  const handleSimulateCallback = async () => {
    if (!simOrderId.trim()) {
      toast.error("ID Pesanan simulasi wajib diisi!");
      return;
    }
    setSimulating(true);
    setSimulateResult(null);
    try {
      const res = await fetch("/api/owner/test-pakasir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "simulate-callback",
          orderId: simOrderId.trim(),
          type: simType
        })
      });
      const data = await res.json();
      setSimulateResult(data);
      if (data.success) {
        toast.success("Simulasi Webhook berhasil diproses!");
      } else {
        toast.error("Simulasi Webhook ditolak!");
      }
    } catch {
      toast.error("Gagal mengirim simulasi webhook");
    } finally {
      setSimulating(false);
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
        <h1 className="text-2xl font-bold text-[#F1F5F9]">Pengaturan Sistem Owner</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-1 space-y-2">
          <button
            onClick={() => setActiveTab("platform")}
            className={`w-full flex items-center gap-3 p-4 border rounded-xl font-medium transition-all text-left ${
              activeTab === "platform"
                ? "bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.1)] text-[#F1F5F9] shadow-[0_0_15px_rgba(59,130,246,0.05)]"
                : "border-transparent text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[rgba(255,255,255,0.02)]"
            }`}
          >
            <Building className={`w-5 h-5 ${activeTab === "platform" ? "text-[#3B82F6]" : ""}`} />
            Profil & Branding Platform
          </button>

          <button
            onClick={() => setActiveTab("diagnostics")}
            className={`w-full flex items-center gap-3 p-4 border rounded-xl font-medium transition-all text-left ${
              activeTab === "diagnostics"
                ? "bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.1)] text-[#F1F5F9] shadow-[0_0_15px_rgba(59,130,246,0.05)]"
                : "border-transparent text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[rgba(255,255,255,0.02)]"
            }`}
          >
            <Activity className={`w-5 h-5 ${activeTab === "diagnostics" ? "text-[#56D6FF]" : ""}`} />
            Diagnostik Pakasir
          </button>

          <button
            onClick={() => setActiveTab("fonnte")}
            className={`w-full flex items-center gap-3 p-4 border rounded-xl font-medium transition-all text-left ${
              activeTab === "fonnte"
                ? "bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.1)] text-[#F1F5F9] shadow-[0_0_15px_rgba(59,130,246,0.05)]"
                : "border-transparent text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[rgba(255,255,255,0.02)]"
            }`}
          >
            <Wifi className={`w-5 h-5 ${activeTab === "fonnte" ? "text-green-450" : ""}`} />
            Integrasi WhatsApp Fonnte
          </button>
        </div>

        {/* Tab Contents */}
        <div className="lg:col-span-2">

          {activeTab === "platform" && (
            <div className="glass-card p-6 animate-in fade-in duration-200">
              <h2 className="text-lg font-bold text-[#F1F5F9] mb-6 flex items-center gap-2">
                <Building className="w-5 h-5 text-[#3B82F6]" />
                Profil & Platform Branding
              </h2>

              <div className="space-y-6">
                <div className="bg-[rgba(15,23,42,0.5)] p-6 rounded-lg border border-[rgba(255,255,255,0.05)] space-y-6">
                  <p className="text-[#94A3B8]">
                    Konfigurasi logo dan ikon global untuk platform CS-Velora. Pengaturan ini hanya dapat diakses oleh Owner Sistem.
                  </p>
                  
                  {/* 1. Login Logo */}
                  <div className="border-b border-white/5 pb-5">
                    <label className="block text-sm font-semibold text-[#F1F5F9] mb-1">Logo Halaman Login & Registrasi</label>
                    <p className="text-xs text-[#94A3B8] mb-3">Akan ditampilkan pada halaman masuk serta pembuatan akun tenant baru.</p>
                    {platformSettings.system_login_logo && platformSettings.system_login_logo !== "/logo-velora.png" ? (
                      <div className="space-y-2">
                        <div className="relative group w-full h-[140px] rounded-xl overflow-hidden border border-[rgba(255,255,255,0.08)] bg-slate-950/50 flex items-center justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={platformSettings.system_login_logo} alt="Login Logo Preview" className="max-w-full max-h-full object-contain p-3" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                            <button type="button" onClick={() => setPlatformSettings((p) => ({ ...p, system_login_logo: "/logo-velora.png" }))} className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 rounded-lg text-white text-xs font-bold transition-all">
                              <Trash2 className="h-3.5 w-3.5" /> Hapus Logo
                            </button>
                          </div>
                        </div>
                        <label className="flex items-center justify-center gap-1.5 w-full py-2 border border-dashed border-[rgba(255,255,255,0.1)] hover:border-[#56D6FF]/40 rounded-xl text-xs text-[#69809F] hover:text-[#56D6FF] cursor-pointer transition-all">
                          <Upload className="h-3.5 w-3.5" /> Ganti Logo Login
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoUpload(e, "system_login_logo")} disabled={!!uploadingField} />
                        </label>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center border-2 border-dashed border-[rgba(255,255,255,0.12)] hover:border-[#56D6FF]/50 bg-white/2 hover:bg-[#56D6FF]/5 rounded-xl p-6 cursor-pointer transition-all group">
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoUpload(e, "system_login_logo")} disabled={!!uploadingField} />
                        {uploadingField === "system_login_logo" ? (
                          <div className="flex flex-col items-center gap-2 text-[#93A8C7]"><Loader2 className="h-8 w-8 animate-spin text-[#56D6FF]" /><span className="text-xs">Mengunggah...</span></div>
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-[#93A8C7] group-hover:text-[#F1F5F9]">
                            <div className="w-10 h-10 rounded-xl bg-[#56D6FF]/10 flex items-center justify-center group-hover:bg-[#56D6FF]/20 transition-all"><Upload className="h-5 w-5 text-[#56D6FF]" /></div>
                            <span className="text-xs font-semibold">Unggah Logo Login</span>
                            <span className="text-[10px] text-[#69809F]">PNG, JPG, SVG — Maks 2MB</span>
                          </div>
                        )}
                      </label>
                    )}
                  </div>

                  {/* 2. System Sidebar Logo */}
                  <div className="border-b border-white/5 pb-5">
                    <label className="block text-sm font-semibold text-[#F1F5F9] mb-1">Logo Sidebar Default</label>
                    <p className="text-xs text-[#94A3B8] mb-3">Logo bawaan pada panel navigasi kiri sebelum tenant mengunggah logo kustom mereka sendiri.</p>
                    {platformSettings.system_sidebar_logo && platformSettings.system_sidebar_logo !== "/logo-velora.png" ? (
                      <div className="space-y-2">
                        <div className="relative group w-full h-[140px] rounded-xl overflow-hidden border border-[rgba(255,255,255,0.08)] bg-slate-950/50 flex items-center justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={platformSettings.system_sidebar_logo} alt="Sidebar Logo Preview" className="max-w-full max-h-full object-contain p-3" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                            <button type="button" onClick={() => setPlatformSettings((p) => ({ ...p, system_sidebar_logo: "/logo-velora.png" }))} className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 rounded-lg text-white text-xs font-bold transition-all">
                              <Trash2 className="h-3.5 w-3.5" /> Hapus Logo
                            </button>
                          </div>
                        </div>
                        <label className="flex items-center justify-center gap-1.5 w-full py-2 border border-dashed border-[rgba(255,255,255,0.1)] hover:border-[#56D6FF]/40 rounded-xl text-xs text-[#69809F] hover:text-[#56D6FF] cursor-pointer transition-all">
                          <Upload className="h-3.5 w-3.5" /> Ganti Logo Sidebar
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoUpload(e, "system_sidebar_logo")} disabled={!!uploadingField} />
                        </label>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center border-2 border-dashed border-[rgba(255,255,255,0.12)] hover:border-[#56D6FF]/50 bg-white/2 hover:bg-[#56D6FF]/5 rounded-xl p-6 cursor-pointer transition-all group">
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoUpload(e, "system_sidebar_logo")} disabled={!!uploadingField} />
                        {uploadingField === "system_sidebar_logo" ? (
                          <div className="flex flex-col items-center gap-2 text-[#93A8C7]"><Loader2 className="h-8 w-8 animate-spin text-[#56D6FF]" /><span className="text-xs">Mengunggah...</span></div>
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-[#93A8C7] group-hover:text-[#F1F5F9]">
                            <div className="w-10 h-10 rounded-xl bg-[#56D6FF]/10 flex items-center justify-center group-hover:bg-[#56D6FF]/20 transition-all"><Upload className="h-5 w-5 text-[#56D6FF]" /></div>
                            <span className="text-xs font-semibold">Unggah Logo Sidebar</span>
                            <span className="text-[10px] text-[#69809F]">PNG, JPG, SVG — Maks 2MB</span>
                          </div>
                        )}
                      </label>
                    )}
                  </div>

                  {/* 3. Favicon */}
                  <div>
                    <label className="block text-sm font-semibold text-[#F1F5F9] mb-1">Ikon Tab Browser / Favicon</label>
                    <p className="text-xs text-[#94A3B8] mb-3">Ikon kecil yang ditampilkan di tab peramban/browser (Disarankan ukuran 32x32 piksel format PNG/ICO).</p>
                    {platformSettings.system_favicon && platformSettings.system_favicon !== "/logo-velora.png" ? (
                      <div className="space-y-2">
                        <div className="relative group w-full h-[120px] rounded-xl overflow-hidden border border-[rgba(255,255,255,0.08)] bg-slate-950/50 flex items-center justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={platformSettings.system_favicon} alt="Favicon Preview" className="max-w-[64px] max-h-[64px] object-contain" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                            <button type="button" onClick={() => setPlatformSettings((p) => ({ ...p, system_favicon: "/logo-velora.png" }))} className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 rounded-lg text-white text-xs font-bold transition-all">
                              <Trash2 className="h-3.5 w-3.5" /> Hapus Favicon
                            </button>
                          </div>
                        </div>
                        <label className="flex items-center justify-center gap-1.5 w-full py-2 border border-dashed border-[rgba(255,255,255,0.1)] hover:border-[#56D6FF]/40 rounded-xl text-xs text-[#69809F] hover:text-[#56D6FF] cursor-pointer transition-all">
                          <Upload className="h-3.5 w-3.5" /> Ganti Favicon
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoUpload(e, "system_favicon")} disabled={!!uploadingField} />
                        </label>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center border-2 border-dashed border-[rgba(255,255,255,0.12)] hover:border-[#56D6FF]/50 bg-white/2 hover:bg-[#56D6FF]/5 rounded-xl p-6 cursor-pointer transition-all group">
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoUpload(e, "system_favicon")} disabled={!!uploadingField} />
                        {uploadingField === "system_favicon" ? (
                          <div className="flex flex-col items-center gap-2 text-[#93A8C7]"><Loader2 className="h-8 w-8 animate-spin text-[#56D6FF]" /><span className="text-xs">Mengunggah...</span></div>
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-[#93A8C7] group-hover:text-[#F1F5F9]">
                            <div className="w-10 h-10 rounded-xl bg-[#56D6FF]/10 flex items-center justify-center group-hover:bg-[#56D6FF]/20 transition-all"><Upload className="h-5 w-5 text-[#56D6FF]" /></div>
                            <span className="text-xs font-semibold">Unggah Favicon</span>
                            <span className="text-[10px] text-[#69809F]">PNG, ICO — 32×32px, Maks 2MB</span>
                          </div>
                        )}
                      </label>
                    )}
                  </div>
                  
                  <div className="mt-6 flex justify-end pt-4 border-t border-white/5">
                    <button 
                      onClick={handleSavePlatform}
                      disabled={saving || !!uploadingField}
                      className="flex items-center gap-2 px-6 py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium rounded-xl transition-colors disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Simpan Platform Branding
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "diagnostics" && (
            <div className="glass-card p-6 animate-in fade-in duration-200 space-y-6">
              <div className="flex items-center gap-3 border-b border-[rgba(255,255,255,0.06)] pb-3">
                <Activity className="h-5 w-5 text-[#56D6FF]" />
                <h2 className="font-display text-xl font-bold text-white">Diagnostik & Alat Uji Pakasir</h2>
              </div>
              <p className="text-xs text-[#93A8C7]">
                Gunakan alat diagnostik ini untuk menguji kredensial Pakasir milik Owner yang dipasang di <code>.env</code> server, serta menyimulasikan callback webhook order.
              </p>

              {/* 1. Tes Koneksi API */}
              <div className="bg-[rgba(15,23,42,0.5)] p-5 rounded-xl border border-white/5 space-y-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#56D6FF]" />
                  Tes Koneksi API Pakasir (Owner)
                </h3>
                <p className="text-xs text-[#94A3B8]">
                  Menghubungi API Pakasir menggunakan credentials owner dari <code>.env</code> server untuk memverifikasi validitas slug dan API key.
                </p>

                <div className="flex justify-start">
                  <button
                    onClick={handleTestConnection}
                    disabled={testingConn}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    {testingConn ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5" />}
                    Uji Koneksi API Pakasir
                  </button>
                </div>

                {testConnResult && (
                  <div className="mt-3 p-4 bg-[#080d1a] border border-white/5 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold">
                      {testConnResult.success ? (
                        <span className="text-green-400 flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" /> SUKSES
                        </span>
                      ) : (
                        <span className="text-red-400 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" /> GAGAL
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 font-medium">{testConnResult.message || testConnResult.error}</p>
                    {testConnResult.details && (
                      <pre className="text-[10px] font-mono text-[#56D6FF] bg-black/35 p-3 rounded-lg overflow-x-auto max-h-[150px] whitespace-pre-wrap">
                        {JSON.stringify(testConnResult.details, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </div>

              {/* 2. Simulasi Webhook */}
              <div className="bg-[rgba(15,23,42,0.5)] p-5 rounded-xl border border-white/5 space-y-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-[#FFBF69]" />
                  Simulasi Webhook Callback
                </h3>
                <p className="text-xs text-[#94A3B8]">
                  Kirim request callback tiruan (mock request) ke endpoint webhook <code>/api/webhooks/pakasir</code> untuk memicu status pembayaran lunas.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-1">
                    <label className="block text-xs text-[#94A3B8] mb-1.5">Tipe Simulasi</label>
                    <select
                      value={simType}
                      onChange={e => setSimType(e.target.value as "sub" | "ord")}
                      className="w-full px-3 py-2 bg-[#0A0F1E] border border-[rgba(255,255,255,0.08)] rounded-xl text-xs text-white focus:outline-none focus:border-[#3B82F6] cursor-pointer"
                    >
                      <option value="sub">Langganan Tenant (SUB-)</option>
                      <option value="ord">Order Toko Tenant (ORD-)</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-[#94A3B8] mb-1.5">
                      ID Pesanan (Order ID)
                      <span className="ml-1 text-[9px] text-[#64748B]">Harus ada di database</span>
                    </label>
                    <input
                      type="text"
                      value={simOrderId}
                      onChange={e => setSimOrderId(e.target.value)}
                      placeholder={simType === "sub" ? "Cth: SUB-123e4567-..." : "Cth: ORD-123e4567-..."}
                      className="w-full px-3 py-2 bg-[#0A0F1E] border border-[rgba(255,255,255,0.08)] rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#3B82F6]"
                    />
                  </div>
                </div>

                <div className="flex justify-start">
                  <button
                    onClick={handleSimulateCallback}
                    disabled={simulating}
                    className="px-4 py-2 bg-[#FFBF69]/10 hover:bg-[#FFBF69]/20 border border-[#FFBF69]/20 text-[#FFBF69] rounded-xl text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    {simulating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Terminal className="w-3.5 h-3.5" />}
                    Kirim Simulasi Webhook
                  </button>
                </div>

                {simulateResult && (
                  <div className="mt-3 p-4 bg-[#080d1a] border border-white/5 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold">
                      {simulateResult.success ? (
                        <span className="text-green-400 flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" /> SUCCESS ({simulateResult.status})
                        </span>
                      ) : (
                        <span className="text-red-400 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" /> FAILED ({simulateResult.status || 500})
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 font-medium">{simulateResult.message || simulateResult.error}</p>
                    <pre className="text-[10px] font-mono text-[#56D6FF] bg-black/35 p-3 rounded-lg overflow-x-auto max-h-[150px] whitespace-pre-wrap">
                      {JSON.stringify(simulateResult.response || simulateResult, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              {/* RustFS Storage Diagnostik */}
              <div className="bg-[rgba(15,23,42,0.5)] p-5 rounded-xl border border-white/5 space-y-4 mt-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[rgba(255,255,255,0.06)] pb-3">
                  <div className="flex items-center gap-3">
                    <Upload className="h-6 w-6 text-[#56D6FF]" />
                    <div>
                      <h3 className="text-sm font-semibold text-white">Diagnostik RustFS Storage (S3)</h3>
                      <p className="text-xs text-[#93A8C7]">Uji koneksi penyimpanan berkas global RustFS.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleTestRustFS}
                    disabled={testingRustFS}
                    className="px-4 py-2 bg-[#56D6FF]/10 hover:bg-[#56D6FF]/20 border border-[#56D6FF]/20 text-[#56D6FF] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50 shrink-0 self-start sm:self-center"
                  >
                    {testingRustFS ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5" />}
                    Tes Koneksi RustFS Storage
                  </button>
                </div>
                <p className="text-xs text-[#93A8C7] leading-relaxed">
                  Uji koneksi ke Object Storage RustFS (S3-compatible) menggunakan environment variables server (<code>S3_ENDPOINT</code>, <code>S3_BUCKET</code>, dll.) untuk memastikan pengunggahan file/logo toko berjalan dengan lancar.
                </p>
              </div>
            </div>
          )}

          {activeTab === "fonnte" && (
            <div className="glass-card p-6 animate-in fade-in duration-200">
              <h2 className="text-lg font-bold text-[#F1F5F9] mb-6 flex items-center gap-2">
                <Wifi className="w-5 h-5 text-green-500" />
                Integrasi Fonnte Gateway (Owner Only)
              </h2>

              <div className="space-y-6">
                <div className="bg-[rgba(15,23,42,0.5)] p-6 rounded-lg border border-[rgba(255,255,255,0.05)] space-y-4">
                  <p className="text-[#94A3B8] text-xs leading-relaxed">
                    Fonnte Gateway digunakan secara global oleh Owner untuk melakukan pengiriman pesan sistem (seperti notifikasi tagihan atau broadcast penting) kepada seluruh pengguna aktif.
                  </p>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Token / API Key Fonnte</label>
                    <input
                      type="password"
                      value={platformSettings.owner_fonnte_token || ""}
                      onChange={(e) => setPlatformSettings(prev => ({ ...prev, owner_fonnte_token: e.target.value }))}
                      placeholder="Masukkan Fonnte API Key..."
                      className="w-full px-4 py-2.5 bg-[#0A0F1E] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-[#F1F5F9] focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
                    />
                  </div>

                  <div className="flex gap-3 justify-end pt-4 border-t border-white/5">
                    <button
                      onClick={handleTestFonnte}
                      disabled={testingFonnte || saving}
                      className="flex items-center gap-2 px-4 py-2 bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] text-[#F1F5F9] text-xs font-bold border border-white/10 rounded-xl transition-colors disabled:opacity-50"
                    >
                      {testingFonnte ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5" />}
                      Test Koneksi Fonnte
                    </button>
                    <button 
                      onClick={handleSavePlatform}
                      disabled={saving}
                      className="flex items-center gap-2 px-6 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      Simpan Token Fonnte
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
