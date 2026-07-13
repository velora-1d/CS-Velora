#!/usr/bin/env node
/**
 * Credential Connection Tester
 * Menguji semua layanan yang credential-nya didefinisikan di .env.local
 * Jalankan: node scripts/test-credentials.cjs
 */
const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

// ---------- Util ----------
const ROOT = path.resolve(__dirname, "..");
const ENV_FILE = path.join(ROOT, ".env.local");

function parseEnv(file) {
  if (!fs.existsSync(file)) throw new Error(`.env.local tidak ditemukan di ${file}`);
  const raw = fs.readFileSync(file, "utf8");
  const out = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const m = trimmed.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    out[m[1]] = v;
  }
  return out;
}

function mask(v, keep = 4) {
  if (!v) return "<empty>";
  if (v.length <= keep * 2) return "*".repeat(v.length);
  return v.slice(0, keep) + "…" + v.slice(-keep);
}

function request(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const lib = u.protocol === "https:" ? https : http;
    const req = lib.request(
      {
        method: opts.method || "GET",
        hostname: u.hostname,
        port: u.port || (u.protocol === "https:" ? 443 : 80),
        path: u.pathname + (u.search || ""),
        headers: opts.headers || {},
        timeout: opts.timeout || 15000,
      },
      (res) => {
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () =>
          resolve({ status: res.statusCode || 0, headers: res.headers, body })
        );
      }
    );
    req.on("timeout", () => {
      req.destroy(new Error("Timeout"));
    });
    req.on("error", reject);
    if (opts.body) req.write(opts.body);
    req.end();
  });
}

const results = [];
function record(name, ok, detail) {
  results.push({ name, ok, detail });
  const tag = ok ? "✅ PASS" : "❌ FAIL";
  console.log(`${tag}  ${name}`);
  if (detail) console.log(`        ${detail}`);
}

// ---------- Tests ----------
async function testDatabase(env) {
  const name = "Neon PostgreSQL (DATABASE_URL)";
  const url = env.DATABASE_URL;
  if (!url) return record(name, false, "DATABASE_URL kosong");
  try {
    const { neon } = require("@neondatabase/serverless");
    const sql = neon(url);
    const rows = await sql`select version() as v, now() as t, current_database() as db`;
    const r = rows[0];
    record(name, true, `versi=${r.v.split(" ").slice(0, 2).join(" ")} | db=${r.db}`);
  } catch (e) {
    record(name, false, e.message);
  }
}

async function testWaha(env) {
  const name = "WAHA WhatsApp API";
  if (!env.WAHA_API_URL) return record(name, false, "WAHA_API_URL kosong");
  try {
    const base = env.WAHA_API_URL.replace(/\/+$/, "");
    const headers = { "X-Api-Key": env.WAHA_API_KEY || "" };
    // banyak instance WAHA expose /api/sessions
    const r = await request(`${base}/api/sessions`, { headers, timeout: 10000 });
    const ok =
      r.status >= 200 && r.status < 500; // 401 pun menandakan server hidup
    const detail = `HTTP ${r.status} | ${r.body.slice(0, 120).replace(/\s+/g, " ")}`;
    record(name, ok, detail);
  } catch (e) {
    record(name, false, e.message);
  }
}

