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

### Base de datos en Neon

1. En [neon.tech](https://neon.tech) crear un proyecto (región cercana, p. ej. `us-east-1`) y copiar la cadena de conexión con **Connection pooling** activado.
2. En `.env`, pegarla en `DATABASE_URL` (cambiar `sslmode=require` por `sslmode=verify-full` evita un aviso de `pg`). `DIRECT_URL` es opcional: si falta, se deduce quitando `-pooler` del host.
3. `npm run db:setup`: prueba la conexión, aplica las migraciones y carga `ADMIN_EMAILS`. Se puede repetir sin riesgo.

En producción (Vercel u otro), configurar `DATABASE_URL` con la misma URL *pooled*.

Tour de demostración con fotos/videos propios (se suben a Cloudinary): copiar los archivos a `demo-media/` (ignorada por git; el primero por nombre es la portada) y correr `npm run demo:tour`. Para borrarlo: `npm run demo:tour -- --remove`.

## Scripts

| Script | Qué hace |
| --- | --- |
| `npm run dev` / `build` / `start` | Desarrollo, build de producción y servidor |
| `npm run lint` / `typecheck` | ESLint y TypeScript |
| `npm run db:migrate` | Crea/aplica migraciones en desarrollo |
| `npm run db:deploy` | Aplica migraciones en producción |
| `npm run db:seed` | Sincroniza `ADMIN_EMAILS` con la tabla `AdminUser` |
| `npm run db:setup` | Prepara una base nueva (Neon): conexión + migraciones + admins |
| `npm run db:studio` | Explorador visual de la base de datos |
| `npm run demo:tour` | Crea/reemplaza el tour demo con `demo-media/` |

## Estado

Hecho:
- Sitio público: inicio, listado y detalle de tours, contacto, 404 traducido
- SEO: metadata dinámica, hreflang es/en, `sitemap.xml`, `robots.txt`, JSON-LD
- Schema de Prisma y migración inicial
- Login con Google + lista blanca, middleware que protege `/admin` y `/api/admin`
- Panel admin (`/admin`): crear/editar/eliminar tours, publicar, destacar y ordenar
- Traducción automática con DeepL al guardar el español (módulo intercambiable en `src/lib/translation/`). El inglés se puede corregir a mano en la pestaña Inglés; esas correcciones no se sobrescriben salvo con «Retraducir»
- Fotos y videos: subida directa del navegador a Cloudinary con firma del servidor (`/api/admin/media/sign`), por partes para archivos de más de 20 MB; reordenar, elegir portada, texto alternativo es/en y eliminar
- Validación de tipo y tamaño (`src/config/media.ts`): en el navegador, en la firma (`allowed_formats`) y en el servidor, que lee los metadatos desde Cloudinary y borra el archivo si no cumple
- Rate limiting en firma/registro de subidas y en traducción (`src/lib/rate-limit.ts`)

Pendiente:
- Reemplazar los usuarios de redes y el número de WhatsApp de ejemplo en `src/config/site.ts`

## Seguridad

El formulario «Planifica tu viaje» guarda datos personales (nombre, correo, teléfono, nacionalidad, mensaje).

- **Límite de envíos** (`src/server/request-limits.ts`): se cuenta sobre la base de datos, así que vale para todas las instancias de Vercel. Máximo 5 por IP en 30 min y 3 por correo en 24 h. La IP se guarda como HMAC (`ipHash`), nunca en claro. El rate limiting en memoria (`src/lib/rate-limit.ts`) queda solo para el panel.
- **reCAPTCHA v3** es obligatorio en producción: sin `RECAPTCHA_*` el formulario rechaza los envíos.
- **Consentimiento**: casilla obligatoria (validada también en el servidor) y fecha en `consentAt`. La política está en `/privacidad` · `/privacy` (textos en `messages/*.json`, `Privacy`). **Es un borrador: revisarla con un abogado.**
- **Confirmación al cliente**: no repite el mensaje libre, para que no se pueda usar el formulario para mandar spam con la marca.
- **Panel**: las lecturas de solicitudes (`src/server/admin/requests.ts`) verifican al admin en cada llamada, además del layout y del middleware.
- **Cabeceras**: CSP, HSTS, `X-Frame-Options` y demás en `next.config.ts`. Si se agrega un servicio externo nuevo (scripts, imágenes, iframes), hay que sumarlo a la CSP.
- **Dependencias**: `overrides` en `package.json` fuerza `nodemailer` 10 para Auth.js (que no lo usa aquí) y `postcss` parcheado para Next.
- **Riesgos aceptados** (`npm audit`): `mysql2` y `deepmerge-ts` vienen del CLI de Prisma, que solo corre al compilar y migrar (el proyecto usa Postgres). `braces` viene de ESLint (solo desarrollo). Revisar cuando Prisma publique una versión parcheada.
- **Desarrollo**: usar una rama de Neon aparte (no la base de producción) en `.env` local y en el entorno Preview de Vercel.
