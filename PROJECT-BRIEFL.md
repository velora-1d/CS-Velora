# PROJECT BRIEF
## WA Chatbot Admin Panel — Velora ID
**v2.0 FINAL — Maret 2026 | Internal Velora ID**

---

## Project Overview

| | |
|---|---|
| **Nama Proyek** | WA Chatbot Admin Panel — Velora ID |
| **Tipe** | Internal Tool → SaaS (Fase 2) |
| **PIC** | Mahin Utsman Nawawi — Velora ID |
| **Versi** | 2.0 FINAL |
| **Tanggal** | Maret 2026 |
| **Status** | Ready for Development |

### Deskripsi
Platform admin panel untuk mengelola WhatsApp chatbot bisnis secara lengkap — mencakup manajemen produk (fisik, digital, jasa, konsultasi), sistem booking, pembayaran manual multi-metode, AI settings dengan knowledge base dinamis, dan monitoring percakapan dari satu dashboard terpusat.

Dibangun sebagai **dogfood internal Velora ID** sebelum diprodukkan sebagai SaaS untuk klien UMKM, freelancer, konsultan, dan bisnis lokal Indonesia.

### Goals
- Operator mengelola seluruh operasi chatbot WA tanpa menyentuh kode
- Bot menjawab pertanyaan produk, harga, stok, promo, dan FAQ secara otomatis
- AI selalu up-to-date dengan data terbaru dari database tanpa update manual
- Sistem booking konsultasi slot-based + free form dalam satu flow
- Pembayaran manual via transfer & QRIS dengan konfirmasi admin
- Bot aman dari ban WA dengan mekanisme anti-ban built-in
- Support multi-bahasa Indonesia & Inggris di FE dan AI

### Success Metrics
- Akurasi jawaban bot lebih dari 85% untuk pertanyaan umum
- Setup WA connection selesai dalam kurang dari 2 menit
- Response time bot 3-9 detik (natural human-like delay)
- Zero ban dalam 30 hari pertama penggunaan normal
- Admin dapat manage semua konten tanpa bantuan developer

---

## User & Roles

| Role | Deskripsi | Akses |
|---|---|---|
| **Super Admin** | Owner Velora ID (Mahin) | Full access semua fitur & tenant |
| **Admin** | Operator per toko/bisnis | Full access dalam scope tenant sendiri |

### Catatan Role
- Fase 1 (MVP): hanya 1 role aktif — Admin (internal Velora ID)
- Fase 2 (SaaS): Super Admin dapat akses semua tenant, Admin terbatas per tenant
- Autentikasi via Auth.js v5, session JWT dengan expiry

---

## Product Structure

### Sitemap

```
WA Chatbot Admin Panel
│
├── Auth
│   └── Login
│
├── Dashboard
│
├── WhatsApp
│   ├── Koneksi & Provider
│   └── Health Monitor
│
├── Produk
│   ├── List Produk
│   └── Detail / CRUD Produk
│
├── Promo
│   ├── List Promo
│   └── Detail / CRUD Promo
│
├── Orders
│   ├── List Order
│   └── Detail Order + Konfirmasi Pembayaran
│
├── Jadwal & Konsultasi
│   ├── Kelola Slot
│   ├── List Booking
│   ├── Request Custom
│   └── Kalender View
│
├── Pembayaran
│   ├── Rekening Bank
│   └── QRIS
│
├── FAQ
│   └── List FAQ + CRUD
│
├── AI Settings
│   ├── System Prompt
│   ├── Persona & Nama Agent
│   └── Preview & Test
│
├── Bot Settings
│   ├── Greeting & Offline
│   ├── Jam Operasional
│   ├── Delay Config
│   └── Keyword Rules
│
├── Security Settings
│   ├── Rate Limiting
│   ├── Webhook Validation
│   └── Data Retention
│
├── Riwayat Chat
│   ├── List Percakapan
│   └── Detail Thread
│
├── Profil Toko
│
└── Akun
    ├── Ganti Password
    ├── Preferensi Bahasa
    └── Notifikasi
```

### Menu

