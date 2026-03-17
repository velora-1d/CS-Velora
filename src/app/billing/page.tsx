import { auth } from "@/auth";
import { db } from "@/lib/db";
import { tenants, ownerPaymentInfo } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import TenantBillingPage from "./BillingClient";

export const metadata = {
  title: "Billing & Langganan - CS Velora",
  description: "Kelola tagihan dan langganan Anda",
};

export default async function BillingPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Admin dan CS tak berhak masuk billing
  if (session.user.role !== "tenant" && session.user.role !== "owner") {
    redirect("/dashboard");
  }

  // Jika owner test akses
  const tenantId = session.user.tenantId || "owner-bypass";

  // Cek apakah tenantId adalah UUID yang valid (v4)
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tenantId);
  
  let tenantData = null;
  if (isUuid) {
    tenantData = await db.query.tenants.findFirst({
      where: eq(tenants.id, tenantId),
    });
  }

  if (!tenantData && session.user.role !== "owner") {
    redirect("/login");
  }

  // Ambil data metode pembayaran dari owner
  const paymentMethods = await db.query.ownerPaymentInfo.findMany();

  return (
    <TenantBillingPage
      tenant={tenantData || { status: 'active', paket: 'pro', maxWaAccounts: 999 }}
      paymentMethods={paymentMethods}
      isOwner={session.user.role === "owner"}
    />
  );
}
