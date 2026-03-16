import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { tenants } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Bypass for owner testing the dashboard
  if (session.user.role !== "owner") {
    const tenantId = session.user.tenantId;

    if (!tenantId) {
      redirect("/login");
    }

    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, tenantId),
      columns: { id: true, status: true, trialEndsAt: true },
    });

    if (!tenant) {
      redirect("/login");
    }

    let currentStatus = tenant.status;

    // Check trial expiration
    if (currentStatus === "trial" && tenant.trialEndsAt && new Date() > new Date(tenant.trialEndsAt)) {
      currentStatus = "expired";
      // Update the DB asynchronously (fire and forget is fine here, or await it)
      await db.update(tenants).set({ status: "expired" }).where(eq(tenants.id, tenant.id));
    }

    if (currentStatus === "expired" || currentStatus === "suspended") {
      redirect("/expired");
    }
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