| No | Menu | Icon | Keterangan |
|---|---|---|---|
| 1 | Dashboard | 📊 | Overview statistik & status real-time |
| 2 | WhatsApp | 📱 | Provider, koneksi, health monitor |
| 3 | Produk | 📦 | CRUD produk semua tipe |
| 4 | Promo | 🎉 | CRUD promo + tanggal aktif |
| 5 | Orders | 🛒 | List order + konfirmasi pembayaran |
| 6 | Jadwal & Konsultasi | 📅 | Slot, booking, request custom, kalender |
| 7 | Pembayaran | 💳 | Rekening bank + QRIS statis |
| 8 | FAQ | ❓ | CRUD FAQ + auto-inject ke AI |
| 9 | AI Settings | 🤖 | System prompt, persona, knowledge base |
| 10 | Bot Settings | ⚙️ | Greeting, jam ops, delay, keyword rules |
| 11 | Security Settings | 🛡️ | Rate limit, retention, whitelist |
| 12 | Riwayat Chat | 💬 | Log percakapan + filter + search |
| 13 | Profil Toko | 🏪 | Nama, deskripsi, logo, link marketplace |
| 14 | Akun | 👤 | Password, bahasa UI, notifikasi |

### Pages

| Halaman | Path | Deskripsi |
|---|---|---|
| Login | `/login` | Form login admin |
| Dashboard | `/dashboard` | Overview utama |
| WA Koneksi | `/whatsapp` | QR scanner, provider selector, status |
| List Produk | `/products` | Tabel produk + tombol CRUD |
| List Promo | `/promos` | Tabel promo + tombol CRUD |
| List Order | `/orders` | Tabel order + filter + konfirmasi |
| Detail Order | `/orders/[id]` | Detail order + bukti transfer |
| Kelola Slot | `/consultations/slots` | CRUD slot konsultasi |
| List Booking | `/consultations/bookings` | Semua booking masuk |
| Request Custom | `/consultations/requests` | Approve/reject jadwal custom |
| Kalender | `/consultations/calendar` | Kalender view semua booking |
| Pembayaran | `/payments` | CRUD rekening + QRIS upload |
| FAQ | `/faqs` | CRUD FAQ |
| AI Settings | `/ai-settings` | System prompt + persona + preview |
| Bot Settings | `/bot-settings` | Semua konfigurasi bot |
| Security | `/security` | Rate limit, retention, whitelist |
| Riwayat Chat | `/chats` | List thread percakapan |
| Detail Chat | `/chats/[id]` | Thread lengkap per nomor WA |
| Profil Toko | `/profile` | Info toko + logo + link |
| Akun | `/account` | Password + bahasa + notifikasi |

---

## Features

### Global Features
- **Dark Mode** — default di semua halaman, tidak ada toggle light mode
- **Glassmorphism UI** — backdrop blur pada sidebar, card, dan panel
- **Slide-in Drawer** — semua CRUD muncul dari kanan (bukan popup modal)
- **Toast Notification** — feedback setiap aksi berhasil/gagal
- **Multi-bahasa** — UI support Indonesia & Inggris via next-intl
- **Responsive** — support desktop & tablet
- **Loading Skeleton** — skeleton loader saat fetch data
- **Empty State** — tampilan khusus saat data kosong

### Features per Menu

#### 📊 Dashboard
- Overview statistik: total chat hari ini, total order, produk aktif, promo aktif
- Status WA real-time: connected/disconnected + nomor aktif
- Slot konsultasi hari ini
- Pending actions: order belum dikonfirmasi, pembayaran pending, request jadwal custom

#### 📱 WhatsApp
- Pilih provider: WAHA atau Fonnte via dropdown
- Connect WAHA: tampilkan QR code, scan dari HP, status auto-update
- Connect Fonnte: input API key, validasi koneksi
- Status koneksi real-time + tombol disconnect
- Health monitor: alert otomatis jika provider disconnect

#### 📦 Produk
- List produk dalam tabel dengan filter tipe & status
- CRUD via slide-in drawer dari kanan
- Tipe produk: Fisik / Digital / Jasa / Konsultasi
- Field dinamis sesuai tipe: stok (fisik), link delivery (digital), durasi (jasa/konsultasi)
- Link Shopee & TikTok Shop per produk
- Toggle aktif/nonaktif tanpa hapus data

#### 🎉 Promo
- List promo dalam tabel dengan status aktif/expired
- CRUD via slide-in drawer
- Set tanggal mulai & berakhir
- Auto expire: promo otomatis nonaktif setelah tanggal berakhir
- Toggle manual aktif/nonaktif

#### 🛒 Orders
- List order dengan filter status & tanggal
- Status: Pending / Dikonfirmasi / Diproses / Selesai / Dibatalkan
- Detail order: produk, jumlah, total, nomor WA, alamat (jika fisik)
- Lihat foto bukti transfer dari user
- Tombol konfirmasi / reject pembayaran
- Search by nomor WA atau nama pemesan

