# PWA: configuración usada en Anthony Jimenez Wildlife

Guía para replicar en otras apps la configuración de app instalable (PWA) de este proyecto.
Stack: **Next.js 15 (App Router)**, sin librerías de PWA (`next-pwa`, `serwist`, etc.): todo son archivos propios.

## Qué hace

- **Dos apps instalables independientes** desde el mismo dominio:
  - **Sitio público** (`/`): ícono sobre fondo negro, nombre «AJ Wildlife».
  - **Panel admin** (`/admin`): ícono sobre fondo blanco, nombre «AJ Admin». Se instala aparte y tiene su propio ícono en la pantalla de inicio.
- **Página sin conexión** (`/offline.html`) cuando falla la red al navegar.
- **Sin caché de páginas ni datos**: todo lo demás va directo a la red, así el panel nunca muestra información desactualizada.
- **iOS**: pantalla completa, ícono propio (incrustado para que nunca salga una letra) y barra de estado configurada.
- **Zoom bloqueado solo en la app instalada**. En el navegador el zoom sigue disponible por accesibilidad.

## Archivos

| Archivo | Función |
| --- | --- |
| `src/app/manifest.ts` | Manifiesto del sitio público (Next lo sirve en `/manifest.webmanifest`) |
| `src/app/admin/manifest.webmanifest/route.ts` | Manifiesto del panel (route handler estático) |
| `public/sw.js` | Service worker: instalación + página sin conexión |
| `public/offline.html` | Página sin conexión, autocontenida |
| `src/components/pwa/register-service-worker.tsx` | Registra el service worker (solo en producción) |
| `src/components/pwa/standalone-zoom-lock.tsx` | Bloquea el zoom cuando corre como app instalada |
| `scripts/pwa-icons.ts` | Genera todos los íconos a partir de `public/logo.png` |
| `public/icons/*` | Íconos de los manifiestos (generados) |
| `public/apple-touch-icon*.png` | Rutas fijas que iOS consulta en la raíz (generados) |
| `src/config/touch-icons.ts` | Ícono de iOS como `data:` URI (generado, no editar a mano) |
| `src/app/[locale]/layout.tsx` / `src/app/admin/layout.tsx` | Metadata de iOS, `viewport` y montaje de los componentes |

---

## 1. Manifiesto del sitio público

`src/app/manifest.ts`: convención de archivo de Next, que agrega solo el `<link rel="manifest">`.

```ts
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Anthony Jimenez Wildlife",
    short_name: "AJ Wildlife",                 // ≤ 12 caracteres: es el texto bajo el ícono
    description: "Tours de vida silvestre y observación de aves en Costa Rica con un guía naturalista local.",
    start_url: "/",                            // el middleware de i18n redirige a /es o /en
    scope: "/",
    display: "standalone",
    background_color: "#000000",               // pantalla de carga (splash) en Android
    theme_color: "#06140c",                    // barra del sistema / barra de título
    lang: "es",
    categories: ["travel"],
    icons: [
      { src: "/icons/icon-192.png?v=3", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png?v=3", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png?v=3", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
```

- **`id`** identifica la app instalada. Si cambia, el navegador la trata como otra app. No cambiarlo después de publicar.
- **`?v=3`**: los navegadores cachean mucho los íconos del manifiesto. Al regenerar los íconos, subir este número (en los dos manifiestos) para forzar que se descarguen de nuevo.
- `any` y `maskable` van en entradas separadas: un mismo ícono para los dos usos queda mal recortado o con mucho margen.

## 2. Manifiesto del panel (segunda app)

Next solo admite `manifest.ts` en la raíz de `app/`, así que el del panel es un **route handler estático** cuya carpeta se llama como el archivo:

`src/app/admin/manifest.webmanifest/route.ts`

