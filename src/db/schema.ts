import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  date,
  time,
  pgEnum,
} from "drizzle-orm/pg-core";

// Enums
export const waProviderEnum = pgEnum("wa_provider", ["waha", "fonnte"]);
export const paketEnum = pgEnum("paket", ["basic", "pro"]);
export const productTypeEnum = pgEnum("product_type", ["fisik", "digital", "jasa", "konsultasi"]);
export const orderStatusEnum = pgEnum("order_status", ["pending", "konfirmasi", "proses", "selesai", "batal"]);
export const paymentTypeEnum = pgEnum("payment_type", ["transfer", "qris"]);
export const slotStatusEnum = pgEnum("slot_status", ["tersedia", "terbooking", "diblokir"]);
export const requestStatusEnum = pgEnum("request_status", ["pending", "approved", "rejected"]);
export const aiToneEnum = pgEnum("ai_tone", ["formal", "semi-formal", "santai"]);
export const bahasaEnum = pgEnum("bahasa", ["id", "en"]);
export const tenantStatusEnum = pgEnum("tenant_status", ["trial", "active", "suspended", "expired"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", ["pending", "active", "expired", "rejected"]);
export const announcementPriorityEnum = pgEnum("announcement_priority", ["low", "medium", "high"]);

// Tenants table
export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  namaToko: varchar("nama_toko", { length: 255 }).notNull(),
  deskripsi: text("deskripsi"),
  logoUrl: varchar("logo_url", { length: 500 }),
  linkShopee: varchar("link_shopee", { length: 500 }),
  linkTiktok: varchar("link_tiktok", { length: 500 }),
  waProvider: waProviderEnum("wa_provider").notNull(),
  waApiKey: varchar("wa_api_key", { length: 500 }),
  waSessionId: varchar("wa_session_id", { length: 255 }),
  waNumber: varchar("wa_number", { length: 30 }),
  paket: paketEnum("paket").notNull().default("basic"),
  status: tenantStatusEnum("status").notNull().default("trial"),
  trialEndsAt: timestamp("trial_ends_at"),
  suspendedAt: timestamp("suspended_at"),
  suspendReason: text("suspend_reason"),
  maxWaAccounts: integer("max_wa_accounts").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// WA Sessions table (Multi-WA support)
export const waSessions = pgTable("wa_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  sessionId: varchar("session_id", { length: 255 }).notNull(),
  waNumber: varchar("wa_number", { length: 30 }).notNull(),
  label: varchar("label", { length: 100 }),
  status: varchar("status", { length: 50 }).notNull().default("disconnected"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Users table (Admins & Owners)
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id), // Nullable for owner
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  nama: varchar("nama", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull().default("tenant"), // owner, tenant
  bahasa: bahasaEnum("bahasa").default("id"),
  aktif: boolean("aktif").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Products table
export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  nama: varchar("nama", { length: 255 }).notNull(),
  tipe: productTypeEnum("tipe").notNull(),
  harga: integer("harga").notNull(),
  deskripsi: text("deskripsi"),
  stok: integer("stok"),
  durasi: varchar("durasi", { length: 100 }),
  linkShopee: varchar("link_shopee", { length: 500 }),
  linkTiktok: varchar("link_tiktok", { length: 500 }),
  linkDelivery: varchar("link_delivery", { length: 500 }),
  aktif: boolean("aktif").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Promos table
export const promos = pgTable("promos", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  judul: varchar("judul", { length: 255 }).notNull(),
  deskripsi: text("deskripsi").notNull(),
  tanggalMulai: date("tanggal_mulai").notNull(),
  tanggalBerakhir: date("tanggal_berakhir").notNull(),
  aktif: boolean("aktif").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Payment methods table
export const paymentMethods = pgTable("payment_methods", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  tipe: paymentTypeEnum("tipe").notNull(),
  namaBank: varchar("nama_bank", { length: 100 }),
  nomorRekening: varchar("nomor_rekening", { length: 50 }),
  namaPemilik: varchar("nama_pemilik", { length: 255 }),
  gambarQris: varchar("gambar_qris", { length: 500 }),
  urutan: integer("urutan").notNull().default(0),
  aktif: boolean("aktif").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// FAQs table
export const faqs = pgTable("faqs", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  pertanyaan: varchar("pertanyaan", { length: 500 }).notNull(),
  jawaban: text("jawaban").notNull(),
  aktif: boolean("aktif").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Orders table
export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  fromNumber: varchar("from_number", { length: 30 }).notNull(),
  fromName: varchar("from_name", { length: 255 }),
  productId: uuid("product_id").references(() => products.id).notNull(),
  jumlah: integer("jumlah").notNull(),
  totalHarga: integer("total_harga").notNull(),
  alamat: text("alamat"),
  buktiTransfer: varchar("bukti_transfer", { length: 500 }),
  paymentMethodId: uuid("payment_method_id").references(() => paymentMethods.id),
  status: orderStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Consultation slots table
export const consultationSlots = pgTable("consultation_slots", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  productId: uuid("product_id").references(() => products.id).notNull(),
  tanggal: date("tanggal").notNull(),
  jamMulai: time("jam_mulai").notNull(),
  jamSelesai: time("jam_selesai").notNull(),
  status: slotStatusEnum("status").notNull().default("tersedia"),
  bookedBy: varchar("booked_by", { length: 30 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Consultation requests table
export const consultationRequests = pgTable("consultation_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  fromNumber: varchar("from_number", { length: 30 }).notNull(),
  productId: uuid("product_id").references(() => products.id).notNull(),
  jadwalRequest: text("jadwal_request").notNull(),
  status: requestStatusEnum("status").notNull().default("pending"),
  catatanAdmin: text("catatan_admin"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Bot settings table
export const botSettings = pgTable("bot_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull().unique(),
  greeting: text("greeting").notNull(),
  pesanOffline: text("pesan_offline").notNull(),
  jamBuka: time("jam_buka").notNull(),
  jamTutup: time("jam_tutup").notNull(),
  delayMin: integer("delay_min").notNull().default(3000),
  delayMax: integer("delay_max").notNull().default(9000),
  typingIndicator: boolean("typing_indicator").notNull().default(true),
  aiEnabled: boolean("ai_enabled").notNull().default(true),
  bahasaDefault: bahasaEnum("bahasa_default").notNull().default("id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// AI settings table
export const aiSettings = pgTable("ai_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull().unique(),
  systemPrompt: text("system_prompt").notNull(),
  namaAgent: varchar("nama_agent", { length: 100 }).notNull(),
  model: varchar("model", { length: 50 }).notNull().default("gpt-4o"),
  tone: aiToneEnum("tone").notNull().default("semi-formal"),
  aktif: boolean("aktif").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Chat logs table
export const chatLogs = pgTable("chat_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  fromNumber: varchar("from_number", { length: 30 }).notNull(),
  fromName: varchar("from_name", { length: 255 }),
  message: text("message").notNull(),
  reply: text("reply"),
  isAi: boolean("is_ai").notNull().default(false),
  isHuman: boolean("is_human").notNull().default(false),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

// Subscriptions table (Billing)
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  paket: paketEnum("paket").notNull(),
  amount: integer("amount").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: subscriptionStatusEnum("status").notNull().default("pending"),
  buktiTransfer: varchar("bukti_transfer", { length: 500 }),
  confirmedAt: timestamp("confirmed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Announcements table
export const announcements = pgTable("announcements", {
  id: uuid("id").primaryKey().defaultRandom(),
  judul: varchar("judul", { length: 255 }).notNull(),
  isi: text("isi").notNull(),
  prioritas: announcementPriorityEnum("prioritas").notNull().default("medium"),
  targetAll: boolean("target_all").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Announcement Targets table (if targetAll is false or for tracking read status)
export const announcementTargets = pgTable("announcement_targets", {
  id: uuid("id").primaryKey().defaultRandom(),
  announcementId: uuid("announcement_id").references(() => announcements.id).notNull(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  readAt: timestamp("read_at"),
});

// Owner Payment Info table (For tenants to transfer to)
export const ownerPaymentInfo = pgTable("owner_payment_info", {
  id: uuid("id").primaryKey().defaultRandom(),
  tipe: paymentTypeEnum("tipe").notNull(),
  namaBank: varchar("nama_bank", { length: 100 }),
  nomorRekening: varchar("nomor_rekening", { length: 50 }),
  namaPemilik: varchar("nama_pemilik", { length: 255 }),
  gambarQris: varchar("gambar_qris", { length: 500 }),
  aktif: boolean("aktif").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Type exports
export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;
export type WaSession = typeof waSessions.$inferSelect;
export type NewWaSession = typeof waSessions.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Promo = typeof promos.$inferSelect;
export type NewPromo = typeof promos.$inferInsert;
export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type NewPaymentMethod = typeof paymentMethods.$inferInsert;
export type Faq = typeof faqs.$inferSelect;
export type NewFaq = typeof faqs.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type ConsultationSlot = typeof consultationSlots.$inferSelect;
export type NewConsultationSlot = typeof consultationSlots.$inferInsert;
export type ConsultationRequest = typeof consultationRequests.$inferSelect;
export type NewConsultationRequest = typeof consultationRequests.$inferInsert;
export type BotSetting = typeof botSettings.$inferSelect;
export type NewBotSetting = typeof botSettings.$inferInsert;
export type AiSetting = typeof aiSettings.$inferSelect;
export type NewAiSetting = typeof aiSettings.$inferInsert;
export type ChatLog = typeof chatLogs.$inferSelect;
export type NewChatLog = typeof chatLogs.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
export type Announcement = typeof announcements.$inferSelect;
export type NewAnnouncement = typeof announcements.$inferInsert;
export type AnnouncementTarget = typeof announcementTargets.$inferSelect;
export type NewAnnouncementTarget = typeof announcementTargets.$inferInsert;
export type OwnerPaymentInfo = typeof ownerPaymentInfo.$inferSelect;
export type NewOwnerPaymentInfo = typeof ownerPaymentInfo.$inferInsert;
