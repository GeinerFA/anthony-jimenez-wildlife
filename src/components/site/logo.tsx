import Image from "next/image";
// Importado (no "/logo.png"): la URL lleva un hash del contenido, así un logo nuevo no queda tapado por el caché.
import logo from "../../../public/logo.png";

// sm se achica en celular para que el nombre quepa junto al botón del menú del sitio (pantallas de 360 px).
// md es el mismo tamaño fijo en toda pantalla: el header del panel no lleva botones en celular.
const sizes = {
  sm: { badge: 75, badgeClass: "size-14 sm:size-[75px]", gap: "gap-2 sm:gap-3", name: "text-base sm:text-xl", place: "text-[0.65rem] sm:text-[0.75rem]" },
  md: { badge: 75, badgeClass: "", gap: "gap-3", name: "text-xl", place: "text-[0.75rem]" },
  lg: { badge: 100, badgeClass: "", gap: "gap-3", name: "text-3xl", place: "text-[0.85rem]" },
} as const;

/**
 * Monograma "AJ" de la marca (public/logo.png: media/logo-tony.jpg sin el fondo negro) junto al nombre.
 * Pensado para fondos oscuros: header, footer y panel.
 */
export function Logo({ size = "sm", priority = false, className }: { size?: keyof typeof sizes; priority?: boolean; className?: string }) {
  const s = sizes[size];
  return (
    <span className={`inline-flex items-center ${s.gap} ${className ?? ""}`}>
      <Image src={logo} alt="" width={s.badge} height={s.badge} priority={priority} className={`shrink-0 ${s.badgeClass}`} />
      <span className="flex flex-col leading-none">
        <span className={`whitespace-nowrap font-display tracking-tight ${s.name}`}>Anthony Jimenez Wildlife</span>
        <span className={`mt-1 whitespace-nowrap font-semibold uppercase tracking-[0.3em] text-lime ${s.place}`}>Costa Rica</span>
      </span>
    </span>
  );
}
