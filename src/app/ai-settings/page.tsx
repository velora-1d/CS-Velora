"use client";
import { useState, useEffect } from "react";
import { Send, ToggleLeft, ToggleRight, Loader2, Save, Cpu, Layers, DollarSign, ChevronDown, Check, X } from "lucide-react";
import { toast } from "sonner";
import { AIModel, AI_MODELS } from "@/lib/ai-models";

export default function AISettingsPage() {
  const [systemPrompt, setSystemPrompt] = useState("");
  const [namaAgent, setNamaAgent] = useState("");
  const [model, setModel] = useState("gpt-4o");
  const [tone, setTone] = useState("semi-formal");
  const [aktif, setAktif] = useState(true);
  const [models, setModels] = useState<AIModel[]>([]);
  const [testMessage, setTestMessage] = useState("");
  const [testResponse, setTestResponse] = useState("");
  const [knowledgeBase, setKnowledgeBase] = useState<{ profile: string; products: string; faqs: string; promos: string; payments: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [loadingKB, setLoadingKB] = useState(false);
  
  // Modal AI Model Picker state
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [searchModel, setSearchModel] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [settingsRes, modelsRes] = await Promise.all([
        fetch("/api/ai-settings"),
        fetch("/api/ai/models")
      ]);

      if (settingsRes.ok) {
        const settings = await settingsRes.json();
        setSystemPrompt(settings.systemPrompt || "");
        setNamaAgent(settings.namaAgent || "");
        setModel(settings.model || "gpt-4o");
        setTone(settings.tone || "semi-formal");
        setAktif(settings.aktif ?? true);
      }

      if (modelsRes.ok) {
        // Kita tidak memakai data API mentah lagi, melainkan memakai konstan dari ai-models.ts
        // Namun kita biarkan fetch nya jalan saja / kita comment out jika tidak dibutuhkan
        // const modelsData = await modelsRes.json();
        // setModels(modelsData.data || []);
      }
      
      fetchKB();
    } catch (error) {
      console.error("Error fetching AI settings:", error);
      toast.error("Gagal memuat pengaturan AI");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/ai-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemPrompt,
          namaAgent,
          model,
          tone,
          aktif,
        }),
      });

      if (res.ok) {
        toast.success("Pengaturan AI berhasil disimpan");
      } else {
        toast.error("Gagal menyimpan pengaturan AI");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat menyimpan");
    } finally {
      setSaving(false);
    }
  };

  const fetchKB = async () => {
    setLoadingKB(true);
    try {
      const res = await fetch("/api/ai/knowledge-base");
      if (res.ok) {
        const data = await res.json();
        setKnowledgeBase(data);
      }
    } catch (error) {
      console.error("Error fetching KB:", error);
    } finally {
      setLoadingKB(false);
    }
  };

  const handleTest = async () => {
    if (!testMessage) return;
    setTesting(true);
    try {
      const res = await fetch("/api/ai/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: testMessage,
          systemPrompt,
          namaAgent,
          model,
          tone,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setTestResponse(data.reply);
      } else {
        toast.error("AI gagal merespon");
      }
    } catch (error) {
      toast.error("Gagal melakukan pengetesan AI");
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#3B82F6]" />
      </div>
    );
  }

  // Filter models for the modal picker
  const filteredModels = AI_MODELS.filter(m => 
    m.id.toLowerCase().includes(searchModel.toLowerCase()) || 
    m.provider.toLowerCase().includes(searchModel.toLowerCase())
  );

  const selectedModelObj = AI_MODELS.find(m => m.id === model) || AI_MODELS.find(m => m.id === "gpt-4o") || AI_MODELS[0];

  return (
    <div className="space-y-6 relative">
      <div>
        <h1 className="text-2xl font-bold text-[#F1F5F9]">AI Settings</h1>
        <p className="text-[#94A3B8] text-sm mt-1">Konfigurasi chatbot AI & Personalitas</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#F1F5F9]">Konfigurasi AI</h2>
            <button onClick={() => setAktif(!aktif)} className={`flex items-center gap-2 transition-colors ${aktif ? "text-[#10B981]" : "text-[#94A3B8]"}`}>
              {aktif ? <ToggleRight className="w-8 h-8 transition-all" /> : <ToggleLeft className="w-8 h-8 transition-all" />}
              <span className="text-xs font-medium uppercase tracking-wider">{aktif ? "Aktif" : "Nonaktif"}</span>
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-2 uppercase tracking-wider">Nama Agent</label>
              <input 
                type="text" 
                value={namaAgent} 
                onChange={e => setNamaAgent(e.target.value)} 
                placeholder="Contoh: Velora Assistant"
                className="w-full px-4 py-2 bg-[#0A0F1E] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#F1F5F9] focus:outline-none focus:ring-1 focus:ring-[#3B82F6]" 
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-2 uppercase tracking-wider">AI Model</label>
              <div 
                onClick={() => setIsModelModalOpen(true)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-[#0A0F1E] border border-[rgba(255,255,255,0.08)] hover:border-[#3B82F6]/50 rounded-lg cursor-pointer transition-colors group"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-[#F1F5F9] truncate group-hover:text-[#3B82F6] transition-colors">{selectedModelObj?.id || model}</span>
                  <span className="text-[10px] text-[#94A3B8] capitalize">{selectedModelObj?.provider || 'Unknown'} • {selectedModelObj?.contextLength || 'N/A'} tokens</span>
                </div>
                <ChevronDown className="w-4 h-4 text-[#94A3B8] group-hover:text-[#3B82F6] transition-colors" />
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-[#94A3B8] mb-2 uppercase tracking-wider">Tone & Persona</label>
            <select 
              value={tone} 
              onChange={e => setTone(e.target.value)} 
              className="w-full px-4 py-2 bg-[#0A0F1E] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#F1F5F9] focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
            >
              <option value="formal">Formal</option>
              <option value="semi-formal">Semi-formal</option>
              <option value="santai">Santai</option>
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-[#94A3B8] mb-2 uppercase tracking-wider">System Prompt (Instruksi)</label>
            <textarea 
              value={systemPrompt} 
              onChange={e => setSystemPrompt(e.target.value)} 
              rows={6} 
              placeholder="Berikan instruksi spesifik kepada AI..."
              className="w-full px-4 py-2 bg-[#0A0F1E] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#F1F5F9] resize-none focus:outline-none focus:ring-1 focus:ring-[#3B82F6]" 
            />
            <p className="text-[10px] text-[#94A3B8] mt-2 italic">*Data produk, promo, dan FAQ akan otomatis di-inject ke prompt ini saat bot berjalan.</p>
          </div>
          
          <button 
            onClick={handleSave}
            disabled={saving}
            className="w-full py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Simpan Perubahan
          </button>
        </div>
        
        <div className="glass-card p-6 flex flex-col">
          <h2 className="text-lg font-semibold text-[#F1F5F9] mb-4">AI Playground (Test)</h2>
          <div className="flex-1 flex flex-col space-y-4">
            <div className="flex-1 overflow-y-auto p-4 bg-[#0A0F1E]/50 rounded-xl border border-[rgba(255,255,255,0.05)] min-h-[200px]">
              {testResponse ? (
                <div className="flex flex-col gap-3">
                  <div className="self-end bg-[#3B82F6]/20 py-2 px-4 rounded-2xl rounded-tr-none max-w-[80%] border border-[#3B82F6]/30">
                    <p className="text-sm text-[#F1F5F9]">{testMessage}</p>
                  </div>
                  <div className="self-start bg-[rgba(255,255,255,0.05)] py-2 px-4 rounded-2xl rounded-tl-none max-w-[80%] border border-[rgba(255,255,255,0.1)]">
                    <p className="text-sm text-[#F1F5F9]">{testResponse}</p>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-[#94A3B8] text-xs italic">
                  Belum ada percakapan. Mulai test di bawah.
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <input 
                type="text" 
                value={testMessage} 
                onChange={e => setTestMessage(e.target.value)} 
                placeholder="Ketik pesan untuk test..." 
                onKeyDown={(e) => e.key === 'Enter' && handleTest()}
                className="flex-1 px-4 py-2.5 bg-[#0A0F1E] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#F1F5F9] focus:outline-none focus:ring-1 focus:ring-[#3B82F6]" 
              />
              <button 
                onClick={handleTest} 
                disabled={testing || !testMessage} 
                className="w-12 h-12 flex items-center justify-center bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-lg disabled:opacity-50 transition-all"
              >
                {testing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#F1F5F9]">Knowledge Base Preview</h2>
          <button onClick={fetchKB} disabled={loadingKB} className="text-xs text-[#3B82F6] hover:underline">
            {loadingKB ? "Refreshing..." : "Refresh Data"}
          </button>
        </div>
        <p className="text-xs text-[#94A3B8] mb-6">Berikut adalah data mentah yang akan disuntikkan ke dalam AI setiap kali bot merespon pesan pelanggan.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-[#3B82F6] uppercase">Profil Bisnis</span>
            <div className="p-3 bg-[#0A0F1E] border border-[rgba(255,255,255,0.05)] rounded-lg text-[11px] text-[#CBD5E1] whitespace-pre-wrap h-40 overflow-y-auto">
              {knowledgeBase?.profile || "-"}
            </div>
          </div>
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-[#10B981] uppercase">Produk & Layanan</span>
            <div className="p-3 bg-[#0A0F1E] border border-[rgba(255,255,255,0.05)] rounded-lg text-[11px] text-[#CBD5E1] whitespace-pre-wrap h-40 overflow-y-auto">
              {knowledgeBase?.products || "-"}
            </div>
          </div>
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-[#F59E0B] uppercase">Promo Aktif</span>
            <div className="p-3 bg-[#0A0F1E] border border-[rgba(255,255,255,0.05)] rounded-lg text-[11px] text-[#CBD5E1] whitespace-pre-wrap h-40 overflow-y-auto">
              {knowledgeBase?.promos || "-"}
            </div>
          </div>
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-[#94A3B8] uppercase">FAQ</span>
            <div className="p-3 bg-[#0A0F1E] border border-[rgba(255,255,255,0.05)] rounded-lg text-[11px] text-[#CBD5E1] whitespace-pre-wrap h-40 overflow-y-auto">
              {knowledgeBase?.faqs || "-"}
            </div>
          </div>
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-[#8B5CF6] uppercase">Metode Pembayaran</span>
            <div className="p-3 bg-[#0A0F1E] border border-[rgba(255,255,255,0.05)] rounded-lg text-[11px] text-[#CBD5E1] whitespace-pre-wrap h-40 overflow-y-auto">
              {knowledgeBase?.payments || "-"}
            </div>
          </div>
        </div>
      </div>

      {/* Model Picker Modal */}
      {isModelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0B1120] border border-[rgba(255,255,255,0.1)] rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh] overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-[rgba(255,255,255,0.05)] shrink-0">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-[#F1F5F9]">Pilih Model AI</h3>
                <p className="text-xs text-[#94A3B8]">Daftar model language terintegrasi beserta kapasitas token & biaya operasional.</p>
              </div>
              <button onClick={() => setIsModelModalOpen(false)} className="p-2 text-[#94A3B8] hover:text-white bg-[#1E293B] hover:bg-[#334155] rounded-full transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-4 shrink-0 bg-[#0B1120] border-b border-[rgba(255,255,255,0.02)]">
              <input
                type="text"
                placeholder="Cari model id atau provider (ex: gpt, gemini, google...)"
                value={searchModel}
                onChange={(e) => setSearchModel(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#0f172a] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-[#F1F5F9] focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] placeholder:text-[#475569] transition-all"
              />
            </div>
            
            <div className="overflow-y-auto p-2">
              <div className="flex flex-col gap-1.5 p-2">
                {filteredModels.map((m) => {
                  const isSelected = model === m.id;
                  return (
                    <div 
                      key={m.id}
                      onClick={() => {
                        setModel(m.id);
                        setIsModelModalOpen(false);
                      }}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 cursor-pointer rounded-xl transition-all border ${isSelected ? 'bg-[#3B82F6]/10 border-[#3B82F6]/50 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'bg-transparent border-transparent hover:bg-[rgba(255,255,255,0.03)] hover:border-[rgba(255,255,255,0.05)]'}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? 'border-[#3B82F6]' : 'border-[#475569]'}`}>
                          {isSelected && <div className="w-2 h-2 rounded-full bg-[#3B82F6]" />}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold text-sm ${isSelected ? 'text-[#3B82F6]' : 'text-[#F1F5F9]'}`}>{m.id}</span>
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-[#1E293B] text-[#94A3B8] border border-[rgba(255,255,255,0.05)]">{m.provider}</span>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
                            <div className="flex items-center gap-1.5 text-xs text-[#94A3B8]">
                              <Layers className="w-3.5 h-3.5 text-[#8B5CF6]" />
                              <span>{m.contextLength} limit token</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-[#94A3B8]">
                              <DollarSign className="w-3.5 h-3.5 text-[#10B981]" />
                              <span><strong className="text-[#CBD5E1] font-medium">{m.inputPrice}</strong> in / <strong className="text-[#CBD5E1] font-medium">{m.outputPrice}</strong> out <span className="text-[10px] opacity-70">(per 1M)</span></span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {isSelected && (
                        <div className="hidden sm:flex items-center justify-center bg-[#3B82F6] text-white rounded-full p-1.5">
                          <Check className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  );
                })}
                {filteredModels.length === 0 && (
                  <div className="text-center py-10 text-[#64748B]">
                    <Cpu className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">Model tidak ditemukan</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

