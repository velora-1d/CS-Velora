"use client";

import { OwnerSidebar } from "@/components/layout/owner-sidebar";
import { useState, useEffect, useRef } from "react";
import { MobileHeader } from "@/components/layout/mobile-header";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [checkingStorage, setCheckingStorage] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const verified = sessionStorage.getItem("owner_pin_verified") === "true";
      setIsVerified(verified);
    }
    setCheckingStorage(false);
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && (session?.user as any)?.role !== "owner") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  if (status === "loading" || checkingStorage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0F1E]">
        <Loader2 className="w-8 h-8 animate-spin text-[#3B82F6]" />
      </div>
    );
  }

  if (!session || (session.user as any).role !== "owner") {
    return null;
  }

  if (!isVerified) {
    return (
      <PinEntryScreen 
        onVerified={() => setIsVerified(true)} 
        onCancel={() => router.push("/dashboard")} 
      />
    );
  }

  const userData = {
    nama: (session.user as any).nama,
    email: session.user.email || undefined,
  };

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-[#F1F5F9]">
      <MobileHeader 
        isOpen={isSidebarOpen} 
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        subtitle="Owner Panel"
      />

      <OwnerSidebar 
        user={userData} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Areas */}
      <main className="min-h-screen pt-20 md:pt-8 md:ml-64 px-4 md:px-6 py-4 md:py-6 transition-all duration-300">
        <div className="max-w-none w-full">
          {children}
        </div>
      </main>
    </div>
  );
}

function PinEntryScreen({ onVerified, onCancel }: { onVerified: () => void; onCancel: () => void }) {
  const [pin, setPin] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRefs = useRef<HTMLInputElement[]>([]);

  const handleChange = (index: number, val: string) => {
    if (val && !/^\d+$/.test(val)) return;

    const newPin = [...pin];
    newPin[index] = val.slice(-1);
    setPin(newPin);

    if (val && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!pin[index] && index > 0) {
        const newPin = [...pin];
        newPin[index - 1] = "";
        setPin(newPin);
        inputRefs.current[index - 1]?.focus();
      } else {
        const newPin = [...pin];
        newPin[index] = "";
        setPin(newPin);
      }
    }
  };

  const handleSubmit = async (enteredPin: string) => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/owner/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: enteredPin }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        sessionStorage.setItem("owner_pin_verified", "true");
        toast.success("Verifikasi berhasil");
        onVerified();
      } else {
        setError(data.error || "PIN tidak valid");
        setPin(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch {
      setError("Kesalahan jaringan, silakan coba lagi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fullPin = pin.join("");
    if (fullPin.length === 6) {
      handleSubmit(fullPin);
    }
  }, [pin]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0F1E] px-4">
      <div className="glass-card max-w-sm w-full p-8 border border-[rgba(255,255,255,0.08)] bg-white/5 backdrop-blur-xl rounded-[28px] shadow-2xl text-center space-y-8">
        <div className="space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#56D6FF]/10 border border-[#56D6FF]/20 text-[#56D6FF]">
            <Lock className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Protected Access</h2>
          <p className="text-xs text-[#93A8C7] leading-relaxed max-w-xs mx-auto">
            Akses ke Owner Panel memerlukan verifikasi PIN keamanan 6 digit.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex justify-center gap-2">
            {pin.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => { inputRefs.current[idx] = el!; }}
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                disabled={loading}
                className="w-10 h-12 text-center text-xl font-black rounded-xl border border-[rgba(255,255,255,0.12)] bg-white/5 text-[#56D6FF] focus:border-[#56D6FF] focus:bg-[#56D6FF]/5 focus:shadow-[0_0_15px_rgba(86,214,255,0.25)] outline-none transition-all"
              />
            ))}
          </div>

          {error && <p className="text-xs font-semibold text-red-400 animate-pulse">{error}</p>}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="app-button-secondary flex-1 py-3 text-xs"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}
