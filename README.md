# Natural Land CR

Sitio web de la agencia de tours Natural Land CR. Bilingüe (español/inglés), con panel administrativo para gestionar tours y medios.

- **Next.js 15** (App Router) + TypeScript + Tailwind CSS v4
- **next-intl**: rutas `/es/...` y `/en/...`; el contenido se escribe en español y el inglés se traduce automáticamente
- **PostgreSQL + Prisma 7**: tours, traducciones, metadatos de medios y lista blanca de administradores
- **Cloudinary**: almacenamiento de imágenes y videos
- **Auth.js (Google)**: acceso a `/admin` restringido a los correos de la tabla `AdminUser`
- **Motion + Lenis**: animaciones y scroll suave

Los tours no tienen precio: se consulta por mensaje directo (WhatsApp / redes sociales).

## Puesta en marcha

```bash
npm install
cp .env.example .env          # completar las variables
podman compose up -d          # o docker compose: Postgres local
npm run db:migrate            # aplica las migraciones
npm run db:seed               # crea los admins de ADMIN_EMAILS
npm run dev                   # http://localhost:3000
```

Tour de demostración con fotos/videos propios (se suben a Cloudinary): copiar los archivos a `demo-media/` (ignorada por git; el primero por nombre es la portada) y correr `npm run demo:tour`. Para borrarlo: `npm run demo:tour -- --remove`.

## Scripts

| Script | Qué hace |
| --- | --- |
| `npm run dev` / `build` / `start` | Desarrollo, build de producción y servidor |
| `npm run lint` / `typecheck` | ESLint y TypeScript |
| `npm run db:migrate` | Crea/aplica migraciones en desarrollo |
| `npm run db:deploy` | Aplica migraciones en producción |
| `npm run db:seed` | Sincroniza `ADMIN_EMAILS` con la tabla `AdminUser` |
| `npm run db:studio` | Explorador visual de la base de datos |
| `npm run demo:tour` | Crea/reemplaza el tour demo con `demo-media/` |

## Estado

Hecho:
- Sitio público: inicio, listado y detalle de tours, contacto, 404 traducido
- SEO: metadata dinámica, hreflang es/en, `sitemap.xml`, `robots.txt`, JSON-LD
- Schema de Prisma y migración inicial
- Login con Google + lista blanca, middleware que protege `/admin` y `/api/admin`

Pendiente:
- Panel admin: crear/editar tours, subir/reordenar/eliminar medios
- Traducción automática con DeepL (módulo intercambiable en `src/lib/translation/`)
- Subida directa del navegador a Cloudinary con firma del servidor
- Rate limiting en rutas de subida y traducción; validación de tipo y tamaño de archivo
- Reemplazar los usuarios de redes y el número de WhatsApp de ejemplo en `src/config/site.ts`
