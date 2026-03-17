import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { OwnerSidebar } from "@/components/layout/owner-sidebar";

export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user || session.user.role !== "owner") {
    redirect("/dashboard");
  }

  const userData = {
    nama: (session.user as any).nama,
    email: session.user.email || undefined,
  };

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-[#F1F5F9] flex">
      <OwnerSidebar user={userData} />

      {/* Main Content Areas */}
      <main className="flex-1 overflow-x-hidden p-8">
        {children}
      </main>
    </div>
  );
}
