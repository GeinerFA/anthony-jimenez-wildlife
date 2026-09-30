import "dotenv/config";
import { defineConfig, env } from "prisma/config";
import { migrationUrl } from "./prisma/direct-url";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // La app usa DATABASE_URL (en Neon, la "pooled"); los comandos de Prisma, la conexión directa.
    url: migrationUrl(env("DATABASE_URL")),
  },
});
