"use client";

import { useEffect, useState } from "react";
import { 
  TrendingUp, Users, CreditCard, Activity,
  PackageOpen, AlertCircle, CheckCircle2, DollarSign,
  FileText, FileSpreadsheet, FileJson
} from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import { exportToPDF, exportToExcel, exportToCSV } from "@/lib/export-utils";
import { toast } from "sonner";

export default function OwnerReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (startDate) params.set("start", startDate);
      if (endDate) params.set("end", endDate);
      
      const res = await fetch(`/api/owner/reports?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      console.error("Gagal memuat laporan", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [startDate, endDate]);

  const handleExport = (type: "pdf" | "excel" | "csv") => {
    if (!data?.tenants?.list) return;

    const exportConfig = {
      filename: `Report_Owner_Tenants_${new Date().toISOString().split('T')[0]}`,
      title: "Laporan Data Tenant CS Velora - Master",
      columns: ["Nama", "Email", "Telepon", "Paket", "Status", "Terdaftar"],
      rows: data.tenants.list.map((t: any) => [
        t.name,
        t.email,
        t.phone,
        t.paket,
        t.status,
        new Date(t.createdAt).toLocaleDateString("id-ID")
      ])
    };

    if (type === "pdf") exportToPDF(exportConfig);
    else if (type === "excel") exportToExcel(exportConfig);
    else exportToCSV(exportConfig);
    
    toast.success(`Laporan ${type.toUpperCase()} berhasil diunduh`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-[#94A3B8]">
        Gagal memuat data laporan.
      </div>
    );
  }

    return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#F1F5F9]">Laporan & Statistik Bisnis</h1>
          <p className="text-[#94A3B8] text-sm mt-1">Data agregat seluruh tenant dan pendapatan sistem</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-2">
            <span className="text-[10px] uppercase font-bold text-[#64748B]">Mulai</span>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent border-none text-xs text-[#F1F5F9] focus:outline-none focus:ring-0 [color-scheme:dark]"
            />
          </div>
          <div className="flex items-center gap-2 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-2">
            <span className="text-[10px] uppercase font-bold text-[#64748B]">Sampai</span>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent border-none text-xs text-[#F1F5F9] focus:outline-none focus:ring-0 [color-scheme:dark]"
            />
          </div>
          <div className="h-6 w-px bg-white/10 mx-1 hidden md:block" />
          <div className="flex items-center gap-2">
            <button 
              onClick={() => handleExport("pdf")}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-all text-sm font-medium"
            >
              <FileText className="w-4 h-4" /> PDF
            </button>
            <button 
              onClick={() => handleExport("excel")}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/20 transition-all text-sm font-medium"
            >
              <FileSpreadsheet className="w-4 h-4" /> Excel
            </button>
            <button 
              onClick={() => handleExport("csv")}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-xl hover:bg-blue-500/20 transition-all text-sm font-medium"
            >
              <FileJson className="w-4 h-4" /> CSV
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Revenue */}
        <div className="glass-card p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-[#94A3B8] text-sm mb-1">Total Pendapatan</p>
              <h3 className="text-2xl font-bold text-[#F1F5F9]">{formatRupiah(data.revenue?.total || 0)}</h3>
            </div>
            <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-500" />
            </div>
          </div>
          <p className="text-xs text-[#94A3B8] flex items-center gap-1">
            <span className="text-green-500 flex items-center">
               Bulan ini: {formatRupiah(data.revenue?.thisMonth || 0)}
            </span>
          </p>
        </div>

        {/* Total Tenants */}
        <div className="glass-card p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-[#94A3B8] text-sm mb-1">Total Tenant</p>
              <h3 className="text-2xl font-bold text-[#F1F5F9]">{data.tenants?.total || 0}</h3>
            </div>
            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
          </div>
          <p className="text-xs text-[#94A3B8]">
            Seluruh tenant yang terdaftar
          </p>
        </div>

        {/* Active Tenants */}
        <div className="glass-card p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-[#94A3B8] text-sm mb-1">Tenant Aktif</p>
              <h3 className="text-2xl font-bold text-[#F1F5F9]">{data.tenants?.active || 0}</h3>
            </div>
            <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
          </div>
          <p className="text-xs text-[#94A3B8]">
             Berstatus berlangganan (Active)
          </p>
        </div>

        {/* Suspended/Expired */}
        <div className="glass-card p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-[#94A3B8] text-sm mb-1">Expired / Suspended</p>
              <h3 className="text-2xl font-bold text-[#F1F5F9]">{data.tenants?.suspended || 0}</h3>
            </div>
            <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
          </div>
          <p className="text-xs text-[#94A3B8]">
            Tenant yang masa aktifnya habis
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribusi Paket */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-bold text-[#F1F5F9] mb-6 flex items-center gap-2">
            <PackageOpen className="w-5 h-5 text-[#3B82F6]" />
            Distribusi Paket
          </h2>
          
          <div className="space-y-4">
            {/* Basic */}
            <div className="bg-[#0A0F1E] p-4 rounded-lg border border-[rgba(255,255,255,0.05)]">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[#F1F5F9] font-medium">Paket Basic</span>
                <span className="text-[#3B82F6] font-bold">{data.paket?.basic || 0} Tenant</span>
              </div>
              <div className="w-full bg-[#1E293B] rounded-full h-2">
                <div 
                  className="bg-[#3B82F6] h-2 rounded-full" 
                  style={{ width: `${(data.paket?.basic / (data.tenants?.total || 1)) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Pro */}
            <div className="bg-[#0A0F1E] p-4 rounded-lg border border-[rgba(255,255,255,0.05)]">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[#F1F5F9] font-medium flex items-center gap-2">
                  Paket Pro <span className="px-2 py-0.5 text-[10px] bg-yellow-500/20 text-yellow-500 rounded border border-yellow-500/30">PREMIUM</span>
                </span>
                <span className="text-yellow-500 font-bold">{data.paket?.pro || 0} Tenant</span>
              </div>
              <div className="w-full bg-[#1E293B] rounded-full h-2">
                <div 
                  className="bg-yellow-500 h-2 rounded-full" 
                  style={{ width: `${(data.paket?.pro / (data.tenants?.total || 1)) * 100}%` }}
                ></div>
              </div>
            </div>
            
            {/* Trial */}
            <div className="bg-[#0A0F1E] p-4 rounded-lg border border-[rgba(255,255,255,0.05)]">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[#F1F5F9] font-medium">Trial Gratis</span>
                <span className="text-emerald-500 font-bold">{data.tenants?.trial || 0} Tenant</span>
              </div>
              <div className="w-full bg-[#1E293B] rounded-full h-2">
                <div 
                  className="bg-emerald-500 h-2 rounded-full" 
                  style={{ width: `${(data.tenants?.trial / (data.tenants?.total || 1)) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
