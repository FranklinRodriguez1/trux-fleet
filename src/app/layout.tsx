import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TRUX · Seguimiento de viajes de flota",
  description: "Seguimiento y auditoría de viajes de una flota. Proyecto personal de Franklin Rodríguez.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
