"use client";

import { useState, useEffect } from "react";
import { 
  Database, 
  Search, 
  Download, 
  User, 
  Calendar, 
  MessageSquare, 
  MoreVertical, 
  Filter,
  FileSpreadsheet,
  FileText,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface Client {
  id: string;
  nomor: string;
  nama: string | null;
  catatan: string | null;
  isNew: boolean;
  lastInteraction: string;
  createdAt: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [exportLoading, setExportLoading] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await fetch("/api/clients");
      if (res.ok) {
        const data = await res.json();
        setClients(data);
      }
    } catch (err) {
      toast.error("Gagal mengambil data client");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (formatType: 'csv' | 'xlsx') => {
    setExportLoading(true);
    setShowExportMenu(false);
    try {
      const res = await fetch(`/api/clients/export?format=${formatType}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `clients-velora-${format(new Date(), 'yyyyMMdd')}.${formatType}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success(`Data berhasil diekspor ke ${formatType.toUpperCase()}`);
      } else {
        toast.error("Gagal mengekspor data");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan saat ekspor");
    } finally {
      setExportLoading(false);
    }
  };

  const filteredClients = clients.filter(c => 
    c.nomor.includes(search) || 
    (c.nama && c.nama.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Database Client
          </h1>
          <p className="text-gray-400 mt-1">
            Kelola dan pantau semua pelanggan yang pernah berinteraksi dengan AI Anda.
          </p>
        </div>
        
        <div className="flex items-center gap-3 relative">
          <button 
            onClick={() => setShowExportMenu(!showExportMenu)}
            disabled={exportLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white transition-all disabled:opacity-50"
          >
            {exportLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Ekspor Data
          </button>
          
          {showExportMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-[#0F0F12] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
              <button 
                onClick={() => handleExport('xlsx')}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-white text-sm transition-colors text-left"
              >
                <FileSpreadsheet className="w-4 h-4 text-green-400" />
                Excel (.xlsx)
              </button>
              <button 
                onClick={() => handleExport('csv')}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-white text-sm transition-colors text-left border-t border-white/5"
              >
                <FileText className="w-4 h-4 text-blue-400" />
                CSV (.csv)
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input 
            type="text"
            placeholder="Cari nomor atau nama pelanggan..." 
            className="w-full pl-10 pr-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-[#56D6FF] transition-all"
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          />
        </div>
        <button className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
          <Filter className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-48 bg-white/5 animate-pulse rounded-2xl border border-white/5" />
          ))}
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="bg-white/5 border border-dashed border-white/10 py-16 rounded-2xl flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <Database className="w-8 h-8 text-gray-500" />
          </div>
          <h3 className="text-xl font-medium text-white">Belum Ada Client</h3>
          <p className="text-gray-400 max-w-xs mt-2">
            Pelanggan yang berinteraksi via WhatsApp akan otomatis muncul di sini.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <div 
              key={client.id} 
              className="group relative bg-[#16161D] border border-white/10 rounded-2xl p-6 hover:border-[#56D6FF]/50 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-[#56D6FF] opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#56D6FF]/10 flex items-center justify-center">
                  <User className="w-6 h-6 text-[#56D6FF]" />
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  client.isNew 
                    ? "bg-[#56D6FF] text-black" 
                    : "border border-white/10 text-gray-500"
                }`}>
                  {client.isNew ? "Baru" : "Lama"}
                </span>
              </div>
              
              <div>
                <h3 className="text-lg text-[#F1F5F9] font-bold truncate">
                  {client.nama || "Pelanggan Tanpa Nama"}
                </h3>
                <p className="text-[#56D6FF] font-mono text-sm mt-1">
                  {client.nomor}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/5">
                <div className="space-y-1">
                  <span className="text-[10px] text-gray-500 uppercase font-bold tracking-tight flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Terdaftar
                  </span>
                  <p className="text-sm text-gray-300">
                    {format(new Date(client.createdAt), 'dd MMM yyyy', { locale: id })}
                  </p>
                </div>
                <div className="space-y-1 text-right">
                  <span className="text-[10px] text-gray-500 uppercase font-bold tracking-tight flex items-center gap-1 justify-end">
                    <MessageSquare className="w-3 h-3" /> Terakhir
                  </span>
                  <p className="text-sm text-gray-300">
                    {format(new Date(client.lastInteraction), 'HH:mm dd/MM/yy')}
                  </p>
                </div>
              </div>
              
              {client.catatan && (
                <div className="mt-4 bg-black/40 p-3 rounded-xl border border-white/5">
                  <p className="text-xs text-gray-400 italic line-clamp-2 leading-relaxed">
                    "{client.catatan}"
                  </p>
                </div>
              )}

              <div className="mt-6 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                <button className="flex-1 py-2 rounded-xl bg-white/5 border border-white/5 text-xs font-bold text-white hover:bg-white/10 transition-colors">
                  Lihat Detail
                </button>
                <button className="p-2 rounded-xl bg-white/5 border border-white/5 text-gray-400 hover:text-white transition-colors">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