#### 📅 Jadwal & Konsultasi
- Kelola slot: tambah/hapus/blokir slot tersedia via drawer
- List booking: semua slot yang sudah di-book + detail pemesan
- Request custom: list jadwal free form dari user
- Approve / reject / suggest jadwal alternatif untuk request custom
- Kalender view: tampilan mingguan semua booking & slot

#### 💳 Pembayaran
- CRUD rekening bank: nama bank, nomor rekening, nama pemilik
- Upload QRIS statis: upload gambar + preview
- Toggle aktif/nonaktif per metode
- Atur urutan tampil ke user via drag or input angka

#### ❓ FAQ
- CRUD FAQ: pertanyaan & jawaban bebas
- Toggle aktif/nonaktif
- FAQ aktif otomatis di-inject ke knowledge base AI

#### 🤖 AI Settings
- System prompt: textarea untuk brief & instruksi AI
- Nama agent: custom nama yang tampil ke user WA
- Tone & persona: Formal / Semi-formal / Santai
- Knowledge base: tampilkan preview data yang akan di-inject (produk, promo, FAQ, dll)
- Preview & test: input pesan → lihat response AI langsung
- Model Selection: Pilih model AI dinamis (GPT-4o, Claude, dll) yang tersedia di provider
- Toggle AI on/off
- Bahasa default: fallback bahasa bot (Indonesia / Inggris)

#### ⚙️ Bot Settings
- Pesan greeting: pesan sambutan pertama kali user chat
- Pesan offline: pesan otomatis di luar jam operasional
- Jam operasional: set jam buka & tutup bot
- Random delay: config min & max delay reply dalam detik
- Toggle typing indicator
- Keyword rules: tambah/edit keyword + reply template-nya
- Human handover: keyword trigger eskalasi ke admin

#### 🛡️ Security Settings
- Rate limiting: batasi maksimal request per menit per nomor
- Webhook validation: toggle validasi signature
- Data retention: set berapa hari chat log disimpan sebelum auto-delete
- Whitelist nomor: batasi akses bot hanya untuk nomor tertentu (opsional)

#### 💬 Riwayat Chat
- List semua percakapan dengan timestamp & status
- Filter by tanggal, status (AI/human), nomor WA
- Search by nama atau nomor
- Detail: thread lengkap per nomor WA
- Tandai percakapan sebagai butuh reply manual (human handover)

#### 🏪 Profil Toko
- Nama toko, deskripsi bisnis, logo (upload)
- Link utama Shopee & TikTok Shop
- Semua data profil toko otomatis di-inject ke knowledge base AI

#### 👤 Akun
- Ganti password dengan konfirmasi
- Pilih bahasa UI: Indonesia / Inggris
- Setting notifikasi: order masuk, booking baru, WA disconnect

---

## Flow

### User Flow

#### Flow Login
```
User buka /login
→ Input email + password
→ Auth.js validasi kredensial
→ Berhasil: redirect ke /dashboard
→ Gagal: tampilkan pesan error
```

#### Flow Connect WhatsApp (WAHA)
```
Admin buka menu WhatsApp
→ Pilih provider: WAHA
→ Klik "Connect"
→ Sistem request QR dari WAHA API
→ QR ditampilkan di dashboard
→ Admin scan QR dari HP klien
→ Status otomatis update: Connected ✅
→ Nomor aktif tampil di header
```

#### Flow Connect WhatsApp (Fonnte)
```
Admin buka menu WhatsApp
→ Pilih provider: Fonnte
→ Input API key
→ Klik "Validasi"
→ Sistem test koneksi ke Fonnte
→ Berhasil: status Connected ✅
→ Gagal: tampilkan pesan error
```

#### Flow CRUD Produk
```
Admin klik "Tambah Produk"
→ Drawer slide-in dari kanan
→ Pilih tipe produk (fisik/digital/jasa/konsultasi)
→ Field form menyesuaikan tipe yang dipilih
→ Isi semua field yang diperlukan
→ Klik Simpan
→ Drawer close → tabel refresh → toast sukses
```

