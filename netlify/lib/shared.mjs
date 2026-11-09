import { getStore } from "@netlify/blobs";

export const DEFAULT_CONFIG = { max: 100, abierto: true };

export function store() {
  return getStore({ name: "socialrun-2026", consistency: "strong" });
}

export async function getConfig(s) {
  const cfg = await s.get("config", { type: "json" });
  return { ...DEFAULT_CONFIG, ...(cfg || {}) };
}

export async function listInscritos(s) {
  const { blobs } = await s.list({ prefix: "insc/" });
  const items = await Promise.all(blobs.map((b) => s.get(b.key, { type: "json" })));
  return items
    .filter(Boolean)
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.id.localeCompare(b.id))
    .map((it, i) => ({ ...it, numero: i + 1 }));
}

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

export const norm = (v) =>
  String(v || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
