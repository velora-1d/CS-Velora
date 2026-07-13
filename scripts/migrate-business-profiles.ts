import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/db/schema";
import { sql as drizzleSql, eq } from "drizzle-orm";
import * as path from "path";
import * as fs from "fs";

// Load dotenv
const envPath = path.join(__dirname, "../.env.local");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  content.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const [k, ...v] = trimmed.split("=");
      process.env[k.trim()] = v.join("=").trim().replace(/^['"]|['"]$/g, "");
    }
  });
}

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const sqlClient = neon(dbUrl);
const db = drizzle(sqlClient, { schema });

async function main() {
  console.log("=== STARTING DATABASE MIGRATION ===");

  // 1. Create table business_profiles raw SQL
  console.log("Creating business_profiles table...");
  await sqlClient`
    CREATE TABLE IF NOT EXISTS "business_profiles" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
      "name" varchar(150) NOT NULL,
      "greeting" text NOT NULL,
      "pesan_offline" text NOT NULL,
      "ai_enabled" boolean DEFAULT true NOT NULL,
      "system_prompt" text NOT NULL,
      "model" varchar(100) DEFAULT 'qwen-vl-plus' NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL
    );
  `;

  // 2. Add column business_profile_id to wa_sessions
  console.log("Adding business_profile_id to wa_sessions table...");
  await sqlClient`
    ALTER TABLE "wa_sessions" ADD COLUMN IF NOT EXISTS "business_profile_id" uuid REFERENCES "business_profiles"("id") ON DELETE SET NULL;
  `;

  // 2.5 Add column tenant_type_id to business_profiles
  console.log("Adding tenant_type_id to business_profiles table...");
  await sqlClient`
    ALTER TABLE "business_profiles" ADD COLUMN IF NOT EXISTS "tenant_type_id" uuid REFERENCES "tenant_types"("id") ON DELETE SET NULL;
  `;

  // 3. Query all tenants
  console.log("Fetching all tenants...");
  const activeTenants = await db.select().from(schema.tenants);
  console.log(`Found ${activeTenants.length} tenants.`);

  for (const tenant of activeTenants) {
    console.log(`Processing tenant ${tenant.id} (${tenant.namaToko})...`);

    // Get existing bot settings
    const botSetting = await db.query.botSettings.findFirst({
      where: eq(schema.botSettings.tenantId, tenant.id),
    });

    // Get existing AI settings
    const aiSetting = await db.query.aiSettings.findFirst({
      where: eq(schema.aiSettings.tenantId, tenant.id),
    });

    // Check if they already have any business profiles
    const existingProfiles = await db.query.businessProfiles.findMany({
      where: eq(schema.businessProfiles.tenantId, tenant.id),
    });

    let profileId: string;

    if (existingProfiles.length === 0) {
      console.log(`No business profile found for tenant ${tenant.id}. Creating default...`);

      // Fallback values
      const name = aiSetting?.namaAgent || "CS Utama";
      const greeting = botSetting?.greeting || "Halo! Selamat datang di layanan kami. Ada yang bisa kami bantu?";
      const pesanOffline = botSetting?.pesanOffline || "Maaf, saat ini kami sedang offline. Pesan Anda akan dibalas setelah kami online kembali.";
      const aiEnabled = botSetting?.aiEnabled !== false;
      const systemPrompt = aiSetting?.systemPrompt || "Anda adalah asisten virtual yang ramah.";
      const model = aiSetting?.model || "qwen-vl-plus";

      // Insert default business profile
      const [newProfile] = await db.insert(schema.businessProfiles).values({
        tenantId: tenant.id,
        name,
        greeting,
        pesanOffline,
        aiEnabled,
        systemPrompt,
        model,
      }).returning();

      profileId = newProfile.id;
      console.log(`Created default profile with ID: ${profileId}`);
    } else {
      profileId = existingProfiles[0].id;
      console.log(`Found existing business profile. Using ID: ${profileId}`);
    }

    // Connect all existing tenant's WA sessions to this business profile if they are not connected yet
    console.log(`Linking WA sessions to profile ${profileId}...`);
    await db.update(schema.waSessions)
      .set({ businessProfileId: profileId })
      .where(
        eq(schema.waSessions.tenantId, tenant.id)
      );
  }

  console.log("=== MIGRATION COMPLETED SUCCESSFULLY ===");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
