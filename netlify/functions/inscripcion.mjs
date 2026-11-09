// API pública: contador de plazas (GET) e inscripción (POST)
import { store, getConfig, listInscritos, json, norm } from "../lib/shared.mjs";

const NIVELES = ["paseo", "trote", "ritmo"];
const MAX_PDF_BYTES = 4 * 1024 * 1024;

export default async (req) => {
  const s = store();

  if (req.method === "GET") {
    const [cfg, inscritos, sorteo] = await Promise.all([
      getConfig(s),
      listInscritos(s),
      s.get("sorteo", { type: "json" }),
    ]);
    const publico =
      sorteo && sorteo.publicado
        ? sorteo.ganadores.map((g) => ({ nombre: g.nombre, inicial: g.inicial, numero: g.numero }))
        : null;
    return json({
      inscritos: inscritos.length,
      max: cfg.max,
      abierto: cfg.abierto && inscritos.length < cfg.max,
      ganadores: publico,
    });
  }

  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "No hemos podido leer el formulario. Vuelve a intentarlo." }, 400);
  }

  const nombre = String(body.nombre || "").trim().slice(0, 60);
  const apellidos = String(body.apellidos || "").trim().slice(0, 90);
  const telefono = String(body.telefono || "").replace(/[^\d+]/g, "").slice(0, 16);
  const edad = parseInt(body.edad, 10);
  const nivel = String(body.nivel || "");
  const imagen = body.imagen === "si" ? "si" : body.imagen === "no" ? "no" : "";

  if (nombre.length < 2) return json({ error: "Escribe tu nombre." }, 400);
  if (apellidos.length < 2) return json({ error: "Escribe tus apellidos." }, 400);
  if (!Number.isInteger(edad) || edad < 4 || edad > 99) return json({ error: "Indica una edad válida." }, 400);
  if (telefono.replace(/\D/g, "").length < 9) return json({ error: "Escribe un teléfono de contacto de al menos 9 cifras." }, 400);
  if (!NIVELES.includes(nivel)) return json({ error: "Elige tu ritmo." }, 400);
  if (!imagen) return json({ error: "Indica si autorizas el uso de imagen." }, 400);
  if (body.privacidad !== true) return json({ error: "Necesitas aceptar la política de protección de datos." }, 400);

  const menor = edad < 18;
  let pdfBytes = null;
  if (menor) {
    const data = body.pdf && typeof body.pdf.data === "string" ? body.pdf.data : "";
    if (!data) return json({ error: "Al ser menor de edad, adjunta la autorización firmada en PDF." }, 400);
    try {
      pdfBytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
    } catch {
      return json({ error: "El PDF adjunto no es válido." }, 400);
    }
    const head = String.fromCharCode(...pdfBytes.slice(0, 4));
    if (head !== "%PDF") return json({ error: "El archivo adjunto tiene que ser un PDF." }, 400);
    if (pdfBytes.length > MAX_PDF_BYTES) return json({ error: "El PDF pesa más de 4 MB. Reduce su tamaño y vuelve a subirlo." }, 400);
  }

  const [cfg, inscritos] = await Promise.all([getConfig(s), listInscritos(s)]);
  if (!cfg.abierto) return json({ error: "Las inscripciones están cerradas." }, 409);
  if (inscritos.length >= cfg.max) return json({ error: "Se han completado todas las plazas." }, 409);

  const dup = inscritos.find(
    (i) =>
      i.telefono.replace(/\D/g, "").slice(-9) === telefono.replace(/\D/g, "").slice(-9) &&
      norm(i.nombre) === norm(nombre) &&
      norm(i.apellidos) === norm(apellidos)
  );
  if (dup) return json({ error: `Ya estás inscrito/a con el número ${dup.numero}.`, numero: dup.numero }, 409);

  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const registro = {
    id,
    fecha: new Date().toISOString(),
    nombre,
    apellidos,
    edad,
    telefono,
    nivel,
    imagen,
    privacidad: true,
    menor,
    pdf: menor ? String(body.pdf.name || "autorizacion.pdf").slice(0, 80) : null,
    presente: false,
  };

  if (pdfBytes) await s.set(`pdf/${id}`, pdfBytes, { metadata: { name: registro.pdf } });
  await s.setJSON(`insc/${id}`, registro);

  const actual = await listInscritos(s);
  const yo = actual.find((i) => i.id === id);
  return json({ ok: true, numero: yo ? yo.numero : actual.length, inscritos: actual.length, max: cfg.max });
};

export const config = { path: "/api/inscripcion" };
