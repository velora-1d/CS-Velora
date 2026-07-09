# Roadmap Katalog Dinamis CS Velora

## Prinsip Eksekusi
- Katalog dinamis menjadi source of truth baru.
- `products` lama tidak dihapus di awal karena masih dipakai order, promo, konsultasi, dashboard, keuangan, dan webhook.
- Migrasi dilakukan bertahap dengan jalur kompatibilitas agar fitur existing tetap hidup.
- Fitur tambahan seperti import CSV dan duplicate item masuk setelah CRUD dinamis stabil.

## Fase 0 — Validasi Fondasi
**Tujuan:** pastikan arah implementasi jelas sebelum menyentuh kode.

Task:
- Finalkan field system: `nama`, `harga`, `aktif`.
- Finalkan template awal: bisnis, klinik, travel, properti, pendidikan.
- Tentukan label menu per tenant: `catalog_label` dan `order_label`.
- Tentukan strategi migrasi dari `products` ke `catalog_items`.

Output:
- Brief siap menjadi acuan implementasi.
- Tidak ada perubahan database/app.

## Fase 1 — Schema Katalog Dinamis
**Tujuan:** tambah fondasi database tanpa merusak fitur lama.

Task:
- Tambah tabel `tenant_types`.
- Tambah tabel `catalog_fields`.
- Tambah tabel `catalog_items`.
- Tambah kolom target di `tenants`: `tenant_type_id`, `catalog_label`, `order_label`.
- Tambah index tenant untuk field dan item katalog.
- Tambah seed template awal.

Output:
- Database siap menyimpan multi-template katalog.
- `products` lama tetap ada.

## Fase 2 — API Katalog Dinamis
**Tujuan:** buat jalur backend baru untuk katalog tanpa mengganggu `/api/products`.

Task:
- Buat `GET /api/tenant-types`.
- Buat CRUD `/api/catalog-fields`.
- Buat CRUD `/api/catalog-items`.
- Validasi `catalog_items.data` berdasarkan `catalog_fields`.
- Pastikan semua query filter `tenant_id`.
- Pastikan field system tidak bisa dihapus.

Output:
- API katalog dinamis siap dipakai UI.
- API produk lama tetap jalan.

## Fase 3 — UI Field Builder
**Tujuan:** tenant bisa mengatur field katalog.

Task:
- Buat halaman pengaturan katalog field.
- Tampilkan field system dan custom field.
- Tambah/edit/nonaktif/hapus field non-system.
- Reorder field.
- Validasi `field_key` snake_case dan unik.

Output:
- Tenant bisa kustom field katalog dari dashboard.

## Fase 4 — UI Katalog Dinamis
**Tujuan:** ganti pengalaman menu Produk menjadi Katalog dinamis.

Task:
- Ubah label menu berdasarkan `catalog_label`.
- Render form katalog dari `catalog_fields`.
- List `catalog_items` dengan search, filter aktif, dan pagination.
- Tambah/edit/hapus/toggle item katalog.
- Tampilkan field penting secara ringkas di table/card.

Output:
- Katalog dinamis bisa dipakai tenant sehari-hari.

## Fase 5 — Migrasi Data Produk Lama
**Tujuan:** pindahkan data lama tanpa kehilangan dependency.

Task:
- Buat script/migration copy `products` ke `catalog_items`.
- Simpan `products.id` lama di metadata jika perlu mapping.
- Mapping field lama ke `catalog_items.data`.
- Verifikasi jumlah data sebelum/sesudah.

Output:
- Data produk lama tersedia sebagai katalog dinamis.

## Fase 6 — Migrasi Dependency
**Tujuan:** pindahkan fitur yang masih memakai `product_id`.

Task:
- Migrasi `orders.product_id` ke `orders.catalog_item_id`.
- Migrasi `promo_products` ke relasi promo-katalog.
- Migrasi `consultation_slots.product_id` ke `catalog_item_id`.
- Update dashboard, keuangan, Pakasir webhook, dan halaman konsultasi.
- Pertahankan fallback baca `products` sementara jika data lama belum termigrasi penuh.

Output:
- Fitur utama memakai `catalog_items`.
- `products` tidak lagi menjadi source of truth.

## Fase 7 — Cleanup Produk Lama
**Tujuan:** hapus beban lama setelah migrasi aman.

Task:
- Audit semua referensi `products`.
- Hapus API/UI produk lama yang tidak dipakai.
- Pertimbangkan drop tabel `products` hanya setelah data production aman dan ada backup.

Output:
- Codebase bersih memakai katalog dinamis.

## Fase 8 — Fitur Lanjutan
**Tujuan:** tambah fitur yang bukan blocker inti.

Task:
- Import CSV berdasarkan field aktif tenant.
- Duplicate item.
- Template editor owner.
- Upload field untuk gambar/file.
- Advanced filter per field dinamis.

Output:
- Katalog dinamis lengkap untuk variasi bisnis lebih besar.

## Urutan Kerja Terdekat
1. Kerjakan Fase 1: schema + seed template.
2. Kerjakan Fase 2: API `tenant-types`, `catalog-fields`, `catalog-items`.
3. Kerjakan Fase 3 dan 4: UI field builder dan katalog.
4. Baru masuk migrasi data dan dependency.