#### Flow Order Masuk
```
User chat ke nomor WA
→ Bot tampilkan produk & harga
→ User pilih produk
→ Bot catat order → kirim total + metode pembayaran
→ User transfer → kirim foto bukti
→ Bot: "Bukti diterima, sedang diverifikasi"
→ Admin lihat order di dashboard (pending badge)
→ Admin buka detail order → lihat foto bukti
→ Admin klik Konfirmasi / Reject
→ Bot otomatis notif user sesuai keputusan admin
```

#### Flow Booking Konsultasi
```
User tanya konsultasi via WA
→ Bot tampilkan produk konsultasi + harga
→ Bot tampilkan list slot tersedia (max 5 slot)
→ User pilih nomor slot → bot konfirmasi booking
→ [Jika tidak ada slot cocok]
   User ketik jadwal yang diinginkan (free form)
   → Request masuk ke dashboard admin
   → Admin approve / reject / suggest jadwal lain
   → Bot notif user hasil keputusan admin
→ Booking confirmed → bot lanjut ke flow pembayaran
```

### System Flow

#### Flow Pesan Masuk (Bot Logic)
```
Pesan masuk dari WA
→ WAHA/Fonnte forward ke POST /api/webhook/whatsapp
→ Validasi webhook signature
→ Cek rate limit per nomor pengirim
→ Cek jam operasional
   [Di luar jam] → kirim pesan offline → stop
→ Cek keyword rules
   [Match] → ambil reply template → lanjut ke delay
   [Tidak match] → build system prompt + inject knowledge base
               → kirim ke Seed AI
               → terima response AI
→ Random delay (delay_min hingga delay_max ms)
→ Typing indicator ON selama delay
→ Typing indicator OFF
→ Kirim reply via WAHA/Fonnte API
→ Simpan log ke chat_logs
```

#### Flow Auto-Inject Knowledge Base ke AI
```
Request ke Seed AI masuk
→ Query DB: ambil profil toko (tenants)
→ Query DB: ambil semua produk aktif (products)
→ Query DB: ambil semua promo aktif & belum expired (promos)
→ Query DB: ambil semua metode pembayaran aktif (payment_methods)
→ Query DB: ambil semua FAQ aktif (faqs)
→ Query DB: ambil riwayat order user yang chat (orders by from_number)
→ Query DB: ambil slot konsultasi tersedia (consultation_slots)
→ Query DB: ambil ai_settings (prompt, nama agent, tone)
→ Build final system prompt dengan semua data di atas
→ Kirim ke Seed AI API
→ Return response
```

---

## System Design

### Architecture

```
┌─────────────────────────────────────────────┐
│              CLIENT (Browser)               │
│         Next.js Admin Panel (React)         │
└──────────────────┬──────────────────────────┘
                   │ HTTPS
┌──────────────────▼──────────────────────────┐
│           NEXT.JS SERVER (Vercel)           │
│                                             │
│  ┌─────────────┐    ┌────────────────────┐  │
│  │ App Router  │    │    API Routes      │  │
│  │  (Pages)    │    │  /api/webhook/wa   │  │
│  │             │    │  /api/products     │  │
│  │             │    │  /api/orders       │  │
│  │             │    │  /api/ai           │  │
│  └─────────────┘    └────────────────────┘  │
└────────┬────────────────────┬───────────────┘
         │                    │
┌────────▼──────┐    ┌────────▼──────────────┐
│   NEON DB     │    │    WA PROVIDER        │
│  (PostgreSQL) │    │  WAHA (Sumopod) atau  │
│  via Drizzle  │    │  Fonnte (Cloud)       │
└───────────────┘    └───────────────────────┘
                               │
                     ┌─────────▼─────────┐
                     │   SEED AI API     │
                     │   (Sumopod)       │
                     └───────────────────┘
```

### Database

#### Tabel: tenants
| Kolom | Tipe | Required | Keterangan |
|---|---|---|---|
| id | uuid | ✅ | Primary key |
| nama_toko | varchar | ✅ | Nama bisnis |
| deskripsi | text | | Deskripsi untuk AI |
| logo_url | varchar | | URL logo toko |
| link_shopee | varchar | | Link toko Shopee |
| link_tiktok | varchar | | Link TikTok Shop |
| wa_provider | enum | ✅ | waha / fonnte |
| wa_api_key | varchar | | API key provider |
| wa_session_id | varchar | | Session ID WAHA |
| paket | enum | ✅ | basic / pro |
| created_at | timestamp | ✅ | Waktu dibuat |

