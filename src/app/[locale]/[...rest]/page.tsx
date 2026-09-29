import { notFound } from "next/navigation";

// Cualquier ruta desconocida bajo /[locale] muestra el 404 traducido de app/[locale]/not-found.tsx.
export default function CatchAll() {
  notFound();
}
