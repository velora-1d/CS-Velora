# Database Schema Target

## tenant_types
Template tipe bisnis yang bisa dipilih tenant.

| Kolom | Fungsi |
|---|---|
| id | primary key |
| key | slug unik, contoh `bisnis`, `klinik` |
| name | nama tipe bisnis |
| catalog_label | label menu katalog |
| order_label | label order/pendaftaran |
| field_template | JSONB template field default |
| is_active | status template |
| created_at | waktu dibuat |
| updated_at | waktu update |

## tenants
Tambahan target untuk tenant.

| Kolom | Fungsi |
|---|---|
| tenant_type_id | relasi ke `tenant_types` |
| catalog_label | override label katalog tenant |
| order_label | override label order tenant |

## catalog_fields
Field katalog aktual per tenant.

| Kolom | Fungsi |
|---|---|
| id | primary key |
| tenant_id | scope tenant |
| label | label yang tampil di form |
| field_key | key unik snake_case |
| field_type | text, textarea, number, date, select, toggle, url, upload |
| options | JSONB untuk select |
| is_required | wajib diisi |
| is_system | tidak boleh dihapus |
| is_active | field aktif |
| sort_order | urutan tampil |
| created_at | waktu dibuat |
| updated_at | waktu update |

## catalog_items
Item katalog dinamis.

| Kolom | Fungsi |
|---|---|
| id | primary key |
| tenant_id | scope tenant |
| nama | nama item, wajib |
| harga | harga utama, nullable untuk tipe bisnis tertentu |
| aktif | status item |
| data | JSONB field dinamis |
| created_at | waktu dibuat |
| updated_at | waktu update |

## Relasi yang Perlu Dimigrasi
| Lama | Baru |
|---|---|
| `orders.product_id` | `orders.catalog_item_id` |
| `promo_products.product_id` | `promo_catalog_items.catalog_item_id` |
| `consultation_slots.product_id` | `consultation_slots.catalog_item_id` |

## Index Wajib
- `idx_catalog_fields_tenant_id`
- `idx_catalog_fields_tenant_key`
- `idx_catalog_items_tenant_id`
- `idx_catalog_items_tenant_active`
- `idx_catalog_items_tenant_created`

## Aturan Data
- Semua tabel operasional wajib punya `tenant_id`.
- Semua query list wajib pagination.
- Semua query tenant wajib filter `tenant_id`.
- `nama`, `harga`, dan `aktif` tetap kolom utama agar order, payment, AI, dan list tidak bergantung penuh ke JSONB.
