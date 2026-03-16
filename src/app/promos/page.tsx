"use client";
import { useState } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";

const initialPromos = [
  { id: "1", judul: "Diskon 20%", deskripsi: "Diskon untuk semua produk", tanggalMulai: "2026-03-01", tanggalBerakhir: "2026-03-31", aktif: true },
  { id: "2", judul: "Buy 1 Get 1", deskripsi: "Pembelian tertentu", tanggalMulai: "2026-03-15", tanggalBerakhir: "2026-03-20", aktif: false },
];

export default function PromosPage() {
  const [promos] = useState(initialPromos);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#F1F5F9]">Promo</h1>
          <p className="text-[#94A3B8] text-sm mt-1">Kelola promo dan diskon</p>
        </div>
        <button className="px-4 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-lg flex items-center gap-2">
          <Plus className="w-4 h-4" /> Tambah Promo
        </button>
      </div>
      <div className="glass-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[rgba(255,255,255,0.08)]">
              <th className="text-left px-4 py-3 text-[#94A3B8] font-medium text-sm">Judul</th>
              <th className="text-left px-4 py-3 text-[#94A3B8] font-medium text-sm">Deskripsi</th>
              <th className="text-left px-4 py-3 text-[#94A3B8] font-medium text-sm">Periode</th>
              <th className="text-left px-4 py-3 text-[#94A3B8] font-medium text-sm">Status</th>
              <th className="text-right px-4 py-3 text-[#94A3B8] font-medium text-sm">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {promos.map((promo) => (
              <tr key={promo.id} className="border-b border-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.02)]">
                <td className="px-4 py-3 text-[#F1F5F9] font-medium">{promo.judul}</td>
                <td className="px-4 py-3 text-[#94A3B8]">{promo.deskripsi}</td>
                <td className="px-4 py-3 text-[#94A3B8]">{promo.tanggalMulai} - {promo.tanggalBerakhir}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${promo.aktif ? "bg-[#10B981]/10 text-[#10B981]" : "bg-[#94A3B8]/10 text-[#94A3B8]"}`}>
                    {promo.aktif ? "Aktif" : "Nonaktif"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button className="p-2 hover:bg-[rgba(255,255,255,0.05)] rounded-lg text-[#94A3B8]"><Edit className="w-4 h-4" /></button>
                    <button className="p-2 hover:bg-[rgba(255,255,255,0.05)] rounded-lg text-[#94A3B8] hover:text-[#EF4444]"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
