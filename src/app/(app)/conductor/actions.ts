"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { servicesFor } from "@/composition/container";
import { TRIP_STATUSES } from "@/domain/trips/trip-status";
import { requireActor } from "@/infrastructure/auth/session";

const Schema = z.object({ tripId: z.uuid(), to: z.enum(TRIP_STATUSES) });

export async function changeStatusAction(form: FormData) {
  const actor = await requireActor("CONDUCTOR");
  const input = Schema.parse(Object.fromEntries(form));
  await servicesFor(actor).changeTripStatus(input);
  revalidatePath("/conductor");
}
