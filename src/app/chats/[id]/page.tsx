"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  Bot,
  Loader2,
} from "lucide-react";

type ChatMessage = {
  id: string;
  message: string;
  reply: string | null;
  isAi: boolean;
  isHuman: boolean;
  timestamp: string;
};

export default function ChatDetailPage() {
  const { id: fromNumber } = useParams<{ id: string }>();
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
  }, [fromNumber]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/chats/${fromNumber}`);
      const data = await res.json();
      if (res.ok) setMessages(data);
      else toast.error("Gagal memuat pesan.");
    } catch {
      toast.error("Gagal memuat data.");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (ts: string) => {
    try {
      return new Date(ts).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    } catch { return ""; }
  };

  const formatDate = (ts: string) => {
    try {
      return new Date(ts).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    } catch { return ""; }
  };

  // Group messages by date
  const grouped: { date: string; messages: ChatMessage[] }[] = [];
  messages.forEach((msg) => {
    const date = formatDate(msg.timestamp);
    const last = grouped[grouped.length - 1];
    if (last && last.date === date) {
      last.messages.push(msg);
    } else {
      grouped.push({ date, messages: [msg] });
    }
  });

  return (
    <div className="flex h-[calc(100vh-80px)] flex-col">
      {/* Header */}
      <div className="glass-card flex items-center gap-4 px-6 py-4 shrink-0">
        <button onClick={() => router.push("/chats")} className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[rgba(138,180,248,0.12)] text-[#93A8C7] hover:bg-[rgba(255,255,255,0.05)]">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(145deg,rgba(86,214,255,0.18),rgba(103,167,255,0.06))]">
          <User className="h-5 w-5 text-[#56D6FF]" />
        </div>
        <div>
          <p className="font-medium text-[#F1F5F9]">{decodeURIComponent(fromNumber)}</p>
          <p className="text-xs text-[#93A8C7]">{messages.length} pesan</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#93A8C7]">
            <Loader2 className="h-10 w-10 animate-spin mb-4 text-[#56D6FF]" />
            <p>Memuat pesan...</p>
          </div>
        ) : (
          grouped.map((group) => (
            <div key={group.date}>
              <div className="flex justify-center my-4">
                <span className="rounded-full bg-[rgba(255,255,255,0.06)] px-4 py-1 text-xs text-[#69809F]">
                  {group.date}
                </span>
              </div>
              {group.messages.map((msg) => (
                <div key={msg.id} className="space-y-2 mb-3">
                  {/* User message */}
                  {msg.message && msg.isHuman && (
                    <div className="flex justify-start">
                      <div className="flex items-end gap-2 max-w-[75%]">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[rgba(255,255,255,0.06)]">
                          <User className="h-3.5 w-3.5 text-[#93A8C7]" />
                        </div>
                        <div className="rounded-2xl rounded-bl-md bg-[rgba(255,255,255,0.06)] px-4 py-2.5">
                          <p className="text-sm text-[#F1F5F9] whitespace-pre-wrap">{msg.message}</p>
                          <p className="mt-1 text-[10px] text-[#69809F]">{formatTime(msg.timestamp)}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Bot reply */}
                  {msg.reply && (
                    <div className="flex justify-end">
                      <div className="flex items-end gap-2 max-w-[75%]">
                        <div className="rounded-2xl rounded-br-md bg-[linear-gradient(145deg,rgba(86,214,255,0.12),rgba(103,167,255,0.06))] px-4 py-2.5">
                          <p className="text-sm text-[#F1F5F9] whitespace-pre-wrap">{msg.reply}</p>
                          <div className="mt-1 flex items-center gap-1.5 justify-end">
                            {msg.isAi && <Bot className="h-3 w-3 text-[#56D6FF]" />}
                            <p className="text-[10px] text-[#69809F]">{formatTime(msg.timestamp)}</p>
                          </div>
                        </div>
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[rgba(86,214,255,0.12)]">
                          <Bot className="h-3.5 w-3.5 text-[#56D6FF]" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
