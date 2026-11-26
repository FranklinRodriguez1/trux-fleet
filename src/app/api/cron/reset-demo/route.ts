import { timingSafeEqual } from "node:crypto";
import { prisma } from "@/infrastructure/db/prisma";
import { seedDemo } from "@/infrastructure/demo/demo-seed";

/**
 * Reinicia los datos de demo. Lo llama Vercel Cron una vez al día
 * (vercel.json) con el header Authorization: Bearer $CRON_SECRET.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  const ok =
    !!secret &&
    auth.length === expected.length &&
    timingSafeEqual(Buffer.from(auth), Buffer.from(expected));
  if (!ok) return new Response("No autorizado", { status: 401 });

  await seedDemo(prisma);
  return Response.json({ ok: true, resetAt: new Date().toISOString() });
}
