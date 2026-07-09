CREATE TYPE "public"."catalog_field_type" AS ENUM('text', 'textarea', 'number', 'date', 'select', 'toggle', 'url', 'upload');--> statement-breakpoint
CREATE TABLE "catalog_fields" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"label" varchar(120) NOT NULL,
	"field_key" varchar(80) NOT NULL,
	"field_type" "catalog_field_type" NOT NULL,
	"options" jsonb,
	"is_required" boolean DEFAULT false NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "catalog_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"nama" varchar(255) NOT NULL,
	"harga" integer,
	"aktif" boolean DEFAULT true NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"nomor" varchar(30) NOT NULL,
	"nama" varchar(255),
	"catatan" text,
	"is_new" boolean DEFAULT true NOT NULL,
	"last_interaction" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"catalog_label" varchar(100) NOT NULL,
	"order_label" varchar(100) NOT NULL,
	"field_template" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tenant_types_key_unique" UNIQUE("key")
);
--> statement-breakpoint
INSERT INTO "tenant_types" ("key", "name", "catalog_label", "order_label", "field_template") VALUES
('bisnis', 'Bisnis Umum', 'Produk', 'Pesanan', '[
  {"label":"Nama","fieldKey":"nama","fieldType":"text","isRequired":true,"isSystem":true},
  {"label":"Harga","fieldKey":"harga","fieldType":"number","isRequired":true,"isSystem":true},
  {"label":"Status Aktif","fieldKey":"aktif","fieldType":"toggle","isRequired":true,"isSystem":true},
  {"label":"Deskripsi","fieldKey":"deskripsi","fieldType":"textarea"},
  {"label":"Stok","fieldKey":"stok","fieldType":"number"},
  {"label":"Gambar","fieldKey":"gambar","fieldType":"upload"},
  {"label":"Kategori","fieldKey":"kategori","fieldType":"text"}
]'::jsonb),
('klinik', 'Klinik', 'Layanan', 'Pendaftaran', '[
  {"label":"Nama Layanan","fieldKey":"nama","fieldType":"text","isRequired":true,"isSystem":true},
  {"label":"Tarif","fieldKey":"harga","fieldType":"number","isRequired":true,"isSystem":true},
  {"label":"Status Aktif","fieldKey":"aktif","fieldType":"toggle","isRequired":true,"isSystem":true},
  {"label":"Deskripsi","fieldKey":"deskripsi","fieldType":"textarea"},
  {"label":"Durasi","fieldKey":"durasi","fieldType":"text"},
  {"label":"Dokter/Terapis","fieldKey":"praktisi","fieldType":"text"}
]'::jsonb),
('travel', 'Travel', 'Paket', 'Booking', '[
  {"label":"Nama Paket","fieldKey":"nama","fieldType":"text","isRequired":true,"isSystem":true},
  {"label":"Harga","fieldKey":"harga","fieldType":"number","isRequired":true,"isSystem":true},
  {"label":"Status Aktif","fieldKey":"aktif","fieldType":"toggle","isRequired":true,"isSystem":true},
  {"label":"Destinasi","fieldKey":"destinasi","fieldType":"text"},
  {"label":"Durasi","fieldKey":"durasi","fieldType":"text"},
  {"label":"Kuota","fieldKey":"kuota","fieldType":"number"},
  {"label":"Tanggal","fieldKey":"tanggal","fieldType":"date"}
]'::jsonb),
('properti', 'Properti', 'Unit', 'Lead', '[
  {"label":"Nama Unit","fieldKey":"nama","fieldType":"text","isRequired":true,"isSystem":true},
  {"label":"Harga","fieldKey":"harga","fieldType":"number","isRequired":true,"isSystem":true},
  {"label":"Status Aktif","fieldKey":"aktif","fieldType":"toggle","isRequired":true,"isSystem":true},
  {"label":"Lokasi","fieldKey":"lokasi","fieldType":"text"},
  {"label":"Luas","fieldKey":"luas","fieldType":"number"},
  {"label":"Kamar","fieldKey":"kamar","fieldType":"number"}
]'::jsonb),
('pendidikan', 'Pendidikan', 'Program', 'Pendaftaran', '[
  {"label":"Nama Program","fieldKey":"nama","fieldType":"text","isRequired":true,"isSystem":true},
  {"label":"Biaya","fieldKey":"harga","fieldType":"number","isRequired":true,"isSystem":true},
  {"label":"Status Aktif","fieldKey":"aktif","fieldType":"toggle","isRequired":true,"isSystem":true},
  {"label":"Level","fieldKey":"level","fieldType":"select","options":["pemula","menengah","lanjutan"]},
  {"label":"Durasi","fieldKey":"durasi","fieldType":"text"},
  {"label":"Jadwal","fieldKey":"jadwal","fieldType":"text"}
]'::jsonb)
ON CONFLICT ("key") DO NOTHING;
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "harga_asli" integer;--> statement-breakpoint
UPDATE "orders" SET "harga_asli" = "total_harga" WHERE "harga_asli" IS NULL;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "harga_asli" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "diskon_amount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "promo_id" uuid;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "tenant_type_id" uuid;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "catalog_label" varchar(100) DEFAULT 'Produk' NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "order_label" varchar(100) DEFAULT 'Pesanan' NOT NULL;--> statement-breakpoint
UPDATE "tenants"
SET "tenant_type_id" = (SELECT "id" FROM "tenant_types" WHERE "key" = 'bisnis'),
    "catalog_label" = 'Produk',
    "order_label" = 'Pesanan'
WHERE "tenant_type_id" IS NULL;
--> statement-breakpoint
INSERT INTO "catalog_fields" (
  "tenant_id",
  "label",
  "field_key",
  "field_type",
  "options",
  "is_required",
  "is_system",
  "sort_order"
)
SELECT
  "tenants"."id",
  "field"."value"->>'label',
  "field"."value"->>'fieldKey',
  ("field"."value"->>'fieldType')::catalog_field_type,
  "field"."value"->'options',
  COALESCE(("field"."value"->>'isRequired')::boolean, false),
  COALESCE(("field"."value"->>'isSystem')::boolean, false),
  ("field"."ordinality" - 1)::integer
FROM "tenants"
JOIN "tenant_types" ON "tenant_types"."id" = "tenants"."tenant_type_id"
CROSS JOIN LATERAL jsonb_array_elements("tenant_types"."field_template")
  WITH ORDINALITY AS "field"("value", "ordinality");
--> statement-breakpoint
ALTER TABLE "catalog_fields" ADD CONSTRAINT "catalog_fields_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_items" ADD CONSTRAINT "catalog_items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_catalog_fields_tenant_id" ON "catalog_fields" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_catalog_fields_tenant_key" ON "catalog_fields" USING btree ("tenant_id","field_key");--> statement-breakpoint
CREATE INDEX "idx_catalog_items_tenant_id" ON "catalog_items" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_catalog_items_tenant_active" ON "catalog_items" USING btree ("tenant_id","aktif");--> statement-breakpoint
CREATE INDEX "idx_catalog_items_tenant_created" ON "catalog_items" USING btree ("tenant_id","created_at");--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_promo_id_promos_id_fk" FOREIGN KEY ("promo_id") REFERENCES "public"."promos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_tenant_type_id_tenant_types_id_fk" FOREIGN KEY ("tenant_type_id") REFERENCES "public"."tenant_types"("id") ON DELETE no action ON UPDATE no action;
