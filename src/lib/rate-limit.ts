/**
 * Simple in-memory rate limiter.
 * Tidak cocok untuk multi-instance/cluster — gunakan Redis untuk production skala besar.
 * Untuk single server (VPS/Coolify), ini sudah cukup.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

/**
 * @param key - Identifier unik (IP address, email, dsb)
 * @param limit - Max request per window
 * @param windowMs - Waktu window dalam ms (default: 15 menit)
 * @returns { allowed: boolean, remaining: number }
 */
export function rateLimit(key: string, limit: number, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: limit - entry.count };
}

// Bersihkan entri yang sudah expired setiap 1 jam
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) store.delete(key);
  }
}, 60 * 60 * 1000);
