"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface CustomDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function CustomDropdown({
  value,
  onChange,
  options,
  placeholder = "Pilih opsi...",
  className = "",
  disabled = false,
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div ref={dropdownRef} className={`relative w-full ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex w-full items-center justify-between border rounded-[18px] bg-slate-950/70 border-white/10 text-[#F1F5F9] px-4 h-[2.75rem] text-left text-sm transition-all focus:outline-none focus:border-[#56D6FF]/50 focus:ring-4 focus:ring-[#56D6FF]/12 disabled:cursor-not-allowed disabled:opacity-50 ${
          isOpen ? "border-[#56D6FF]/50 ring-4 ring-[#56D6FF]/12" : ""
        }`}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown className={`h-4 w-4 text-[#69809F] transition-transform duration-200 ${isOpen ? "rotate-180 text-white" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-2 z-50 max-h-60 overflow-y-auto rounded-2xl border border-white/10 bg-[#0B1120] p-1.5 shadow-2xl backdrop-blur-md custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-150">
          {options.length === 0 ? (
            <div className="px-3 py-2 text-xs text-[#69809F]">Tidak ada opsi tersedia</div>
          ) : (
            options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 text-xs rounded-xl transition-all ${
                    isSelected
                      ? "bg-[#3B82F6] text-white font-semibold"
                      : "text-[#93A8C7] hover:bg-white/5 hover:text-[#F1F5F9]"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
