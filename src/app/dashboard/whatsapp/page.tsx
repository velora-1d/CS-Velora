"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Smartphone,
  Plus,
  Trash2,
  RefreshCw,
  Wifi,
  WifiOff,
  Clock,
  QrCode,
  X,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

interface WaSession {
  id: string;
  sessionId: string;
  waNumber: string;
  label: string;
  status: string;
  createdAt: string;
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { text: string; cls: string; icon: React.ReactNode }> = {
    connected: {
      text: "Terhubung",
      cls: "bg-[#4ADE80]/10 text-[#4ADE80]",
      icon: <Wifi className="h-3 w-3" />,
    },
    disconnected: {
      text: "Terputus",
      cls: "bg-[#EF4444]/10 text-[#EF4444]",
      icon: <WifiOff className="h-3 w-3" />,
    },
    qr_pending: {
      text: "Menunggu Scan QR",
      cls: "bg-[#FFBF69]/10 text-[#FFBF69]",
      icon: <QrCode className="h-3 w-3" />,
    },
  };

  const meta = config[status] || {
    text: status,
    cls: "bg-[#94A3B8]/10 text-[#94A3B8]",
    icon: <Clock className="h-3 w-3" />,
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${meta.cls}`}>
      {meta.icon}
      {meta.text}
    </span>
  );
}

export default function WhatsAppPage() {
  const [sessions, setSessions] = useState<WaSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [labelInput, setLabelInput] = useState("");
  const [qrModal, setQrModal] = useState<{ sessionId: string; qrUrl: string } | null>(null);
  const [limitReached, setLimitReached] = useState(false);

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/whatsapp/sessions");
      const data = await res.json();
      if (res.ok) {
        setSessions(data);
      }
    } catch {
      setError("Gagal memuat sesi WhatsApp.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  async function handleAddSession() {
    try {
      setAdding(true);
      setError(null);
      const res = await fetch("/api/whatsapp/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: labelInput }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Gagal menambah sesi.");
        if (data.limitReached) setLimitReached(true);
        return;
      }

      setShowAddModal(false);
      setLabelInput("");
      // Tampilkan QR Code
      setQrModal({ sessionId: data.session.id, qrUrl: data.qrUrl });
      await fetchSessions();
    } catch {
      setError("Gagal menghubungi server.");
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Yakin ingin menghapus sesi WA ini?")) return;
    const res = await fetch(`/api/whatsapp/sessions/${id}`, { method: "DELETE" });
    if (res.ok) {
      setSessions((prev) => prev.filter((s) => s.id !== id));
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#56D6FF]">
            Multi-Device Management
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-[#F1F5F9]">
            WhatsApp Akun
          </h1>
          <p className="mt-1 text-sm text-[#93A8C7]">
            Kelola sesi WhatsApp yang terhubung ke sistem CS Velora.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchSessions}
            className="inline-flex items-center gap-2 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-4 py-2 text-sm text-[#93A8C7] transition hover:bg-[rgba(255,255,255,0.08)]"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            onClick={() => { setShowAddModal(true); setError(null); setLimitReached(false); }}
            className="inline-flex items-center gap-2 rounded-xl bg-[#3B82F6] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#2563EB]"
          >
            <Plus className="h-4 w-4" />
            Tambah Nomor WA
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#EF4444]" />
          <div className="flex-1">
            <p className="text-sm text-[#EF4444]">{error}</p>
            {limitReached && (
              <p className="mt-1 text-xs text-[#93A8C7]">
                Upgrade ke paket <strong>Pro</strong> untuk menambah lebih banyak nomor WhatsApp.
              </p>
            )}
          </div>
          <button onClick={() => setError(null)}>
            <X className="h-4 w-4 text-[#EF4444]" />
          </button>
        </div>
      )}

      {/* Session List */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2].map((i) => (
            <div key={i} className="glass-card h-32 animate-pulse rounded-2xl p-5" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center gap-4 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#3B82F6]/10 text-[#3B82F6]">
            <Smartphone className="h-8 w-8" />
          </div>
          <p className="text-[#F1F5F9]">Belum ada nomor WhatsApp yang terhubung.</p>
          <p className="text-sm text-[#93A8C7]">Klik &ldquo;Tambah Nomor WA&rdquo; untuk menghubungkan akun WhatsApp.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sessions.map((s) => (
            <div key={s.id} className="glass-card space-y-4 p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3B82F6]/10 text-[#3B82F6]">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-[#F1F5F9]">{s.label}</p>
                    <p className="text-xs text-[#69809F]">
                      {s.waNumber || "Belum terscanning"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="rounded-lg p-1.5 text-[#EF4444] transition hover:bg-[#EF4444]/10"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <StatusBadge status={s.status} />
                {s.status === "qr_pending" && (
                  <button
                    onClick={() =>
                      setQrModal({
                        sessionId: s.id,
                        qrUrl: `/api/whatsapp/sessions/${s.id}`,
                      })
                    }
                    className="text-xs text-[#3B82F6] underline"
                  >
                    Lihat QR
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Session Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#F1F5F9]">Tambah Nomor WhatsApp</h2>
              <button onClick={() => setShowAddModal(false)}>
                <X className="h-5 w-5 text-[#69809F]" />
              </button>
            </div>
            <p className="mt-2 text-sm text-[#93A8C7]">
              Sesi baru akan dibuat di WAHA. Scan QR Code yang muncul untuk menghubungkan nomor Anda.
            </p>
            <div className="mt-5 space-y-4">
              <div>
                <label className="text-xs uppercase tracking-[0.15em] text-[#69809F]">
                  Label Akun (opsional)
                </label>
                <input
                  value={labelInput}
                  onChange={(e) => setLabelInput(e.target.value)}
                  placeholder="Contoh: CS Utama, Toko Cabang"
                  className="mt-2 w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-4 py-2.5 text-sm text-[#F1F5F9] placeholder:text-[#4A6080] focus:border-[#3B82F6] focus:outline-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 rounded-xl border border-[rgba(255,255,255,0.08)] py-2.5 text-sm text-[#93A8C7] transition hover:bg-[rgba(255,255,255,0.06)]"
                >
                  Batal
                </button>
                <button
                  onClick={handleAddSession}
                  disabled={adding}
                  className="flex-1 rounded-xl bg-[#3B82F6] py-2.5 text-sm font-medium text-white transition hover:bg-[#2563EB] disabled:opacity-50"
                >
                  {adding ? "Memproses..." : "Buat Sesi & Tampilkan QR"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {qrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass-card flex w-full max-w-sm flex-col items-center gap-5 p-6 text-center">
            <div className="flex items-center justify-between w-full">
              <h2 className="text-lg font-semibold text-[#F1F5F9]">Scan QR Code</h2>
              <button onClick={() => setQrModal(null)}>
                <X className="h-5 w-5 text-[#69809F]" />
              </button>
            </div>
            <div className="flex h-56 w-56 items-center justify-center rounded-2xl bg-white p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrModal.qrUrl} alt="QR Code WhatsApp" className="h-full w-full object-contain" />
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-[#4ADE80]/10 px-4 py-2.5">
              <CheckCircle className="h-4 w-4 text-[#4ADE80]" />
              <p className="text-xs text-[#4ADE80]">
                Buka WhatsApp → Perangkat Tertaut → Tautkan Perangkat → Scan QR
              </p>
            </div>
            <button
              onClick={() => { setQrModal(null); fetchSessions(); }}
              className="w-full rounded-xl bg-[#3B82F6] py-2.5 text-sm font-medium text-white transition hover:bg-[#2563EB]"
            >
              Sudah Scan, Refresh Status
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
