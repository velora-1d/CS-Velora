"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Loader2, Lock, Mail, Eye, EyeOff, CheckCircle2,
  Bot, BarChart3, ShieldCheck, CreditCard, Tag,
  HelpCircle, Database, Brain, ArrowRight
} from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (isResetMode) {
        const res = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (data.success) {
          setSuccess("Instruksi reset password telah dikirim ke WhatsApp Anda.");
          setIsResetMode(false);
        } else {
          setError(data.error || "Gagal mereset password");
        }
      } else {
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });
        if (result?.error) {
          setError("Email atau password salah");
        } else {
          router.push("/dashboard");
        }
      }
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: <Bot className="w-5 h-5" />, title: "AI Assistant", desc: "Chatbot otomatis 24/7 melayani pelanggan.", color: "text-[#56D6FF]", bg: "bg-[#56D6FF]/10" },
    { icon: <Database className="w-5 h-5" />, title: "Client Database", desc: "Simpan nomor & ekspor data ke Excel/CSV.", color: "text-[#67A7FF]", bg: "bg-[#67A7FF]/10" },
    { icon: <Brain className="w-5 h-5" />, title: "Memori Jangka Panjang", desc: "AI kenali pelanggan baru vs pelanggan lama.", color: "text-[#4ADE80]", bg: "bg-[#4ADE80]/10" },
    { icon: <BarChart3 className="w-5 h-5" />, title: "Analitik Brutal", desc: "Pantau bisnis dengan grafik & KPI real-time.", color: "text-[#A78BFA]", bg: "bg-[#A78BFA]/10" },
    { icon: <CreditCard className="w-5 h-5" />, title: "Pembayaran", desc: "Gateway terintegrasi & konfirmasi manual.", color: "text-[#FBBF24]", bg: "bg-[#FBBF24]/10" },
    { icon: <Tag className="w-5 h-5" />, title: "Promo & Voucher", desc: "Diskon dinamis untuk tingkatkan konversi.", color: "text-[#F472B6]", bg: "bg-[#F472B6]/10" },
    { icon: <HelpCircle className="w-5 h-5" />, title: "FAQ Cerdas", desc: "Pusat bantuan mandiri untuk efisiensi CS.", color: "text-[#FB923C]", bg: "bg-[#FB923C]/10" },
    { icon: <ShieldCheck className="w-5 h-5" />, title: "Keamanan & Speed", desc: "Enkripsi end-to-end dengan performa kilat.", color: "text-[#60A5FA]", bg: "bg-[#60A5FA]/10" },
  ];

  return (
    <div className="min-h-screen flex bg-[#060B18] font-body overflow-hidden">

      {/* ─── Left Panel ─── */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-[55%] relative flex-col">
        {/* Background gradients */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.18),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(86,214,255,0.1),transparent_60%)]" />
        <div className="absolute inset-0 bg-[#0A0F1E]/70" />
        <div className="absolute right-0 inset-y-0 w-px bg-gradient-to-b from-transparent via-[rgba(255,255,255,0.07)] to-transparent" />

        <div className="relative z-10 flex flex-col h-full px-14 xl:px-20 py-12">
          {/* Logo */}
          <div className="flex items-center gap-3.5">
            <div className="relative w-10 h-10 shrink-0">
              <Image src="/logo-velora.png" alt="Velora Logo" fill className="object-contain" priority />
            </div>
            <div>
              <p className="text-lg font-display font-bold text-[#F1F5F9] tracking-tight leading-none">Velora ID</p>
              <p className="text-[9px] uppercase tracking-[0.35em] text-[#56D6FF] font-bold mt-0.5">Control Room</p>
            </div>
          </div>

          {/* Headline */}
          <div className="mt-auto pb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#56D6FF]/10 border border-[#56D6FF]/20 mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-[#56D6FF] animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#56D6FF]">Platform AI Customer Service</span>
            </div>
            <h2 className="text-4xl xl:text-5xl font-display font-bold text-[#F1F5F9] leading-[1.15] mb-12">
              Pusat Kendali{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#56D6FF] via-[#67A7FF] to-[#9D8CFF]">
                Bisnis Digital
              </span>{" "}
              Masa Depan.
            </h2>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-6">
              {features.map((f, i) => (
                <div key={i} className="flex items-start gap-4 group">
                  <div className={`shrink-0 w-10 h-10 rounded-2xl ${f.bg} border border-white/5 flex items-center justify-center ${f.color} transition-all duration-300 group-hover:scale-110 group-hover:border-white/10`}>
                    {f.icon}
                  </div>
                  <div className="pt-0.5">
                    <h3 className="text-[#E2E8F0] font-semibold text-[13px] leading-tight">{f.title}</h3>
                    <p className="text-[#64748B] text-[11.5px] leading-relaxed mt-1">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-white/5 pt-6 mt-auto">
            <p className="text-[#475569] text-xs">© 2026 Velora ID — Advanced Agentic Solutions</p>
          </div>
        </div>
      </div>

      {/* ─── Right Panel ─── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative overflow-hidden">
        {/* Subtle bg glow on mobile */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#3B82F6]/8 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#9D8CFF]/8 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        <div className="w-full max-w-[420px] relative z-10">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-10">
            <div className="inline-flex items-center gap-3 mb-1">
              <div className="relative w-9 h-9">
                <Image src="/logo-velora.png" alt="Velora Logo" fill className="object-contain" priority />
              </div>
              <span className="text-2xl font-display font-bold text-[#F1F5F9]">Velora ID</span>
            </div>
            <p className="text-[#56D6FF] uppercase tracking-[0.25em] text-[9px] font-bold mt-2">Control Room</p>
          </div>

          {/* Card */}
          <div className="rounded-[28px] border border-white/[0.07] bg-[rgba(15,23,42,0.85)] backdrop-blur-xl shadow-2xl shadow-black/40 overflow-hidden">
            {/* Card header bar */}
            <div className="h-px w-full bg-gradient-to-r from-transparent via-[#3B82F6]/40 to-transparent" />

            <div className="p-8 md:p-10">
              {/* Title */}
              <div className="mb-8">
                <h1 className="text-[22px] font-display font-bold text-[#F1F5F9] leading-tight">
                  {isResetMode ? "Atur Ulang Sandi" : "Selamat Datang Kembali"}
                </h1>
                <p className="text-[#64748B] text-sm mt-2 leading-relaxed">
                  {isResetMode
                    ? "Masukkan email Anda untuk menerima link reset."
                    : "Silakan masuk ke akun Anda untuk melanjutkan."}
                </p>
              </div>

              {/* Alerts */}
              {error && (
                <div className="mb-5 p-3.5 bg-red-500/8 border border-red-500/20 rounded-2xl text-red-400 text-sm flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                  {error}
                </div>
              )}
              {success && (
                <div className="mb-5 p-3.5 bg-emerald-500/8 border border-emerald-500/20 rounded-2xl text-emerald-400 text-sm flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  {success}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#475569] block">
                    Email Bisnis
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569] group-focus-within:text-[#3B82F6] transition-colors" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-[rgba(255,255,255,0.03)] border border-white/[0.08] hover:border-white/[0.12] rounded-2xl text-[#F1F5F9] text-sm placeholder-[#334155] focus:outline-none focus:border-[#3B82F6]/50 focus:ring-[3px] focus:ring-[#3B82F6]/8 transition-all"
                      placeholder="nama@perusahaan.com"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                {!isResetMode && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-[#475569] block">
                        Kata Sandi
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsResetMode(true)}
                        className="text-[11px] text-[#3B82F6] hover:text-[#56D6FF] transition-colors font-medium"
                      >
                        Lupa Sandi?
                      </button>
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569] group-focus-within:text-[#3B82F6] transition-colors" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-11 pr-12 py-3 bg-[rgba(255,255,255,0.03)] border border-white/[0.08] hover:border-white/[0.12] rounded-2xl text-[#F1F5F9] text-sm placeholder-[#334155] focus:outline-none focus:border-[#3B82F6]/50 focus:ring-[3px] focus:ring-[#3B82F6]/8 transition-all"
                        placeholder="••••••••••••"
                        required={!isResetMode}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#475569] hover:text-[#94A3B8] transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3.5 bg-gradient-to-r from-[#3B82F6] to-[#6366F1] hover:from-[#2563EB] hover:to-[#5254CC] text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      {isResetMode ? "Kirim Instruksi" : "Masuk ke Panel"}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Footer link */}
              <div className="mt-7 pt-6 border-t border-white/[0.05] text-center">
                <p className="text-[#475569] text-sm">
                  {isResetMode ? (
                    <button
                      onClick={() => setIsResetMode(false)}
                      className="text-[#3B82F6] font-semibold hover:text-[#56D6FF] transition-colors"
                    >
                      ← Kembali ke Login
                    </button>
                  ) : (
                    <>
                      Belum punya akses?{" "}
                      <button
                        onClick={() => router.push("/register")}
                        className="text-[#3B82F6] font-semibold hover:text-[#56D6FF] transition-colors"
                      >
                        Daftar Sekarang
                      </button>
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
