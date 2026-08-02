# 🚀 CS-Velora — WA Chatbot Admin Panel

> **v2.0 FINAL — Velora ID Internal & SaaS Platform**

CS-Velora adalah platform **WhatsApp Chatbot & Admin Panel** modern berbasis AI yang dirancang untuk membantu UMKM, penyedia jasa, konsultan, dan bisnis lokal mengelola alur komunikasi pelanggan, katalog produk, sistem booking, serta pembayaran secara otomatis dan terpusat.

Dibangun dengan **Next.js 16 (App Router)**, **React 19**, **Drizzle ORM**, **Neon DB (PostgreSQL)**, serta terintegrasi dengan **Aliyun MaaS / Qwen VL** AI engine dan WhatsApp Gateway (**WAHA** / **Fonnte**).

---

## 📋 Daftar Isi

- [Fitur Utama](#-fitur-utama)
- [Teknologi & Tech Stack](#-teknologi--tech-stack)
- [Struktur Direktori Proyek](#-struktur-direktori-proyek)
- [Panduan Instalasi & Penggunaan](#-panduan-instalasi--penggunaan)
- [Konfigurasi Environment (.env.local)](#-konfigurasi-environment-envlocal)
- [Migrasi & Skema Database](#-migrasi--skema-database)
- [Deployment via Docker](#-deployment-via-docker)
- [Fitur Keamanan & Anti-Ban WA](#-fitur-keamanan--anti-ban-wa)
- [Kontak & Tim](#-kontak--tim)

---

## ✨ Fitur Utama

### 📊 1. Centralized Dashboard
- **Statistik Real-time**: Monitoring jumlah chat harian, order masuk, produk aktif, dan promo berjalan.
- **Status Koneksi WA**: Indikator status koneksi WhatsApp Gateway (Connected / Disconnected / Scanning QR).
- **Pending Action Notifications**: Notifikasi cepat untuk pembayaran butuh verifikasi, order baru, dan pengajuan jadwal custom.

### 📱 2. WhatsApp Provider & Health Monitor
- **Multi-Provider Support**: Mendukung **WAHA (WhatsApp HTTP API)** dan **Fonnte**.
- **QR Code Scanner**: Scan QR Code langsung di dashboard untuk menghubungkan nomor WhatsApp.
- **Health Monitor**: Sistem pemantauan status koneksi otomatis yang akan memberikan alert jika bot terputus.

### 📦 3. Manajemen Katalog & Produk Multi-Tipe
- Tipe Produk yang didukung:
  - 🛍️ **Fisik** (Produk bertipe fisik dengan penanganan stok)
  - 💾 **Digital** (File download / akses lisensi)
  - 🛠️ **Jasa** (Layanan pengerjaan)
  - 💬 **Konsultasi** (Layanan berbasis waktu/slot)
- **Slide-in Drawer**: Form CRUD interaktif yang bersih dan cepat tanpa modal popup.

### 🎉 4. Manajemen Promo & Voucher
- Pengaturan diskon bertipe persentase (%) atau nominal (Rp).
- Periode aktif promo (tanggal mulai & berakhir).
- Auto-apply promo secara cerdas oleh AI Chatbot saat transaksi terjadi.

### 📅 5. Sistem Booking & Konsultasi
- **Manajemen Slot**: Pengaturan jam operasional dan kuota konsultasi per slot waktu.
- **Request Custom Schedule**: Alur pengajuan jadwal khusus oleh pelanggan yang dapat disetujui/ditolak oleh admin.
- **Kalender Interaktif**: Tampilan visual seluruh janji temu dan booking terjadual.

### 💳 6. Pembayaran & Gateway Integrasi
- **Multi-Method Payment**: Transfer Bank Manual, QRIS Statis, serta integrasi **Pakasir Payment Gateway**.
- **Storage Bukti Transfer**: Integrasi dengan **S3 / RustFS Object Storage** untuk penyimpanan aman file bukti pembayaran.
- **Konfirmasi Otomatis & Manual**: Alur verifikasi status pembayaran langsung dari panel order.

### 🤖 7. AI Engine & Dynamic Knowledge Base
- **Powered by Qwen VL / Aliyun MaaS**: Kemampuan pemrosesan teks dan instruksi secara alami.
- **Dynamic FAQ Injection**: Setiap FAQ yang ditambahkan oleh admin otomatis disuntikkan ke Knowledge Base AI tanpa perlu training ulang model.
- **Persona & Prompt Customization**: Pengaturan instruksi dasar (System Prompt), nama bot, dan gaya bahasa bot.
- **AI Playground & Preview**: Fitur uji coba balasan AI langsung dari panel sebelum diterapkan secara live.

### 💬 8. Riwayat Percakapan (Chat Audit Logs)
- Log percakapan WhatsApp lengkap per nomor pelanggan.
- Fitur pencarian pesan dan filter berdasarkan waktu atau nomor HP.

---

## 🛠️ Teknologi & Tech Stack

| Kategori | Teknologi | Deskripsi |
|---|---|---|
| **Framework UI** | Next.js 16 (App Router), React 19 | Server Components & Client Hydration |
| **Bahasa** | TypeScript, Node.js 22 | Type safety penuh di seluruh codebase |
| **Styling & Design** | Tailwind CSS v4, Framer Motion, Radix UI | Dark Mode default, Glassmorphic UI aesthetics |
| **Database & ORM** | PostgreSQL (Neon Database Serverless), Drizzle ORM | Serverless relational database dengan Drizzle Kit |
| **Authentication** | Auth.js v5 (NextAuth.js v5 beta), Bcryptjs | JWT Session-based Auth & Role Management |
| **AI Integration** | Aliyun MaaS (Qwen VL Plus / Seed AI Engine) | OpenAI-compatible API client untuk AI Chatbot |
| **WhatsApp Gateway** | WAHA (WhatsApp HTTP API), Fonnte | WhatsApp Multi-Device HTTP API Connection |
| **Object Storage** | S3 API / RustFS (`@aws-sdk/client-s3`) | Storage terpusat untuk gambar produk, QRIS & bukti transfer |
| **i18n & Export** | Next-Intl, jsPDF, XLSX, Recharts | Dukungan Bahasa Indonesia/Inggris, Export PDF/Excel, Grafik |

---

## 📁 Struktur Direktori Proyek

```
CS-Velora/
├── .env.local             # Konfigurasi variabel lingkungan lokal
├── Dockerfile             # Multi-stage Docker build config
├── drizzle.config.ts      # Konfigurasi Drizzle ORM
├── package.json           # Dependensi & script proyek
├── run-migrate.js         # Script eksekusi migrasi database
├── PROJECT-BRIEFL.md      # Dokumentasi spesifikasi proyek v2.0
├── scripts/               # Helper scripts (seeding & testing)
├── src/
│   ├── app/               # Next.js App Router (Halaman & API Routes)
│   │   ├── (auth)/        # Route autentikasi (login, register)
│   │   ├── dashboard/     # Halaman utama statistik
│   │   ├── whatsapp/      # Koneksi WA & QR Scanner
│   │   ├── products/      # CRUD Katalog produk
│   │   ├── promos/        # Pengaturan promo
│   │   ├── orders/        # Manajemen order & konfirmasi
│   │   ├── consultations/ # Slot booking & kalender
│   │   ├── payments/      # Rekening & QRIS
│   │   ├── faqs/          # FAQ & Knowledge Base AI
│   │   ├── ai-settings/   # Config System Prompt & Persona
│   │   ├── bot-settings/  # Config delay, operational hours
│   │   ├── security/      # Config rate limit & whitelist
│   │   ├── chats/         # Log riwayat percakapan
│   │   └── api/           # Endpoint API internal & Webhook WA
│   ├── auth.ts            # Konfigurasi Auth.js / NextAuth
│   ├── components/        # Component UI (Radix, Drawer, Cards, Tables)
│   ├── db/                # Schema Drizzle & Migrations
│   │   ├── schema.ts      # Schema definisi tabel PostgreSQL
│   │   └── migrations/    # File SQL migrasi
│   ├── lib/               # Utility functions (AI client, S3, WAHA, formatters)
│   └── types/             # TypeScript type definitions
```

---

## 🚀 Panduan Instalasi & Penggunaan

### 1. Prasyarat System
Pastikan komputer/server Anda telah terpasang:
- **Node.js**: `v20.x` atau `v22.x`
- **Package Manager**: `pnpm` (direkomendasikan) atau `npm` / `yarn`
- **Database**: PostgreSQL (direkomendasikan menggunakan [Neon Database](https://neon.tech))

### 2. Clone Repository & Install Dependensi
```bash
git clone https://github.com/velora-id/CS-Velora.git
cd CS-Velora

# Menggunakan pnpm
pnpm install

# atau menggunakan npm
npm install
```

### 3. Setup Variabel Lingkungan
Salin file konfigurasi environment dan sesuaikan isinya:
```bash
cp .env.local .env
```
Isi variabel yang dibutuhkan di file `.env.local` (lihat panduan [Konfigurasi Environment](#-konfigurasi-environment-envlocal)).

### 4. Eksekusi Migrasi Database
Jalankan migrasi schema ke PostgreSQL menggunakan Drizzle Kit:
```bash
# Push schema langsung ke Database Neon
npx drizzle-kit push

# Atau jalankan script migrasi internal
node run-migrate.js
```

### 5. Jalankan Server Development
```bash
pnpm dev
# atau
npm run dev
```
Akses aplikasi melalui browser di **`http://localhost:3000`**.

---

## ⚙️ Konfigurasi Environment (`.env.local`)

Berikut adalah template lengkap variabel lingkungan yang dibutuhkan oleh CS-Velora:

```env
# Database Connection (Neon DB Serverless)
DATABASE_URL="postgresql://user:password@ep-host.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

# NextAuth v5 Configuration
NEXTAUTH_SECRET="ganti_dengan_secret_acak_yang_aman"
AUTH_SECRET="ganti_dengan_secret_acak_yang_aman"
AUTH_TRUST_HOST=true
NEXT_APP_URL="http://localhost:3000"

# WhatsApp Gateway — WAHA (WhatsApp HTTP API)
WAHA_API_URL="https://your-waha-instance.domain.com"
WAHA_API_KEY="your_waha_api_key"

# WhatsApp Gateway — Fonnte (Optional Alternative)
FONNTE_TOKEN="your_fonnte_token"
FONNTE_API_KEY="your_fonnte_api_key"

# AI Provider (Aliyun MaaS / Qwen VL Engine)
SEED_AI_URL="https://ws-xxxx.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1"
SEED_AI_API_KEY="sk-ws-your-api-key"
SEED_AI_MODEL="qwen-vl-plus"

# Object Storage (S3 / RustFS)
STORAGE_PROVIDER=RustFS
S3_ENDPOINT="https://s3.your-domain.com"
S3_ACCESS_KEY="your_access_key"
S3_SECRET_KEY="your_secret_key"
S3_BUCKET="chat"
S3_REGION="ap-southeast-1"
S3_PUBLIC_URL="https://s3.your-domain.com/chat"

# Payment Gateway (Pakasir)
PAKASIR_PROJECT_SLUG="your_project_slug"
PAKASIR_API_KEY="your_pakasir_api_key"

# Webhook & Cron Security
WHATSAPP_WEBHOOK_SECRET="your_webhook_secret"
CRON_SECRET="your_cron_secret"
INTERNAL_API_SECRET="your_internal_secret"
```

---

## 🐳 Deployment via Docker

CS-Velora dilengkapi dengan `Dockerfile` multi-stage build berukuran ringan berbasis Node 22 Alpine.

### Build Image Docker
```bash
docker build -t cs-velora:latest .
```

### Jalankan Container
```bash
docker run -d \
  --name cs-velora-app \
  -p 3000:3000 \
  --env-file .env.local \
  cs-velora:latest
```

---

## 🛡️ Fitur Keamanan & Anti-Ban WA

Mengingat WhatsApp memiliki regulasi ketat terkait otomatisasi pesan, CS-Velora dilengkapi dengan fitur perlindungan bawaan:

1. **Human-like Response Delay Simulation**: Bot memberikan jeda pengetikan acak antara **3 hingga 9 detik** sebelum membalas pesan, meniru perilaku mengetik manusia.
2. **Rate Limiting**: Membatasi jumlah pesan masukan per nomor telepon untuk mencegah serangan spam/flood.
3. **Operational Hours Window**: Pengaturan jam aktif bot; pesan masuk di luar jam kerja dapat dibalas dengan pesan offline otomatis atau ditunda.
4. **Webhook Signature Validation**: Memastikan pesan masukan berasal dari server WhatsApp Gateway resmi yang terverifikasi.

---

## 📞 Kontak & Tim

- **Project Owner**: Velora ID (Mahin Utsman Nawawi)
- **Dokumentasi Internal**: [`PROJECT-BRIEFL.md`](PROJECT-BRIEFL.md)
- **Status Proyek**: Internal Dogfooding (Fase 1) ➔ Commercial Multi-tenant SaaS (Fase 2)

---

<p center align="center">
  Developed with ❤️ by <b>Velora ID Team</b>
</p>
