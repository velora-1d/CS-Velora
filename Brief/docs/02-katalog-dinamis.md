# Katalog Dinamis Multi-Template

## Tujuan
Mengganti katalog fixed `products` menjadi katalog dinamis yang bisa mengikuti tipe bisnis tenant tanpa rewrite kode setiap ada jenis bisnis baru.

## Konsep Utama
- `tenant_types`: template tipe bisnis.
- `catalog_fields`: field aktual per tenant, hasil generate dari template dan bisa dikustom.
- `catalog_items`: data katalog tenant, berisi field inti dan `data` JSONB untuk field dinamis.

## Template Awal
| Tipe Bisnis | Label Katalog | Label Order | Field Default |
|---|---|---|---|
| bisnis | Katalog | Pesanan | Nama, Deskripsi, Harga, Stok, Gambar, Kategori, Status |
| klinik | Layanan | Pendaftaran | Nama Layanan, Deskripsi, Tarif, Durasi, Dokter/Terapis, Status |
| travel | Paket | Booking | Nama Paket, Destinasi, Harga, Durasi, Kuota, Tanggal, Status |
| properti | Unit | Lead | Nama Unit, Lokasi, Harga, Luas, Kamar, Status |
| pendidikan | Program | Pendaftaran | Nama Program, Level, Biaya, Durasi, Jadwal, Status |

## Field System
Field berikut wajib ada dan tidak boleh dihapus:
- `nama`: nama item katalog, dipakai list dan AI.
- `harga`: harga utama untuk order/payment.
- `aktif`: status item.

## Field Builder
Admin tenant bisa:
- tambah field baru;
- edit label field;
- edit tipe field;
- ubah urutan field;
- nonaktifkan field non-system;
- hapus field non-system.

## Tipe Field
| Tipe | Fungsi |
|---|---|
| text | teks pendek |
| textarea | teks panjang |
| number | angka/harga/stok |
| date | tanggal |
| select | pilihan tetap |
| toggle | boolean |
| url | link |
| upload | file/gambar, fase lanjut |

## Fitur Katalog
- CRUD item katalog.
- Search berdasarkan `nama`.
- Filter status aktif/nonaktif.
- Filter berdasarkan template/field penting jika ada.
- Toggle aktif/nonaktif.
- Duplikat item, fase lanjut.
- Import CSV, fase lanjut setelah field builder stabil.

## Migrasi dari Produk Lama
1. Buat tabel baru tanpa menghapus `products`.
2. Copy data `products` ke `catalog_items`.
3. Simpan field lama ke `catalog_items.data`.
4. Pindahkan `orders`, `promo_products`, dan `consultation_slots` bertahap ke `catalog_item_id`.
5. Hapus dependency ke `products` hanya setelah semua fitur memakai katalog baru.

## Non-Goal Fase Awal
- Tidak membuat editor template owner dulu.
- Tidak membuat import CSV dulu.
- Tidak menghapus `products` sebelum dependency selesai dimigrasi.
