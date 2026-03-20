"use client";

import { redirect } from "next/navigation";
import { OwnerSidebar } from "@/components/layout/owner-sidebar";
import { useState, useEffect } from "react";
import { MobileHeader } from "@/components/layout/mobile-header";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.user?.role !== "owner") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0F1E]">
        <Loader2 className="w-8 h-8 animate-spin text-[#3B82F6]" />
      </div>
    );
  }

  if (!session || session.user.role !== "owner") {
    return null;
  }

  const userData = {
    nama: (session.user as any).nama,
    email: session.user.email || undefined,
  };

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-[#F1F5F9]">
      <MobileHeader 
        isOpen={isSidebarOpen} 
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        subtitle="Owner Panel"
      />

      <OwnerSidebar 
        user={userData} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Areas */}
      <main className="min-h-screen pt-20 md:pt-8 md:ml-64 p-4 md:p-8 transition-all duration-300">
        <div className="max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
