"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Eye, Clock, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface Subscription {
  id: string;
  paket: string;
  amount: number;
  createdAt: string;
  buktiTransfer?: string | null;
  tenant?: { namaToko: string } | null;
}

export default function BillingActions({ subs }: { subs: Subscription[] }) {
  const [items, setItems] = useState(subs);
  const [loading, setLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleApprove(id: string) {
    setLoading(id + "_approve");
    const res = await fetch(`/api/owner/billing/${id}/approve`, { method: "POST" });
    const data = await res.json();
    setLoading(null);
    if (res.ok) {
      setItems((prev) => prev.filter((s) => s.id !== id));
      showToast(data.message, true);
    } else {
      showToast(data.error || "Gagal menyetujui tagihan.", false);
    }
  }

  async function handleReject(id: string) {
    if (!confirm("Yakin menolak tagihan ini?")) return;
    setLoading(id + "_reject");
    const res = await fetch(`/api/owner/billing/${id}/reject`, { method: "POST" });
    const data = await res.json();
    setLoading(null);
    if (res.ok) {
      setItems((prev) => prev.filter((s) => s.id !== id));
      showToast("Tagihan berhasil ditolak.", true);
    } else {
      showToast(data.error || "Gagal menolak tagihan.", false);
    }
  }

  return (
    <div className="relative">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-white shadow-xl transition-all duration-200 ${
            toast.ok ? "bg-[#10B981]" : "bg-[#EF4444]"
          }`}
        >
          {toast.ok ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-[#94A3B8]">
          <thead className="text-xs text-[#94A3B8] uppercase bg-[rgba(255,255,255,0.02)] border-b border-[rgba(255,255,255,0.05)]">
            <tr>
              <th className="px-6 py-4 font-medium">Tanggal</th>
              <th className="px-6 py-4 font-medium">Tenant</th>
              <th className="px-6 py-4 font-medium">Paket</th>
              <th className="px-6 py-4 font-medium">Nominal</th>
              <th className="px-6 py-4 font-medium text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(255,255,255,0.05)]">
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-[#4ADE80]">
                    <CheckCircle className="h-10 w-10 opacity-60" />
                    <p className="text-sm">Tidak ada tagihan yang menunggu konfirmasi.</p>
                  </div>
                </td>
              </tr>
            ) : (
              items.map((sub) => (
                <tr key={sub.id} className="hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 text-[#93A8C7]">
                      <Clock className="h-3.5 w-3.5" />
                      {format(new Date(sub.createdAt), "dd MMM yyyy, HH:mm", { locale: id })}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-[#F1F5F9]">
                    {sub.tenant?.namaToko || "Unknown"}
                  </td>
                  <td className="px-6 py-4">
                    <span className="capitalize inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#3B82F6]/10 border border-[#3B82F6]/20 text-[#3B82F6]">
                      {sub.paket}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-[#F1F5F9]">
                    Rp {Number(sub.amount).toLocaleString("id-ID")}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {sub.buktiTransfer && (
                        <a
                          href={sub.buktiTransfer}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-[#94A3B8] hover:text-[#F1F5F9] rounded-lg transition"
                          title="Lihat Bukti Transfer"
                        >
                          <Eye className="h-4 w-4" />
                        </a>
                      )}
                      <button
                        onClick={() => handleApprove(sub.id)}
                        disabled={!!loading}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-500 rounded-lg text-xs font-medium transition disabled:opacity-50"
                        title="Setujui & Aktifkan"
                      >
                        {loading === sub.id + "_approve" ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CheckCircle className="h-3.5 w-3.5" />
                        )}
                        Setujui
                      </button>
                      <button
                        onClick={() => handleReject(sub.id)}
                        disabled={!!loading}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-xs font-medium transition disabled:opacity-50"
                        title="Tolak"
                      >
                        {loading === sub.id + "_reject" ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5" />
                        )}
                        Tolak
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
