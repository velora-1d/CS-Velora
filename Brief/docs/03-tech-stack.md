# Tech Stack & Arsitektur

## Stack Aktif
| Layer | Teknologi |
|---|---|
| App | Next.js App Router |
| Bahasa | TypeScript |
| UI | Tailwind CSS |
| Auth | NextAuth v5 |
| Database | PostgreSQL Neon |
| ORM | Drizzle |
| Validation | Zod |
| Toast | Sonner |
| Icon | Lucide React |
| WhatsApp Gateway | WAHA atau Fonnte |
| Payment | Pakasir/manual transfer |

## Batasan Arsitektur
- Project ini bukan Laravel/Vue/Inertia.
- Mutasi internal sebaiknya memakai server-side endpoint/action yang tervalidasi.
- API route dipakai untuk kebutuhan client fetch, webhook, gateway, dan integrasi eksternal.
- Jangan expose secret/API key ke client.
- Tenant isolation harus dicek di setiap query.

## Flow Sistem
```text
Tenant/Admin
  -> Next.js dashboard
  -> NextAuth session
  -> API/server logic
  -> Drizzle
  -> PostgreSQL Neon

Customer WhatsApp
  -> WAHA/Fonnte webhook
  -> webhook handler
  -> tenant lookup
  -> rules/AI/form handler
  -> send reply via active gateway
```

## Keputusan Katalog
Katalog dinamis menjadi source of truth baru. `products` lama hanya dipakai selama masa migrasi agar order, promo, konsultasi, dashboard, dan webhook tidak rusak mendadak.
