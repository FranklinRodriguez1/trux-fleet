import type { TripView } from "@/application/trips/list-trips";
import { STATUS_LABEL } from "@/domain/trips/trip-status";
import type { ReactNode } from "react";

const fmt = new Intl.DateTimeFormat("es-DO", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Santo_Domingo",
});

export function TripTable({
  trips,
  showDriver,
  actions,
}: {
  trips: TripView[];
  showDriver: boolean;
  actions?: (trip: TripView) => ReactNode;
}) {
  if (trips.length === 0) {
    return <p className="rounded-lg border border-dashed p-6 text-center text-slate-500">No hay viajes.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white text-slate-900">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-3 py-2">Ruta</th>
            <th className="px-3 py-2">Vehículo</th>
            {showDriver && <th className="px-3 py-2">Conductor</th>}
            <th className="px-3 py-2">Llegada prevista</th>
            <th className="px-3 py-2">Estado</th>
            {actions && <th className="px-3 py-2" />}
          </tr>
        </thead>
        <tbody>
          {trips.map((t) => (
            <tr key={t.id} className="border-t border-slate-100">
              <td className="px-3 py-2 font-medium">
                {t.origin} → {t.destination}
              </td>
              <td className="px-3 py-2">{t.vehiclePlate}</td>
              {showDriver && <td className="px-3 py-2">{t.driverName}</td>}
              <td className="px-3 py-2">{fmt.format(t.expectedArrival)}</td>
              <td className="px-3 py-2">
                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs">{STATUS_LABEL[t.status]}</span>
                {t.delayed && (
                  <span className="ml-2 rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                    Retrasado
                  </span>
                )}
              </td>
              {actions && <td className="px-3 py-2 text-right">{actions(t)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
