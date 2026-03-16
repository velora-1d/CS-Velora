export default function OwnerDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-[#F1F5F9] mb-6">Dashboard Owner</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-card p-6">
          <p className="text-[#94A3B8] text-sm mb-2">Total Tenant Aktif</p>
          <div className="text-3xl font-bold text-[#F1F5F9]">-</div>
        </div>
        <div className="glass-card p-6">
          <p className="text-[#94A3B8] text-sm mb-2">Total Pendapatan (Bulan ini)</p>
          <div className="text-3xl font-bold text-[#3B82F6]">Rp -</div>
        </div>
        <div className="glass-card p-6">
          <p className="text-[#94A3B8] text-sm mb-2">Tenant Trial</p>
          <div className="text-3xl font-bold text-[#EAB308]">-</div>
        </div>
      </div>

      <div className="glass-card p-6">
        <h2 className="text-[#F1F5F9] font-medium mb-4">Aktivitas Terbaru</h2>
        <div className="text-[#94A3B8] text-sm text-center py-8">
          Belum ada aktivitas
        </div>
      </div>
    </div>
  );
}
