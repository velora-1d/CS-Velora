"use client";
import { useState } from "react";
import { ToggleLeft, ToggleRight } from "lucide-react";

export default function BotSettingsPage() {
  const [greeting, setGreeting] = useState("Halo! Selamat datang di Velora ID. Ada yang bisa kami bantu?");
  const [offlineMessage, setOfflineMessage] = useState("Maaf, kami sedang offline. Silakan hubungi kembali pada jam operasional.");
  const [jamBuka, setJamBuka] = useState("09:00");
  const [jamTutup, setJamTutup] = useState("17:00");
  const [delayMin, setDelayMin] = useState("3");
  const [delayMax, setDelayMax] = useState("9");
  const [typing, setTyping] = useState(true);

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-[#F1F5F9]">Bot Settings</h1><p className="text-[#94A3B8] text-sm mt-1">Konfigurasi perilaku bot</p></div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-[#F1F5F9]">Pesan</h2>
          
          <div>
            <label className="block text-sm text-[#94A3B8] mb-2">Pesan Sambutan</label>
            <textarea value={greeting} onChange={e => setGreeting(e.target.value)} rows={3} className="w-full px-4 py-2.5 bg-[#0A0F1E] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#F1F5F9] resize-none" />
          </div>
          
          <div>
            <label className="block text-sm text-[#94A3B8] mb-2">Pesan Offline</label>
            <textarea value={offlineMessage} onChange={e => setOfflineMessage(e.target.value)} rows={3} className="w-full px-4 py-2.5 bg-[#0A0F1E] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#F1F5F9] resize-none" />
          </div>
        </div>
        
        <div className="glass-card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-[#F1F5F9]">Jam Operasional</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[#94A3B8] mb-2">Jam Buka</label>
              <input type="time" value={jamBuka} onChange={e => setJamBuka(e.target.value)} className="w-full px-4 py-2.5 bg-[#0A0F1E] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#F1F5F9]" />
            </div>
            <div>
              <label className="block text-sm text-[#94A3B8] mb-2">Jam Tutup</label>
              <input type="time" value={jamTutup} onChange={e => setJamTutup(e.target.value)} className="w-full px-4 py-2.5 bg-[#0A0F1E] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#F1F5F9]" />
            </div>
          </div>
        </div>
        
        <div className="glass-card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-[#F1F5F9]">Delay & Typing</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[#94A3B8] mb-2">Delay Min (detik)</label>
              <input type="number" value={delayMin} onChange={e => setDelayMin(e.target.value)} className="w-full px-4 py-2.5 bg-[#0A0F1E] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#F1F5F9]" />
            </div>
            <div>
              <label className="block text-sm text-[#94A3B8] mb-2">Delay Max (detik)</label>
              <input type="number" value={delayMax} onChange={e => setDelayMax(e.target.value)} className="w-full px-4 py-2.5 bg-[#0A0F1E] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#F1F5F9]" />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-[#F1F5F9]">Typing Indicator</span>
            <button onClick={() => setTyping(!typing)} className={`${typing ? "text-[#10B981]" : "text-[#94A3B8]"}`}>
              {typing ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>
      
      <button className="w-full py-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-lg">Simpan Pengaturan</button>
    </div>
  );
}
