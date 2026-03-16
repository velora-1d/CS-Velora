"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, Mail, Eye, EyeOff } from "lucide-react";

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
        // Handle reset password request
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
        // Handle normal login
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0F1E] p-4">
      <div className="w-full max-w-md">
        <div className="glass-card p-8">
          {/* Logo/Title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[#F1F5F9]">Velora ID</h1>
            <p className="text-[#94A3B8] mt-2">
              {isResetMode ? "Reset Password" : "WA Chatbot Admin Panel"}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-lg text-[#EF4444] text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-500 text-sm">
              {success}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-[#94A3B8] mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#0A0F1E] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#F1F5F9] placeholder-[#94A3B8] focus:outline-none focus:border-[#3B82F6]"
                  placeholder="admin@velora.id"
                  required
                />
              </div>
            </div>

            {!isResetMode && (
              <div>
                <label className="block text-sm text-[#94A3B8] mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 bg-[#0A0F1E] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#F1F5F9] placeholder-[#94A3B8] focus:outline-none focus:border-[#3B82F6]"
                    placeholder="••••••••"
                    required={!isResetMode}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#F1F5F9] p-1"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                
                <div className="flex justify-end mt-2">
                  <button
                    type="button"
                    onClick={() => setIsResetMode(true)}
                    className="text-sm text-[#3B82F6] hover:text-[#2563EB]"
                  >
                    Lupa Password?
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {isResetMode ? "Mengirim..." : "Masuk..."}
                </>
              ) : (
                isResetMode ? "Kirim Link Reset" : "Masuk"
              )}
            </button>
          </form>

          {/* Footer */}
          {isResetMode && (
            <div className="text-center mt-6">
              <button
                type="button"
                onClick={() => setIsResetMode(false)}
                className="text-sm text-[#94A3B8] hover:text-[#F1F5F9]"
              >
                Kembali ke Login
              </button>
            </div>
          )}
          
          <div className="text-center mt-6 pt-6 border-t border-[rgba(255,255,255,0.08)]">
            <p className="text-[#94A3B8] text-sm mb-2">Belum punya akun?</p>
            <button
              onClick={() => router.push("/register")}
              className="text-[#3B82F6] hover:text-[#2563EB] font-medium"
            >
              Daftar Sekarang
            </button>
          </div>

          <p className="text-center text-[rgba(148,163,184,0.5)] text-xs mt-6">
            © 2026 Velora ID. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
