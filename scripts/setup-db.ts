/**
 * Prepara una base de datos Postgres nueva (pensado para Neon) para este proyecto:
 * verifica la conexión, aplica las migraciones de Prisma y carga los administradores.
 *
 *   npm run db:setup
 *
 * Lee de .env:
 *   DATABASE_URL  conexión que usa la app. En Neon: la "pooled" (host con -pooler).
 *   DIRECT_URL    conexión directa para migraciones. Opcional en Neon: si falta,
 *                 se deduce de DATABASE_URL quitando "-pooler" del host.
 *   ADMIN_EMAILS  correos con acceso al panel (separados por coma).
 *
 * Se puede correr varias veces: solo aplica las migraciones pendientes y los admins se actualizan.
 */
import "dotenv/config";
import { spawnSync } from "node:child_process";
import pg from "pg";
import { migrationUrl } from "../prisma/direct-url";

const EXPECTED_TABLES = ["AdminUser", "Media", "Tour", "TourTranslation", "_prisma_migrations"];

function fail(message: string): never {
  console.error(`\n✖ ${message}`);
  process.exit(1);
}

function describe(url: string) {
  const u = new URL(url);
  return `${u.hostname}${u.port ? `:${u.port}` : ""}/${u.pathname.slice(1)} (usuario ${decodeURIComponent(u.username)})`;
}

function connectionHint(error: unknown) {
  const e = error as { code?: string; message?: string };
  switch (e.code) {
    case "ENOTFOUND":
      return "No se encontró el servidor. Revisá que la URL esté completa y bien copiada.";
    case "ETIMEDOUT":
    case "ECONNREFUSED":
    case "ECONNRESET":
      return "No se pudo conectar al puerto 5432. Si estás en una red corporativa, probablemente el firewall bloquea Postgres: probá desde otra red (por ejemplo, datos del celular).";
    case "28P01":
      return "Usuario o contraseña incorrectos. Copiá de nuevo la cadena de conexión desde el panel de Neon.";
    case "3D000":
      return "La base de datos del final de la URL no existe. En Neon, la base por defecto se llama neondb.";
    case "SELF_SIGNED_CERT_IN_CHAIN":
      return "Un proxy intercepta el SSL. Corré el script con NODE_OPTIONS=--use-system-ca.";
    default:
      return e.message ?? String(error);
  }
}

async function query<T extends pg.QueryResultRow>(url: string, sql: string) {
  const client = new pg.Client({ connectionString: url, connectionTimeoutMillis: 15_000 });
  await client.connect();
  try {
    return (await client.query<T>(sql)).rows;
  } finally {
    await client.end();
  }
}

/** `command` es siempre un texto fijo de este archivo (nunca entrada del usuario). */
function run(step: string, command: string, env: NodeJS.ProcessEnv) {
  console.log(`\n→ ${step}`);
  // shell: en Windows, npx es un .cmd y no se puede lanzar sin shell.
  const result = spawnSync(`npx ${command}`, { stdio: "inherit", env, shell: true });
  if (result.status !== 0) fail(`Falló: ${step}. Revisá el mensaje de arriba.`);
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) fail("Falta DATABASE_URL en .env. Pegá ahí la cadena de conexión de Neon.");
  let directUrl: string;
  try {
    directUrl = migrationUrl(databaseUrl);
  } catch {
    fail("DATABASE_URL o DIRECT_URL no tienen formato de URL (postgresql://usuario:clave@host/base).");
  }

  const host = new URL(databaseUrl).hostname;
  const isLocal = ["localhost", "127.0.0.1"].includes(host);
  if (!isLocal && !/sslmode=(require|verify-full)/.test(databaseUrl)) {
    fail("La URL no exige SSL. Agregá ?sslmode=require al final (Neon lo incluye al copiar la cadena).");
  }

  console.log("Base de datos de la app:  " + describe(databaseUrl));
  console.log("Conexión para migraciones: " + describe(directUrl));
  if (isLocal) console.log("(Es una base local; para Neon, poné su URL en DATABASE_URL.)");

  console.log("\n→ Probando la conexión");
  try {
    const [info] = await query<{ version: string }>(directUrl, "select version()");
    console.log("  " + info.version.split(",")[0]);
  } catch (error) {
    fail(`No se pudo conectar: ${connectionHint(error)}`);
  }

  // prisma.config.ts deduce la misma conexión directa (prisma/direct-url.ts).
  run("Aplicando migraciones (crea o actualiza las tablas)", "prisma migrate deploy", process.env);
  run("Cargando administradores de ADMIN_EMAILS", "prisma db seed", process.env);

  console.log("\n→ Verificando");
  const tables = (
    await query<{ table_name: string }>(
      directUrl,
      "select table_name from information_schema.tables where table_schema = 'public' order by table_name",
    )
  ).map((row) => row.table_name);
  const missing = EXPECTED_TABLES.filter((table) => !tables.includes(table));
  if (missing.length) fail(`Faltan tablas: ${missing.join(", ")}`);

  const [counts] = await query<{ tours: string; admins: string; migrations: string }>(
    directUrl,
    `select (select count(*) from "Tour") as tours,
            (select count(*) from "AdminUser" where active) as admins,
            (select count(*) from "_prisma_migrations" where finished_at is not null) as migrations`,
  );
  console.log(`  Tablas: ${EXPECTED_TABLES.filter((t) => !t.startsWith("_")).join(", ")}`);
  console.log(`  Migraciones aplicadas: ${counts.migrations} · Tours: ${counts.tours} · Admins activos: ${counts.admins}`);

  const badAdmins = (await query<{ email: string }>(directUrl, `select email from "AdminUser" where email not like '%@%'`)).map(
    (row) => row.email,
  );
  if (badAdmins.length) {
    console.warn(`\n⚠ Estos "correos" de ADMIN_EMAILS no son direcciones válidas: ${badAdmins.join(", ")}. Poné el correo completo y volvé a correr el script.`);
  }
  if (counts.admins === "0") console.warn("\n⚠ No hay administradores: completá ADMIN_EMAILS en .env y volvé a correr el script.");

  console.log("\n✔ Base de datos lista.");
  if (!isLocal) {
    console.log("  Para producción (p. ej. Vercel), configurá DATABASE_URL con la misma URL pooled de Neon.");
  }
}

main().catch((error) => fail(error instanceof Error ? error.message : String(error)));
