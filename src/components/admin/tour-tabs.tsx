"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function TourTabs({ tourId, mediaCount }: { tourId: string; mediaCount: number }) {
  const pathname = usePathname();
  const base = `/admin/tours/${tourId}`;
  const tabs = [
    { href: base, label: "Español" },
    { href: `${base}/ingles`, label: "Inglés" },
    { href: `${base}/medios`, label: `Fotos y videos (${mediaCount})` },
  ];

  return (
    <nav aria-label="Secciones del tour" className="flex gap-1 overflow-x-auto border-b border-ink/10">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`-mb-px whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
              active ? "border-fern text-ink" : "border-transparent text-ink/55 hover:text-ink"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
