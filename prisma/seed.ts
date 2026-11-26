import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { DEMO_PASSWORD, seedDemo } from "../src/infrastructure/demo/demo-seed";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

seedDemo(prisma)
  .then(() =>
    console.log(`Seed listo. Usuarios: empresa@trux.demo y conductor@trux.demo (contraseña ${DEMO_PASSWORD})`),
  )
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
