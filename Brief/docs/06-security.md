# Security

## Auth
- Dashboard memakai NextAuth v5.
- Session wajib dicek di semua endpoint internal.
- Role owner dan tenant harus dipisah.
- Tenant user tidak boleh akses tenant lain.

## Tenant Isolation
- Semua query operasional wajib filter `tenant_id`.
- Super admin/owner tetap harus eksplisit saat akses lintas tenant.
- Response API tidak boleh membocorkan data tenant lain.

## Webhook
- Webhook WAHA/Fonnte wajib validasi signature/token.
- Webhook harus idempotent.
- Return cepat; proses berat dipisah ke job/async handler jika sudah tersedia.

## Secret
- API key WA, Pakasir, AI, dan database tidak boleh dikirim ke client.
- Jangan log secret, token, password, atau payload sensitif.
- `.env` tidak boleh masuk git.

## Rate Limit
Endpoint berikut wajib rate limit:
- auth;
- webhook;
- AI preview/generate;
- send message;
- public form/order.

## Validasi Input
- Semua mutation wajib validasi server.
- Field dinamis katalog divalidasi berdasarkan `catalog_fields`.
- `field_key` harus snake_case dan unik per tenant.
- Output user-generated content wajib di-escape saat ditampilkan.
