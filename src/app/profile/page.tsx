"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Store,
  Save,
  Loader2,
  ExternalLink,
  ShoppingBag,
} from "lucide-react";

type ProfileData = {
  namaToko: string;
  deskripsi: string;
  logoUrl: string;
  linkShopee: string;
  linkTiktok: string;
  waNumber: string;
  waProvider: string;
  paket: string;
  pakasirProjectSlug: string;
  pakasirApiKey: string;
};

const defaults: ProfileData = {
  namaToko: "",
  deskripsi: "",
  logoUrl: "",
  linkShopee: "",
  linkTiktok: "",
  waNumber: "",
  waProvider: "",
  paket: "",
  pakasirProjectSlug: "",
  pakasirApiKey: "",
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData>(defaults);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/profile");
      const data = await res.json();
      if (res.ok) setProfile({ ...defaults, ...data });
      else toast.error("Gagal memuat profil.");
    } catch {
      toast.error("Gagal memuat data profil.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile.namaToko.trim()) {
      toast.error("Nama toko wajib diisi.");
      return;
    }
    try {
      setIsSaving(true);
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (res.ok) {
        toast.success("Profil toko berhasil diperbarui!");
      } else {
        const data = await res.json();
        toast.error("Gagal menyimpan: " + (data.error || "Unknown error"));
      }
    } catch {
      toast.error("Gagal menyimpan profil.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[#93A8C7]">
        <Loader2 className="h-10 w-10 animate-spin mb-4 text-[#56D6FF]" />
        <p>Memuat profil toko...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="hero-panel px-6 py-7 md:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <span className="section-kicker">Store identity</span>
            <h1 className="mt-5 font-display text-4xl font-semibold text-[#F1F5F9] md:text-5xl">
              Profil toko yang dikenalkan bot ke pelanggan.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-[#93A8C7] md:text-base">
              Informasi ini otomatis di-inject ke knowledge base AI saat bot merespons pertanyaan tentang toko.
            </p>
          </div>
          <div className="panel-shell p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-[#56D6FF]">Store snapshot</p>
            <div className="mt-5 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[linear-gradient(145deg,rgba(86,214,255,0.18),rgba(103,167,255,0.06))]">
                <Store className="h-6 w-6 text-[#56D6FF]" />
              </div>
              <div>
                <p className="font-display text-2xl text-[#F1F5F9]">{profile.namaToko || "—"}</p>
                <p className="text-sm text-[#93A8C7]">Paket {profile.paket?.toUpperCase() || "—"} • {profile.waProvider?.toUpperCase() || "—"}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(255,255,255,0.05)] text-[#67A7FF]">
              <Store className="h-5 w-5" />
            </div>
            <h2 className="font-display text-xl text-[#F1F5F9]">Identitas Toko</h2>
          </div>
          <div>
            <label className="block text-sm text-[#93A8C7] mb-2">Nama Toko *</label>
            <input type="text" value={profile.namaToko} onChange={(e) => setProfile((c) => ({ ...c, namaToko: e.target.value }))} className="app-input" placeholder="Nama bisnis Anda" />
          </div>
          <div>
            <label className="block text-sm text-[#93A8C7] mb-2">Deskripsi</label>
            <textarea value={profile.deskripsi || ""} onChange={(e) => setProfile((c) => ({ ...c, deskripsi: e.target.value }))} rows={4} className="app-input resize-none" placeholder="Deskripsi singkat tentang toko Anda..." />
          </div>
        </div>

        <div className="glass-card p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(255,255,255,0.05)] text-[#FFBF69]">
              <ExternalLink className="h-5 w-5" />
            </div>
            <h2 className="font-display text-xl text-[#F1F5F9]">Link Marketplace</h2>
          </div>
          <div>
            <label className="block text-sm text-[#93A8C7] mb-2">Link Shopee</label>
            <input type="url" value={profile.linkShopee || ""} onChange={(e) => setProfile((c) => ({ ...c, linkShopee: e.target.value }))} className="app-input" placeholder="https://shopee.co.id/yourstorename" />
          </div>
          <div>
            <label className="block text-sm text-[#93A8C7] mb-2">Link TikTok Shop</label>
            <input type="url" value={profile.linkTiktok || ""} onChange={(e) => setProfile((c) => ({ ...c, linkTiktok: e.target.value }))} className="app-input" placeholder="https://tiktok.com/@yourstorename" />
          </div>
          <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4">
            <div className="flex items-center gap-3">
              <ShoppingBag className="h-5 w-5 text-[#93A8C7]" />
              <div>
                <p className="text-sm text-[#F1F5F9]">WhatsApp: {profile.waNumber || "—"}</p>
                <p className="text-xs text-[#69809F]">Provider: {profile.waProvider?.toUpperCase() || "—"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pakasir Payment Gateway Settings */}
        <div className="glass-card p-6 space-y-5 lg:col-span-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(255,255,255,0.05)] text-[#4ADE80]">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-xl text-[#F1F5F9]">Gateway Pembayaran (Pakasir)</h2>
              <p className="text-xs text-[#93A8C7] mt-1">Isi data ini jika Anda menggunakan Pakasir sebagai payment gateway otomatis. Jika kosong, pembayaran manual akan digunakan.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-[#93A8C7] mb-2">Pakasir Project Slug</label>
              <input type="text" value={profile.pakasirProjectSlug || ""} onChange={(e) => setProfile((c) => ({ ...c, pakasirProjectSlug: e.target.value }))} className="app-input" placeholder="contoh: velora-id" />
            </div>
            <div>
              <label className="block text-sm text-[#93A8C7] mb-2">Pakasir API Key</label>
              <input type="text" value={profile.pakasirApiKey || ""} onChange={(e) => setProfile((c) => ({ ...c, pakasirApiKey: e.target.value }))} className="app-input" placeholder="pk_..." />
            </div>
          </div>
        </div>
      </div>

      <button onClick={handleSave} disabled={isSaving} className="app-button-primary w-full py-4 text-base disabled:cursor-not-allowed disabled:opacity-50">
        {isSaving ? (
          <><Loader2 className="h-5 w-5 animate-spin" /> Menyimpan...</>
        ) : (
          <><Save className="h-5 w-5" /> Simpan Profil</>
        )}
      </button>
    </div>
  );
}
