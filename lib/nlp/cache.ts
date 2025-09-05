// lib/nlp/cache.ts
// Small in-memory LRU cache with TTL (per server instance).

type Entry<T> = { value: T; expiresAt: number };

export class LruTtlCache<T> {
  private map = new Map<string, Entry<T>>();
  constructor(private max = 500, private ttlMs = 5 * 60 * 1000) {}

  get(key: string): T | undefined {
    const hit = this.map.get(key);
    if (!hit) return;
    if (hit.expiresAt < Date.now()) {
      this.map.delete(key);
      return;
    }
    // bump LRU
    this.map.delete(key);
    this.map.set(key, hit);
    return hit.value;
    }

  set(key: string, value: T) {
    if (this.map.size >= this.max) {
      const first = this.map.keys().next().value;
      if (first) this.map.delete(first);
    }
    this.map.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }
}

export function hashFor(lang: string, text: string) {
  // fast non-crypto hash is fine here
  let h = 2166136261 >>> 0;
  const s = `${lang}::${text}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h.toString(36);
}