#### Tabel: products
| Kolom | Tipe | Required | Keterangan |
|---|---|---|---|
| id | uuid | ✅ | Primary key |
| tenant_id | uuid | ✅ | FK ke tenants |
| nama | varchar | ✅ | Nama produk |
| tipe | enum | ✅ | fisik / digital / jasa / konsultasi |
| harga | integer | ✅ | Harga dalam Rupiah |
| deskripsi | text | | Deskripsi untuk AI & bot |
| stok | integer | | Stok fisik; null = unlimited |
| durasi | varchar | | Estimasi waktu jasa/konsultasi |
| link_shopee | varchar | | Link produk di Shopee |
| link_tiktok | varchar | | Link produk di TikTok Shop |
| link_delivery | varchar | | Link download produk digital |
| aktif | boolean | ✅ | Toggle tampil di bot |

#### Tabel: promos
| Kolom | Tipe | Required | Keterangan |
|---|---|---|---|
| id | uuid | ✅ | Primary key |
| tenant_id | uuid | ✅ | FK ke tenants |
| judul | varchar | ✅ | Judul promo |
| deskripsi | text | ✅ | Deskripsi detail promo |
| tanggal_mulai | date | ✅ | Tanggal mulai promo |
| tanggal_berakhir | date | ✅ | Tanggal berakhir promo |
| aktif | boolean | ✅ | Toggle manual aktif/nonaktif |

#### Tabel: payment_methods
| Kolom | Tipe | Required | Keterangan |
|---|---|---|---|
| id | uuid | ✅ | Primary key |
| tenant_id | uuid | ✅ | FK ke tenants |
| tipe | enum | ✅ | transfer / qris |
| nama_bank | varchar | | Nama bank |
| nomor_rekening | varchar | | Nomor rekening |
| nama_pemilik | varchar | | Nama pemilik rekening |
| gambar_qris | varchar | | URL gambar QRIS statis |
| urutan | integer | ✅ | Urutan tampil ke user |
| aktif | boolean | ✅ | Toggle aktif/nonaktif |

#### Tabel: faqs
| Kolom | Tipe | Required | Keterangan |
|---|---|---|---|
| id | uuid | ✅ | Primary key |
| tenant_id | uuid | ✅ | FK ke tenants |
| pertanyaan | varchar | ✅ | Pertanyaan FAQ |
| jawaban | text | ✅ | Jawaban FAQ |
| aktif | boolean | ✅ | Toggle inject ke AI |

#### Tabel: orders
| Kolom | Tipe | Required | Keterangan |
|---|---|---|---|
| id | uuid | ✅ | Primary key |
| tenant_id | uuid | ✅ | FK ke tenants |
| from_number | varchar | ✅ | Nomor WA pemesan |
| from_name | varchar | | Nama pemesan |
| product_id | uuid | ✅ | FK ke products |
| jumlah | integer | ✅ | Jumlah order |
| total_harga | integer | ✅ | Total dalam Rupiah |
| alamat | text | | Alamat pengiriman (fisik) |
| bukti_transfer | varchar | | URL foto bukti transfer |
| payment_method_id | uuid | | FK ke payment_methods |
| status | enum | ✅ | pending / konfirmasi / proses / selesai / batal |
| created_at | timestamp | ✅ | Waktu order masuk |

#### Tabel: consultation_slots
| Kolom | Tipe | Required | Keterangan |
|---|---|---|---|
| id | uuid | ✅ | Primary key |
| tenant_id | uuid | ✅ | FK ke tenants |
| product_id | uuid | ✅ | FK ke products |
| tanggal | date | ✅ | Tanggal slot |
| jam_mulai | time | ✅ | Jam mulai |
| jam_selesai | time | ✅ | Jam selesai |
| status | enum | ✅ | tersedia / terbooking / diblokir |
| booked_by | varchar | | Nomor WA yang booking |

#### Tabel: consultation_requests
| Kolom | Tipe | Required | Keterangan |
|---|---|---|---|
| id | uuid | ✅ | Primary key |
| tenant_id | uuid | ✅ | FK ke tenants |
| from_number | varchar | ✅ | Nomor WA requester |
| product_id | uuid | ✅ | FK ke products |
| jadwal_request | text | ✅ | Jadwal bebas dari user |
| status | enum | ✅ | pending / approved / rejected |
| catatan_admin | text | | Saran jadwal alternatif |

