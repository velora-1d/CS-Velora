"use client";
import { useState } from "react";
import { Plus, Building, QrCode, Edit, Trash2, ToggleRight } from "lucide-react";

const initialPayments = [
  { id: "1", tipe: "transfer", namaBank: "BCA", nomorRekening: "1234567890", namaPemilik: "Velora ID", urutan: 1, aktif: true },
  { id: "2", tipe: "transfer", namaBank: "Mandiri", nomorRekening: "0987654321", namaPemilik: "Velora ID", urutan: 2, aktif: true },
  { id: "3", tipe: "qris", namaBank: "", nomorRekening: "", namaPemilik: "", urutan: 3, aktif: true },
];

export default function PaymentsPage() {
  const [payments] = useState(initialPayments);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-[#F1F5F9]">Pembayaran</h1><p className="text-[#94A3B8] text-sm mt-1">Kelola rekening bank dan QRIS</p></div>
        <button className="px-4 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-lg flex items-center gap-2"><Plus className="w-4 h-4" /> Tambah</button>
      </div>
      <div className="grid gap-4">
        {payments.map(p => (
          <div key={p.id} className="glass-card p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-[rgba(255,255,255,0.05)] flex items-center justify-center">
                {p.tipe === "transfer" ? <Building className="w-6 h-6 text-[#3B82F6]" /> : <QrCode className="w-6 h-6 text-[#10B981]" />}
              </div>
              <div>
                <p className="text-[#F1F5F9] font-medium">{p.tipe === "transfer" ? p.namaBank : "QRIS"}</p>
                <p className="text-[#94A3B8] text-sm">{p.tipe === "transfer" ? `${p.nomorRekening} (${p.namaPemilik})` : "Scan QRIS untuk pembayaran"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[#94A3B8] text-sm">#{p.urutan}</span>
              <button className="text-[#10B981]"><ToggleRight className="w-6 h-6" /></button>
              <button className="p-2 hover:bg-[rgba(255,255,255,0.05)] rounded-lg text-[#94A3B8]"><Edit className="w-4 h-4" /></button>
              <button className="p-2 hover:bg-[rgba(255,255,255,0.05)] rounded-lg text-[#94A3B8] hover:text-[#EF4444]"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
