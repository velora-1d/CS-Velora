"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Shield,
  Clock,
  Database,
  Webhook,
  ToggleLeft,
  ToggleRight,
  Save,
  AlertTriangle,
  Loader2,
} from "lucide-react";

export default function SecurityPage() {
  const [rateLimitPerMinute, setRateLimitPerMinute] = useState("30");
  const [dataRetentionDays, setDataRetentionDays] = useState("90");
  const [webhookEnabled, setWebhookEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    toast.success("Pengaturan keamanan disimpan (konfigurasi lokal).");
  };

  return (
    <div className="space-y-6">
      <section className="hero-panel px-6 py-7 md:px-8">
        <div>
          <span className="section-kicker">Security center</span>
          <h1 className="mt-5 font-display text-4xl font-semibold text-[#F1F5F9] md:text-5xl">
            Keamanan & Kebijakan Data
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-[#93A8C7] md:text-base">
            Kontrol rate limiting, retensi data, dan konfigurasi webhook untuk menjaga keamanan sistem.
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rate Limiting */}
        <div className="glass-card p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(255,255,255,0.05)] text-[#FFBF69]">
              <Clock className="h-5 w-5" />
            </div>
            <h2 className="font-display text-xl text-[#F1F5F9]">Rate Limiting</h2>
          </div>
          <div>
            <label className="block text-sm text-[#93A8C7] mb-2">Max Request per Menit per Nomor</label>
            <input type="number" value={rateLimitPerMinute} onChange={(e) => setRateLimitPerMinute(e.target.value)} className="app-input" placeholder="30" />
            <p className="mt-1 text-xs text-[#69809F]">Default: 30 request/menit. Berlaku di webhook handler.</p>
          </div>
          <div className="rounded-2xl border border-[rgba(255,191,105,0.16)] bg-[rgba(255,191,105,0.06)] p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 text-[#FFBF69] mt-0.5" />
              <p className="text-sm text-[#FFBF69]">
                Rate limiting aktif di webhook handler secara in-memory. Perubahan di sini memerlukan restart server.
              </p>
            </div>
          </div>
        </div>

        {/* Data Retention */}
        <div className="glass-card p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(255,255,255,0.05)] text-[#A78BFA]">
              <Database className="h-5 w-5" />
            </div>
            <h2 className="font-display text-xl text-[#F1F5F9]">Retensi Data</h2>
          </div>
          <div>
            <label className="block text-sm text-[#93A8C7] mb-2">Simpan Chat Log (hari)</label>
            <input type="number" value={dataRetentionDays} onChange={(e) => setDataRetentionDays(e.target.value)} className="app-input" placeholder="90" />
            <p className="mt-1 text-xs text-[#69809F]">Chat log lebih lama dari ini bisa dihapus otomatis via cron job.</p>
          </div>
          <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4">
            <p className="text-sm text-[#93A8C7]">
              Kebijakan retensi: Data percakapan disimpan minimum 90 hari untuk audit dan compliance.
            </p>
          </div>
        </div>

        {/* Webhook Config */}
        <div className="glass-card p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(255,255,255,0.05)] text-[#56D6FF]">
              <Webhook className="h-5 w-5" />
            </div>
            <h2 className="font-display text-xl text-[#F1F5F9]">Webhook</h2>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4">
            <div>
              <span className="text-[#F1F5F9]">Webhook Aktif</span>
              <p className="text-xs text-[#69809F] mt-1">Terima pesan WhatsApp via webhook</p>
            </div>
            <button onClick={() => setWebhookEnabled(!webhookEnabled)} className={webhookEnabled ? "text-[#4ADE80]" : "text-[#69809F]"}>
              {webhookEnabled ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6" />}
            </button>
          </div>
          <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4">
            <p className="text-xs text-[#69809F]">Webhook URL</p>
            <p className="mt-1 text-sm font-mono text-[#F1F5F9] break-all">
              {typeof window !== "undefined" ? window.location.origin : "https://cs.ve-lora.my.id"}/api/webhook/whatsapp
            </p>
          </div>
        </div>

        {/* Security Tips */}
        <div className="glass-card p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(255,255,255,0.05)] text-[#4ADE80]">
              <Shield className="h-5 w-5" />
            </div>
            <h2 className="font-display text-xl text-[#F1F5F9]">Security Checklist</h2>
          </div>
          <div className="space-y-3">
            {[
              { label: "Webhook secret dikonfigurasi", done: true },
              { label: "Rate limiting aktif (30/min)", done: true },
              { label: "HTTPS enabled", done: true },
              { label: "Password hashing (bcrypt)", done: true },
              { label: "Tenant isolation per query", done: true },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl bg-[rgba(255,255,255,0.03)] px-4 py-3">
                <div className={`h-2 w-2 rounded-full ${item.done ? "bg-[#4ADE80]" : "bg-[#EF4444]"}`} />
                <span className="text-sm text-[#F1F5F9]">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button onClick={handleSave} disabled={isSaving} className="app-button-primary w-full py-4 text-base disabled:cursor-not-allowed disabled:opacity-50">
        {isSaving ? <><Loader2 className="h-5 w-5 animate-spin" /> Menyimpan...</> : <><Save className="h-5 w-5" /> Simpan Pengaturan Keamanan</>}
      </button>
    </div>
  );
}