```ts
import type { MetadataRoute } from "next";

export const dynamic = "force-static";

const manifest: MetadataRoute.Manifest = {
  id: "/admin",                 // distinto del sitio: el navegador lo instala como otra app
  name: "Admin · Anthony Jimenez Wildlife",
  short_name: "AJ Admin",
  description: "Panel de administración de tours, solicitudes y portadas.",
  start_url: "/admin",
  scope: "/admin",              // al salir de /admin, abre el navegador
  display: "standalone",
  background_color: "#ffffff",
  theme_color: "#06140c",
  lang: "es",
  icons: [
    { src: "/icons/admin-192.png?v=3", sizes: "192x192", type: "image/png", purpose: "any" },
    { src: "/icons/admin-512.png?v=3", sizes: "512x512", type: "image/png", purpose: "any" },
    { src: "/icons/admin-maskable-512.png?v=3", sizes: "512x512", type: "image/png", purpose: "maskable" },
  ],
};

export function GET() {
  return Response.json(manifest, { headers: { "content-type": "application/manifest+json" } });
}
```

Y en `src/app/admin/layout.tsx` se enlaza en la metadata, reemplazando el del sitio:

```ts
export const metadata: Metadata = {
  manifest: "/admin/manifest.webmanifest",
  // ...
};
```

**Importante, autenticación:** el navegador pide el manifiesto **sin sesión**. Como la URL termina en `.webmanifest`, el `matcher` del middleware (`"/((?!api/auth|_next|_vercel|.*\\..*).*)"`) la deja pasar sin exigir login. Si en otra app el middleware protege todo, hay que excluir el manifiesto, `sw.js`, `offline.html` y `/icons/`. El manifiesto no expone datos del panel.

Si la otra app tiene una sola zona (sin panel), este paso se omite.

## 3. Service worker

`public/sw.js`: se sirve en `/sw.js`, así que su alcance es todo el sitio (`/`) y cubre las dos apps.

```js
const CACHE = "ajw-offline-v2";      // subir la versión al cambiar offline.html o los archivos precacheados
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll([OFFLINE_URL, "/icons/icon-192.png"]))
      .then(() => self.skipWaiting()),          // activa la versión nueva sin esperar a cerrar pestañas
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),         // toma control de las pestañas ya abiertas
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;   // CSS, JS, imágenes, API: el navegador sigue normal
  event.respondWith(fetch(event.request).catch(() => caches.match(OFFLINE_URL)));
});
```

Estrategia: **network-only con respaldo offline**. Solo intercepta navegaciones (cargas de página) y, si la red falla, responde con la página sin conexión. No guarda nada más.

- Es la opción segura para apps con datos que cambian (paneles, formularios, inventario).
- Para cachear contenido (por ejemplo, un catálogo que se lea sin conexión), conviene usar Serwist/Workbox en lugar de escribirlo a mano.
- Chrome exige un handler `fetch` para ofrecer «Instalar app». Este cumple ese requisito.

### Página sin conexión

`public/offline.html` debe ser **autocontenida**: estilos inline, sin JS ni fuentes externas. Solo puede usar lo que está en el precache, en este caso el ícono de 192. Es bilingüe y tiene un botón «Reintentar» (`location.reload()`). Ver el archivo para copiarlo.

## 4. Registro del service worker

`src/components/pwa/register-service-worker.tsx`

```tsx
"use client";

import { useEffect } from "react";

export function RegisterServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  return null;
}
```

**Solo en producción**: en desarrollo un service worker interfiere con la recarga en caliente. Para probarlo en local: `npm run build && npm run start`.

Se monta al final del `<body>` en **cada layout raíz** (aquí, `app/[locale]/layout.tsx` y `app/admin/layout.tsx`, porque son dos `<html>` distintos).

## 5. iOS / iPadOS

iOS no usa el manifiesto para el ícono ni para la barra de estado, así que se configura con la metadata de cada layout.

**Sitio público** (`app/[locale]/layout.tsx`):

