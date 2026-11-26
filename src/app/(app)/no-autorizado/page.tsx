import Link from "next/link";

export default function NoAutorizado() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="text-2xl font-bold">Sin acceso</h1>
      <p className="mt-2 text-slate-500">Tu rol no tiene permiso para ver esta página.</p>
      <Link href="/" className="mt-6 inline-block text-sky-700 underline">
        Volver al inicio
      </Link>
    </div>
  );
}
