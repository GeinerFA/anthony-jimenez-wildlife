/**
 * Genera los íconos de las apps instalables a partir de public/logo.png:
 *   - Sitio público: logo sobre fondo negro. Panel: logo sobre fondo blanco.
 *   - public/icons/*: íconos del manifiesto (Android, Chrome).
 *   - public/apple-touch-icon*.png: rutas fijas que iOS consulta en la raíz del sitio.
 *   - src/config/touch-icons.ts: el ícono de iOS incrustado como data: URI. La hoja "Agregar a inicio"
 *     de iOS a veces no descarga el ícono enlazado y pone una letra; incrustado no depende de la red.
 *
 * Uso: npx tsx scripts/pwa-icons.ts (sharp viene con Next).
 */
import { writeFileSync } from "node:fs";
import sharp from "sharp";

const LOGO = "public/logo.png";

const apps = [
  { prefix: "icon", background: "#000000", exportName: "siteTouchIcon" },
  { prefix: "admin", background: "#ffffff", exportName: "adminTouchIcon" },
] as const;

// logo: fracción del lado que ocupa el monograma. El maskable deja libre la zona que Android recorta.
const sizes = [
  { name: "192", size: 192, logo: 0.82 },
  { name: "512", size: 512, logo: 0.82 },
  { name: "maskable-512", size: 512, logo: 0.6 },
] as const;

/** PNG cuadrado y sin transparencia: iOS rellena el canal alfa con el color que quiere. */
async function render(size: number, logoFraction: number, background: string) {
  const inner = Math.round(size * logoFraction);
  const logo = await sharp(LOGO).resize(inner, inner).toBuffer();
  return sharp({ create: { width: size, height: size, channels: 3, background } })
    .composite([{ input: logo, gravity: "center" }])
    .removeAlpha()
    .png({ compressionLevel: 9, palette: true, quality: 90 })
    .toBuffer();
}

async function main() {
  const touchIcons: string[] = [];

  for (const app of apps) {
    for (const s of sizes) {
      writeFileSync(`public/icons/${app.prefix}-${s.name}.png`, await render(s.size, s.logo, app.background));
    }

    const touch = await render(180, 0.78, app.background);
    writeFileSync(`public/icons/${app.prefix}-apple-180.png`, touch);
    if (app.prefix === "icon") {
      for (const file of ["apple-touch-icon.png", "apple-touch-icon-precomposed.png", "apple-touch-icon-180x180.png"]) {
        writeFileSync(`public/${file}`, touch);
      }
    }
    touchIcons.push(`export const ${app.exportName} = "data:image/png;base64,${touch.toString("base64")}";`);
  }

  writeFileSync(
    "src/config/touch-icons.ts",
    `// Generado por scripts/pwa-icons.ts: no editar a mano.\n// Íconos de iOS (180×180) incrustados para que "Agregar a inicio" no dependa de descargarlos.\n\n${touchIcons.join("\n\n")}\n`,
  );
}

main();
