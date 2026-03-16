"use client";
import { useState, useEffect } from "react";
import { Send, ToggleLeft, ToggleRight, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

interface Model {
  id: string;
  name?: string;
}

export default function AISettingsPage() {
  const [systemPrompt, setSystemPrompt] = useState("");
  const [namaAgent, setNamaAgent] = useState("");
  const [model, setModel] = useState("gpt-4o");
  const [tone, setTone] = useState("semi-formal");
  const [aktif, setAktif] = useState(true);
  
  const [models, setModels] = useState<Model[]>([]);
  const [testMessage, setTestMessage] = useState("");
  const [testResponse, setTestResponse] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

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
        const modelsData = await modelsRes.json();
        setModels(modelsData.data || []);
      }
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

  const handleTest = async () => {
    if (!testMessage) return;
    setTesting(true);
    setTestResponse("");
    try {
      // Logic for real AI preview would go here
      // For now simulation
      await new Promise(r => setTimeout(r, 1500));
      setTestResponse(`[Simulasi via ${model}]: Halo! Saya ${namaAgent}. Bagaimana saya bisa membantu Anda hari ini?`);
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

  return (
    <div className="space-y-6">
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
              <select 
                value={model} 
                onChange={e => setModel(e.target.value)} 
                className="w-full px-4 py-2 bg-[#0A0F1E] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#F1F5F9] focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
              >
                {models.length > 0 ? (
                  models.map((m) => (
                    <option key={m.id} value={m.id}>{m.id}</option>
                  ))
                ) : (
                  <option value="gpt-4o">gpt-4o (default)</option>
                )}
              </select>
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
    </div>
  );
}

