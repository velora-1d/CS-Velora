"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  ToggleLeft,
  ToggleRight,
  Loader2,
  Save,
  Bot,
  Clock,
  MessageSquare,
  Timer,
} from "lucide-react";

type BotSettingsData = {
  id?: string;
  greeting: string;
  pesanOffline: string;
  jamBuka: string;
  jamTutup: string;
  delayMin: number;
  delayMax: number;
  typingIndicator: boolean;
  aiEnabled: boolean;
  bahasaDefault: string;
};

const defaults: BotSettingsData = {
  greeting: "Halo! Ada yang bisa kami bantu?",
  pesanOffline: "Maaf, kami sedang offline.",
  jamBuka: "08:00",
  jamTutup: "17:00",
  delayMin: 2000,
  delayMax: 5000,
  typingIndicator: true,
  aiEnabled: true,
  bahasaDefault: "id",
};

export default function BotSettingsPage() {
  const [settings, setSettings] = useState<BotSettingsData>(defaults);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/bot-settings");
      const data = await res.json();
      if (res.ok) {
        setSettings({
          ...defaults,
          ...data,
          jamBuka: data.jamBuka?.substring(0, 5) || defaults.jamBuka,
          jamTutup: data.jamTutup?.substring(0, 5) || defaults.jamTutup,
        });
      } else {
        toast.error("Gagal memuat pengaturan: " + (data.error || "Unknown error"));
      }
    } catch {
      toast.error("Gagal memuat pengaturan bot.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (settings.delayMin < 1000) {
      toast.error("Delay minimum harus minimal 1000ms (1 detik).");
      return;
    }
    if (settings.delayMax < settings.delayMin) {
      toast.error("Delay maximum harus lebih besar dari delay minimum.");
      return;
    }
    try {
      setIsSaving(true);
      const payload = {
        ...settings,
        jamBuka: settings.jamBuka.length === 5 ? settings.jamBuka + ":00" : settings.jamBuka,
        jamTutup: settings.jamTutup.length === 5 ? settings.jamTutup + ":00" : settings.jamTutup,
      };
      const res = await fetch("/api/bot-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Pengaturan bot berhasil disimpan!");
      } else {
        toast.error("Gagal menyimpan: " + (data.error || "Unknown error"));
      }
    } catch {
      toast.error("Gagal menyimpan pengaturan.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[#93A8C7]">
        <Loader2 className="h-10 w-10 animate-spin mb-4 text-[#56D6FF]" />
        <p>Memuat pengaturan bot...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="hero-panel px-6 py-7 md:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <span className="section-kicker">Bot behavior engine</span>
            <h1 className="mt-5 font-display text-4xl font-semibold text-[#F1F5F9] md:text-5xl">
              Atur perilaku bot agar terasa manusiawi.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-[#93A8C7] md:text-base">
              Konfigurasi pesan sambutan, jam operasional, delay respons, dan typing indicator.
            </p>
          </div>
          <div className="panel-shell p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-[#56D6FF]">Bot status</p>
            <div className="mt-5 flex items-center gap-4">
              <div className={`flex h-14 w-14 items-center justify-center rounded-full ${settings.aiEnabled ? "bg-[#4ADE80]/12 text-[#4ADE80]" : "bg-[#EF4444]/12 text-[#EF4444]"}`}>
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <p className="font-display text-2xl text-[#F1F5F9]">{settings.aiEnabled ? "AI Aktif" : "AI Nonaktif"}</p>
                <p className="text-sm text-[#93A8C7]">{settings.jamBuka} — {settings.jamTutup} WIB</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pesan */}
        <div className="glass-card p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(255,255,255,0.05)] text-[#67A7FF]">
              <MessageSquare className="h-5 w-5" />
            </div>
            <h2 className="font-display text-xl text-[#F1F5F9]">Pesan</h2>
          </div>
          <div>
            <label className="block text-sm text-[#93A8C7] mb-2">Pesan Sambutan</label>
            <textarea
              value={settings.greeting}
              onChange={(e) => setSettings((c) => ({ ...c, greeting: e.target.value }))}
              rows={3}
              className="app-input resize-none"
              placeholder="Halo! Ada yang bisa kami bantu?"
            />
          </div>
          <div>
            <label className="block text-sm text-[#93A8C7] mb-2">Pesan Offline</label>
            <textarea
              value={settings.pesanOffline}
              onChange={(e) => setSettings((c) => ({ ...c, pesanOffline: e.target.value }))}
              rows={3}
              className="app-input resize-none"
              placeholder="Maaf, kami sedang offline."
            />
          </div>
        </div>

        {/* Jam Operasional */}
        <div className="glass-card p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(255,255,255,0.05)] text-[#FFBF69]">
              <Clock className="h-5 w-5" />
            </div>
            <h2 className="font-display text-xl text-[#F1F5F9]">Jam Operasional</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[#93A8C7] mb-2">Jam Buka</label>
              <input type="time" value={settings.jamBuka} onChange={(e) => setSettings((c) => ({ ...c, jamBuka: e.target.value }))} className="app-input" />
            </div>
            <div>
              <label className="block text-sm text-[#93A8C7] mb-2">Jam Tutup</label>
              <input type="time" value={settings.jamTutup} onChange={(e) => setSettings((c) => ({ ...c, jamTutup: e.target.value }))} className="app-input" />
            </div>
          </div>
        </div>

        {/* Delay & Typing */}
        <div className="glass-card p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(255,255,255,0.05)] text-[#A78BFA]">
              <Timer className="h-5 w-5" />
            </div>
            <h2 className="font-display text-xl text-[#F1F5F9]">Delay & Typing</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[#93A8C7] mb-2">Delay Min (ms)</label>
              <input type="number" value={settings.delayMin} onChange={(e) => setSettings((c) => ({ ...c, delayMin: parseInt(e.target.value) || 0 }))} className="app-input" placeholder="2000" />
              <p className="mt-1 text-xs text-[#69809F]">Min: 1000ms</p>
            </div>
            <div>
              <label className="block text-sm text-[#93A8C7] mb-2">Delay Max (ms)</label>
              <input type="number" value={settings.delayMax} onChange={(e) => setSettings((c) => ({ ...c, delayMax: parseInt(e.target.value) || 0 }))} className="app-input" placeholder="5000" />
              <p className="mt-1 text-xs text-[#69809F]">Harus &gt; delay min</p>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4">
            <span className="text-[#F1F5F9]">Typing Indicator</span>
            <button onClick={() => setSettings((c) => ({ ...c, typingIndicator: !c.typingIndicator }))} className={settings.typingIndicator ? "text-[#4ADE80]" : "text-[#69809F]"}>
              {settings.typingIndicator ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* AI Toggle + Bahasa */}
        <div className="glass-card p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(255,255,255,0.05)] text-[#56D6FF]">
              <Bot className="h-5 w-5" />
            </div>
            <h2 className="font-display text-xl text-[#F1F5F9]">AI & Bahasa</h2>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4">
            <div>
              <span className="text-[#F1F5F9]">AI Otomatis</span>
              <p className="text-xs text-[#69809F] mt-1">Bot akan menjawab otomatis jika aktif</p>
            </div>
            <button onClick={() => setSettings((c) => ({ ...c, aiEnabled: !c.aiEnabled }))} className={settings.aiEnabled ? "text-[#4ADE80]" : "text-[#69809F]"}>
              {settings.aiEnabled ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6" />}
            </button>
          </div>
          <div>
            <label className="block text-sm text-[#93A8C7] mb-2">Bahasa Default</label>
            <select value={settings.bahasaDefault} onChange={(e) => setSettings((c) => ({ ...c, bahasaDefault: e.target.value }))} className="app-select">
              <option value="id">Bahasa Indonesia</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>
      </div>

      <button onClick={handleSave} disabled={isSaving} className="app-button-primary w-full py-4 text-base disabled:cursor-not-allowed disabled:opacity-50">
        {isSaving ? (
          <><Loader2 className="h-5 w-5 animate-spin" /> Menyimpan...</>
        ) : (
          <><Save className="h-5 w-5" /> Simpan Pengaturan</>
        )}
      </button>
    </div>
  );
}
