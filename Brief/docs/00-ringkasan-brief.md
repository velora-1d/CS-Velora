# Ringkasan Brief

## Arah Produk
CS Velora adalah admin panel WhatsApp chatbot multi-tenant untuk bisnis lokal. Fokus utama sekarang adalah mengubah katalog dari produk fixed menjadi katalog dinamis berbasis template tipe bisnis.

## Stack yang Dipakai
- Frontend/backend: Next.js App Router
- Bahasa: TypeScript
- Auth: NextAuth v5
- Database: PostgreSQL Neon
- ORM: Drizzle
- UI: Tailwind CSS + komponen lokal/shadcn-style
- AI: server-side LLM integration, tidak boleh expose API key ke client
- WhatsApp gateway: WAHA atau Fonnte
- Payment: Pakasir/manual transfer

## Dokumen yang Dipakai
- `01-menu-fitur.md`: struktur menu dan fitur per area
- `02-katalog-dinamis.md`: spesifikasi utama katalog multi-template
- `03-tech-stack.md`: stack dan batasan arsitektur
- `04-database-schema.md`: rancangan schema target
- `05-flow-bot-ai.md`: flow WhatsApp, AI, rules, dan form collection
- `06-security.md`: aturan security, tenant isolation, webhook, rate limit

## Dokumen yang Dihapus
Dokumen lama dipadatkan karena sebagian masih mengarah ke Laravel, Vue/Inertia, route non-Next.js, atau duplikat dengan dokumen inti di atas.

## Prioritas Implementasi
1. Tambah `tenant_types`, `catalog_fields`, dan `catalog_items`.
2. Seed template tipe bisnis.
3. Buat API katalog dinamis.
4. Ubah UI Produk menjadi Katalog dinamis.
5. Migrasi data `products` lama ke `catalog_items`.
6. Pindahkan dependency order, promo, konsultasi dari `product_id` ke `catalog_item_id`.