```ts
export const viewport: Viewport = {
  themeColor: "#06140c",
  viewportFit: "cover",            // ocupa toda la pantalla, incluida la zona del notch
};

// dentro de generateMetadata / metadata:
appleWebApp: { capable: true, title: "AJ Wildlife", statusBarStyle: "black-translucent" },
icons: { apple: [{ url: siteTouchIcon, sizes: "180x180", type: "image/png" }] },
formatDetection: { telephone: false, address: false, email: false },
```

**Panel** (`app/admin/layout.tsx`):

```ts
appleWebApp: { capable: true, title: "AJ Admin", statusBarStyle: "black" },
icons: { apple: [{ url: adminTouchIcon, sizes: "180x180", type: "image/png" }] },
```

Detalles:

- **`statusBarStyle`**:
  - `black-translucent`: el contenido pasa por debajo de la hora. Úsalo con fondos oscuros, y agrega margen con `env(safe-area-inset-top)` al header fijo (aquí: `style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}`).
  - `black`: barra opaca. Úsalo en pantallas claras (el panel), porque con la translúcida la hora queda ilegible.
- **Ícono incrustado (`data:` URI)**: la hoja «Agregar a inicio» de iOS a veces no descarga el ícono enlazado y muestra una letra. Incrustado en el HTML, no depende de la red.
- **Respaldo en la raíz**: además se generan `public/apple-touch-icon.png`, `apple-touch-icon-precomposed.png` y `apple-touch-icon-180x180.png`, que iOS busca por convención si no encuentra el `<link>`.
- **No usar `app/apple-icon.png`**: esa convención de Next agrega su propio `<link rel="apple-touch-icon">` en todas las páginas y compite con el definido en la metadata (por ejemplo, el panel puede terminar con el ícono del sitio). Por eso se eliminó.
- **`formatDetection`** evita que iOS convierta en enlaces los números sueltos (horas, precios).
- iOS **cachea el ícono** al agregarlo. Para ver un cambio hay que borrar el acceso de la pantalla de inicio y agregarlo de nuevo.

## 6. Íconos

Se generan todos con un script a partir de un único `public/logo.png` (cuadrado, idealmente de 512 px o más):

```bash
npx tsx scripts/pwa-icons.ts
```

| Archivo | Tamaño | Logo ocupa | Uso |
| --- | --- | --- | --- |
| `icons/{icon,admin}-192.png` | 192 | 82 % | Manifiesto, `any` |
| `icons/{icon,admin}-512.png` | 512 | 82 % | Manifiesto, `any` (splash de Android) |
| `icons/{icon,admin}-maskable-512.png` | 512 | 60 % | Manifiesto, `maskable` |
| `icons/{icon,admin}-apple-180.png` + `apple-touch-icon*.png` | 180 | 78 % | iOS |
| `src/config/touch-icons.ts` | 180 | 78 % | iOS, incrustado |

Reglas que aplica el script (`sharp`, que ya viene con Next):

- **Sin transparencia** (`removeAlpha()`): iOS rellena el canal alfa con el color que quiere (suele quedar negro o blanco al azar).
- **Fondo según la app**: negro para el sitio y blanco para el panel, así se distinguen en la pantalla de inicio.
- **Maskable al 60 %**: Android recorta el ícono con distintas formas (círculo, gota, cuadrado redondeado). La zona segura es el círculo central del 80 %; con el logo al 60 % nunca se corta.
- **PNG con paleta** (`palette: true`) para que pesen poco.

Después de regenerar: subir el `?v=` de los dos manifiestos (sección 1).

Para adaptarlo a otra app, cambiar en el script `LOGO`, los colores de `apps` y, si hay una sola app, dejar solo la entrada `icon`.

## 7. Bloqueo de zoom en la app instalada

`src/components/pwa/standalone-zoom-lock.tsx` (opcional). Solo actúa si la página corre instalada:

```ts
window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true
```

Y en ese caso:

