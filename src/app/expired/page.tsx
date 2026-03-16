import Link from "next/link";
import { AlertCircle, CreditCard, LogOut } from "lucide-react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { tenants } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function ExpiredPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Allow owner to bypass
  if (session.user.role === "owner") {
    redirect("/owner/dashboard");
  }

  // Check current tenant status
  const tenantId = session.user.tenantId;
  if (!tenantId) {
    redirect("/login");
  }

  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, tenantId),
  });

  if (!tenant) {
    redirect("/login");
  }

  // If tenant is actually active/trial, redirect back to dashboard
  if (tenant.status === "active" || tenant.status === "trial") {
    redirect("/dashboard");
  }

  const isSuspended = tenant.status === "suspended";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0F1E] p-4">
      <div className="w-full max-w-lg glass-card p-10 text-center">
        <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-10 h-10" />
        </div>
        
        <h1 className="text-3xl font-bold text-[#F1F5F9] mb-4">
          {isSuspended ? "Akun Anda Ditangguhkan" : "Masa Aktif Berakhir"}
        </h1>
        
        <div className="text-[#94A3B8] mb-8 space-y-4">
          {isSuspended ? (
            <>
              <p>Mohon maaf, akses akun Anda saat ini ditangguhkan oleh Admin (Owner).</p>
              {tenant.suspendReason && (
                <div className="bg-[#0A0F1E] p-4 rounded-lg border border-[rgba(255,255,255,0.05)] text-left">
                  <span className="text-sm text-[#F1F5F9] font-medium block mb-1">Alasan Penangguhan:</span>
                  <span className="text-sm">{tenant.suspendReason}</span>
                </div>
              )}
              <p>Silakan hubungi administrator untuk informasi lebih lanjut.</p>
            </>
          ) : (
            <>
              <p>Masa aktif layanan Velora CS Chatbot untuk toko <strong>{tenant.namaToko}</strong> telah berakhir.</p>
              <p>Untuk melanjutkan menggunakan semua fitur dan layanan kami, silakan perpanjang paket langganan Anda.</p>
            </>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {!isSuspended && (
            <Link
              href="/billing"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium rounded-lg transition-colors"
            >
              <CreditCard className="w-5 h-5" />
              Perpanjang Paket
            </Link>
          )}
          
          <Link
            href="/api/auth/signout"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-[#F1F5F9] font-medium rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Keluar
          </Link>
        </div>
      </div>
    </div>
  );
}
