# Flow Bot & AI

## Pesan Masuk
```text
Customer WhatsApp
  -> WAHA/Fonnte webhook
  -> validasi signature/token
  -> cari tenant dari session/provider
  -> upsert contact
  -> buka/lanjutkan conversation
  -> cek pending form
  -> cek rules
  -> ambil katalog aktif
  -> ambil FAQ/knowledge base
  -> panggil AI jika perlu
  -> validasi output
  -> delay random
  -> kirim balasan
  -> log pesan
```

## Katalog untuk AI
AI membaca `catalog_items` aktif tenant. Payload katalog minimal berisi:
- `nama`
- `harga`
- `data` field dinamis yang relevan
- status aktif

Item nonaktif tidak boleh masuk konteks AI.

## Rules Engine
Trigger awal:
- keyword match;
- intent manual;
- status contact;
- pending form;
- fallback jika AI confidence rendah.

Aksi awal:
- balas otomatis;
- eskalasi ke operator;
- mulai form collection;
- tag contact;
- buat order/pendaftaran.

## Form Collection
Rules bisa punya `form_fields` JSONB. Jika AI atau rule memulai form, conversation menyimpan:
- `pending_form`
- `pending_form_data`
- field aktif yang sedang ditanya

Setelah lengkap, sistem membuat order/pendaftaran sesuai tipe bisnis tenant.

## Delay Chat
Setiap pesan keluar memakai delay random per tenant.

```text
delay = random(delay_min, delay_max)
```

Default: 3-8 detik. Pesan burst dan pesan identik berulang dilarang.

## Fallback AI
- Jika AI error, kirim fallback message.
- Jika topik pembayaran/komplain serius, arahkan ke manusia.
- Jika confidence rendah, eskalasi.