1. Agrega `maximum-scale=1, user-scalable=no` al `<meta name="viewport">`: evita el zoom con dos dedos y el zoom automático de iOS al tocar un campo de texto. Se reaplica al cambiar de ruta, por si Next reescribe la etiqueta.
2. `touch-action: manipulation` en `<html>`: elimina el zoom por doble toque (deslizar con un dedo sigue funcionando).
3. `preventDefault` en `gesturestart`/`gesturechange` (Safari) y en `touchmove` con 2 o más dedos (`{ passive: false }`): el pellizco, donde el viewport no alcanza.

En el navegador normal no hace nada: el zoom se mantiene por accesibilidad. Se monta junto a `RegisterServiceWorker` en cada layout raíz.

## 8. Otros requisitos

- **HTTPS**: obligatorio para el service worker (en `localhost` funciona sin él).
- **CSP**: `default-src 'self'` ya permite registrar `/sw.js`. Si la otra app define `worker-src` o `script-src` más estrictos, incluir `'self'`.
- **Middleware**: no debe redirigir ni exigir sesión en `/sw.js`, `/offline.html`, `/manifest.webmanifest`, `/admin/manifest.webmanifest`, `/icons/*` ni `/apple-touch-icon*.png` (ver sección 2).
- **Sitios multiidioma**: `start_url: "/"` y que el middleware elija el idioma. Si se pone `/es`, la app instalada abre siempre en español.

---

## Checklist para otra app

1. Poner el logo cuadrado en `public/logo.png`.
2. Copiar `scripts/pwa-icons.ts`, ajustar colores/apps y correrlo.
3. Copiar `src/app/manifest.ts` y cambiar `name`, `short_name`, `description`, colores, `lang` y `categories`.
4. ¿Tiene panel o segunda zona? Copiar `src/app/<zona>/manifest.webmanifest/route.ts` con su propio `id`, `scope` e íconos, y enlazarlo con `metadata.manifest` en el layout de esa zona.
5. Copiar `public/sw.js` (cambiar el prefijo de `CACHE`) y `public/offline.html` (textos y colores).
6. Copiar `src/components/pwa/` y montar los dos componentes al final del `<body>` de cada layout raíz.
7. Agregar en cada layout `viewport` (`themeColor`, `viewportFit`), `appleWebApp`, `icons.apple` y `formatDetection`.
8. Borrar `app/apple-icon.png` si existe.
9. Revisar el `matcher` del middleware y la CSP (sección 8).
10. Probar en producción (`npm run build && npm run start`, o el deploy).

## Cómo probar

- **Chrome (escritorio/Android)**: DevTools → **Application** → *Manifest* (sin errores, íconos visibles) y *Service workers* (activo). En la barra de direcciones debe aparecer el ícono de «Instalar».
- **Sin conexión**: DevTools → *Network* → **Offline** y recargar: debe salir `offline.html`.
- **Lighthouse**: categoría PWA / instalabilidad.
- **iPhone**: Safari → Compartir → **Agregar a inicio**. Revisar ícono, nombre, barra de estado y que abra sin la barra de Safari.
- **Dos apps**: instalar `/` y `/admin` por separado; deben quedar con íconos y nombres distintos.

## Actualizar después de publicar

| Cambio | Qué hacer |
| --- | --- |
| Logo / íconos | `npx tsx scripts/pwa-icons.ts` + subir `?v=` en los manifiestos. En iOS, quitar y volver a agregar el acceso |
| `offline.html` o lista de precache | Subir la versión de `CACHE` en `sw.js` (`-v2` → `-v3`) |
| Nombre, colores del manifiesto | Basta con desplegar; Android lo actualiza solo en unos días. Nunca cambiar `id` |
| Quitar la PWA | Reemplazar `sw.js` por uno que haga `self.registration.unregister()` y borre las cachés; si solo se borra el archivo, los clientes conservan el anterior |
