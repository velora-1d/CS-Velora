CREATE TYPE "public"."ai_tone" AS ENUM('formal', 'semi-formal', 'santai');--> statement-breakpoint
CREATE TYPE "public"."announcement_priority" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."bahasa" AS ENUM('id', 'en');--> statement-breakpoint
CREATE TYPE "public"."diskon_type" AS ENUM('persen', 'nominal');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending', 'konfirmasi', 'proses', 'selesai', 'batal');--> statement-breakpoint
CREATE TYPE "public"."paket" AS ENUM('basic', 'pro');--> statement-breakpoint
CREATE TYPE "public"."payment_type" AS ENUM('transfer', 'qris');--> statement-breakpoint
CREATE TYPE "public"."product_type" AS ENUM('fisik', 'digital', 'jasa', 'konsultasi');--> statement-breakpoint
CREATE TYPE "public"."promo_target_type" AS ENUM('all', 'pilihan');--> statement-breakpoint
CREATE TYPE "public"."promo_type" AS ENUM('produk', 'voucher');--> statement-breakpoint
CREATE TYPE "public"."request_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."slot_status" AS ENUM('tersedia', 'terbooking', 'diblokir');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('pending', 'active', 'expired', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."tenant_status" AS ENUM('trial', 'active', 'suspended', 'expired');--> statement-breakpoint
CREATE TYPE "public"."wa_provider" AS ENUM('waha', 'fonnte');--> statement-breakpoint
CREATE TABLE "ai_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"system_prompt" text NOT NULL,
	"nama_agent" varchar(100) NOT NULL,
	"model" varchar(50) DEFAULT 'gpt-4o' NOT NULL,
	"tone" "ai_tone" DEFAULT 'semi-formal' NOT NULL,
	"aktif" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ai_settings_tenant_id_unique" UNIQUE("tenant_id")
);
--> statement-breakpoint
CREATE TABLE "announcement_targets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"announcement_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"read_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"judul" varchar(255) NOT NULL,
	"isi" text NOT NULL,
	"prioritas" "announcement_priority" DEFAULT 'medium' NOT NULL,
	"target_all" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bot_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"greeting" text NOT NULL,
	"pesan_offline" text NOT NULL,
	"jam_buka" time NOT NULL,
	"jam_tutup" time NOT NULL,
	"delay_min" integer DEFAULT 3000 NOT NULL,
	"delay_max" integer DEFAULT 9000 NOT NULL,
	"typing_indicator" boolean DEFAULT true NOT NULL,
	"ai_enabled" boolean DEFAULT true NOT NULL,
	"bahasa_default" "bahasa" DEFAULT 'id' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "bot_settings_tenant_id_unique" UNIQUE("tenant_id")
);
--> statement-breakpoint
CREATE TABLE "chat_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"from_number" varchar(30) NOT NULL,
	"from_name" varchar(255),
	"message" text NOT NULL,
	"reply" text,
	"is_ai" boolean DEFAULT false NOT NULL,
	"is_human" boolean DEFAULT false NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consultation_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"from_number" varchar(30) NOT NULL,
	"product_id" uuid NOT NULL,
	"jadwal_request" text NOT NULL,
	"status" "request_status" DEFAULT 'pending' NOT NULL,
	"catatan_admin" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consultation_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"tanggal" date NOT NULL,
	"jam_mulai" time NOT NULL,
	"jam_selesai" time NOT NULL,
	"status" "slot_status" DEFAULT 'tersedia' NOT NULL,
	"booked_by" varchar(30),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "faqs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"pertanyaan" varchar(500) NOT NULL,
	"jawaban" text NOT NULL,
	"aktif" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"from_number" varchar(30) NOT NULL,
	"from_name" varchar(255),
	"product_id" uuid NOT NULL,
	"jumlah" integer NOT NULL,
	"total_harga" integer NOT NULL,
	"alamat" text,
	"bukti_transfer" varchar(500),
	"payment_method_id" uuid,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "owner_payment_info" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tipe" "payment_type" NOT NULL,
	"nama_bank" varchar(100),
	"nomor_rekening" varchar(50),
	"nama_pemilik" varchar(255),
	"gambar_qris" varchar(500),
	"aktif" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_methods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"tipe" "payment_type" NOT NULL,
	"nama_bank" varchar(100),
	"nomor_rekening" varchar(50),
	"nama_pemilik" varchar(255),
	"gambar_qris" varchar(500),
	"urutan" integer DEFAULT 0 NOT NULL,
	"aktif" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"nama" varchar(255) NOT NULL,
	"tipe" "product_type" NOT NULL,
	"harga" integer NOT NULL,
	"harga_coret" integer,
	"diskon_persen" integer,
	"deskripsi" text,
	"stok" integer,
	"durasi" varchar(100),
	"link_shopee" varchar(500),
	"link_tiktok" varchar(500),
	"link_delivery" varchar(500),
	"aktif" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "promo_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"promo_id" uuid NOT NULL,
	"product_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "promos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"judul" varchar(255) NOT NULL,
	"deskripsi" text NOT NULL,
	"tipe" "promo_type" DEFAULT 'produk' NOT NULL,
	"kode_voucher" varchar(50),
	"diskon_tipe" "diskon_type" DEFAULT 'persen' NOT NULL,
	"diskon_value" integer DEFAULT 0 NOT NULL,
	"min_pembelian" integer DEFAULT 0,
	"max_potongan" integer,
	"target_tipe" "promo_target_type" DEFAULT 'all' NOT NULL,
	"tanggal_mulai" date NOT NULL,
	"tanggal_berakhir" date NOT NULL,
	"aktif" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"paket" "paket" NOT NULL,
	"amount" integer NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"status" "subscription_status" DEFAULT 'pending' NOT NULL,
	"bukti_transfer" varchar(500),
	"confirmed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nama_toko" varchar(255) NOT NULL,
	"deskripsi" text,
	"logo_url" varchar(500),
	"link_shopee" varchar(500),
	"link_tiktok" varchar(500),
	"wa_provider" "wa_provider" NOT NULL,
	"wa_api_key" varchar(500),
	"wa_session_id" varchar(255),
	"wa_number" varchar(30),
	"pakasir_project_slug" varchar(255),
	"pakasir_api_key" varchar(255),
	"paket" "paket" DEFAULT 'basic' NOT NULL,
	"status" "tenant_status" DEFAULT 'trial' NOT NULL,
	"trial_ends_at" timestamp,
	"suspended_at" timestamp,
	"suspend_reason" text,
	"max_wa_accounts" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"email" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"nama" varchar(255) NOT NULL,
	"role" varchar(50) DEFAULT 'tenant' NOT NULL,
	"bahasa" "bahasa" DEFAULT 'id',
	"aktif" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "wa_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"session_id" varchar(255) NOT NULL,
	"wa_number" varchar(30) NOT NULL,
	"label" varchar(100),
	"status" varchar(50) DEFAULT 'disconnected' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_settings" ADD CONSTRAINT "ai_settings_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcement_targets" ADD CONSTRAINT "announcement_targets_announcement_id_announcements_id_fk" FOREIGN KEY ("announcement_id") REFERENCES "public"."announcements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcement_targets" ADD CONSTRAINT "announcement_targets_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bot_settings" ADD CONSTRAINT "bot_settings_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_logs" ADD CONSTRAINT "chat_logs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultation_requests" ADD CONSTRAINT "consultation_requests_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultation_requests" ADD CONSTRAINT "consultation_requests_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultation_slots" ADD CONSTRAINT "consultation_slots_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultation_slots" ADD CONSTRAINT "consultation_slots_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faqs" ADD CONSTRAINT "faqs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_payment_method_id_payment_methods_id_fk" FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_methods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_products" ADD CONSTRAINT "promo_products_promo_id_promos_id_fk" FOREIGN KEY ("promo_id") REFERENCES "public"."promos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_products" ADD CONSTRAINT "promo_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promos" ADD CONSTRAINT "promos_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wa_sessions" ADD CONSTRAINT "wa_sessions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;