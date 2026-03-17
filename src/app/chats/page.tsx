"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  MessageCircle,
  Search,
  Loader2,
  User,
  Bot,
  ChevronRight,
} from "lucide-react";

type ChatThread = {
  fromNumber: string;
  fromName: string | null;
  lastMessage: string;
  lastReply: string;
  messageCount: number;
  lastTimestamp: string;
};

export default function ChatsPage() {
  const router = useRouter();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchThreads();
  }, []);

  const fetchThreads = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/chats");
      const data = await res.json();
      if (res.ok) setThreads(data);
      else toast.error("Gagal memuat riwayat chat.");
    } catch {
      toast.error("Gagal memuat data.");
    } finally {
      setLoading(false);
    }
  };

  const filtered = threads.filter((t) =>
    t.fromNumber.includes(search) || (t.fromName?.toLowerCase() || "").includes(search.toLowerCase())
  );

  const formatTime = (ts: string) => {
    try {
      const d = new Date(ts);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays === 0) return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
      if (diffDays === 1) return "Kemarin";
      if (diffDays < 7) return `${diffDays} hari lalu`;
      return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
    } catch { return ""; }
  };

  return (
    <div className="space-y-6">
      <section className="hero-panel px-6 py-7 md:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <span className="section-kicker">Conversation hub</span>
            <h1 className="mt-5 font-display text-4xl font-semibold text-[#F1F5F9] md:text-5xl">
              Pantau setiap percakapan bot secara real-time.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-[#93A8C7] md:text-base">
              Lihat riwayat chat, filter berdasarkan nomor, dan telusuri setiap percakapan.
            </p>
          </div>
          <div className="panel-shell p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-[#56D6FF]">Chat pulse</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="metric-card p-4">
                <p className="text-2xl font-semibold text-[#F1F5F9]">{threads.length}</p>
                <p className="mt-1 text-xs leading-5 text-[#93A8C7]">Total kontak</p>
              </div>
              <div className="metric-card p-4">
                <p className="text-2xl font-semibold text-[#67A7FF]">
                  {threads.reduce((s, t) => s + t.messageCount, 0)}
                </p>
                <p className="mt-1 text-xs leading-5 text-[#93A8C7]">Total pesan</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="glass-card p-5 md:p-6">
        <div className="relative">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nomor atau nama..." className="app-input pl-4" />
        </div>
      </div>

      <div className="space-y-2">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#93A8C7]">
            <Loader2 className="h-10 w-10 animate-spin mb-4 text-[#56D6FF]" />
            <p>Memuat riwayat chat...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card py-20 text-center">
            <MessageCircle className="mx-auto h-12 w-12 text-[#334155] mb-4" />
            <p className="text-[#93A8C7]">Belum ada riwayat percakapan.</p>
          </div>
        ) : (
          filtered.map((thread) => (
            <button
              key={thread.fromNumber}
              onClick={() => router.push(`/chats/${thread.fromNumber}`)}
              className="glass-card w-full p-5 text-left transition-all hover:border-[rgba(138,180,248,0.24)] hover:bg-[rgba(255,255,255,0.03)]"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(145deg,rgba(86,214,255,0.18),rgba(103,167,255,0.06))]">
                    <User className="h-5 w-5 text-[#56D6FF]" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-[#F1F5F9]">
                        {thread.fromName || thread.fromNumber}
                      </p>
                      <span className="status-pill bg-[#67A7FF]/10 text-[#67A7FF] text-[10px]">
                        {thread.messageCount} pesan
                      </span>
                    </div>
                    <p className="mt-1 truncate text-sm text-[#93A8C7]">
                      {thread.lastReply || thread.lastMessage || "..."}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-[#69809F]">{formatTime(thread.lastTimestamp)}</span>
                  <ChevronRight className="h-4 w-4 text-[#69809F]" />
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
