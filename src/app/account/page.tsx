"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  User,
  Lock,
  Globe,
  Save,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";

type AccountData = {
  nama: string;
  email: string;
  bahasa: string;
};

export default function AccountPage() {
  const [account, setAccount] = useState<AccountData>({ nama: "", email: "", bahasa: "id" });
  const [loading, setLoading] = useState(true);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isSavingLang, setIsSavingLang] = useState(false);

  useEffect(() => {
    fetchAccount();
  }, []);

  const fetchAccount = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/account");
      const data = await res.json();
      if (res.ok) setAccount(data);
      else toast.error("Gagal memuat data akun.");
    } catch {
      toast.error("Gagal memuat data.");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      toast.error("Password lama dan baru wajib diisi.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password baru minimal 6 karakter.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Konfirmasi password tidak cocok.");
      return;
    }
    try {
      setIsSavingPassword(true);
      const res = await fetch("/api/account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Password berhasil diperbarui!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(data.error || "Gagal mengubah password.");
      }
    } catch {
      toast.error("Gagal mengubah password.");
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleChangeLang = async (lang: string) => {
    try {
      setIsSavingLang(true);
      const res = await fetch("/api/account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bahasa: lang }),
      });
      if (res.ok) {
        setAccount((c) => ({ ...c, bahasa: lang }));
        toast.success("Bahasa diperbarui!");
      } else {
        toast.error("Gagal menyimpan.");
      }
    } catch {
      toast.error("Gagal menyimpan.");
    } finally {
      setIsSavingLang(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[#93A8C7]">
        <Loader2 className="h-10 w-10 animate-spin mb-4 text-[#56D6FF]" />
        <p>Memuat akun...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="hero-panel px-6 py-7 md:px-8">
        <div>
          <span className="section-kicker">Account management</span>
          <h1 className="mt-5 font-display text-4xl font-semibold text-[#F1F5F9] md:text-5xl">Pengaturan Akun</h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-[#93A8C7] md:text-base">
            Kelola password dan preferensi bahasa Anda.
          </p>
        </div>
      </section>

      {/* Info Akun */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(255,255,255,0.05)] text-[#67A7FF]">
            <User className="h-5 w-5" />
          </div>
          <h2 className="font-display text-xl text-[#F1F5F9]">Info Akun</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4">
            <p className="text-xs text-[#69809F]">Nama</p>
            <p className="mt-1 text-[#F1F5F9] font-medium">{account.nama}</p>
          </div>
          <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4">
            <p className="text-xs text-[#69809F]">Email</p>
            <p className="mt-1 text-[#F1F5F9] font-medium">{account.email}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ganti Password */}
        <div className="glass-card p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(255,255,255,0.05)] text-[#EF4444]">
              <Lock className="h-5 w-5" />
            </div>
            <h2 className="font-display text-xl text-[#F1F5F9]">Ganti Password</h2>
          </div>
          <div>
            <label className="block text-sm text-[#93A8C7] mb-2">Password Lama</label>
            <div className="relative">
              <input type={showCurrent ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="app-input pr-12" placeholder="••••••••" />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#69809F]">
                {showCurrent ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm text-[#93A8C7] mb-2">Password Baru</label>
            <div className="relative">
              <input type={showNew ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="app-input pr-12" placeholder="Minimal 6 karakter" />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#69809F]">
                {showNew ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm text-[#93A8C7] mb-2">Konfirmasi Password</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="app-input" placeholder="Ulangi password baru" />
          </div>
          <button onClick={handleChangePassword} disabled={isSavingPassword} className="app-button-primary w-full disabled:cursor-not-allowed disabled:opacity-50">
            {isSavingPassword ? <><Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...</> : <><Save className="h-4 w-4" /> Simpan Password</>}
          </button>
        </div>

        {/* Bahasa */}
        <div className="glass-card p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(255,255,255,0.05)] text-[#4ADE80]">
              <Globe className="h-5 w-5" />
            </div>
            <h2 className="font-display text-xl text-[#F1F5F9]">Bahasa</h2>
          </div>
          <div className="space-y-3">
            {[
              { value: "id", label: "Bahasa Indonesia", flag: "🇮🇩" },
              { value: "en", label: "English", flag: "🇺🇸" },
            ].map((lang) => (
              <button
                key={lang.value}
                onClick={() => handleChangeLang(lang.value)}
                disabled={isSavingLang}
                className={`w-full rounded-2xl border p-4 text-left transition-all ${
                  account.bahasa === lang.value
                    ? "border-[#56D6FF]/40 bg-[linear-gradient(145deg,rgba(86,214,255,0.18),rgba(103,167,255,0.06))]"
                    : "border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] hover:border-[rgba(255,255,255,0.16)]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{lang.flag}</span>
                  <span className="font-medium text-[#F1F5F9]">{lang.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