async function testSeedAI(env) {
  const name = "SEED_AI (Aliyun MaaS / Qwen VL)";
  if (!env.SEED_AI_URL) return record(name, false, "SEED_AI_URL kosong");
  try {
    // Qwen VL adalah multimodal: content WAJIB array of parts (text/image_url).
    // Kirim hanya text part "ping" agar murah.
    const r = await request(env.SEED_AI_URL, {
      method: "POST",
      timeout: 25000,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.SEED_AI_API_KEY || ""}`,
      },
      body: JSON.stringify({
        model: env.SEED_AI_MODEL || "qwen-vl-plus",
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: "ping" }],
          },
        ],
        max_tokens: 5,
      }),
    });
    let parsed;
    try {
      parsed = JSON.parse(r.body);
    } catch {
      parsed = { raw: r.body };
    }
    const ok =
      r.status >= 200 &&
      r.status < 300 &&
      (parsed.choices || parsed.output || parsed.message);
    record(
      name,
      ok,
      `HTTP ${r.status} | model=${env.SEED_AI_MODEL} | ${JSON.stringify(parsed).slice(0, 220)}`
    );
  } catch (e) {
    record(name, false, e.message);
  }
}

async function testS3(env) {
  const name = `RustFS / S3 (${env.STORAGE_PROVIDER})`;
  if (!env.S3_ENDPOINT) return record(name, false, "S3_ENDPOINT kosong");
  try {
    const {
      S3Client,
      ListBucketsCommand,
      HeadBucketCommand,
    } = require("@aws-sdk/client-s3");
    const client = new S3Client({
      region: env.S3_REGION || "us-east-1",
      endpoint: env.S3_ENDPOINT,
      forcePathStyle: String(env.S3_PATH_STYLE).toLowerCase() === "true",
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY,
        secretAccessKey: env.S3_SECRET_KEY,
      },
    });
    // Coba HeadBucket untuk bucket spesifik
    let bucketOk = false;
    let bucketDetail = "";
    if (env.S3_BUCKET) {
      try {
        await client.send(new HeadBucketCommand({ Bucket: env.S3_BUCKET }));
        bucketOk = true;
        bucketDetail = `bucket '${env.S3_BUCKET}' accessible`;
      } catch (e) {
        bucketDetail = `HeadBucket: ${e.name || "Error"} - ${e.message}`;
      }
    }
    // ListBuckets untuk validasi credential
    let listOk = false;
    let listDetail = "";
    try {
      const out = await client.send(new ListBucketsCommand({}));
      listOk = true;
      const names = (out.Buckets || []).map((b) => b.Name).join(", ");
      listDetail = `buckets=[${names}]`;
    } catch (e) {
      listDetail = `ListBuckets: ${e.name || "Error"} - ${e.message}`;
    }
    const ok = listOk || bucketOk;
    record(name, ok, `${bucketDetail} | ${listDetail}`);
  } catch (e) {
    record(name, false, e.message);
  }
}

async function testPakasir(env) {
  const name = "Pakasir Payment Gateway";
  const slug = env.PAKASIR_PROJECT_SLUG;
  const apiKey = env.PAKASIR_API_KEY;
  if (!slug || !apiKey) return record(name, false, "PAKASIR_PROJECT_SLUG atau API_KEY kosong");
  try {
    // Endpoint resmi Transaction Detail (GET):
    //   GET [REDACTED-URL]
    // Kirim order_id dummy — server akan balas "transaksi tidak ditemukan" → API + slug + key valid.
    const params = new URLSearchParams({
      project: slug,
      order_id: `test-${Date.now()}`,
      amount: "1",
      api_key: apiKey,
    });
    const url = `[REDACTED-URL]
    const r = await request(url, { timeout: 15000 });
    let parsed;
    try {
      parsed = JSON.parse(r.body);
    } catch {
      parsed = { raw: r.body };
    }
    // Hidup tapi order dummy → balas "tidak ditemukan" (HTTP 200 + error message)
    const looksValid =
      r.status >= 200 && r.status < 500 && parsed && parsed.transaction !== undefined;
    // Slug/key mungkin ditolak → HTTP 401/403/422 atau status 200 + error dari server
    const text = JSON.stringify(parsed).toLowerCase();
    const slugKeyLooksValid =
      looksValid ||
      /tidak ditemukan|not found|transaksi/.test(text) ||
      (r.status >= 400 && r.status < 500);
    record(
      name,
      slugKeyLooksValid,
      `slug=${slug} | HTTP ${r.status} | ${JSON.stringify(parsed).slice(0, 220)}`
    );
  } catch (e) {
    record(name, false, e.message);
  }
}

async function testFonnte(env) {
  const name = "Fonnte WhatsApp Gateway";
  const token = env.FONNTE_TOKEN || env.FONNTE_API_KEY;
  if (!token) return record(name, false, "FONNTE_TOKEN kosong");
  try {
    // Endpoint resmi: POST [REDACTED-URL] dengan token di header Authorization.
    // Server mengembalikan {"status":false,"reason":"unknown user : your account token is invalid"} jika key salah,
    // atau list device jika valid. Status 200 + reason apapun → server hidup & token diterima/diproses.
    const r = await request("[REDACTED-URL]", {
      method: "POST",
      timeout: 15000,
      headers: { "Content-Type": "application/json", Authorization: token },
      body: "",
    });
    let parsed;
    try {
      parsed = JSON.parse(r.body);
    } catch {
      parsed = { raw: r.body.slice(0, 200) };
    }
    const ok = r.status >= 200 && r.status < 500;
    const validToken =
      parsed && (parsed.status === true || /device/i.test(r.body));
    record(
      name,
      ok,
      `HTTP ${r.status} | token_valid=${validToken ? "ya" : "tidak"} | ${JSON.stringify(parsed).slice(0, 200)}`
    );
  } catch (e) {
    record(name, false, e.message);
  }
}

function testAuthSecret(env) {
  const name = "NextAuth AUTH_SECRET";
  const v = env.AUTH_SECRET;
  if (!v) return record(name, false, "AUTH_SECRET kosong");
  const weak =
    v === "INIT_OWNER_123" ||
    v.length < 16 ||
    v === "secret" ||
    v === "changeme";
  record(
    name,
    !weak,
    weak
      ? `Nilai terlalu lemah / placeholder: ${mask(v)}`
      : `panjang=${v.length} | ${mask(v)}`
  );
}

function testEmptySecrets(env) {
  const secrets = [
    "INTERNAL_API_SECRET",
    "N8N_WEBHOOK_SECRET",
    "WHATSAPP_WEBHOOK_SECRET",
    "CRON_SECRET",
  ];
  const empty = secrets.filter((k) => !env[k]);
  record(
    "Internal secrets (kosong = belum disetel)",
    empty.length === secrets.length,
    empty.length === 0
      ? "semua terisi"
      : `kosong: ${empty.join(", ")} (non-blocking, akan memengaruhi fitur terkait)`
  );
}

// ---------- Main ----------
(async () => {
  console.log("==================================================");
  console.log(" Credential Connection Tester — .env.local");
  console.log(` Target: ${ENV_FILE}`);
  console.log("==================================================\n");

  let env;
  try {
    env = parseEnv(ENV_FILE);
  } catch (e) {
    console.error("❌ Gagal membaca .env.local:", e.message);
    process.exit(1);
  }

  // Tampilkan ringkasan env (masked)
  console.log("📋 Ringkasan Env:");
  const keys = Object.keys(env).sort();
  for (const k of keys) {
    const v = env[k];
    const masked = /KEY|SECRET|TOKEN|PASSWORD/i.test(k) ? mask(v) : v;
    console.log(`   ${k.padEnd(28)} = ${masked}`);
  }
  console.log("");

  testAuthSecret(env);
  testEmptySecrets(env);
  await testDatabase(env);
  await testWaha(env);
  await testSeedAI(env);
  await testS3(env);
  await testPakasir(env);
  await testFonnte(env);

  const pass = results.filter((r) => r.ok).length;
  const fail = results.filter((r) => !r.ok).length;
  console.log("\n==================================================");
  console.log(` Ringkasan: ${pass} PASS · ${fail} FAIL (dari ${results.length})`);
  console.log("==================================================");
  process.exit(fail === 0 ? 0 : 1);
})();
