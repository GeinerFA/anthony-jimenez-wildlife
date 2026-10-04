"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { parseTourCategory, tourCategories, tourCategoryConfig } from "@/config/tour-categories";

const sections = [
  ...tourCategories.map((category) => ({ href: tourCategoryConfig[category].adminHref, label: tourCategoryConfig[category].label })),
  { href: "/admin/solicitudes", label: "Solicitudes" },
  { href: "/admin/portadas", label: "Portadas" },
];

/**
 * Secciones del panel. Al crear un tour (/admin/tours/nuevo?categoria=...) queda activa la sección elegida;
 * dentro de un tour ya creado, el enlace "volver" de arriba indica su sección.
 */
export function AdminNav({ newRequests = 0 }: { newRequests?: number }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isActive = (href: string) => {
    if (pathname === "/admin/tours/nuevo") return href === tourCategoryConfig[parseTourCategory(searchParams.get("categoria"))].adminHref;
    return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
  };

  return (
    // En celular: botones en una cuadrícula de 3 columnas (todas las secciones a la vista, sin deslizar).
    // Desde sm: pestañas subrayadas sobre una línea.
    <nav aria-label="Secciones del panel" className="mb-8 grid grid-cols-3 gap-2 sm:flex sm:gap-1 sm:border-b sm:border-ink/10">
      {sections.map((section) => (
        <Link
          key={section.href}
          href={section.href}
          aria-current={isActive(section.href) ? "page" : undefined}
          className={`flex items-center justify-center rounded-full border px-2 py-2 text-center text-xs font-semibold leading-tight transition-colors sm:-mb-px sm:rounded-none sm:border-0 sm:border-b-2 sm:bg-transparent sm:px-4 sm:py-3 sm:text-sm sm:whitespace-nowrap ${
            isActive(section.href)
              ? "border-ink bg-ink text-bone sm:border-fern sm:text-ink"
              : "border-ink/15 bg-white text-ink/70 hover:text-ink sm:border-transparent sm:text-ink/55"
          }`}
        >
          {section.label}
          {section.href === "/admin/solicitudes" && newRequests > 0 && (
            <span className="ml-2 rounded-full bg-lime px-1.5 py-0.5 text-xs text-ink" title={`${newRequests} nuevas`}>
              {newRequests}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
}