#### Tabel: bot_settings
| Kolom | Tipe | Required | Keterangan |
|---|---|---|---|
| id | uuid | ✅ | Primary key |
| tenant_id | uuid | ✅ | FK ke tenants |
| greeting | text | ✅ | Pesan sambutan |
| pesan_offline | text | ✅ | Pesan di luar jam ops |
| jam_buka | time | ✅ | Jam mulai bot aktif |
| jam_tutup | time | ✅ | Jam bot nonaktif |
| delay_min | integer | ✅ | Delay min ms (default 3000) |
| delay_max | integer | ✅ | Delay max ms (default 9000) |
| typing_indicator | boolean | ✅ | Toggle simulasi mengetik |
| ai_enabled | boolean | ✅ | Toggle AI fallback |
| bahasa_default | enum | ✅ | id / en |

#### Tabel: ai_settings
| Kolom | Tipe | Required | Keterangan |
|---|---|---|---|
| id | uuid | ✅ | Primary key |
| tenant_id | uuid | ✅ | FK ke tenants |
| system_prompt | text | ✅ | Brief & instruksi untuk AI |
| nama_agent | varchar | ✅ | Nama custom AI agent |
| model | varchar | ✅ | Identifier model AI (e.g. gpt-4o) |
| tone | enum | ✅ | formal / semi-formal / santai |
| aktif | boolean | ✅ | Toggle AI on/off |

#### Tabel: chat_logs
| Kolom | Tipe | Required | Keterangan |
|---|---|---|---|
| id | uuid | ✅ | Primary key |
| tenant_id | uuid | ✅ | FK ke tenants |
| from_number | varchar | ✅ | Nomor WA pengirim |
| from_name | varchar | | Nama kontak |
| message | text | ✅ | Pesan dari user |
| reply | text | ✅ | Balasan bot |
| is_ai | boolean | ✅ | True jika reply dari AI |
| is_human | boolean | ✅ | True jika reply manual admin |
| timestamp | timestamp | ✅ | Waktu pesan |

### API

#### Auth
| Method | Endpoint | Deskripsi |
|---|---|---|
| POST | `/api/auth/login` | Login admin |
| POST | `/api/auth/logout` | Logout admin |
| GET | `/api/auth/session` | Cek session aktif |

#### WhatsApp
| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/whatsapp/status` | Status koneksi provider |
| GET | `/api/whatsapp/qr` | Ambil QR code WAHA |
| POST | `/api/whatsapp/connect` | Connect provider (API key Fonnte) |
| POST | `/api/whatsapp/disconnect` | Disconnect provider |
| POST | `/api/webhook/whatsapp` | Webhook penerima pesan masuk |

#### Produk
| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/products` | List semua produk |
| POST | `/api/products` | Tambah produk baru |
| PUT | `/api/products/[id]` | Update produk |
| DELETE | `/api/products/[id]` | Hapus produk |
| PATCH | `/api/products/[id]/toggle` | Toggle aktif/nonaktif |

#### Orders
| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/orders` | List semua order |
| GET | `/api/orders/[id]` | Detail order |
| PATCH | `/api/orders/[id]/status` | Update status order |
| POST | `/api/orders/[id]/confirm` | Konfirmasi pembayaran |
| POST | `/api/orders/[id]/reject` | Reject pembayaran |

#### Konsultasi
| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/consultations/slots` | List semua slot |
| POST | `/api/consultations/slots` | Tambah slot baru |
| DELETE | `/api/consultations/slots/[id]` | Hapus slot |
| PATCH | `/api/consultations/slots/[id]/block` | Blokir slot |
| GET | `/api/consultations/requests` | List request custom |
| PATCH | `/api/consultations/requests/[id]` | Approve/reject request |

