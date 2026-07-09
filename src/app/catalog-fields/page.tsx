"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import Link from "next/link";
import {
  Settings,
  Plus,
  Edit,
  Trash2,
  ArrowUp,
  ArrowDown,
  ToggleLeft,
  ToggleRight,
  Shield,
  Loader2,
  ArrowLeft,
  Info,
  Check,
  Sparkles,
  Save,
  X,
} from "lucide-react";

import { ConfirmModal } from "@/components/ui/confirm-modal";
import { CustomDropdown } from "@/components/ui/custom-dropdown";

type FieldType = "text" | "textarea" | "number" | "date" | "select" | "toggle" | "url" | "upload";

interface CatalogField {
  id: string;
  label: string;
  fieldKey: string;
  fieldType: FieldType;
  options: string[] | null;
  isRequired: boolean;
  isSystem: boolean;
  isActive: boolean;
  sortOrder: number;
}

interface FieldForm {
  label: string;
  fieldKey: string;
  fieldType: FieldType;
  optionsString: string;
  isRequired: boolean;
}

const initialForm: FieldForm = {
  label: "",
  fieldKey: "",
  fieldType: "text",
  optionsString: "",
  isRequired: false,
};

const typeLabels: Record<FieldType, string> = {
  text: "Teks Pendek (contoh: Merk, Lokasi)",
  textarea: "Teks Panjang / Paragraf (contoh: Catatan, Alamat)",
  number: "Angka / Nominal (contoh: Stok, Berat, Luas)",
  date: "Tanggal (contoh: Masa Berlaku)",
  select: "Pilihan Dropdown (contoh: Warna, Pilihan Kelas)",
  toggle: "Pilihan Ya / Tidak (contoh: Free Ongkir?)",
  url: "Tautan Web / Link (contoh: Link Video)",
  upload: "Unggahan Foto / Gambar",
};

