"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import Link from "next/link";
import {
  Package,
  Plus,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Boxes,
  Loader2,
  Settings,
  FileText,
  Upload,
  X,
  Save,
  Sparkles,
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

interface CatalogItem {
  id: string;
  nama: string;
  harga: number | null;
  aktif: boolean;
  data: Record<string, unknown>;
  createdAt: string;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface TenantType {
  id: string;
  key: string;
  name: string;
  catalogLabel: string;
  orderLabel: string;
}

export default function CatalogItemsPage() {
  const [catalogLabel, setCatalogLabel] = useState("Produk");
  const [fields, setFields] = useState<CatalogField[]>([]);
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState<"all" | "true" | "false">("all");
  const [page, setPage] = useState(1);
  const [showDrawer, setShowDrawer] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  
  // Dynamic form state maps fieldKey to its value
  const [formValues, setFormValues] = useState<Record<string, unknown>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Tenant type states
  const [tenantTypes, setTenantTypes] = useState<TenantType[]>([]);
  const [tenantTypeId, setTenantTypeId] = useState("");
  const [savingType, setSavingType] = useState(false);

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
    fetchProfile();
    fetchFields();
    fetchTenantTypes();
  }, []);

  // Fetch catalog items when search, filters, or page changes
  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filterActive, page]);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/profile");
      const data = await res.json();
      if (res.ok) {
        if (data.catalogLabel) setCatalogLabel(data.catalogLabel);
        if (data.tenantTypeId) setTenantTypeId(data.tenantTypeId);
      }
    } catch {
      console.error("Gagal memuat profil tenant");
    }
  };

  const fetchTenantTypes = async () => {
    try {
      const res = await fetch("/api/tenant-types");
      if (res.ok) {
        const data = await res.json();
        setTenantTypes(data);
      }
    } catch {
      console.error("Gagal memuat tipe bisnis");
    }
  };

  const handleChangeTenantType = async (newTypeId: string) => {
    if (!newTypeId || newTypeId === tenantTypeId) return;
    const selectedType = tenantTypes.find(t => t.id === newTypeId);
    if (!selectedType) return;

    showConfirm({
      title: "Ubah Template Bisnis",
      message: `Ubah ke "${selectedType.name}"? Field katalog kustom Anda akan direset sesuai template baru.`,
      confirmLabel: "Ya, Ubah",
      cancelLabel: "Batal",
      isDanger: true,
      onConfirm: async () => {
        setSavingType(true);
        try {
          const profileRes = await fetch("/api/profile");
          const profileData = await profileRes.json();

          const res = await fetch("/api/profile", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...profileData,
              tenantTypeId: newTypeId,
              catalogLabel: selectedType.catalogLabel,
              orderLabel: selectedType.orderLabel,
            }),
          });

          if (res.ok) {
            setTenantTypeId(newTypeId);
            setCatalogLabel(selectedType.catalogLabel);
            await fetchFields();
            toast.success(`Template "${selectedType.name}" berhasil diterapkan!`);
            window.dispatchEvent(new Event("profile-updated"));
          } else {
            const err = await res.json();
            toast.error(err.error || "Gagal mengubah template bisnis.");
          }
        } catch {
          toast.error("Terjadi kesalahan.");
        } finally {
          setSavingType(false);
        }
      },
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
          catalogLabel: newTemplateCatalogLabel.trim() || "Produk",
          orderLabel: newTemplateOrderLabel.trim() || "Pesanan",
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`Template kustom "${data.name}" berhasil dibuat!`);
        setShowTemplateModal(false);
        setNewTemplateName("");
        setNewTemplateCatalogLabel("");
        setNewTemplateOrderLabel("");
        // Reload template types
        await fetchTenantTypes();
        // Set active template to this new one
        setTenantTypeId(data.id);
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
      const res = await fetch("/api/catalog-fields");
      const data = await res.json();
      if (res.ok) {
        // Filter out inactive fields for form layout, but keep them for reference if needed
        setFields(data);
      } else {
        toast.error("Gagal memuat field katalog: " + (data.error || "Unknown error"));
      }
    } catch {
      toast.error("Gagal memuat konfigurasi field.");
    }
  };

  const fetchItems = async () => {
    try {
      setLoading(true);
      const activeFilterQuery = filterActive !== "all" ? `&aktif=${filterActive}` : "";
      const res = await fetch(
        `/api/catalog-items?search=${encodeURIComponent(search)}&page=${page}&limit=10${activeFilterQuery}`
      );
      const data = await res.json();
      if (res.ok) {
        setItems(data.items || []);
        if (data.pagination) {
          setPagination(data.pagination);
        }
      } else {
        toast.error("Gagal memuat item katalog: " + (data.error || "Unknown error"));
      }
    } catch {
      toast.error("Gagal memuat item katalog.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDrawer = (item?: CatalogItem) => {
    const defaultVals: Record<string, unknown> = {};

    // Get active fields to populate form defaults
    const activeFields = fields.filter((f) => f.isActive);

    activeFields.forEach((field) => {
      if (field.fieldType === "toggle") {
        defaultVals[field.fieldKey] = false;
      } else {
        defaultVals[field.fieldKey] = "";
      }
    });

    if (item) {
      setEditingItem(item);
      // Map system columns
      defaultVals["nama"] = item.nama;
      defaultVals["harga"] = item.harga !== null ? item.harga.toString() : "";
      defaultVals["aktif"] = item.aktif;
      // Map custom json values
      activeFields.forEach((field) => {
        if (!field.isSystem) {
          const val = item.data[field.fieldKey];
          defaultVals[field.fieldKey] = val !== undefined && val !== null ? val : "";
        }
      });
      setFormValues(defaultVals);
    } else {
      setEditingItem(null);
      // Initialize new form
      activeFields.forEach((field) => {
        if (field.fieldType === "toggle") {
          defaultVals[field.fieldKey] = field.fieldKey === "aktif" ? true : false;
        } else if (field.fieldKey === "harga") {
          defaultVals[field.fieldKey] = "";
        } else {
          defaultVals[field.fieldKey] = "";
        }
      });
      setFormValues(defaultVals);
    }

    setShowDrawer(true);
  };

  const handleCloseDrawer = () => {
    setShowDrawer(false);
    setEditingItem(null);
    setFormValues({});
  };

  const handleInputChange = (fieldKey: string, val: unknown) => {
    setFormValues((curr) => ({
      ...curr,
      [fieldKey]: val,
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const url = editingItem ? `/api/catalog-items/${editingItem.id}` : "/api/catalog-items";
      const method = editingItem ? "PUT" : "POST";

      // Form validation before sending
      const activeFields = fields.filter((f) => f.isActive);
      for (const field of activeFields) {
        const val = formValues[field.fieldKey];
        const isEmpty =
          val === undefined ||
          val === null ||
          (typeof val === "string" && val.trim() === "");

        if (field.isRequired && isEmpty) {
          toast.error(`Field '${field.label}' wajib diisi`);
          setIsSaving(false);
          return;
        }
      }

      // Format payload (the validator handles nesting in 'data' column, but we can pass a flat object)
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formValues),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(editingItem ? `${catalogLabel} diperbarui` : `${catalogLabel} ditambahkan`);
        fetchItems();
        handleCloseDrawer();
      } else {
        toast.error("Gagal menyimpan: " + (data.error || "Unknown error"));
      }
    } catch {
      toast.error(`Gagal menyimpan ${catalogLabel.toLowerCase()}.`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      const res = await fetch(`/api/catalog-items/${id}/toggle`, {
        method: "PATCH",
      });
      if (res.ok) {
        toast.success("Status item diperbarui");
        fetchItems();
      } else {
        const data = await res.json();
        toast.error("Gagal mengubah status: " + (data.error || "Unknown error"));
      }
    } catch {
      toast.error("Terjadi kesalahan saat mengubah status.");
    }
  };

  const handleDelete = async (id: string) => {
    showConfirm({
      title: `Hapus ${catalogLabel}`,
      message: `Yakin ingin menghapus ${catalogLabel.toLowerCase()} ini?`,
      confirmLabel: "Hapus",
      cancelLabel: "Batal",
      isDanger: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/catalog-items/${id}`, {
            method: "DELETE",
          });
          if (res.ok) {
            toast.success("Item berhasil dihapus");
            fetchItems();
          } else {
            const data = await res.json();
            toast.error("Gagal menghapus: " + (data.error || "Unknown error"));
          }
        } catch {
          toast.error("Terjadi kesalahan saat menghapus.");
        }
      }
    });
  };

  // Determine important fields to show in the table columns (excluding system fields)
  // Let's show up to 2 active custom fields.
  const activeCustomFields = fields.filter((f) => !f.isSystem && f.isActive && f.fieldType !== "upload").slice(0, 2);
  const isHargaActive = fields.some((f) => f.fieldKey === "harga" && f.isActive);
  const isStatusActive = fields.some((f) => f.fieldKey === "aktif" && f.isActive);
  // Find if there's any image upload field to use as thumbnail
  const imageUploadField = fields.find((f) => f.isActive && f.fieldType === "upload" && 
    (f.fieldKey === "gambar" || f.fieldKey === "foto" || f.fieldKey === "image" || f.fieldKey === "thumbnail"
      || f.label.toLowerCase().includes("gambar") || f.label.toLowerCase().includes("foto")
    ));

  // Statistics counters
  const totalItemsCount = pagination.total;
  const customFieldsCount = fields.filter((f) => !f.isSystem && f.isActive).length;

  const metricCards = [
    {
      label: `Total ${catalogLabel}`,
      value: totalItemsCount,
      icon: Boxes,
      color: "text-[#56D6FF]",
      bg: "bg-[#56D6FF]/10",
    },
    {
      label: "Kolom Tambahan Aktif",
      value: customFieldsCount,
      icon: Settings,
      color: "text-[#4ADE80]",
      bg: "bg-[#4ADE80]/10",
    },
    {
      label: "Format Dinamis",
      value: fields.length,
      icon: FileText,
      color: "text-[#FFBF69]",
      bg: "bg-[#FFBF69]/10",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <section className="hero-panel relative overflow-hidden px-6 py-4 rounded-2xl">
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <span className="section-kicker">Katalog Bisnis</span>
            <h1 className="font-display text-xl font-bold tracking-tight text-[#F1F5F9] mt-1">
              Pengaturan {catalogLabel} Anda
            </h1>
            <p className="text-xs text-[#93A8C7]">
              Kelola katalog bisnis secara dinamis. Tambahkan kolom kustom untuk melatih asisten AI Anda.
            </p>
          </div>
          
          <div className="flex items-center gap-3 shrink-0 bg-white/3 border border-white/5 rounded-xl p-2.5">
            <div className="px-3 border-r border-white/10 text-center">
              <p className="text-[10px] uppercase tracking-wider text-[#69809F]">Total {catalogLabel}</p>
              <p className="text-sm font-bold text-[#56D6FF] mt-0.5">{totalItemsCount}</p>
            </div>
            <div className="px-3 border-r border-white/10 text-center">
              <p className="text-[10px] uppercase tracking-wider text-[#69809F]">Kolom Kustom</p>
              <p className="text-sm font-bold text-[#4ADE80] mt-0.5">{customFieldsCount}</p>
            </div>
            <div className="px-3 text-center">
              <p className="text-[10px] uppercase tracking-wider text-[#69809F]">Format</p>
              <p className="text-sm font-bold text-[#FFBF69] mt-0.5">{fields.length}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Template Bisnis Selector */}
      <div className="glass-card !overflow-visible z-30 relative px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#56D6FF]/10 border border-[#56D6FF]/20 flex items-center justify-center shrink-0">
            <Settings className="w-4 h-4 text-[#56D6FF]" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#56D6FF] uppercase tracking-wider">Template Bisnis</p>
            <p className="text-[11px] text-[#64748B] mt-0.5">Pilih template sesuai jenis bisnis Anda — field katalog akan disesuaikan otomatis</p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto min-w-[340px]">
          <CustomDropdown
            value={tenantTypeId}
            onChange={handleChangeTenantType}
            options={[
              { value: "", label: savingType ? "Mengubah template..." : "Pilih Template Bisnis..." },
              ...tenantTypes.map(t => ({ value: t.id, label: t.name })),
            ]}
            className="flex-1"
          />
          {savingType && <Loader2 className="w-4 h-4 animate-spin text-[#56D6FF] shrink-0" />}
          
          <button
            type="button"
            onClick={() => {
              setNewTemplateCatalogLabel(catalogLabel);
              setNewTemplateOrderLabel("Pesanan");
              setShowTemplateModal(true);
            }}
            className="px-3.5 py-2.5 bg-[#56D6FF]/10 hover:bg-[#56D6FF]/20 border border-[#56D6FF]/20 text-[#56D6FF] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
            title="Simpan susunan kolom saat ini sebagai template kustom"
          >
            <Sparkles className="w-3.5 h-3.5" />
            + Template Kustom
          </button>
        </div>
      </div>

      {/* Filter and Configuration Row */}
      <div className="glass-card p-5 md:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[#56D6FF]">
              Filter & Konfigurasi
            </p>
            <p className="mt-2 text-sm text-[#93A8C7]">
              Cari {catalogLabel.toLowerCase()} atau ubah struktur formulir input.
            </p>
          </div>
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative min-w-[260px]">
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder={`Cari nama ${catalogLabel.toLowerCase()}...`}
                className="app-input"
              />
            </div>
            <CustomDropdown
              value={filterActive}
              onChange={(val) => {
                setFilterActive(val as "all" | "true" | "false");
                setPage(1);
              }}
              options={[
                { value: "all", label: "Semua Status" },
                { value: "true", label: "Aktif" },
                { value: "false", label: "Nonaktif" },
              ]}
              className="min-w-[190px]"
            />
            <Link href="/catalog-fields" className="app-button-secondary whitespace-nowrap flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Kustomisasi Formulir
            </Link>
            <button
              onClick={() => handleOpenDrawer()}
              className="app-button-primary whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              Tambah {catalogLabel}
            </button>
          </div>
        </div>
      </div>

      {/* Catalog Table */}
      <div className="glass-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[#56D6FF]">
              {catalogLabel} Matrix
            </p>
            <h2 className="mt-2 font-display text-2xl text-[#F1F5F9]">
              Daftar {catalogLabel}
            </h2>
          </div>
          <span className="status-pill bg-[#67A7FF]/10 text-[#67A7FF]">
            {pagination.total} item ditemukan
          </span>
        </div>

        <div className="overflow-x-auto custom-scrollbar px-3 py-3">
          <table className="table-shell min-w-full">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.08)]">
                <th className="px-4 py-3 text-left whitespace-nowrap">{catalogLabel}</th>
                {isHargaActive && <th className="px-4 py-3 text-left whitespace-nowrap">Harga</th>}
                {activeCustomFields.map((field) => (
                  <th key={field.id} className="px-4 py-3 text-left whitespace-nowrap">
                    {field.label}
                  </th>
                ))}
                {isStatusActive && <th className="px-4 py-3 text-left whitespace-nowrap">Status</th>}
                <th className="px-4 py-3 text-right whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse border-b border-[rgba(255,255,255,0.02)]">
                    <td className="px-4 py-4">
                      <div className="h-4 bg-white/5 rounded w-36 mb-2"></div>
                      <div className="h-3 bg-white/5 rounded w-24"></div>
                    </td>
                    {activeCustomFields.map((f) => (
                      <td key={f.id} className="px-4 py-4">
                        <div className="h-4 bg-white/5 rounded w-28"></div>
                      </td>
                    ))}
                    {isHargaActive && (
                      <td className="px-4 py-4">
                        <div className="h-4 bg-white/5 rounded w-20"></div>
                      </td>
                    )}
                    {isStatusActive && (
                      <td className="px-4 py-4">
                        <div className="h-5 bg-white/5 rounded-full w-14"></div>
                      </td>
                    )}
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <div className="h-8 w-8 bg-white/5 rounded-lg"></div>
                        <div className="h-8 w-8 bg-white/5 rounded-lg"></div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={(isHargaActive ? 1 : 0) + (isStatusActive ? 1 : 0) + 2 + activeCustomFields.length} className="px-4 py-16 text-center text-[#93A8C7]">
                    Tidak ada item yang cocok dengan filter saat ini.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.02)] transition-colors"
                  >
                    {/* Item Name & Image Thumbnail */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(255,255,255,0.05)] text-[#93A8C7] overflow-hidden shrink-0">
                          {imageUploadField && item.data[imageUploadField.fieldKey] && 
                            String(item.data[imageUploadField.fieldKey]).match(/\.(jpeg|jpg|gif|png|webp|svg)/i) ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img 
                              src={String(item.data[imageUploadField.fieldKey])} 
                              alt={item.nama}
                              className="w-full h-full object-cover"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                          ) : (
                            <Package className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-[#F1F5F9]">{item.nama}</p>
                          <p className="mt-1 text-xs text-[#69809F]">
                            ID: {item.id.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Price */}
                    {isHargaActive && (
                      <td className="px-4 py-4 text-[#F1F5F9] whitespace-nowrap">
                        <span className="font-semibold">
                          {item.harga !== null ? `Rp ${item.harga.toLocaleString("id-ID")}` : "-"}
                        </span>
                      </td>
                    )}

                    {/* Custom Fields */}
                    {activeCustomFields.map((field) => {
                      const val = item.data[field.fieldKey];
                      return (
                        <td key={field.id} className="px-4 py-4 text-[#93A8C7] whitespace-nowrap text-sm">
                          {val === true ? (
                            <span className="text-[#4ADE80] font-bold">Ya</span>
                          ) : val === false ? (
                            <span className="text-red-400 font-bold">Tidak</span>
                          ) : val !== undefined && val !== null && val !== "" ? (
                            String(val)
                          ) : (
                            "-"
                          )}
                        </td>
                      );
                    })}

                    {/* Active Status */}
                    {isStatusActive && (
                      <td className="px-4 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleActive(item.id)}
                          className={`inline-flex items-center gap-2 transition-colors ${
                            item.aktif ? "text-[#4ADE80]" : "text-[#69809F]"
                          }`}
                        >
                          {item.aktif ? (
                            <ToggleRight className="h-5 w-5" />
                          ) : (
                            <ToggleLeft className="h-5 w-5" />
                          )}
                          <span className="text-[10px] font-bold uppercase tracking-wider">
                            {item.aktif ? "Aktif" : "Off"}
                          </span>
                        </button>
                      </td>
                    )}

                    {/* Actions */}
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenDrawer(item)}
                          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[rgba(138,180,248,0.12)] text-[#93A8C7] transition-all hover:bg-[rgba(255,255,255,0.05)] hover:text-[#F1F5F9] hover:scale-105"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[rgba(255,107,122,0.12)] text-[#93A8C7] transition-all hover:bg-[rgba(255,107,122,0.08)] hover:text-[#FF9DA7] hover:scale-105"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[rgba(255,255,255,0.08)] px-6 py-4">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="app-button-secondary text-xs disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Sebelumnya
            </button>
            <span className="text-xs text-[#93A8C7]">
              Halaman {page} dari {pagination.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, pagination.totalPages))}
              disabled={page === pagination.totalPages}
              className="app-button-secondary text-xs disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Selanjutnya
            </button>
          </div>
        )}
      </div>

      {/* Dynamic Slide-in Editor Drawer */}
      <div
        className={`fixed inset-0 z-50 transition-opacity ${
          showDrawer ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div className="absolute inset-0 bg-[rgba(2,8,15,0.78)] backdrop-blur-sm" onClick={handleCloseDrawer} />

        <div
          className={`drawer-shell absolute right-0 top-0 h-full w-full max-w-lg border-l border-[rgba(138,180,248,0.12)] transition-transform duration-300 ${
            showDrawer ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex h-full flex-col">
            {/* Drawer Header */}
            <div className="border-b border-[rgba(255,255,255,0.08)] px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-[#56D6FF]">
                    Dynamic slide-in editor
                  </p>
                  <h2 className="mt-2 font-display text-3xl text-[#F1F5F9]">
                    {editingItem ? `Edit ${catalogLabel}` : `Tambah ${catalogLabel}`}
                  </h2>
                  <p className="mt-2 text-sm text-[#93A8C7]">
                    Formulir kustom yang disesuaikan secara otomatis dengan pengaturan bisnis Anda.
                  </p>
                </div>
                <button
                  onClick={handleCloseDrawer}
                  className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[rgba(138,180,248,0.12)] text-[#93A8C7] hover:bg-[rgba(255,255,255,0.05)]"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Dynamic Form Content */}
            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
              {fields
                .filter((field) => field.isActive)
                .map((field) => {
                  const key = field.fieldKey;
                  const label = field.label;
                  const isRequired = field.isRequired;

                  return (
                    <div key={field.id} className="space-y-2">
                      <label className="block text-sm font-medium text-[#93A8C7]">
                        {label} {isRequired && <span className="text-red-400">*</span>}
                      </label>

                      {/* Render based on fieldType */}
                      {field.fieldType === "textarea" ? (
                        <textarea
                          value={(formValues[key] as string) || ""}
                          onChange={(e) => handleInputChange(key, e.target.value)}
                          className="app-input min-h-[90px] py-2"
                          placeholder={`Masukkan ${label.toLowerCase()}...`}
                        />
                      ) : field.fieldType === "select" ? (
                        <CustomDropdown
                          value={(formValues[key] as string) || ""}
                          onChange={(val) => handleInputChange(key, val)}
                          options={[
                            { value: "", label: "Pilih Opsi" },
                            ...(field.options || []).map((opt) => ({
                              value: opt,
                              label: opt,
                            })),
                          ]}
                        />
                      ) : field.fieldType === "toggle" ? (
                        <div className="flex items-center gap-3 pt-1">
                          <button
                            type="button"
                            onClick={() => handleInputChange(key, !formValues[key])}
                            className={`inline-flex items-center gap-2 transition-colors ${
                              formValues[key] ? "text-[#4ADE80]" : "text-[#69809F]"
                            }`}
                          >
                            {formValues[key] ? (
                              <ToggleRight className="h-7 w-7" />
                            ) : (
                              <ToggleLeft className="h-7 w-7" />
                            )}
                            <span className="text-xs font-semibold uppercase">
                              {formValues[key] ? "Aktif / Ya" : "Nonaktif / Tidak"}
                            </span>
                          </button>
                        </div>
                      ) : field.fieldType === "number" ? (
                        <input
                          type="number"
                          value={formValues[key] !== undefined ? (formValues[key] as number) : ""}
                          onChange={(e) => handleInputChange(key, e.target.value)}
                          className="app-input"
                          placeholder="0"
                        />
                      ) : field.fieldType === "date" ? (
                        <input
                          type="date"
                          value={(formValues[key] as string) || ""}
                          onChange={(e) => handleInputChange(key, e.target.value)}
                          className="app-input"
                        />
                      ) : field.fieldType === "url" ? (
                        <input
                          type="url"
                          value={(formValues[key] as string) || ""}
                          onChange={(e) => handleInputChange(key, e.target.value)}
                          className="app-input"
                          placeholder="https://..."
                        />
                      ) : field.fieldType === "upload" ? (
                        <UploadField
                          value={(formValues[key] as string) || ""}
                          onChange={(url) => handleInputChange(key, url)}
                          placeholder={`Unggah ${label.toLowerCase()}...`}
                        />
                      ) : (
                        <input
                          type="text"
                          value={(formValues[key] as string) || ""}
                          onChange={(e) => handleInputChange(key, e.target.value)}
                          className="app-input"
                          placeholder={`Masukkan ${label.toLowerCase()}...`}
                        />
                      )}
                    </div>
                  );
                })}
            </div>

            {/* Drawer Footer */}
            <div className="flex gap-3 border-t border-[rgba(255,255,255,0.08)] px-6 py-5">
              <button onClick={handleCloseDrawer} className="app-button-secondary flex-1">
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="app-button-primary flex-1 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      </div>
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

interface UploadFieldProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

function UploadField({ value, onChange, placeholder }: UploadFieldProps) {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File terlalu besar (Maksimal 10MB)");
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "catalog"); // RustFS folder path

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        onChange(data.url);
        toast.success("Gambar berhasil diunggah ke RustFS");
      } else {
        toast.error(data.error || "Gagal mengunggah berkas");
      }
    } catch {
      toast.error("Terjadi kesalahan sistem saat mengunggah");
    } finally {
      setUploading(false);
    }
  };

  const isImage = value && value.match(/\.(jpeg|jpg|gif|png|webp|svg)/i);

  return (
    <div className="space-y-2">
      {value ? (
        <div className="space-y-2">
          {/* Preview */}
          {isImage ? (
            <div className="relative group w-full h-[160px] rounded-xl overflow-hidden border border-[rgba(255,255,255,0.08)] bg-white/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={value} alt="Pratinjau Gambar" className="w-full h-full object-contain p-1" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => onChange("")}
                  className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 rounded-lg text-white text-xs font-bold transition-all"
                >
                  <X className="h-3.5 w-3.5" />
                  Hapus Gambar
                </button>
              </div>
            </div>
          ) : (
            <div className="relative group flex items-center gap-3 rounded-xl border border-[rgba(255,255,255,0.08)] bg-white/5 p-3">
              <FileText className="h-8 w-8 text-[#56D6FF] shrink-0" />
              <span className="text-xs text-[#93A8C7] truncate flex-1">{value.split("/").pop()}</span>
              <button
                type="button"
                onClick={() => onChange("")}
                className="p-1.5 bg-black/40 hover:bg-red-600 rounded-lg text-white transition-all shrink-0"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Replace button */}
          <label className="flex items-center justify-center gap-2 w-full py-2 border border-dashed border-[rgba(255,255,255,0.1)] hover:border-[#56D6FF]/40 rounded-xl text-xs text-[#69809F] hover:text-[#56D6FF] cursor-pointer transition-all">
            <Upload className="h-3.5 w-3.5" />
            Ganti Gambar
            <input type="file" className="hidden" onChange={handleFileChange} disabled={uploading} accept="image/*,application/pdf" />
          </label>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-[rgba(255,255,255,0.12)] hover:border-[#56D6FF]/50 bg-white/2 hover:bg-[#56D6FF]/5 rounded-xl p-6 cursor-pointer transition-all group">
          <input
            type="file"
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading}
            accept="image/*,application/pdf"
          />
          {uploading ? (
            <div className="flex flex-col items-center gap-2 text-[#93A8C7]">
              <Loader2 className="h-8 w-8 animate-spin text-[#56D6FF]" />
              <span className="text-xs font-medium">Mengunggah ke RustFS...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-[#93A8C7] group-hover:text-[#F1F5F9]">
              <div className="w-12 h-12 rounded-xl bg-[#56D6FF]/10 flex items-center justify-center group-hover:bg-[#56D6FF]/20 transition-all">
                <Upload className="h-6 w-6 text-[#56D6FF]" />
              </div>
              <span className="text-xs font-semibold mt-1">{placeholder || "Klik untuk pilih gambar"}</span>
              <span className="text-[10px] text-[#69809F]">PNG, JPG, WEBP • Maks. 10MB</span>
              <span className="text-[9px] text-[#4A6080] mt-1">Tersimpan di RustFS Object Storage</span>
            </div>
          )}
        </label>
      )}
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

export function CustomTemplateModal({
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
          Simpan susunan kolom katalog Anda saat ini sebagai template baru. Anda dapat menerapkannya kembali kapan saja dari menu tipe bisnis.
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