#### AI
| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/ai/settings` | Ambil AI settings |
| PUT | `/api/ai/settings` | Update AI settings |
| POST | `/api/ai/preview` | Test preview prompt ke AI |
| GET | `/api/ai/knowledge-base` | Preview knowledge base yang akan di-inject |

---

## Tech Stack

### Frontend
| Teknologi | Versi | Keterangan |
|---|---|---|
| Next.js | 14+ | App Router, SSR, React Server Components |
| React | 18+ | UI library |
| Tailwind CSS | 3+ | Utility-first CSS |
| shadcn/ui | Latest | Komponen UI — Sheet, Toast, Table, dll |
| Framer Motion | Latest | Animasi slide-in, transisi halaman |
| next-intl | Latest | Internationalization Indonesia & Inggris |
| Lucide Icons | Latest | Icon set konsisten |

### Backend
| Teknologi | Versi | Keterangan |
|---|---|---|
| Next.js API Routes | 14+ | Server-side logic, webhook handler |
| Auth.js (NextAuth) | v5 | Autentikasi, session JWT |
| Drizzle ORM | Latest | Type-safe query builder & migrations |
| Neon DB | - | PostgreSQL serverless, region Singapore |
| Seed AI (Sumopod) | - | AI fallback untuk bot |
| WAHA Plus NOWEB | - | WA gateway self-hosted |
| Fonnte | - | WA gateway cloud (alternatif) |

### Infrastructure
| Komponen | Platform | Cost |
|---|---|---|
| Hosting FE + BE | Vercel (free tier) | Gratis |
| Database | Neon DB (free tier) | Gratis |
| WAHA Hosting | Sumopod Cloud 512MB | Rp 15.000/bln |
| AI | Seed AI Sumopod | Gratis |
| Domain (opsional) | Existing Velora ID | - |

**Total cost operasional: Rp 15.000 - 30.000/bulan**

---

## UI / UX

### Design Principles
- **Dark First** — dark mode sebagai default, tidak ada toggle light mode
- **Depth via Blur** — glassmorphism untuk menciptakan hierarki visual
- **Slide-in Interaction** — drawer dari kanan menggantikan semua popup modal
- **Minimal Distraction** — sidebar collapsed bisa disembunyikan untuk fokus kerja
- **Feedback Instant** — setiap aksi selalu ada respons visual (toast, loading, skeleton)

### Color Palette
| Token | Value | Penggunaan |
|---|---|---|
| `bg-primary` | `#0A0F1E` | Background utama |
| `bg-sidebar` | `#0D1526` | Background sidebar |
| `bg-card` | `rgba(255,255,255,0.05)` | Card & panel + blur |
| `border` | `rgba(255,255,255,0.08)` | Semua border |
| `accent-blue` | `#3B82F6` | CTA, active state, link |
| `accent-green` | `#10B981` | Success, badge aktif |
| `text-primary` | `#F1F5F9` | Teks utama |
| `text-secondary` | `#94A3B8` | Label, placeholder |
| `danger` | `#EF4444` | Error, delete, reject |
| `warning` | `#F59E0B` | Warning, pending |

### Komponen Utama
- **Sidebar** — fixed left, glassmorphism, collapsible, active state highlight
- **Drawer/Sheet** — slide-in dari kanan 420px, overlay gelap, close button + ESC
- **Table** — sortable column, pagination, row hover highlight, bulk action
- **Toast** — pojok kanan bawah, auto-dismiss 3 detik, tipe: success/error/warning/info
- **Badge** — status pill berwarna sesuai state (pending=kuning, aktif=hijau, dll)
- **Skeleton** — loading placeholder berbentuk sesuai konten aslinya
- **Kalender** — weekly view untuk slot konsultasi dengan color coding status

### Animasi
```
Drawer open   : x: 100% → x: 0, spring damping 25
Drawer close  : x: 0 → x: 100%, spring damping 25
Page enter    : opacity: 0 → 1, y: 8 → 0, duration 0.2s
Toast enter   : y: 20 → 0, opacity: 0 → 1
```

---

## Security

### Autentikasi & Sesi
- Login wajib untuk semua halaman — redirect ke `/login` jika belum auth
- Session JWT dengan expiry — auto logout saat expired
- Password di-hash menggunakan bcrypt sebelum disimpan
- Tidak ada registrasi mandiri — akun dibuat oleh Super Admin

### Webhook Security
- Setiap request ke `/api/webhook/whatsapp` wajib menyertakan signature header
- Signature divalidasi menggunakan HMAC-SHA256 dengan secret key
- Request tanpa signature atau signature invalid langsung ditolak (401)
- Rate limiting: maksimal 30 request per menit per nomor WA pengirim

### Data Security
- Semua environment variables disimpan di `.env.local` — tidak pernah di-commit
- Neon DB connection string hanya diakses di server-side (API Routes)
- WAHA/Fonnte API key tidak pernah dikirim ke client/browser
- HTTPS only — enforced otomatis oleh Vercel

### Anti-Ban WhatsApp
- Random delay reply 3-9 detik sebelum setiap balasan
- Typing indicator aktif selama delay berlangsung
- Bot nonaktif otomatis di luar jam operasional
- Rate limiting per nomor pengirim untuk cegah flood
- Rekomendasi: gunakan nomor WA aktif minimal 1-2 bulan
- Hindari blast ke lebih dari 50 kontak sekaligus

