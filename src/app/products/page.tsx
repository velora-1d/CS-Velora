"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Package,
  Plus,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Boxes,
  Link2,
  Loader2,
} from "lucide-react";

type ProductType = "fisik" | "digital" | "jasa" | "konsultasi";

type ProductItem = {
  id: string;
  nama: string;
  tipe: ProductType;
  harga: number;
  hargaCoret: number | null;
  diskonPersen: number | null;
  aktif: boolean;
  stok: number | null;
};

type ProductForm = {
  nama: string;
  tipe: ProductType;
  harga: string;
  hargaCoret: string;
  diskonPersen: string;
  deskripsi: string;
  stok: string;
  durasi: string;
  linkShopee: string;
  linkTiktok: string;
  linkDelivery: string;
};

// Hapus data statis

const initialFormData: ProductForm = {
  nama: "",
  tipe: "fisik",
  harga: "",
  hargaCoret: "",
  diskonPersen: "",
  deskripsi: "",
  stok: "",
  durasi: "",
  linkShopee: "",
  linkTiktok: "",
  linkDelivery: "",
};

const tipeLabels: Record<ProductType, string> = {
  fisik: "Fisik",
  digital: "Digital",
  jasa: "Jasa",
  konsultasi: "Konsultasi",
};

const tipeColors: Record<ProductType, string> = {
  fisik: "bg-[#67A7FF]/10 text-[#67A7FF]",
  digital: "bg-[#4ADE80]/10 text-[#4ADE80]",
  jasa: "bg-[#FFBF69]/10 text-[#FFBF69]",
  konsultasi: "bg-[#C4A0FF]/10 text-[#C4A0FF]",
};

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterTipe, setFilterTipe] = useState<"all" | ProductType>("all");
  const [showDrawer, setShowDrawer] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [formData, setFormData] = useState<ProductForm>(initialFormData);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/products");
      const data = await res.json();
      if (res.ok) {
        setProducts(data);
      } else {
        toast.error("Gagal memuat produk: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      toast.error("Gagal memuat data produk.");
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.nama.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterTipe === "all" || product.tipe === filterTipe;
    return matchesSearch && matchesType;
  });

  const activeProducts = products.filter((product) => product.aktif).length;
  const digitalReady = products.filter((product) => product.tipe === "digital").length;
  const stockTracked = products.filter((product) => product.stok !== null).length;

  const handleOpenDrawer = (product?: ProductItem) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        nama: product.nama,
        tipe: product.tipe,
        harga: product.harga.toString(),
        hargaCoret: product.hargaCoret?.toString() || "",
        diskonPersen: product.diskonPersen?.toString() || "",
        deskripsi: "",
        stok: product.stok?.toString() || "",
        durasi: "",
        linkShopee: "",
        linkTiktok: "",
        linkDelivery: "",
      });
    } else {
      setEditingProduct(null);
      setFormData(initialFormData);
    }

    setShowDrawer(true);
  };

  const handleCloseDrawer = () => {
    setShowDrawer(false);
    setEditingProduct(null);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const url = editingProduct ? `/api/products/${editingProduct.id}` : "/api/products";
      const method = editingProduct ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(editingProduct ? "Produk diperbarui" : "Produk ditambahkan");
        fetchProducts();
        handleCloseDrawer();
      } else {
        toast.error("Gagal menyimpan: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      toast.error("Gagal menyimpan produk.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      const res = await fetch(`/api/products/${id}/toggle`, {
        method: "PATCH",
      });
      if (res.ok) {
        toast.success("Status produk diperbarui");
        fetchProducts();
      } else {
        const data = await res.json();
        toast.error("Gagal mengubah status: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat mengubah status.");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Yakin ingin menghapus produk ini?")) {
      try {
        const res = await fetch(`/api/products/${id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          toast.success("Produk dihapus");
          fetchProducts();
        } else {
          const data = await res.json();
          toast.error("Gagal menghapus: " + (data.error || "Unknown error"));
        }
      } catch (error) {
        toast.error("Terjadi kesalahan saat menghapus produk.");
      }
    }
  };

  const metricCards = [
    {
      label: "Katalog aktif",
      value: activeProducts,
      icon: Boxes,
      color: "text-[#56D6FF]",
      bg: "bg-[#56D6FF]/10",
    },
    {
      label: "Produk digital",
      value: digitalReady,
      icon: Link2,
      color: "text-[#4ADE80]",
      bg: "bg-[#4ADE80]/10",
    },
    {
      label: "Stok terpantau",
      value: stockTracked,
      icon: Package,
      color: "text-[#FFBF69]",
      bg: "bg-[#FFBF69]/10",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="hero-panel px-6 py-7 md:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <span className="section-kicker">Catalog orchestration</span>
            <h1 className="mt-5 font-display text-4xl font-semibold text-[#F1F5F9] md:text-5xl">
              Satu panel untuk menata produk fisik, digital, jasa, dan konsultasi.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-[#93A8C7] md:text-base">
              UI ini disusun untuk admin yang butuh cepat: lihat status, filter katalog, lalu edit produk dari drawer tanpa pindah konteks.
            </p>
          </div>
          <div className="panel-shell p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-[#56D6FF]">
              Catalog pulse
            </p>
            <div className="mt-5 grid grid-cols-3 gap-3">
              {metricCards.map((metric) => (
                <div key={metric.label} className="metric-card p-4">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${metric.bg} ${metric.color}`}>
                    <metric.icon className="h-5 w-5" />
                  </div>
                  <p className="mt-4 text-2xl font-semibold text-[#F1F5F9]">{metric.value}</p>
                  <p className="mt-1 text-xs leading-5 text-[#93A8C7]">{metric.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="glass-card p-5 md:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[#56D6FF]">
              Filter katalog
            </p>
            <p className="mt-2 text-sm text-[#93A8C7]">
              Cari cepat dan potong daftar berdasarkan tipe produk.
            </p>
          </div>
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative min-w-[260px]">
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari produk, layanan, atau konsultasi..."
                className="app-input"
              />
            </div>
            <select
              value={filterTipe}
              onChange={(event) => setFilterTipe(event.target.value as "all" | ProductType)}
              className="app-select min-w-[190px]"
            >
              <option value="all">Semua Tipe</option>
              <option value="fisik">Fisik</option>
              <option value="digital">Digital</option>
              <option value="jasa">Jasa</option>
              <option value="konsultasi">Konsultasi</option>
            </select>
            <button onClick={() => handleOpenDrawer()} className="app-button-primary whitespace-nowrap">
              <Plus className="h-4 w-4" />
              Tambah Produk
            </button>
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[#56D6FF]">
              Product matrix
            </p>
            <h2 className="mt-2 font-display text-2xl text-[#F1F5F9]">
              Katalog terstruktur
            </h2>
          </div>
          <span className="status-pill bg-[#67A7FF]/10 text-[#67A7FF]">
            {filteredProducts.length} item tampil
          </span>
        </div>

        <div className="overflow-x-auto custom-scrollbar px-3 py-3">
          <table className="table-shell min-w-full">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.08)]">
                <th className="px-4 py-3 text-left whitespace-nowrap">Produk</th>
                <th className="px-4 py-3 text-left whitespace-nowrap">Tipe</th>
                <th className="px-4 py-3 text-left whitespace-nowrap">Harga</th>
                <th className="px-4 py-3 text-left whitespace-nowrap">Stok</th>
                <th className="px-4 py-3 text-left whitespace-nowrap">Status</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-8 w-8 animate-spin text-[#56D6FF]" />
                      <p className="text-[#93A8C7]">Memuat katalog produk...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-[#93A8C7]">
                    Tidak ada produk yang cocok dengan filter saat ini.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="border-b border-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(255,255,255,0.05)] text-[#93A8C7]">
                          <Package className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium text-[#F1F5F9]">{product.nama}</p>
                          <p className="mt-1 text-sm text-[#69809F]">
                            Siap muncul di knowledge base bot
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`status-pill ${tipeColors[product.tipe]}`}>
                        {tipeLabels[product.tipe]}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-[#F1F5F9] whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-semibold">Rp {product.harga.toLocaleString("id-ID")}</span>
                        {product.hargaCoret && (
                          <span className="text-[10px] text-[#69809F] line-through opacity-70">
                            Rp {product.hargaCoret.toLocaleString("id-ID")}
                          </span>
                        )}
                        {product.diskonPersen && (
                          <span className="text-[10px] text-[#4ADE80] font-bold">
                            -{product.diskonPersen}%
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-[#93A8C7] whitespace-nowrap">
                      <span className="text-xs font-mono">{product.stok !== null ? product.stok : "∞"}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggle(product.id)}
                        className={`inline-flex items-center gap-2 transition-colors ${
                          product.aktif ? "text-[#4ADE80]" : "text-[#69809F]"
                        }`}
                      >
                        {product.aktif ? (
                          <ToggleRight className="h-5 w-5" />
                        ) : (
                          <ToggleLeft className="h-5 w-5" />
                        )}
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          {product.aktif ? "Aktif" : "Off"}
                        </span>
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenDrawer(product)}
                          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[rgba(138,180,248,0.12)] text-[#93A8C7] transition-all hover:bg-[rgba(255,255,255,0.05)] hover:text-[#F1F5F9] hover:scale-105"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
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
      </div>

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
            <div className="border-b border-[rgba(255,255,255,0.08)] px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-[#56D6FF]">
                    Slide-in editor
                  </p>
                  <h2 className="mt-2 font-display text-3xl text-[#F1F5F9]">
                    {editingProduct ? "Edit Produk" : "Tambah Produk"}
                  </h2>
                  <p className="mt-2 text-sm text-[#93A8C7]">
                    Form menyesuaikan tipe produk agar admin tetap cepat saat input katalog.
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

            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
              <div>
                <label className="mb-2 block text-sm text-[#93A8C7]">Tipe Produk *</label>
                <select
                  value={formData.tipe}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      tipe: event.target.value as ProductType,
                    }))
                  }
                  className="app-select"
                >
                  <option value="fisik">Fisik</option>
                  <option value="digital">Digital</option>
                  <option value="jasa">Jasa</option>
                  <option value="konsultasi">Konsultasi</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-[#93A8C7]">Nama Produk *</label>
                <input
                  type="text"
                  value={formData.nama}
                  onChange={(event) =>
                    setFormData((current) => ({ ...current, nama: event.target.value }))
                  }
                  className="app-input"
                  placeholder="Masukkan nama produk"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm text-[#93A8C7]">Harga Promo *</label>
                  <input
                    type="number"
                    value={formData.harga}
                    onChange={(event) =>
                      setFormData((current) => ({ ...current, harga: event.target.value }))
                    }
                    className="app-input"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-[#93A8C7]">Harga Coret</label>
                  <input
                    type="number"
                    value={formData.hargaCoret}
                    onChange={(event) =>
                      setFormData((current) => ({ ...current, hargaCoret: event.target.value }))
                    }
                    className="app-input"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-[#93A8C7]">Diskon (%)</label>
                <input
                  type="number"
                  value={formData.diskonPersen}
                  onChange={(event) =>
                    setFormData((current) => ({ ...current, diskonPersen: event.target.value }))
                  }
                  className="app-input"
                  placeholder="Contoh: 10"
                />
              </div>

              {(formData.tipe === "fisik" || formData.tipe === "digital") && (
                <div>
                  <label className="mb-2 block text-sm text-[#93A8C7]">
                    {formData.tipe === "fisik" ? "Stok" : "Link Delivery"}
                  </label>
                  <input
                    type="text"
                    value={formData.tipe === "fisik" ? formData.stok : formData.linkDelivery}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        [formData.tipe === "fisik" ? "stok" : "linkDelivery"]: event.target.value,
                      }))
                    }
                    className="app-input"
                    placeholder={formData.tipe === "fisik" ? "Jumlah stok" : "https://..."}
                  />
                </div>
              )}

              {(formData.tipe === "jasa" || formData.tipe === "konsultasi") && (
                <div>
                  <label className="mb-2 block text-sm text-[#93A8C7]">Durasi</label>
                  <input
                    type="text"
                    value={formData.durasi}
                    onChange={(event) =>
                      setFormData((current) => ({ ...current, durasi: event.target.value }))
                    }
                    className="app-input"
                    placeholder="Contoh: 1 jam, 30 menit"
                  />
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm text-[#93A8C7]">Link Shopee</label>
                <input
                  type="url"
                  value={formData.linkShopee}
                  onChange={(event) =>
                    setFormData((current) => ({ ...current, linkShopee: event.target.value }))
                  }
                  className="app-input"
                  placeholder="https://shopee.co.id/..."
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-[#93A8C7]">Link TikTok Shop</label>
                <input
                  type="url"
                  value={formData.linkTiktok}
                  onChange={(event) =>
                    setFormData((current) => ({ ...current, linkTiktok: event.target.value }))
                  }
                  className="app-input"
                  placeholder="https://tiktok.com/..."
                />
              </div>
            </div>

            <div className="flex gap-3 border-t border-[rgba(255,255,255,0.08)] px-6 py-5">
              <button onClick={handleCloseDrawer} className="app-button-secondary flex-1">
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={!formData.nama || !formData.harga || isSaving}
                className="app-button-primary flex-1 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
