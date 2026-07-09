# Menu & Fitur

## Prinsip Menu
Menu tenant harus menyesuaikan tipe bisnis. Jika tenant adalah toko, menu katalog tampil sebagai "Produk". Jika klinik, tampil sebagai "Layanan". Jika travel, tampil sebagai "Paket".

## Menu Tenant
| Menu | Fungsi |
|---|---|
| Dashboard | KPI, chart, status tenant, ringkasan aktivitas |
| WhatsApp | Provider WAHA/Fonnte, koneksi, health check |
| Katalog Dinamis | Produk/layanan/paket/unit berdasarkan template tenant |
| Promo | Promo untuk semua item atau item tertentu |
| Orders/Pendaftaran | Transaksi, booking, atau pendaftaran sesuai tipe bisnis |
| Jadwal & Konsultasi | Slot konsultasi dan request jadwal |
| Pembayaran | Rekening bank, QRIS, Pakasir/manual transfer |
| FAQ | FAQ aktif yang bisa dipakai AI |
| AI Settings | Prompt, persona, model, fallback, knowledge base |
| Bot Settings | Greeting, jam operasional, delay, keyword rules |
| Security | Rate limit, whitelist, retention, webhook setting |
| Riwayat Chat | Percakapan, status eskalasi, pencarian |
| Profil Bisnis | Nama, logo, deskripsi, link marketplace |
| Akun | Password, bahasa UI, notifikasi |

## Menu Owner
| Menu | Fungsi |
|---|---|
| Owner Dashboard | Ringkasan semua tenant |
| Tenants | Kelola tenant dan status berlangganan |
| Billing | Tagihan tenant dan pembayaran owner |
| Reports | Laporan lintas tenant |
| Announcements | Pengumuman ke tenant |
| Settings | Konfigurasi platform |

## Fitur Global
- Multi-tenant isolation wajib.
- Semua list wajib punya loading, empty, dan error state.
- Semua mutation wajib validasi server.
- Fitur AI harus punya fallback non-AI.
- Aksi destruktif wajib konfirmasi.