### Data Privacy
- Chat log di-auto-delete setelah X hari (configurable di Security Settings)
- Nomor WA user tidak dibagikan ke pihak ketiga
- Foto bukti transfer disimpan di private storage

---

## Rules

### Business Rules

**Produk**
- Produk tipe fisik wajib memiliki input stok — stok 0 tidak bisa diorder via bot
- Produk tipe digital wajib memiliki link delivery
- Produk tipe konsultasi harus punya slot tersedia sebelum bisa di-booking
- Harga produk minimal Rp 1.000

**Promo**
- Tanggal berakhir harus lebih besar dari tanggal mulai
- Promo otomatis nonaktif saat tanggal berakhir tercapai
- Promo aktif otomatis di-inject ke knowledge base AI

**Order**
- Order tidak bisa diubah setelah status Selesai atau Dibatalkan
- Konfirmasi pembayaran hanya bisa dilakukan oleh Admin
- Bukti transfer wajib ada sebelum Admin bisa konfirmasi

**Konsultasi**
- Satu slot hanya bisa di-book oleh satu user
- Slot yang sudah terbooking tidak bisa dihapus — hanya bisa diblokir
- Request custom masuk dengan status pending sampai Admin approve/reject
- Admin bisa suggest jadwal alternatif saat reject request

**Pembayaran**
- Minimal satu metode pembayaran harus aktif setiap saat
- Nomor rekening yang sama tidak bisa didaftarkan dua kali

### Validation Rules

**Form Produk**
- Nama produk: wajib, minimal 3 karakter, maksimal 100 karakter
- Harga: wajib, integer positif, minimal 1000
- Stok: wajib untuk tipe fisik, integer non-negatif
- Link Shopee/TikTok: opsional, harus berformat URL valid jika diisi
- Tipe produk: wajib dipilih sebelum form lain muncul

**Form Order**
- Alamat: wajib untuk produk tipe fisik
- Bukti transfer: format file jpg/png/webp, maksimal 5MB

**Form Konsultasi**
- Jam selesai harus lebih besar dari jam mulai
- Tanggal slot tidak boleh di masa lalu

**Bot Settings**
- delay_min minimal 1000ms (1 detik)
- delay_max minimal sama dengan delay_min
- delay_max maksimal 30000ms (30 detik)
- Jam tutup harus berbeda dari jam buka

**AI Settings**
- System prompt maksimal 2000 karakter
- Nama agent minimal 2 karakter, maksimal 30 karakter

### Permission Rules

| Aksi | Admin | Super Admin |
|---|---|---|
| Login dashboard | ✅ | ✅ |
| CRUD produk, promo, FAQ | ✅ (tenant sendiri) | ✅ (semua tenant) |
| Konfirmasi pembayaran | ✅ | ✅ |
| Kelola slot & booking | ✅ | ✅ |
| Edit AI & bot settings | ✅ | ✅ |
| Edit security settings | ✅ | ✅ |
| Lihat riwayat chat | ✅ (tenant sendiri) | ✅ (semua tenant) |
| Kelola tenant lain | ❌ | ✅ |
| Buat akun admin baru | ❌ | ✅ |

### System Constraints

**Performance**
- Response time API maksimal 3 detik untuk operasi CRUD normal
- Webhook harus return response dalam 5 detik (WAHA/Fonnte timeout)
- Knowledge base inject ke AI maksimal 4000 token total

**Kapasitas**
- Chat log disimpan maksimal 90 hari (default, configurable)
- Maksimal 50 produk aktif per tenant di free tier
- Maksimal 10 slot konsultasi per hari per tenant
- Maksimal 5 metode pembayaran per tenant

**Availability**
- Bot tetap berjalan meski dashboard tidak dibuka
- Jika WAHA/Fonnte disconnect — bot gagal silently, tidak crash app
- Health check endpoint tersedia di `/api/health` untuk monitoring

**Skalabilitas**
- Semua tabel menyertakan `tenant_id` — multi-tenant ready dari awal
- Schema Drizzle menggunakan migration — safe untuk perubahan schema
- Provider WA menggunakan abstraction layer — mudah tambah provider baru

---

*Velora ID — PROJECT BRIEF WA Chatbot Admin Panel — v2.0 FINAL — Maret 2026*
*ve-lora.my.id*
