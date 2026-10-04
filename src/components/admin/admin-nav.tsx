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
    <nav aria-label="Secciones del panel" className="mb-8 flex gap-1 border-b border-ink/10">
      {sections.map((section) => (
        <Link
          key={section.href}
          href={section.href}
          aria-current={isActive(section.href) ? "page" : undefined}
          className={`-mb-px whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
            isActive(section.href) ? "border-fern text-ink" : "border-transparent text-ink/55 hover:text-ink"
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
