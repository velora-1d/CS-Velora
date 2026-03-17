"use client";

import { useEffect, useState } from "react";
import { 
  Users, DollarSign, TrendingUp, AlertCircle, CheckCircle2,
  BarChart3, PieChart as PieChartIcon, Activity, Loader2, Star
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell 
} from "recharts";
import { formatRupiah } from "@/lib/utils";

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

export default function OwnerDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/owner/reports");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      console.error("Gagal memuat data dashboard", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-[#3B82F6] mb-4" />
        <p className="text-[#94A3B8]">Memuat dashboard pusat...</p>
      </div>
    );
  }

  const paketData = [
    { name: "Paket Basic", value: data?.paket?.basic || 0 },
    { name: "Paket Pro", value: data?.paket?.pro || 0 },
  ];

  return (
    <div className="space-y-6">
      <section className="hero-panel px-6 py-7 md:px-8">
        <h1 className="text-2xl font-bold text-[#F1F5F9]">Dashboard Pusat (Owner)</h1>
        <p className="text-[#94A3B8] text-sm mt-1">Pantau ekosistem CS Velora secara keseluruhan</p>
      </section>
      
      {/* Premium KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="metric-card p-5">
          <p className="text-xs uppercase tracking-wider text-[#94A3B8] mb-2 font-bold">Total Revenue</p>
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-[#F1F5F9]">{formatRupiah(data.revenue.total)}</h3>
            <div className="p-2 bg-emerald-500/10 rounded-lg"><DollarSign className="w-5 h-5 text-emerald-500" /></div>
          </div>
        </div>
        <div className="metric-card p-5">
          <p className="text-xs uppercase tracking-wider text-[#94A3B8] mb-2 font-bold">Total Tenant</p>
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-[#F1F5F9]">{data.tenants.total}</h3>
            <div className="p-2 bg-blue-500/10 rounded-lg"><Users className="w-5 h-5 text-blue-500" /></div>
          </div>
        </div>
        <div className="metric-card p-5">
          <p className="text-xs uppercase tracking-wider text-[#94A3B8] mb-2 font-bold">Growth Month</p>
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-[#F1F5F9]">{formatRupiah(data.revenue.thisMonth)}</h3>
            <div className="p-2 bg-purple-500/10 rounded-lg"><TrendingUp className="w-5 h-5 text-purple-500" /></div>
          </div>
        </div>
        <div className="metric-card p-5">
          <p className="text-xs uppercase tracking-wider text-[#94A3B8] mb-2 font-bold">Active Ratio</p>
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-[#F1F5F9]">
              {((data.tenants.active / data.tenants.total) * 100).toFixed(1)}%
            </h3>
            <div className="p-2 bg-orange-500/10 rounded-lg"><CheckCircle2 className="w-5 h-5 text-orange-500" /></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Package Distribution Chart */}
        <div className="glass-card p-6 min-h-[400px]">
          <h3 className="text-lg font-bold text-[#F1F5F9] mb-6 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Distribusi Paket Berlangganan
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paketData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="#64748B" fontSize={12} />
                <YAxis stroke="#64748B" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#0F172A", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
                />
                <Bar dataKey="value" fill="#3B82F6" radius={[8, 8, 0, 0]}>
                  {paketData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 1 ? "#EAB308" : "#3B82F6"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tenant Status Activity */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold text-[#F1F5F9] mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#3B82F6]" />
            Snapshot Status Tenant
          </h3>
          <div className="grid grid-cols-2 gap-4">
             <div className="panel-shell p-4 border-l-4 border-blue-500">
               <p className="text-sm text-[#94A3B8]">Berlangganan (Pro)</p>
               <h4 className="text-xl font-bold text-[#F1F5F9]">{data.paket.pro}</h4>
             </div>
             <div className="panel-shell p-4 border-l-4 border-yellow-500">
               <p className="text-sm text-[#94A3B8]">Berlangganan (Basic)</p>
               <h4 className="text-xl font-bold text-[#F1F5F9]">{data.paket.basic}</h4>
             </div>
             <div className="panel-shell p-4 border-l-4 border-emerald-500">
               <p className="text-sm text-[#94A3B8]">Gratis Trial</p>
               <h4 className="text-xl font-bold text-[#F1F5F9]">{data.tenants.trial}</h4>
             </div>
             <div className="panel-shell p-4 border-l-4 border-red-500">
               <p className="text-sm text-[#94A3B8]">Expired / Suspended</p>
               <h4 className="text-xl font-bold text-[#F1F5F9]">{data.tenants.suspended}</h4>
             </div>
          </div>

          <div className="mt-8">
            <h4 className="text-sm font-semibold text-[#F1F5F9] mb-4">Aktivitas Terakhir</h4>
            <div className="space-y-3">
              {data.tenants.list.slice(0, 3).map((tenant: any) => (
                <div key={tenant.id} className="flex justify-between items-center p-3 rounded-lg bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)]">
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-[#3B82F6]/20 flex items-center justify-center text-[#3B82F6] font-bold text-xs">
                        {tenant.name[0]}
                     </div>
                     <div>
                        <p className="text-xs text-[#F1F5F9] font-medium">{tenant.name}</p>
                        <p className="text-[10px] text-[#94A3B8]">Bergabung pada {new Date(tenant.createdAt).toLocaleDateString("id-ID")}</p>
                     </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${tenant.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                    {tenant.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
