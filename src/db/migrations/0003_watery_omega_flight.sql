CREATE TABLE "business_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(150) NOT NULL,
	"greeting" text NOT NULL,
	"pesan_offline" text NOT NULL,
	"ai_enabled" boolean DEFAULT true NOT NULL,
	"system_prompt" text NOT NULL,
	"model" varchar(100) DEFAULT 'qwen-vl-plus' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "owner_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(100) NOT NULL,
	"value" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "owner_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
ALTER TABLE "tenant_types" DROP CONSTRAINT "tenant_types_key_unique";--> statement-breakpoint
ALTER TABLE "ai_settings" ALTER COLUMN "model" SET DATA TYPE varchar(100);--> statement-breakpoint
ALTER TABLE "ai_settings" ALTER COLUMN "model" SET DEFAULT 'gpt-4o';--> statement-breakpoint
ALTER TABLE "ai_settings" ADD COLUMN "provider" varchar(50) DEFAULT 'openai' NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_settings" ADD COLUMN "api_key" text;--> statement-breakpoint
ALTER TABLE "ai_settings" ADD COLUMN "base_url" text;--> statement-breakpoint
ALTER TABLE "tenant_types" ADD COLUMN "tenant_id" uuid;--> statement-breakpoint
ALTER TABLE "wa_sessions" ADD COLUMN "business_profile_id" uuid;--> statement-breakpoint
ALTER TABLE "business_profiles" ADD CONSTRAINT "business_profiles_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wa_sessions" ADD CONSTRAINT "wa_sessions_business_profile_id_business_profiles_id_fk" FOREIGN KEY ("business_profile_id") REFERENCES "public"."business_profiles"("id") ON DELETE no action ON UPDATE no action;