import { defineConfig, mergeConfig } from "vitest/config";
import base from "./vitest.config";

// Unitarias + integración contra PostgreSQL (requiere DATABASE_URL con el seed aplicado).
export default mergeConfig(
  base,
  defineConfig({ test: { include: ["tests/integration/**/*.test.ts"], fileParallelism: false } }),
);
