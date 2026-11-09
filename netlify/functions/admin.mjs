// API de administración: listado, asistencia, PDFs, configuración y sorteo de dorsales
import { store, getConfig, listInscritos, json } from "../lib/shared.mjs";

const PASSWORD = process.env.ADMIN_PASSWORD || "SocialRun2026";

export default async (req) => {
  const key = req.headers.get("x-admin-key") || "";
  if (key !== PASSWORD) return json({ error: "Contraseña incorrecta." }, 401);

  const s = store();
  const url = new URL(req.url);
  const action = url.searchParams.get("action") || "list";

  if (req.method === "GET") {
    if (action === "list") {
      const [cfg, inscritos, sorteo] = await Promise.all([
        getConfig(s),
        listInscritos(s),
        s.get("sorteo", { type: "json" }),
      ]);
      return json({ config: cfg, inscritos, sorteo: sorteo || null });
    }
    if (action === "pdf") {
      const id = url.searchParams.get("id") || "";
      const res = await s.getWithMetadata(`pdf/${id}`, { type: "arrayBuffer" });
      if (!res) return json({ error: "No hay PDF para esta inscripción." }, 404);
      const name = (res.metadata && res.metadata.name) || `autorizacion-${id}.pdf`;
      return new Response(res.data, {
        headers: {
          "content-type": "application/pdf",
          "content-disposition": `inline; filename="${name.replace(/"/g, "")}"`,
          "cache-control": "no-store",
        },
      });
    }
    return json({ error: "Acción no válida." }, 400);
  }

  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);
  const body = await req.json().catch(() => ({}));

  if (action === "presente") {
    const reg = await s.get(`insc/${body.id}`, { type: "json" });
    if (!reg) return json({ error: "Inscripción no encontrada." }, 404);
    reg.presente = !!body.presente;
    await s.setJSON(`insc/${body.id}`, reg);
    return json({ ok: true });
  }

  if (action === "delete") {
    await s.delete(`insc/${body.id}`);
    await s.delete(`pdf/${body.id}`);
    return json({ ok: true });
  }

  if (action === "config") {
    const cfg = await getConfig(s);
    if (body.max !== undefined) {
      const m = parseInt(body.max, 10);
      if (!Number.isInteger(m) || m < 1 || m > 2000) return json({ error: "Número de plazas no válido." }, 400);
      cfg.max = m;
    }
    if (body.abierto !== undefined) cfg.abierto = !!body.abierto;
    await s.setJSON("config", cfg);
    return json({ ok: true, config: cfg });
  }

  if (action === "sorteo") {
    // body.sorteo = { fecha, soloPresentes, ganadores:[{id,numero,nombre,inicial,...}], suplentes:[...], publicado }
    if (!body.sorteo || !Array.isArray(body.sorteo.ganadores)) return json({ error: "Sorteo no válido." }, 400);
    await s.setJSON("sorteo", body.sorteo);
    return json({ ok: true });
  }

  if (action === "reset-sorteo") {
    await s.delete("sorteo");
    return json({ ok: true });
  }

  return json({ error: "Acción no válida." }, 400);
};

export const config = { path: "/api/admin" };
