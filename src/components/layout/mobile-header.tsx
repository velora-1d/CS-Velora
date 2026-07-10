"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface MobileHeaderProps {
  isOpen: boolean;
  onToggle: () => void;
  subtitle?: string;
}

import { useState, useEffect } from "react";

export function MobileHeader({ isOpen, onToggle, subtitle }: MobileHeaderProps) {
  const [logoUrl, setLogoUrl] = useState<string>("/logo-velora.png");

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const res = await fetch("/api/profile");
        const data = await res.json();
        if (res.ok) {
          if (data.logoUrl) {
            setLogoUrl(data.logoUrl);
            return;
          }
          const resBrand = await fetch("/api/branding");
          if (resBrand.ok) {
            const brandData = await resBrand.json();
            setLogoUrl(brandData.system_sidebar_logo || "/logo-velora.png");
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
    <header className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between border-b border-[rgba(255,255,255,0.08)] bg-[rgba(10,15,30,0.8)] px-3 backdrop-blur-md md:hidden">
      <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
        <div className="flex shrink-0 items-center justify-center w-8 h-8 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoUrl}
            alt="Velora Logo"
            className="max-w-full max-h-full object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/logo-velora.png";
            }}
          />
        </div>
        <span className="font-display text-sm font-semibold text-white truncate">
          Velora ID
        </span>
        {subtitle && (
          <span className="ml-1 hidden text-xs font-medium text-[#93A8C7] sm:inline truncate">
            · {subtitle}
          </span>
        )}
      </Link>

      <button
        onClick={onToggle}
        aria-label="Toggle menu"
        className={cn(
          "shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-all duration-200",
          isOpen
            ? "border-[#EF4444]/20 bg-[#EF4444]/10 text-[#EF4444]"
            : "border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] text-[#94A3B8] hover:text-white"
        )}
      >
        {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>
    </header>
  );
}
