# Social Run San Miguel de Salinas 2026 — web para Netlify

## Qué incluye
- `index.html` — web pública: cartel, cuenta atrás, guirnalda de plazas (contador), ritmos, plan de la tarde, recorrido (mapa + Google Earth + Strava), sorteo de dorsales, formulario de inscripción y organizadores.
- `admin.html` — panel de administración (entra en `tu-web.netlify.app/admin.html`).
- `netlify/functions/` — servidor de inscripciones y administración (guarda los datos en Netlify Blobs).
- `autorizacion-menores-social-run.pdf` — plantilla de autorización que descargan los menores.

## Cómo publicarla (GitHub + Netlify, igual que las otras webs)
1. Sube **todo el contenido de esta carpeta** a un repositorio nuevo de GitHub.
2. En Netlify: *Add new site → Import an existing project* → elige el repositorio. No hace falta cambiar nada de la configuración de build (ya viene en `netlify.toml`).
3. En *Site configuration → Environment variables* crea `ADMIN_PASSWORD` con la contraseña que quieras para el panel y vuelve a desplegar (*Deploys → Trigger deploy*).
   - Si no la creas, la contraseña por defecto es `SocialRun2026` (cámbiala).

> Importante: arrastrar la carpeta a Netlify Drop NO sirve, porque las funciones (inscripción y admin) necesitan el despliegue desde GitHub.

## Panel de administración
- **Plazas máximas**: por defecto 100; se cambian desde el panel sin tocar código.
- **Abrir / cerrar inscripción** con un botón (se cierra sola al llenarse).
- **Lista de inscritos**: buscar, ver PDF de autorización de menores, eliminar, descargar Excel (CSV).
- **Asistió**: el día de la Social Run marca quién ha venido; el sorteo puede hacerse solo entre presentes.
- **Sorteo**: 10 dorsales + 5 suplentes al azar, con animación para proyectar en pantalla. Botón «No está: sustituir» por si un ganador no aparece. «Publicar ganadores en la web» muestra nombre e inicial del apellido en la web pública. «Imprimir» saca la lista.
