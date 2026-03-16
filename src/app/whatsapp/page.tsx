"use client";

import { useState } from "react";
import { Loader2, QrCode, Key, CheckCircle, XCircle, RefreshCw } from "lucide-react";

export default function WhatsAppPage() {
  const [provider, setProvider] = useState<"waha" | "fonnte">("waha");
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");

  // Demo state - in real app, fetch from database
  const [wahaUrl, setWahaUrl] = useState(process.env.NEXT_PUBLIC_WAHA_URL || "http://localhost:3000");
  const [wahaSession, setWahaSession] = useState("default");
  const [wahaSecret, setWahaSecret] = useState("");

  const handleConnect = async () => {
    setLoading(true);
    
    // Simulate connection delay
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    setConnected(true);
    setPhoneNumber("+6281234567890");
    setLoading(false);
  };

  const handleDisconnect = async () => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setConnected(false);
    setPhoneNumber("");
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <section className="hero-panel px-6 py-7 md:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <span className="section-kicker">WA provider orchestration</span>
            <h1 className="mt-5 font-display text-4xl font-semibold text-[#F1F5F9] md:text-5xl">
              Hubungkan bot ke nomor bisnis dengan panel yang terasa seperti ruang kontrol.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-[#93A8C7] md:text-base">
              Pilih gateway, kelola autentikasi, dan pantau heartbeat koneksi tanpa keluar dari workflow admin.
            </p>
          </div>
          <div className="panel-shell p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-[#56D6FF]">
              Connection snapshot
            </p>
            <div className="mt-5 flex items-center gap-4">
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-full ${
                  connected ? "bg-[#10B981]/12 text-[#10B981]" : "bg-[#EF4444]/12 text-[#EF4444]"
                }`}
              >
                {connected ? <CheckCircle className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
              </div>
              <div>
                <p className="font-display text-2xl text-[#F1F5F9]">
                  {connected ? "Connected" : "Standby"}
                </p>
                <p className="text-sm text-[#93A8C7]">
                  {connected ? phoneNumber : "Menunggu autentikasi provider"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="glass-card p-5 md:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full ${
                connected
                  ? "bg-[#10B981]/10"
                  : "bg-[#EF4444]/10"
              }`}
            >
              {connected ? (
                <CheckCircle className="w-5 h-5 text-[#10B981]" />
              ) : (
                <XCircle className="w-5 h-5 text-[#EF4444]" />
              )}
            </div>
            <div>
              <p className="font-display text-xl text-[#F1F5F9]">
                {connected ? "Terhubung" : "Tidak Terhubung"}
              </p>
              <p className="text-sm text-[#93A8C7]">
                {connected ? phoneNumber : "Belum ada koneksi"}
              </p>
            </div>
          </div>
          {connected && (
            <button
              onClick={handleDisconnect}
              disabled={loading}
              className="app-button-danger disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              Putus
            </button>
          )}
        </div>
      </div>

      <div className="glass-card p-6">
        <h2 className="font-display text-2xl text-[#F1F5F9]">
          Pilih Provider
        </h2>
        <p className="mt-2 text-sm text-[#93A8C7]">
          Pilih mode koneksi sesuai infrastruktur yang dipakai tenant.
        </p>

        <div className="mb-6 mt-6 grid gap-4 md:grid-cols-2">
          <button
            onClick={() => setProvider("waha")}
            className={`rounded-[24px] border p-5 text-left transition-all ${
              provider === "waha"
                ? "border-[#56D6FF]/40 bg-[linear-gradient(145deg,rgba(86,214,255,0.18),rgba(103,167,255,0.06))]"
                : "border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] hover:border-[rgba(255,255,255,0.16)]"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(255,255,255,0.05)]">
                <QrCode className={`h-6 w-6 ${provider === "waha" ? "text-[#56D6FF]" : "text-[#94A3B8]"}`} />
              </div>
              <div className="text-left">
                <p className="font-display text-xl text-[#F1F5F9]">WAHA</p>
                <p className="text-sm text-[#93A8C7]">Self-hosted gateway</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setProvider("fonnte")}
            className={`rounded-[24px] border p-5 text-left transition-all ${
              provider === "fonnte"
                ? "border-[#56D6FF]/40 bg-[linear-gradient(145deg,rgba(86,214,255,0.18),rgba(103,167,255,0.06))]"
                : "border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] hover:border-[rgba(255,255,255,0.16)]"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(255,255,255,0.05)]">
                <Key className={`h-6 w-6 ${provider === "fonnte" ? "text-[#56D6FF]" : "text-[#94A3B8]"}`} />
              </div>
              <div className="text-left">
                <p className="font-display text-xl text-[#F1F5F9]">Fonnte</p>
                <p className="text-sm text-[#93A8C7]">Cloud-based gateway</p>
              </div>
            </div>
          </button>
        </div>

        {/* WAHA Configuration */}
        {provider === "waha" && (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm text-[#93A8C7]">
                WAHA URL
              </label>
              <input
                type="text"
                value={wahaUrl}
                onChange={(e) => setWahaUrl(e.target.value)}
                className="app-input"
                placeholder="http://localhost:3000"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-[#93A8C7]">
                Session Name
              </label>
              <input
                type="text"
                value={wahaSession}
                onChange={(e) => setWahaSession(e.target.value)}
                className="app-input"
                placeholder="default"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-[#93A8C7]">
                Secret Key
              </label>
              <input
                type="password"
                value={wahaSecret}
                onChange={(e) => setWahaSecret(e.target.value)}
                className="app-input"
                placeholder="••••••••••••"
              />
            </div>

            {!connected && (
              <button
                onClick={handleConnect}
                disabled={loading}
                className="app-button-primary w-full disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Menghubungkan...
                  </>
                ) : (
                  <>
                    <QrCode className="w-5 h-5" />
                    Generate QR Code
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Fonnte Configuration */}
        {provider === "fonnte" && (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm text-[#93A8C7]">
                API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="app-input"
                placeholder="••••••••••••"
              />
            </div>

            {!connected && (
              <button
                onClick={handleConnect}
                disabled={loading || !apiKey}
                className="app-button-primary w-full disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Menghubungkan...
                  </>
                ) : (
                  <>
                    <Key className="w-5 h-5" />
                    Validasi & Sambungkan
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* QR Code Display (Demo) */}
        {connected && provider === "waha" && (
          <div className="mt-6 flex items-center justify-center rounded-[24px] bg-white p-4">
            <div className="text-center">
              <QrCode className="w-48 h-48 mx-auto text-black" />
              <p className="text-black text-sm mt-2">Scan dengan WhatsApp</p>
            </div>
          </div>
        )}
      </div>

      <div className="glass-card p-6">
        <h2 className="font-display text-2xl text-[#F1F5F9]">
          Health Monitor
        </h2>
        <p className="mt-2 text-sm text-[#93A8C7]">
          Visual ringkas untuk koneksi gateway dan heartbeat sesi.
        </p>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <div className="panel-shell flex items-center justify-between p-4">
            <span className="text-[#F1F5F9]">API Status</span>
            <span className="text-[#10B981] flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Online
            </span>
          </div>

          <div className="panel-shell flex items-center justify-between p-4">
            <span className="text-[#F1F5F9]">WebSocket</span>
            <span className="text-[#10B981] flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Connected
            </span>
          </div>

          <div className="panel-shell flex items-center justify-between p-4">
            <span className="text-[#F1F5F9]">Last Heartbeat</span>
            <span className="text-[#94A3B8]">
              {new Date().toLocaleTimeString("id-ID")}
            </span>
          </div>
        </div>

        <button className="app-button-secondary mt-4 w-full">
          <RefreshCw className="w-4 h-4" />
          Refresh Status
        </button>
      </div>
    </div>
  );
}