export default function CatalogFieldsPage() {
  const [fields, setFields] = useState<CatalogField[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDrawer, setShowDrawer] = useState(false);
  const [editingField, setEditingField] = useState<CatalogField | null>(null);
  const [formData, setFormData] = useState<FieldForm>(initialForm);
  const [isSaving, setIsSaving] = useState(false);

  // Business Type Templates state
  const [profile, setProfile] = useState<any>(null);
  const [tenantTypes, setTenantTypes] = useState<any[]>([]);
  const [isUpdatingTemplate, setIsUpdatingTemplate] = useState(false);

  // Custom Template states
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateCatalogLabel, setNewTemplateCatalogLabel] = useState("");
  const [newTemplateOrderLabel, setNewTemplateOrderLabel] = useState("");
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  // --- Confirm Modal State ---
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title?: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    isDanger?: boolean;
  }>({
    isOpen: false,
    message: "",
    onConfirm: () => {},
  });

  const showConfirm = (options: {
    title?: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    isDanger?: boolean;
  }) => {
    setConfirmConfig({
      isOpen: true,
      ...options,
    });
  };

  const closeConfirm = () => {
    setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
  };

  useEffect(() => {
    fetchFields();
    fetchProfileAndTypes();
  }, []);

  const fetchProfileAndTypes = async () => {
    try {
      const [resProfile, resTypes] = await Promise.all([
        fetch("/api/profile"),
        fetch("/api/tenant-types"),
      ]);
      if (resProfile.ok && resTypes.ok) {
        const pData = await resProfile.json();
        const tData = await resTypes.json();
        setProfile(pData);
        setTenantTypes(tData);
      }
    } catch (error) {
      console.error("Gagal memuat template tipe bisnis:", error);
    }
  };

  const handleTemplateChange = async (newTypeId: string) => {
    if (!profile) return;
    if (profile.tenantTypeId === newTypeId) return;

    const selectedType = tenantTypes.find((t) => t.id === newTypeId);
    if (!selectedType) return;

    showConfirm({
      title: "Ubah Template Tipe Bisnis",
      message: `PERINGATAN: Mengubah template tipe bisnis ke '${selectedType.name}' akan mereset kolom kustom Anda yang ada dan menggantinya dengan kolom bawaan template baru. Apakah Anda yakin?`,
      confirmLabel: "Ubah Template",
      cancelLabel: "Batal",
      isDanger: true,
      onConfirm: async () => {
        try {
          setIsUpdatingTemplate(true);
          const res = await fetch("/api/profile", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...profile,
              tenantTypeId: newTypeId,
              catalogLabel: selectedType.catalogLabel,
              orderLabel: selectedType.orderLabel,
            }),
          });

          if (res.ok) {
            toast.success(`Template tipe bisnis berhasil diubah ke '${selectedType.name}'!`);
            setProfile((prev: any) => ({
              ...prev,
              tenantTypeId: newTypeId,
              catalogLabel: selectedType.catalogLabel,
              orderLabel: selectedType.orderLabel,
            }));
            
            if (typeof window !== "undefined") {
              window.dispatchEvent(new Event("profile-updated"));
            }

            await fetchFields();
          } else {
            toast.error("Gagal memperbarui template tipe bisnis.");
          }
        } catch {
          toast.error("Terjadi kesalahan.");
        } finally {
          setIsUpdatingTemplate(false);
        }
      }
    });
  };

  const handleSaveCustomTemplate = async () => {
    if (!newTemplateName.trim()) {
      toast.error("Nama template wajib diisi");
      return;
    }
    setIsSavingTemplate(true);
    try {
      const res = await fetch("/api/tenant-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTemplateName.trim(),
          catalogLabel: newTemplateCatalogLabel.trim() || (profile?.catalogLabel || "Produk"),
          orderLabel: newTemplateOrderLabel.trim() || (profile?.orderLabel || "Pesanan"),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`Template kustom "${data.name}" berhasil dibuat!`);
        setShowTemplateModal(false);
        setNewTemplateName("");
        setNewTemplateCatalogLabel("");
        setNewTemplateOrderLabel("");
        
        // Reload profiles & templates
        await fetchProfileAndTypes();
      } else {
        toast.error(data.error || "Gagal menyimpan template kustom.");
      }
    } catch {
      toast.error("Terjadi kesalahan.");
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const fetchFields = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/catalog-fields");
      const data = await res.json();
      if (res.ok) {
        setFields(data);
      } else {
        toast.error("Gagal memuat field: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      toast.error("Gagal menghubungkan ke server.");
    } finally {
      setLoading(false);
    }
  };

  const handleLabelChange = (val: string) => {
    // Auto-generate fieldKey in snake_case from Label if not editing
    if (!editingField) {
      const generatedKey = val
        .toLowerCase()
        .replace(/[^a-z0-9\s_]/g, "")
        .trim()
        .replace(/\s+/g, "_");
      setFormData((current) => ({
        ...current,
        label: val,
        fieldKey: generatedKey,
      }));
    } else {
      setFormData((current) => ({
        ...current,
        label: val,
      }));
    }
  };

  const handleOpenDrawer = (field?: CatalogField) => {
    if (field) {
      setEditingField(field);
      setFormData({
        label: field.label,
        fieldKey: field.fieldKey,
        fieldType: field.fieldType,
        optionsString: field.options ? field.options.join(", ") : "",
        isRequired: field.isRequired,
      });
    } else {
      setEditingField(null);
      setFormData(initialForm);
    }
    setShowDrawer(true);
  };

  const handleCloseDrawer = () => {
    setShowDrawer(false);
    setEditingField(null);
    setFormData(initialForm);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const url = editingField ? `/api/catalog-fields/${editingField.id}` : "/api/catalog-fields";
      const method = editingField ? "PUT" : "POST";

      // Parse options if select type
      let options: string[] | null = null;
      if (formData.fieldType === "select" && formData.optionsString.trim()) {
        options = formData.optionsString
          .split(",")
          .map((opt) => opt.trim())
          .filter((opt) => opt !== "");
      }

      const payload = {
        label: formData.label,
        fieldKey: formData.fieldKey,
        fieldType: formData.fieldType,
        isRequired: formData.isRequired,
        options,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(editingField ? "Field berhasil diperbarui" : "Field berhasil ditambahkan");
        fetchFields();
        handleCloseDrawer();
      } else {
        toast.error("Gagal menyimpan: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat menyimpan field.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (field: CatalogField) => {
    if (field.isSystem) return;
    try {
      const res = await fetch(`/api/catalog-fields/${field.id}/toggle`, {
        method: "PATCH",
      });
      if (res.ok) {
        toast.success(`Status field '${field.label}' diperbarui`);
        fetchFields();
      } else {
        const data = await res.json();
        toast.error("Gagal mengubah status: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat mengubah status.");
    }
  };

  const handleDelete = async (field: CatalogField) => {
    if (field.isSystem) return;
    showConfirm({
      title: "Hapus Kolom Informasi",
      message: `Yakin ingin menghapus kolom '${field.label}'? Data katalog yang terisi di kolom ini tidak akan tampil lagi.`,
      confirmLabel: "Hapus",
      cancelLabel: "Batal",
      isDanger: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/catalog-fields/${field.id}`, {
            method: "DELETE",
          });
          if (res.ok) {
            toast.success("Kolom informasi berhasil dihapus");
            fetchFields();
          } else {
            const data = await res.json();
            toast.error("Gagal menghapus: " + (data.error || "Unknown error"));
          }
        } catch (error) {
          toast.error("Terjadi kesalahan saat menghapus kolom.");
        }
      }
    });
  };

  const handleMove = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= fields.length) return;

    const currentField = fields[index];
    const targetField = fields[targetIndex];

    try {
      // Swapping sort orders in DB
      await fetch(`/api/catalog-fields/${currentField.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: targetField.sortOrder }),
      });

      await fetch(`/api/catalog-fields/${targetField.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: currentField.sortOrder }),
      });

      toast.success("Urutan field diperbarui");
      fetchFields();
    } catch (error) {
      toast.error("Gagal mengubah urutan field.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/products"
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[rgba(138,180,248,0.12)] text-[#93A8C7] hover:bg-[rgba(255,255,255,0.05)] hover:text-[#F1F5F9]"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <span className="section-kicker">Konfigurasi Formulir</span>
            <h1 className="font-display text-3xl font-semibold text-[#F1F5F9]">
              Atur Kolom Informasi
            </h1>
          </div>
        </div>
        <button
          onClick={() => handleOpenDrawer()}
          className="app-button-primary whitespace-nowrap"
        >
          <Plus className="h-4 w-4" />
          Tambah Kolom Informasi
        </button>
      </div>

      {/* Info Warning */}
      <div className="rounded-[26px] border border-blue-500/20 bg-blue-500/5 p-4 flex gap-3 text-sm text-[#93A8C7]">
        <Info className="h-5 w-5 text-[#56D6FF] shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-[#F1F5F9] mb-1">Panduan Pengaturan Formulir</p>
          <p>
            Kolom Utama (Nama, Harga, Status Aktif) adalah bawaan aplikasi yang wajib ada dan tidak dapat dihapus atau dinonaktifkan.
            Anda dapat menambahkan Kolom Informasi Tambahan sendiri sesuai jenis usaha Anda. Kolom yang aktif akan otomatis muncul di form input saat menambah/mengedit produk, dan informasinya akan otomatis digunakan oleh AI Chatbot saat melayani pelanggan.
          </p>
        </div>
      </div>

      {/* Template Tipe Bisnis Selection Gallery */}
      {tenantTypes.length > 0 && profile && (
        <div className="glass-card p-6 space-y-4">
          <div>
            <h2 className="font-display text-xl text-[#F1F5F9] font-bold">
              Pilih Template Tipe Bisnis
            </h2>
            <p className="text-xs text-[#93A8C7] mt-1">
              Pilih salah satu template di bawah untuk menyesuaikan nama menu dan kolom informasi bawaan secara otomatis.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pt-2">
            {tenantTypes.map((t) => {
              const isSelected = profile.tenantTypeId === t.id;
              const iconMap: Record<string, string> = {
                "Bisnis Umum": "👜",
                "Klinik": "🩺",
                "Travel": "✈️",
                "Properti": "🏢",
                "Pendidikan": "🎓"
              };
              const emoji = iconMap[t.name] || "📦";

              return (
                <div
                  key={t.id}
                  onClick={() => !isUpdatingTemplate && handleTemplateChange(t.id)}
                  className={`flex flex-col p-5 cursor-pointer rounded-2xl border transition-all duration-300 relative overflow-hidden group ${
                    isSelected
                      ? "bg-[#3B82F6]/10 border-[#3B82F6] shadow-[0_0_20px_rgba(59,130,246,0.15)]"
                      : "bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.1)]"
                  } ${isUpdatingTemplate ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {isSelected && (
                    <div className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-[#3B82F6] text-white shrink-0">
                      <Check className="w-3 h-3" />
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl shrink-0">{emoji}</span>
                    <div>
                      <h4 className="font-bold text-white text-sm leading-none">{t.name}</h4>
                      <span className="text-[9px] text-[#56D6FF] uppercase tracking-wider font-bold block mt-1">
                        {t.catalogLabel} &bull; {t.orderLabel}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5 mt-auto pt-3 border-t border-[rgba(255,255,255,0.04)]">
                    <p className="text-[9px] uppercase font-bold text-[#69809F] tracking-wide">Kolom Bawaan:</p>
                    <div className="flex flex-wrap gap-1">
                      {t.fieldTemplate && t.fieldTemplate.map((f: any, idx: number) => (
                        <span
                          key={idx}
                          className={`text-[9px] px-2 py-0.5 rounded-md border font-medium ${
                            f.isSystem
                              ? "bg-[#3B82F6]/5 border-[#3B82F6]/20 text-[#3B82F6]"
                              : "bg-white/5 border-white/5 text-[#93A8C7]"
                          }`}
                        >
                          {f.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Tombol Simpan Template Kustom */}
            <div
              onClick={() => {
                setNewTemplateCatalogLabel(profile?.catalogLabel || "Produk");
                setNewTemplateOrderLabel(profile?.orderLabel || "Pesanan");
                setShowTemplateModal(true);
              }}
              className="flex flex-col p-5 cursor-pointer rounded-2xl border border-dashed border-[#56D6FF]/20 bg-[#56D6FF]/5 hover:bg-[#56D6FF]/10 hover:border-[#56D6FF]/40 transition-all duration-300 items-center justify-center min-h-[140px] text-center group"
            >
              <Sparkles className="w-6 h-6 text-[#56D6FF] mb-2 group-hover:scale-110 transition-all" />
              <h4 className="font-bold text-[#56D6FF] text-sm">Buat Template Baru</h4>
              <p className="text-[10px] text-[#93A8C7] mt-1.5 max-w-[200px]">Buat template kustom baru dari susunan kolom aktif saat ini</p>
            </div>
          </div>
        </div>
      )}

      {/* Fields List */}
      <div className="glass-card overflow-hidden">
        <div className="border-b border-[rgba(255,255,255,0.08)] px-6 py-5">
          <h2 className="font-display text-xl text-[#F1F5F9]">
            Struktur Kolom Informasi
          </h2>
        </div>

        <div className="overflow-x-auto custom-scrollbar px-3 py-3">
          <table className="table-shell min-w-full">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.08)]">
                <th className="px-4 py-3 text-left">Nama Kolom</th>
                <th className="px-4 py-3 text-left">Kode Sistem (Key)</th>
                <th className="px-4 py-3 text-left">Format Kolom</th>
                <th className="px-4 py-3 text-left">Sifat Pengisian</th>
                <th className="px-4 py-3 text-left">Status Tampilan</th>
                <th className="px-4 py-3 text-center">Urutan</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse border-b border-[rgba(255,255,255,0.02)]">
                    <td className="px-4 py-4"><div className="h-4 bg-white/5 rounded w-28"></div></td>
                    <td className="px-4 py-4"><div className="h-4 bg-white/5 rounded w-20 font-mono"></div></td>
                    <td className="px-4 py-4"><div className="h-4 bg-white/5 rounded w-44"></div></td>
                    <td className="px-4 py-4"><div className="h-5 bg-white/5 rounded-full w-14"></div></td>
                    <td className="px-4 py-4"><div className="h-5 bg-white/5 rounded-full w-14"></div></td>
                    <td className="px-4 py-4 flex justify-center"><div className="h-4 bg-white/5 rounded w-8"></div></td>
                    <td className="px-4 py-4"><div className="flex justify-end gap-2"><div className="h-8 w-8 bg-white/5 rounded-lg"></div><div className="h-8 w-8 bg-white/5 rounded-lg"></div></div></td>
                  </tr>
                ))
              ) : fields.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-[#93A8C7]">
                    Belum ada kolom tambahan. Silakan klik "Tambah Kolom Informasi" untuk menambahkan.
                  </td>
                </tr>
              ) : (
                fields.map((field, index) => (
                  <tr
                    key={field.id}
                    className="border-b border-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.01)] transition-colors"
                  >
                    {/* Label */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {field.isSystem && <Shield className="h-4 w-4 text-[#56D6FF]" />}
                        <span className="font-semibold text-[#F1F5F9]">{field.label}</span>
                      </div>
                    </td>

                    {/* Key */}
                    <td className="px-4 py-4 text-xs font-mono text-[#93A8C7] whitespace-nowrap">
                      {field.fieldKey}
                    </td>

                    {/* Type */}
                    <td className="px-4 py-4 text-[#93A8C7] whitespace-nowrap">
                      <span className="text-sm">{typeLabels[field.fieldType] || field.fieldType}</span>
                      {field.options && (
                        <div className="text-[10px] text-[#69809F] mt-1">
                          Pilihan: {field.options.join(", ")}
                        </div>
                      )}
                    </td>

                    {/* Required */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                          field.isRequired
                            ? "bg-red-500/10 text-red-400 border border-red-500/20"
                            : "bg-gray-500/10 text-gray-400"
                        }`}
                      >
                        {field.isRequired ? "Wajib" : "Opsional"}
                      </span>
                    </td>

                    {/* Status Toggle */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      {field.isSystem ? (
                        <span className="text-xs text-[#56D6FF] font-semibold bg-[#56D6FF]/10 px-2 py-0.5 rounded-full">
                          Utama (Selalu Aktif)
                        </span>
                      ) : (
                        <button
                          onClick={() => handleToggleActive(field)}
                          className={`inline-flex items-center gap-1.5 transition-colors ${
                            field.isActive ? "text-[#4ADE80]" : "text-[#69809F]"
                          }`}
                        >
                          {field.isActive ? (
                            <ToggleRight className="h-5 w-5" />
                          ) : (
                            <ToggleLeft className="h-5 w-5" />
                          )}
                          <span className="text-[10px] font-bold uppercase">
                            {field.isActive ? "Aktif" : "Off"}
                          </span>
                        </button>
                      )}
                    </td>

                    {/* Reorder Arrows */}
                    <td className="px-4 py-4 text-center whitespace-nowrap">
                      <div className="inline-flex gap-1">
                        <button
                          onClick={() => handleMove(index, "up")}
                          disabled={index === 0}
                          className="p-1 rounded hover:bg-white/5 text-[#93A8C7] hover:text-[#F1F5F9] disabled:opacity-30 disabled:pointer-events-none"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleMove(index, "down")}
                          disabled={index === fields.length - 1}
                          className="p-1 rounded hover:bg-white/5 text-[#93A8C7] hover:text-[#F1F5F9] disabled:opacity-30 disabled:pointer-events-none"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenDrawer(field)}
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-[rgba(138,180,248,0.12)] text-[#93A8C7] transition-all hover:bg-[rgba(255,255,255,0.05)] hover:text-[#F1F5F9] hover:scale-105"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        {!field.isSystem && (
                          <button
                            onClick={() => handleDelete(field)}
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[rgba(255,107,122,0.12)] text-[#93A8C7] transition-all hover:bg-[rgba(255,107,122,0.08)] hover:text-[#FF9DA7] hover:scale-105"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-in Drawer Editor */}
      <div
        className={`fixed inset-0 z-50 transition-opacity ${
          showDrawer ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div className="absolute inset-0 bg-[rgba(2,8,15,0.78)] backdrop-blur-sm" onClick={handleCloseDrawer} />

        <div
          className={`drawer-shell absolute right-0 top-0 h-full w-full max-w-md border-l border-[rgba(138,180,248,0.12)] transition-transform duration-300 ${
            showDrawer ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="border-b border-[rgba(255,255,255,0.08)] px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-[#56D6FF]">
                    Kustomisasi Formulir
                  </p>
                  <h2 className="mt-2 font-display text-2xl text-[#F1F5F9]">
                    {editingField ? "Edit Kolom Informasi" : "Tambah Kolom Baru"}
                  </h2>
                </div>
                <button
                  onClick={handleCloseDrawer}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(138,180,248,0.12)] text-[#93A8C7] hover:bg-[rgba(255,255,255,0.05)]"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Form Fields */}
            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
              {/* Label */}
              <div>
                <label className="mb-2 block text-sm text-[#93A8C7]">Nama Kolom *</label>
                <input
                  type="text"
                  value={formData.label}
                  onChange={(e) => handleLabelChange(e.target.value)}
                  className="app-input"
                  placeholder="Contoh: Lokasi Unit, Durasi"
                  disabled={editingField?.isSystem}
                />
              </div>

              {/* Hidden fieldKey for new fields, read-only for edited fields */}
              {!editingField ? (
                <input
                  type="hidden"
                  value={formData.fieldKey}
                />
              ) : (
                <div>
                  <label className="mb-2 block text-sm text-[#69809F]">
                    Kode Sistem (Otomatis)
                  </label>
                  <input
                    type="text"
                    value={formData.fieldKey}
                    className="app-input font-mono opacity-50 bg-white/5 cursor-not-allowed text-xs"
                    disabled
                  />
                </div>
              )}

              {/* Field Type */}
              <div>
                <label className="mb-2 block text-sm text-[#93A8C7]">Format Kolom (Jenis Isi) *</label>
                <CustomDropdown
                  value={formData.fieldType}
                  onChange={(val) =>
                    setFormData((curr) => ({ ...curr, fieldType: val as FieldType }))
                  }
                  options={Object.entries(typeLabels).map(([val, lbl]) => ({
                    value: val,
                    label: lbl,
                  }))}
                  disabled={editingField?.isSystem}
                />
              </div>

              {/* Options String (for select type) */}
              {formData.fieldType === "select" && (
                <div>
                  <label className="mb-2 block text-sm text-[#93A8C7]">Pilihan Dropdown *</label>
                  <input
                    type="text"
                    value={formData.optionsString}
                    onChange={(e) => setFormData((curr) => ({ ...curr, optionsString: e.target.value }))}
                    className="app-input"
                    placeholder="Opsi 1, Opsi 2, Opsi 3"
                    disabled={editingField?.isSystem}
                  />
                  <p className="text-[10px] text-[#69809F] mt-1.5">
                    Pisahkan tiap pilihan dengan tanda koma (,). Contoh: Merah, Kuning, Hijau.
                  </p>
                </div>
              )}

              {/* Is Required (only for non-system) */}
              {!editingField?.isSystem && (
                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="isRequired"
                    checked={formData.isRequired}
                    onChange={(e) => setFormData((curr) => ({ ...curr, isRequired: e.target.checked }))}
                    className="h-4 w-4 rounded border-gray-700 bg-gray-900 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="isRequired" className="text-sm text-[#F1F5F9] cursor-pointer selection:bg-transparent">
                    Wajib diisi oleh admin/staf
                  </label>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex gap-3 border-t border-[rgba(255,255,255,0.08)] px-6 py-5">
              <button onClick={handleCloseDrawer} className="app-button-secondary flex-1">
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={!formData.label || !formData.fieldKey || isSaving}
                className="app-button-primary flex-1 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmLabel={confirmConfig.confirmLabel}
        cancelLabel={confirmConfig.cancelLabel}
        onConfirm={() => {
          confirmConfig.onConfirm();
          closeConfirm();
        }}
        onCancel={closeConfirm}
        isDanger={confirmConfig.isDanger}
      />

      {/* Custom Template Modal */}
      <CustomTemplateModal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        onSave={handleSaveCustomTemplate}
        name={newTemplateName}
        setName={setNewTemplateName}
        catalogLabel={newTemplateCatalogLabel}
        setCatalogLabel={setNewTemplateCatalogLabel}
        orderLabel={newTemplateOrderLabel}
        setOrderLabel={setNewTemplateOrderLabel}
        saving={isSavingTemplate}
      />
    </div>
  );
}

// ─── MODAL TEMPLATE KUSTOM ───────────────────────────────────────────────────
interface CustomTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  name: string;
  setName: (v: string) => void;
  catalogLabel: string;
  setCatalogLabel: (v: string) => void;
  orderLabel: string;
  setOrderLabel: (v: string) => void;
  saving: boolean;
}

function CustomTemplateModal({
  isOpen, onClose, onSave,
  name, setName,
  catalogLabel, setCatalogLabel,
  orderLabel, setOrderLabel,
  saving
}: CustomTemplateModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative z-10 w-full max-w-md p-6 space-y-6"
        style={{
          background: "linear-gradient(160deg, #0D1526 0%, #0A0F1E 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "24px",
          boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#56D6FF]/10 border border-[#56D6FF]/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#56D6FF]" />
            </div>
            <h2 className="text-[#F1F5F9] font-bold text-base">Buat Template Kustom</h2>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-[#94A3B8] hover:text-white transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-[#94A3B8] leading-relaxed">
          Simpan susunan kolom katalog Anda saat ini sebagai template baru. Anda dapat menerapkannya kembali kapan saja dari galeri tipe bisnis di atas.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-[#94A3B8] mb-1.5 font-semibold">Nama Template Kustom *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#0A0F1E] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-[#F1F5F9] placeholder-slate-600 focus:outline-none focus:border-[#3B82F6]"
              placeholder="Cth: Rental Mobil, Kursus Olahraga..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#94A3B8] mb-1.5 font-semibold">Nama Menu Katalog</label>
              <input
                type="text"
                value={catalogLabel}
                onChange={e => setCatalogLabel(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#0A0F1E] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-[#F1F5F9] placeholder-slate-600 focus:outline-none focus:border-[#3B82F6]"
                placeholder="Cth: Mobil, Jasa"
              />
            </div>
            <div>
              <label className="block text-xs text-[#94A3B8] mb-1.5 font-semibold">Nama Menu Pesanan</label>
              <input
                type="text"
                value={orderLabel}
                onChange={e => setOrderLabel(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#0A0F1E] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-[#F1F5F9] placeholder-slate-600 focus:outline-none focus:border-[#3B82F6]"
                placeholder="Cth: Booking, Order"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] text-[#94A3B8] hover:text-white text-xs font-semibold transition-all"
          >
            Batal
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {saving ? "Menyimpan..." : "Simpan Template"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
