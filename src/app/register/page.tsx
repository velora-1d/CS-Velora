"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, Mail, Store, Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [namaToko, setNamaToko] = useState("");
  const [namaPemilik, setNamaPemilik] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ namaToko, namaPemilik, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal mendaftar");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0F1E] p-4">
        <div className="w-full max-w-md glass-card p-8 text-center">
          <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Store className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-[#F1F5F9] mb-2">Pendaftaran Berhasil!</h2>
          <p className="text-[#94A3B8] mb-6">
            Toko Anda berhasil didaftarkan. Anda mendapatkan <span className="text-white font-medium">Trial Gratis selama 2 hari</span>.
          </p>
          <p className="text-sm text-[#94A3B8]">Mengarahkan ke halaman login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0F1E] p-4">
      <div className="w-full max-w-md">
        <div className="glass-card p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[#F1F5F9]">Daftar Velora ID</h1>
            <p className="text-[#94A3B8] mt-2">Mulai kelola CS WhatsApp toko Anda</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-lg text-[#EF4444] text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-[#94A3B8] mb-2">Nama Toko</label>
              <div className="relative">
                <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
                <input
                  type="text"
                  value={namaToko}
                  onChange={(e) => setNamaToko(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#0A0F1E] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#F1F5F9] focus:border-[#3B82F6] focus:outline-none"
                  placeholder="Contoh: Velora Store"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-[#94A3B8] mb-2">Nama Anda</label>
              <input
                type="text"
                value={namaPemilik}
                onChange={(e) => setNamaPemilik(e.target.value)}
                className="w-full px-4 py-3 bg-[#0A0F1E] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#F1F5F9] focus:border-[#3B82F6] focus:outline-none"
                placeholder="Nama lengkap"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-[#94A3B8] mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#0A0F1E] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#F1F5F9] focus:border-[#3B82F6] focus:outline-none"
                  placeholder="email@domain.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-[#94A3B8] mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-[#0A0F1E] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#F1F5F9] focus:border-[#3B82F6] focus:outline-none"
                  placeholder="Minimal 6 karakter"
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#F1F5F9] p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium rounded-lg flex justify-center items-center gap-2 disabled:opacity-50 mt-6"
            >
              {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Mendaftar...</> : "Daftar & Mulai Trial 2 Hari"}
            </button>
          </form>

          <div className="text-center mt-6 pt-6 border-t border-[rgba(255,255,255,0.08)]">
            <p className="text-[#94A3B8] text-sm mb-2">Sudah punya akun?</p>
            <button
              onClick={() => router.push("/login")}
              className="text-[#3B82F6] hover:text-[#2563EB] font-medium"
            >
              Masuk di sini
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
