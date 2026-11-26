import { servicesFor } from "@/composition/container";
import { requireActor } from "@/infrastructure/auth/session";
import { TripTable } from "../../_components/trip-table";

export default async function EmpresaPage() {
  const actor = await requireActor("EMPRESA");
  const trips = await servicesFor(actor).listTrips();

  const count = (pred: (t: (typeof trips)[number]) => boolean) => trips.filter(pred).length;
  const stats = [
    { label: "Programados", value: count((t) => t.status === "PROGRAMADO") },
    { label: "En curso", value: count((t) => t.status === "EN_CURSO") },
    { label: "Retrasados", value: count((t) => t.delayed), alert: true },
    { label: "Completados", value: count((t) => t.status === "COMPLETADO") },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Panel de operaciones</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-slate-200 bg-white p-4 text-slate-900">
            <p className="text-sm text-slate-500">{s.label}</p>
            <p className={`text-3xl font-bold ${s.alert && s.value > 0 ? "text-red-600" : ""}`}>{s.value}</p>
          </div>
        ))}
      </div>
      <TripTable trips={trips} showDriver />
    </div>
  );
}
