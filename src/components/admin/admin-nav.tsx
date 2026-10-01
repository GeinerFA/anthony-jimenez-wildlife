"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const sections = [
  { href: "/admin", label: "Tours" },
  { href: "/admin/portadas", label: "Portadas" },
];

/** Secciones del panel. "Tours" queda activo también dentro de un tour (/admin/tours/...). */
export function AdminNav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" || pathname.startsWith("/admin/tours") : pathname.startsWith(href);

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
        </Link>
      ))}
    </nav>
  );
}
