// src/lib/env.ts
import fs from "fs";
import path from "path";

/**
 * Mendapatkan nilai environment variable.
 * Jika di process.env nilainya kosong/tidak ada (misal tertimpa env kosong oleh system shell),
 * fungsi ini akan mem-parse file .env.local secara manual untuk mengambil nilai aslinya.
 */
export function getEnvFallback(key: string): string {
  // Cek di process.env terlebih dahulu
  if (process.env[key]) {
    return process.env[key]!;
  }

  const files = [".env.local", ".env"];
  for (const filename of files) {
    try {
      const filePath = path.join(process.cwd(), filename);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf-8");
        const lines = content.split("\n");
        for (const line of lines) {
          const trimmed = line.trim();
          // Lewati komentar atau baris kosong
          if (trimmed.startsWith("#") || !trimmed.includes("=")) {
            continue;
          }
          
          const [k, ...v] = trimmed.split("=");
          if (k.trim() === key) {
            // Bersihkan tanda kutip ganda atau tunggal di ujung nilai
            return v.join("=").trim().replace(/^['"]|['"]$/g, "");
          }
        }
      }
    } catch (err) {
      console.error(`[env.ts] Gagal membaca manual ${filename} untuk key "${key}":`, err);
    }
  }

  return "";
}
