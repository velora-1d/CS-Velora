"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, Mail, Store, Eye, EyeOff, CheckCircle2, Bot, BarChart3, ShieldCheck, Zap, User, CreditCard, Tag, HelpCircle, Calendar } from "lucide-react";
import Image from "next/image";

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

  const features = [
    {
      icon: <Bot className="w-5 h-5 text-[#56D6FF]" />,
      title: "AI Assistant",
      desc: "Chatbot otomatis 24/7 melayani pelanggan Anda."
    },
    {
      icon: <BarChart3 className="w-5 h-5 text-[#67A7FF]" />,
      title: "Analitik Brutal",
      desc: "Grafik & KPI real-time untuk pantau bisnis."
    },
    {
      icon: <CreditCard className="w-5 h-5 text-[#4ADE80]" />,
      title: "Pembayaran",
      desc: "Dukungan gateway & konfirmasi manual."
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-[#9D8CFF]" />,
      title: "Keamanan Global",
      desc: "Proteksi data dengan enkripsi end-to-end."
    },
    {
      icon: <Tag className="w-5 h-5 text-[#FBBF24]" />,
      title: "Promo & Voucher",
      desc: "Tingkatkan penjualan dengan diskon dinamis."
    },
    {
      icon: <HelpCircle className="w-5 h-5 text-[#A78BFA]" />,
      title: "FAQ Cerdas",
      desc: "Pusat bantuan mandiri untuk efisiensi CS."
    },
    {
      icon: <Calendar className="w-5 h-5 text-[#F472B6]" />,
      title: "Jadwal Konsultasi",
      desc: "Atur janji temu secara profesional."
    },
    {
      icon: <Zap className="w-5 h-5 text-[#60A5FA]" />,
      title: "Trial Gratis 2 Hari",
      desc: "Akses penuh fitur premium tanpa komitmen awal."
    }
  ];

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0F1E] p-4">
        <div className="w-full max-w-md glass-panel p-10 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-emerald-500" />
          <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-green-500/10 border border-green-500/20">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-display font-bold text-[#F1F5F9] mb-3">Pendaftaran Berhasil!</h2>
          <p className="text-[#94A3B8] mb-8 leading-relaxed">
            Toko <span className="text-[#56D6FF] font-semibold">{namaToko}</span> berhasil didaftarkan. Anda mendapatkan akses <span className="text-white font-medium">Trial Premium selama 2 hari</span>.
          </p>
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-6 h-6 animate-spin text-[#3B82F6]" />
            <p className="text-sm text-[#64748B] font-medium tracking-wide">MENGARAHKAN KE LOGIN...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#0A0F1E] font-body">
      {/* Left Side: Features (Desktop Only) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.15),transparent),radial-gradient(circle_at_bottom_left,rgba(86,214,255,0.1),transparent)] border-r border-[rgba(255,255,255,0.05)]">
        <div className="absolute inset-0 bg-[#0A0F1E]/40 backdrop-blur-[2px]" />
        
        <div className="relative z-10 w-full flex flex-col justify-between p-12 xl:p-20">
          <div className="flex items-center gap-4">
            <div className="relative w-12 h-12">
              <Image src="/logo-velora.png" alt="Velora Logo" fill className="object-contain" priority />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-[#F1F5F9] tracking-tight">Velora ID</h1>
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#56D6FF] font-bold">Control Room</p>
            </div>
          </div>

          <div className="max-w-md">
            <h2 className="text-4xl xl:text-5xl font-display font-bold text-[#F1F5F9] leading-tight mb-8">
              Mulai Langkah <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#56D6FF] via-[#67A7FF] to-[#9D8CFF]">Digital Anda</span> Hari Ini.
            </h2>
            
            <div className="grid grid-cols-2 gap-x-8 gap-y-10">
              {features.map((f, i) => (
                <div key={i} className="flex flex-col gap-4 group">
                  <div className="flex-shrink-0 w-11 h-11 rounded-2xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:border-[#56D6FF]/30 group-hover:bg-[#56D6FF]/5">
                    {f.icon}
                  </div>
                  <div>
                    <h3 className="text-[#F1F5F9] font-semibold text-sm mb-1">{f.title}</h3>
                    <p className="text-[#94A3B8] text-[12px] leading-relaxed line-clamp-2">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-10 border-t border-[rgba(255,255,255,0.05)]">
            <p className="text-[#64748B] text-sm">© 2026 Velora ID — Advanced Agentic Solutions</p>
          </div>
        </div>
      </div>

      {/* Right Side: Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative overflow-hidden">
        {/* Decorative elements for mobile */}
        <div className="lg:hidden absolute top-[-10%] right-[-10%] w-[300px] h-[300px] bg-[#3B82F6]/10 blur-[100px] rounded-full" />
        <div className="lg:hidden absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] bg-[#9D8CFF]/10 blur-[100px] rounded-full" />

        <div className="w-full max-w-md space-y-8 relative z-10">
          <div className="lg:hidden text-center mb-10">
            <div className="flex justify-center mb-4">
              <div className="relative w-20 h-20">
                <Image src="/logo-velora.png" alt="Velora Logo" fill className="object-contain" priority />
              </div>
            </div>
            <h1 className="text-3xl font-display font-bold text-[#F1F5F9]">Velora ID</h1>
            <p className="text-[#56D6FF] uppercase tracking-[0.2em] text-[10px] font-bold mt-1">Control Room</p>
          </div>

          <div className="glass-panel p-8 md:p-10">
            <div className="mb-8">
              <h2 className="text-2xl font-display font-semibold text-[#F1F5F9]">
                Registrasi Toko Baru
              </h2>
              <p className="text-[#94A3B8] text-sm mt-2">
                Dapatkan trial premium 2 hari secara otomatis setelah mendaftar.
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-sm flex items-center gap-3">
                <Lock className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#64748B] ml-1">Nama Toko / Bisnis</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-[#3B82F6] text-[#64748B]">
                    <Store className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={namaToko}
                    onChange={(e) => setNamaToko(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-2xl text-[#F1F5F9] placeholder-[#475569] focus:outline-none focus:border-[#3B82F6]/50 focus:ring-4 focus:ring-[#3B82F6]/5 transition-all outline-none"
                    placeholder="Contoh: Velora Store"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#64748B] ml-1">Nama Pemilik</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-[#3B82F6] text-[#64748B]">
                    <User className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={namaPemilik}
                    onChange={(e) => setNamaPemilik(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-2xl text-[#F1F5F9] placeholder-[#475569] focus:outline-none focus:border-[#3B82F6]/50 focus:ring-4 focus:ring-[#3B82F6]/5 transition-all outline-none"
                    placeholder="Nama lengkap Anda"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#64748B] ml-1">Email Bisnis</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-[#3B82F6] text-[#64748B]">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-2xl text-[#F1F5F9] placeholder-[#475569] focus:outline-none focus:border-[#3B82F6]/50 focus:ring-4 focus:ring-[#3B82F6]/5 transition-all outline-none"
                    placeholder="email@perusahaan.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#64748B] ml-1">Kata Sandi</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-[#3B82F6] text-[#64748B]">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3.5 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-2xl text-[#F1F5F9] placeholder-[#475569] focus:outline-none focus:border-[#3B82F6]/50 focus:ring-4 focus:ring-[#3B82F6]/5 transition-all outline-none"
                    placeholder="Min. 6 karakter"
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#F1F5F9] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] hover:from-[#2563EB] hover:to-[#1D4ED8] text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 disabled:pointer-events-none mt-4"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Mulai Trial Gratis Sekarang"
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-[rgba(255,255,255,0.05)] text-center">
              <p className="text-[#94A3B8] text-sm">
                Sudah punya akun?{" "}
                <button onClick={() => router.push("/login")} className="text-[#3B82F6] font-semibold hover:underline">
                  Masuk di sini
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
