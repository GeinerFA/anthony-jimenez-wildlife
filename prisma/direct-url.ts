/**
 * URL para migraciones y otros comandos de Prisma (migrate, studio): necesitan una conexión directa,
 * porque Prisma Migrate usa locks de sesión que el pooler de Neon no conserva entre consultas.
 *
 * Usa DIRECT_URL si está definida; si no, la deduce de DATABASE_URL quitando "-pooler" del host
 * (en Neon, la URL pooled y la directa solo difieren en eso). Con Postgres local no cambia nada.
 */
export function migrationUrl(databaseUrl: string, directUrl = process.env.DIRECT_URL) {
  if (directUrl) return directUrl;
  const url = new URL(databaseUrl);
  if (!url.hostname.includes("-pooler.")) return databaseUrl;
  url.hostname = url.hostname.replace("-pooler.", ".");
  return url.toString();
}
