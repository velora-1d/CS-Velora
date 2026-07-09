"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";


interface MobileHeaderProps {
  isOpen: boolean;
  onToggle: () => void;
  title?: string;
  subtitle?: string;
}

import { useState, useEffect } from "react";

export function MobileHeader({ isOpen, onToggle, title = "Velora ID", subtitle = "Control Room" }: MobileHeaderProps) {
  const [logoUrl, setLogoUrl] = useState<string>("/logo-velora.png");

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const res = await fetch("/api/profile");
        const data = await res.json();
        if (res.ok) {
          if (data.logoUrl) {
            setLogoUrl(data.logoUrl);
          } else {
            const resBrand = await fetch("/api/branding");
            if (resBrand.ok) {
              const brandData = await resBrand.json();
              setLogoUrl(brandData.system_sidebar_logo || "/logo-velora.png");
            }
          }
        }
      } catch (error) {
        console.error("Gagal memuat logo di header:", error);
      }
    };
    fetchLogo();

    window.addEventListener("profile-updated", fetchLogo);
    window.addEventListener("branding-updated", fetchLogo);
    return () => {
      window.removeEventListener("profile-updated", fetchLogo);
      window.removeEventListener("branding-updated", fetchLogo);
    };
  }, []);
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-b border-[rgba(255,255,255,0.08)] bg-[rgba(10,15,30,0.8)] px-4 backdrop-blur-md md:hidden">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center flex-shrink-0 w-9 h-9 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={logoUrl} 
            alt="Velora Logo" 
            className="max-w-full max-h-full object-contain" 
            onError={(e) => { (e.target as HTMLImageElement).src = "/logo-velora.png"; }} 
          />
        </div>
        <div className="flex flex-col">
          <span className="font-display text-sm font-bold text-white leading-none tracking-tight">{title}</span>
          <span className="text-[9px] uppercase tracking-[0.2em] text-[#56D6FF] mt-1 font-bold opacity-80">{subtitle}</span>
        </div>
      </div>

      <button
        onClick={onToggle}
        className={cn(
          "relative h-10 w-10 flex items-center justify-center rounded-xl border transition-all duration-300",
          isOpen 
            ? "border-[#EF4444]/20 bg-[#EF4444]/10 text-[#EF4444]" 
            : "border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] text-[#94A3B8]"
        )}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
    </header>
  );
}
