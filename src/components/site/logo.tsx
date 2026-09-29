import Image from "next/image";

const sizes = {
  sm: { badge: 44, name: "text-xl", place: "text-[0.55rem]" },
  lg: { badge: 88, name: "text-3xl", place: "text-[0.65rem]" },
} as const;

/**
 * Insignia circular de la marca (public/logo.png, recortada de media/logo-naturallandcr.jpg) junto al nombre.
 * Pensado para fondos oscuros: header, footer y panel.
 */
export function Logo({ size = "sm", priority = false, className }: { size?: keyof typeof sizes; priority?: boolean; className?: string }) {
  const s = sizes[size];
  return (
    <span className={`inline-flex items-center gap-3 ${className ?? ""}`}>
      <Image src="/logo.png" alt="" width={s.badge} height={s.badge} priority={priority} className="shrink-0 rounded-full" />
      <span className="flex flex-col leading-none">
        <span className={`whitespace-nowrap font-display tracking-tight ${s.name}`}>Natural Land</span>
        <span className={`mt-1 whitespace-nowrap font-semibold uppercase tracking-[0.3em] text-lime ${s.place}`}>Costa Rica</span>
      </span>
    </span>
  );
}
