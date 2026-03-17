"use client";

import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from "recharts";
import { BarChart3, TrendingUp, DollarSign } from "lucide-react";
import { formatRupiah } from "@/lib/utils";

interface TenantChartsProps {
  data: any;
}

export default function TenantCharts({ data }: TenantChartsProps) {
  if (!data || data.length === 0) {
    return (
      <div className="glass-card p-6 flex items-center justify-center text-[#94A3B8]">
        Belum ada data tren untuk ditampilkan.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Sales Trend */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-[#F1F5F9] mb-6 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#3B82F6]" />
          Tren Pendapatan (7 Hari)
        </h3>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="tenantRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" stroke="#64748B" fontSize={10} tickFormatter={(val) => val.split('-').slice(1).reverse().join('/')} />
              <YAxis stroke="#64748B" fontSize={10} />
              <Tooltip 
                contentStyle={{ backgroundColor: "#0F172A", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#3B82F6" fillOpacity={1} fill="url(#tenantRev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Order Count Trend */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-[#F1F5F9] mb-6 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-emerald-500" />
          Volume Pesanan (7 Hari)
        </h3>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" stroke="#64748B" fontSize={10} tickFormatter={(val) => val.split('-').slice(1).reverse().join('/')} />
              <YAxis stroke="#64748B" fontSize={10} />
              <Tooltip 
                contentStyle={{ backgroundColor: "#0F172A", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
              />
              <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
