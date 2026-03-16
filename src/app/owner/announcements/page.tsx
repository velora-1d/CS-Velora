"use client";

import { useState, useEffect } from "react";
import { Megaphone, Plus, Trash2, Loader2, Calendar } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export default function OwnerAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ judul: "", isi: "", prioritas: "medium" });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch("/api/owner/announcements");
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data);
      }
    } catch (error) {
      toast.error("Gagal memuat pengumuman");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/owner/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success("Pengumuman berhasil dibuat");
        setIsModalOpen(false);
        setFormData({ judul: "", isi: "", prioritas: "medium" });
        fetchAnnouncements();
      } else {
        const data = await res.json();
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast.error(error.message || "Gagal membuat pengumuman");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, judul: string) => {
    if (!confirm(`Hapus pengumuman "${judul}"?`)) return;

    try {
      const res = await fetch(`/api/owner/announcements/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Pengumuman dihapus");
        setAnnouncements(announcements.filter((a) => a.id !== id));
      } else {
        throw new Error("Gagal menghapus");
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#F1F5F9]">Pengumuman & Notifikasi</h1>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Buat Pengumuman Baru
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#3B82F6]" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="glass-card overflow-hidden">
          <div className="p-12 text-center text-[#94A3B8]">
            <div className="w-16 h-16 bg-[#1E293B] border border-[rgba(255,255,255,0.05)] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Megaphone className="w-8 h-8 text-[#94A3B8]" />
            </div>
            <h3 className="text-lg font-medium text-[#F1F5F9] mb-2">Belum ada pengumuman</h3>
            <p className="max-w-md mx-auto">
              Buat pengumuman baru untuk memberitahukan update fitur, jadwal maintenance, atau promo kepada semua tenant.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {announcements.map((announcement) => (
            <div key={announcement.id} className="glass-card p-6 flex flex-col md:flex-row gap-6 relative group">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    announcement.prioritas === 'high' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                    announcement.prioritas === 'medium' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                    'bg-green-500/10 text-green-500 border border-green-500/20'
                  }`}>
                    {announcement.prioritas.toUpperCase()}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-[#94A3B8]">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(announcement.createdAt), 'dd MMMM yyyy HH:mm', { locale: id })}
                  </div>
                </div>
                <h3 className="text-lg font-bold text-[#F1F5F9] mb-2">{announcement.judul}</h3>
                <p className="text-[#94A3B8] text-sm whitespace-pre-wrap">{announcement.isi}</p>
              </div>

              <div className="flex items-start md:opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleDelete(announcement.id, announcement.judul)}
                  className="p-2 text-[#EF4444] hover:bg-[#EF4444]/10 rounded-lg transition-colors"
                  title="Hapus Pengumuman"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Crate */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0F172A] border border-[rgba(255,255,255,0.1)] rounded-xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-[rgba(255,255,255,0.05)]">
              <h2 className="text-xl font-bold text-[#F1F5F9]">Buat Pengumuman Baru</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-[#94A3B8] mb-2">Judul</label>
                <input 
                  type="text" 
                  value={formData.judul}
                  onChange={(e) => setFormData({...formData, judul: e.target.value})}
                  className="w-full px-4 py-2 bg-[#0A0F1E] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#F1F5F9] focus:outline-none focus:border-[#3B82F6]"
                  placeholder="Contoh: Update Sistem V2.0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-[#94A3B8] mb-2">Prioritas</label>
                <select 
                  value={formData.prioritas}
                  onChange={(e) => setFormData({...formData, prioritas: e.target.value})}
                  className="w-full px-4 py-2 bg-[#0A0F1E] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#F1F5F9] focus:outline-none focus:border-[#3B82F6]"
                >
                  <option value="low">Rendah (Low)</option>
                  <option value="medium">Sedang (Medium)</option>
                  <option value="high">Tinggi (High)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-[#94A3B8] mb-2">Isi Pengumuman</label>
                <textarea 
                  value={formData.isi}
                  onChange={(e) => setFormData({...formData, isi: e.target.value})}
                  className="w-full px-4 py-3 bg-[#0A0F1E] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#F1F5F9] focus:outline-none focus:border-[#3B82F6] min-h-[120px] resize-none"
                  placeholder="Tulis pesan Anda di sini..."
                  required
                ></textarea>
              </div>

              <div className="flex gap-3 justify-end mt-6">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-[#94A3B8] hover:text-[#F1F5F9] transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Mengirim...</> : "Kirim Pengumuman"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
