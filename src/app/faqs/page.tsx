"use client";
import { useState } from "react";
import { Plus, Edit, Trash2, ToggleRight } from "lucide-react";

const initialFaqs = [
  { id: "1", pertanyaan: "Jam operasional?", jawaban: "Kami buka Senin-Jumat, 09.00-17.00 WIB", aktif: true },
  { id: "2", pertanyaan: "Cara pemesanan?", jawaban: "Chat WhatsApp kami di nomor yang tersedia", aktif: true },
];

export default function FaqsPage() {
  const [faqs] = useState(initialFaqs);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-[#F1F5F9]">FAQ</h1><p className="text-[#94A3B8] text-sm mt-1">Kelola pertanyaan frecuentes</p></div>
        <button className="px-4 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-lg flex items-center gap-2"><Plus className="w-4 h-4" /> Tambah FAQ</button>
      </div>
      <div className="space-y-3">
        {faqs.map(faq => (
          <div key={faq.id} className="glass-card p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-[#F1F5F9] font-medium">{faq.pertanyaan}</p>
                <p className="text-[#94A3B8] mt-2">{faq.jawaban}</p>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button className="text-[#10B981]"><ToggleRight className="w-6 h-6" /></button>
                <button className="p-2 hover:bg-[rgba(255,255,255,0.05)] rounded-lg text-[#94A3B8]"><Edit className="w-4 h-4" /></button>
                <button className="p-2 hover:bg-[rgba(255,255,255,0.05)] rounded-lg text-[#94A3B8] hover:text-[#EF4444]"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
