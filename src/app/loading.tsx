import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#06111f] relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#56D6FF] opacity-[0.03] blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#9D8CFF] opacity-[0.03] blur-[120px]" />
      
      <div className="relative z-10 flex flex-col items-center gap-6">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-[#56D6FF] to-[#67A7FF] opacity-20 animate-pulse" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#56D6FF]" />
          </div>
        </div>
        
        <div className="flex flex-col items-center gap-2">
          <h2 className="text-xl font-display font-bold text-[#F1F5F9] tracking-tight">Velora ID</h2>
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[#56D6FF] animate-bounce [animation-delay:-0.3s]" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#67A7FF] animate-bounce [animation-delay:-0.15s]" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#9D8CFF] animate-bounce" />
          </div>
        </div>
      </div>
    </div>
  );
}
