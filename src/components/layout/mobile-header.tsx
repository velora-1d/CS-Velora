"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface MobileHeaderProps {
  isOpen: boolean;
  onToggle: () => void;
  title?: string;
  subtitle?: string;
}

export function MobileHeader({ isOpen, onToggle, title = "Velora ID", subtitle = "Control Room" }: MobileHeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-b border-[rgba(255,255,255,0.08)] bg-[rgba(10,15,30,0.8)] px-4 backdrop-blur-md md:hidden">
      <div className="flex items-center gap-3">
        <div className="relative w-9 h-9 flex-shrink-0">
          <Image src="/logo-velora.png" alt="Velora Logo" fill className="object-contain" priority />
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
