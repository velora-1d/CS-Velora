<div align="center">

  <img src="public/logo-velora.png" alt="CS-Velora Logo" width="110" style="border-radius: 18px; margin-bottom: 12px;" />

  # ⚡ CS-Velora
  ### *Smart AI WhatsApp Chatbot & Centralized Business Management Panel*

  [![Next.js](https://img.shields.io/badge/Next.js-16_App_Router-black?style=for-the-badge&logo=nextdotjs)](https://nextjs.org/)
  [![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
  [![PostgreSQL](https://img.shields.io/badge/Database-Neon_PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://neon.tech/)
  [![AI Engine](https://img.shields.io/badge/AI_Engine-Qwen_VL_Plus-FF6600?style=for-the-badge)](https://www.alibabacloud.com/)

  ---

  *Platform otomasi WhatsApp bisnis cerdas berbasis AI untuk UMKM, penyedia jasa, dan konsultan. Mengelola pesan, katalog produk, sistem booking, dan pembayaran otomatis dalam satu dashboard terpadu.*

</div>

---

## 🌟 Mengapa CS-Velora?

CS-Velora menghadirkan pengalaman kelola bisnis via WhatsApp yang modern, efisien, dan responsif tanpa hambatan teknis.

| Keunggulan | Deskripsi |
|---|---|
| 🤖 **Respon AI Alami & Cerdas** | Didukung AI Qwen VL yang memahami pertanyaan produk, harga, stok, dan FAQ secara kontekstual. |
| 🛡️ **Anti-Ban Built-in** | Simulasi jeda ketik alami (3–9 detik) dan pembatasan rate limit agar akun WhatsApp tetap aman. |
| ⚡ **Penjualan & Booking Otomatis** | Melayani order produk fisik/digital dan pengerjaan jasa/konsultasi slot-based 24/7. |
| 💳 **Pembayaran Multi-Channel** | Verifikasi transfer bank manual, QRIS statis, hingga integrasi payment gateway. |
| 🎨 **UI Modern & Fast** | Tampilan Dark Mode Glassmorphism dengan kemudahan navigasi slide-in drawer. |

---

## ✨ Fitur-Fitur Unggulan

### 📊 Dashboard Monitoring
Overview analitik real-time yang menampilkan statistik percakapan harian, status order, promo aktif, status koneksi WA, serta tindakan yang membutuhkan konfirmasi admin.

### 📱 WhatsApp Gateway & Health Monitor
- Pengoperasian instan via **Scan QR Code**.
- Dukungan provider **WAHA** & **Fonnte**.
- Health monitor otomatis yang memberikan peringatan jika koneksi WhatsApp terputus.

### 📦 Manajemen Produk Multi-Kategori
Dukungan berbagai tipe produk dalam satu platform:
- 🛍️ **Produk Fisik** (Manajemen stok & deskripsi)
- 💾 **Produk Digital** (Pengiriman lisensi/file)
- 🛠️ **Layanan Jasa** (Pemesanan pengerjaan)
- 💬 **Sesi Konsultasi** (Sistem booking slot & penyesuaian jadwal)

### 📅 Sistem Booking & Kalender Interaktif
- Pengaturan jam operasional & kuota slot konsultasi.
- Fitur *Request Custom Schedule* untuk jadwal khusus pelanggan.
- Tampilan kalender interaktif untuk memantau seluruh janji temu.

### 🤖 Dynamic AI Knowledge Base
- **Knowledge Auto-Sync**: Setiap data produk dan FAQ yang diperbarui admin langsung otomatis dipahami oleh AI.
- **AI Persona Customization**: Bebas menentukan gaya bahasa, instruksi dasar, dan kepribadian bot.
- **AI Test Playground**: Fitur simulator untuk menguji respon bot sebelum aktif secara live.

### 🛡️ Keamanan & Privasi
- Verifikasi keamanan webhook terintegrasi.
- Retensi data yang dapat dikustomisasi.
- Fitur *Whitelist* nomor pelanggan.

---

## 🏗️ Alur Sistem & Arsitektur

```
📱 WhatsApp Pelanggan ──► 📡 WA Gateway (WAHA / Fonnte)
                                 │
                                 ▼
                     ⚡ CS-Velora Admin Panel
                                 │
     ┌───────────────────────────┼───────────────────────────┐
     ▼                           ▼                           ▼
🤖 AI Engine             🗄️ Database Neon           📦 S3 Object Storage
(Qwen VL / Aliyun)       (Drizzle PostgreSQL)       (Bukti Transfer & Asset)
```

---

## 🎯 Panduan Singkat Penggunaan

1. **Hubungkan WhatsApp**
   Buka menu **WhatsApp**, scan QR Code dari perangkat Anda, dan bot siap melayani pelanggan.

2. **Atur Katalog & FAQ**
   Masukkan produk dan pertanyaan umum di menu **Produk** & **FAQ**. AI akan otomatis menggunakannya sebagai referensi jawaban.

3. **Pantau & Kelola Order**
   Pantau percakapan masuk, konfirmasi pembayaran, dan kelola booking konsultasi melalui satu dashboard terpusat.

---

## 👥 Tim & Pengembang

<div align="center">

| Role | Penanggung Jawab | Organisasi |
|---|---|---|
| **Project Lead & Owner** | **Mahin Utsman Nawawi** | **Velora ID** |

---

<p align="center">
  Crafted with passion by <b>Velora ID</b>
</p>

</div>
