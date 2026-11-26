import { servicesFor } from "@/composition/container";
import { requireActor } from "@/infrastructure/auth/session";
import { TripTable } from "../../_components/trip-table";
import { changeStatusAction } from "./actions";

const NEXT_ACTION = {
  PROGRAMADO: { to: "EN_CURSO", label: "Iniciar" },
  EN_CURSO: { to: "COMPLETADO", label: "Completar" },
} as const;

export default async function ConductorPage() {
  const actor = await requireActor("CONDUCTOR");
  const trips = await servicesFor(actor).listTrips();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Mis viajes</h1>
      <TripTable
        trips={trips}
        showDriver={false}
        actions={(t) => {
          if (t.status === "COMPLETADO") return null;
          const next = NEXT_ACTION[t.status];
          return (
            <form action={changeStatusAction}>
              <input type="hidden" name="tripId" value={t.id} />
              <input type="hidden" name="to" value={next.to} />
              <button className="rounded-md bg-sky-700 px-3 py-1 text-xs font-medium text-white hover:bg-sky-800">
                {next.label}
              </button>
            </form>
          );
        }}
      />
    </div>
  );
}
