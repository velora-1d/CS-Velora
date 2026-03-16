import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default function WhatsAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
