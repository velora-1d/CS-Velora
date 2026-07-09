"use client";

import { AlertTriangle } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDanger?: boolean;
}

export function ConfirmModal({
  isOpen,
  title = "Konfirmasi Tindakan",
  message,
  confirmLabel = "Ya, Lanjutkan",
  cancelLabel = "Batal",
  onConfirm,
  onCancel,
  isDanger = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0B1120] border border-[rgba(255,255,255,0.1)] rounded-2xl shadow-2xl w-full max-w-md p-6 text-[#F1F5F9] animate-in zoom-in-95 duration-200">
        <div className="flex items-start gap-4">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            isDanger ? "bg-red-500/10 text-red-500" : "bg-blue-500/10 text-blue-400"
          }`}>
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-white leading-6">{title}</h3>
            <p className="mt-2 text-xs text-[#93A8C7] leading-relaxed whitespace-pre-line">{message}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-[rgba(255,255,255,0.05)]">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] px-4 py-2 text-xs font-semibold text-[#93A8C7] hover:bg-[rgba(255,255,255,0.06)] hover:text-white transition-all"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-xl px-5 py-2 text-xs font-bold text-white transition-all ${
              isDanger 
                ? "bg-red-600 hover:bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.15)]" 
                : "bg-[#3B82F6] hover:bg-[#2563EB] shadow-[0_0_15px_rgba(59,130,246,0.15)]"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
