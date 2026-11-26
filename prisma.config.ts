import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  // Las migraciones corren con el dueño de las tablas (MIGRATION_DATABASE_URL);
  // la app y el seed usan DATABASE_URL, un rol sin BYPASSRLS.
  datasource: {
    url: process.env["MIGRATION_DATABASE_URL"] ?? process.env["DATABASE_URL"],
  },
});
