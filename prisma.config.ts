import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Las migraciones necesitan conexión directa; con Neon, DATABASE_URL es la "pooled" (para la app)
    // y DIRECT_URL la directa. Sin DIRECT_URL (Postgres local) se usa DATABASE_URL.
    url: process.env.DIRECT_URL || env("DATABASE_URL"),
  },
});
