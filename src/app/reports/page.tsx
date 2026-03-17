"use client";

import { useEffect, useState } from "react";
import { 
  TrendingUp, ShoppingCart, MessageSquare, DollarSign,
  Download, BarChart3, PieChart as PieChartIcon, FileText, FileSpreadsheet, FileJson,
  Loader2
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell 
} from "recharts";
import { formatRupiah } from "@/lib/utils";
import { exportToPDF, exportToExcel, exportToCSV } from "@/lib/export-utils";
import { toast } from "sonner";

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    fetchReports();
  }, [startDate, endDate]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (startDate) params.set("start", startDate);
      if (endDate) params.set("end", endDate);
      
      const res = await fetch(`/api/reports?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      toast.error("Gagal memuat laporan");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (type: "pdf" | "excel" | "csv") => {
    if (!data?.export?.orders) return;

    const exportConfig = {
      filename: `Report_Orders_${new Date().toISOString().split('T')[0]}`,
      title: "Laporan Pesanan Tenant - CS Velora",
      columns: ["ID", "Customer", "Product", "Amount", "Status", "Date"],
      rows: data.export.orders.map((o: any) => [
        o.id.substring(0, 8),
        o.fromName || o.fromNumber,
        o.produk,
        formatRupiah(o.totalHarga),
        o.status,
        new Date(o.createdAt).toLocaleString("id-ID")
      ])
    };

    if (type === "pdf") exportToPDF(exportConfig);
    else if (type === "excel") exportToExcel(exportConfig);
    else exportToCSV(exportConfig);
    
    toast.success(`Laporan ${type.toUpperCase()} berhasil diunduh`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-[#3B82F6] mb-4" />
        <p className="text-[#94A3B8]">Menyiapkan data laporan...</p>
      </div>
    );
  }

  const pieData = [
    { name: "Selesai", value: data.summary.orders.success },
    { name: "Pending", value: data.summary.orders.pending },
    { name: "Batal", value: data.summary.orders.cancelled },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      <section className="hero-panel px-6 py-7 md:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#F1F5F9]">Analisis Kinerja Bisnis</h1>
            <p className="text-[#94A3B8] text-sm mt-1">Pantau pertumbuhan dan konversi toko Anda</p>
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
      </section>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="metric-card p-5">
          <p className="text-xs uppercase tracking-wider text-[#94A3B8] mb-2 font-bold">Total Revenue</p>
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-[#F1F5F9]">{formatRupiah(data.summary.orders.revenue)}</h3>
            <div className="p-2 bg-emerald-500/10 rounded-lg"><DollarSign className="w-5 h-5 text-emerald-500" /></div>
          </div>
        </div>
        <div className="metric-card p-5">
          <p className="text-xs uppercase tracking-wider text-[#94A3B8] mb-2 font-bold">Total Orders</p>
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-[#F1F5F9]">{data.summary.orders.total}</h3>
            <div className="p-2 bg-blue-500/10 rounded-lg"><ShoppingCart className="w-5 h-5 text-blue-500" /></div>
          </div>
        </div>
        <div className="metric-card p-5">
          <p className="text-xs uppercase tracking-wider text-[#94A3B8] mb-2 font-bold">Chat Sessions</p>
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-[#F1F5F9]">{data.summary.chats.sessions}</h3>
            <div className="p-2 bg-purple-500/10 rounded-lg"><MessageSquare className="w-5 h-5 text-purple-500" /></div>
          </div>
        </div>
        <div className="metric-card p-5">
          <p className="text-xs uppercase tracking-wider text-[#94A3B8] mb-2 font-bold">Conv. Rate</p>
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-[#F1F5F9]">
              {data.summary.orders.total > 0 
                ? ((data.summary.orders.success / data.summary.orders.total) * 100).toFixed(1) 
                : 0}%
            </h3>
            <div className="p-2 bg-orange-500/10 rounded-lg"><TrendingUp className="w-5 h-5 text-orange-500" /></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend Chart */}
        <div className="glass-card p-6 min-h-[400px]">
          <h3 className="text-lg font-bold text-[#F1F5F9] mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#3B82F6]" />
            Tren Penjualan (7 Hari Terakhir)
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.trends}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="#64748B" fontSize={10} tickFormatter={(val) => val.split('-').slice(1).reverse().join('/')} />
                <YAxis stroke="#64748B" fontSize={10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#0F172A", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
                  labelStyle={{ color: "#94A3B8" }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#3B82F6" fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Distribution */}
        <div className="glass-card p-6 min-h-[400px]">
          <h3 className="text-lg font-bold text-[#F1F5F9] mb-6 flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-emerald-500" />
            Distribusi Status Order
          </h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: "#0F172A", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            {pieData.map((item, id) => (
              <div key={id} className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[id % COLORS.length] }} />
                <span className="text-[#94A3B8]">{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
