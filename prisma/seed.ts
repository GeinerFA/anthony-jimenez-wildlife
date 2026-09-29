import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const emails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  if (emails.length === 0) {
    console.warn("ADMIN_EMAILS está vacío: no se creó ningún administrador.");
    return;
  }

  for (const email of emails) {
    await db.adminUser.upsert({
      where: { email },
      update: { active: true },
      create: { email },
    });
  }
  console.log(`Administradores activos: ${emails.join(", ")}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
