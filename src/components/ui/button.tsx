import { ArrowUpRight } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { Link } from "@/i18n/navigation";

type Variant = "sun" | "light" | "dark";

const variants: Record<Variant, { base: string; fill: string; hoverText: string }> = {
  sun: { base: "bg-sun text-ink", fill: "bg-bone", hoverText: "group-hover:text-ink" },
  light: { base: "border border-bone/40 text-bone", fill: "bg-bone", hoverText: "group-hover:text-ink" },
  dark: { base: "border border-ink/25 text-ink", fill: "bg-ink", hoverText: "group-hover:text-bone" },
};

function buttonClasses(variant: Variant, className?: string) {
  return [
    "group relative isolate inline-flex items-center gap-3 overflow-hidden rounded-full px-7 py-4",
    "text-sm font-semibold uppercase tracking-[0.14em] transition-colors duration-500",
    variants[variant].base,
    variants[variant].hoverText,
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * Contenido animado: el relleno sube desde abajo, el texto "rueda" hacia arriba
 * y la flecha sale por la esquina mientras entra una nueva.
 */
function ButtonInner({ children, variant }: { children: ReactNode; variant: Variant }) {
  return (
    <>
      <span
        aria-hidden
        className={`absolute inset-0 -z-10 origin-bottom scale-y-0 rounded-full transition-transform duration-500 ease-out-expo group-hover:scale-y-100 ${variants[variant].fill}`}
      />
      <span className="relative block overflow-hidden">
        <span className="block transition-transform duration-500 ease-out-expo group-hover:-translate-y-full">
          {children}
        </span>
        <span
          aria-hidden
          className="absolute inset-0 block translate-y-full transition-transform duration-500 ease-out-expo group-hover:translate-y-0"
        >
          {children}
        </span>
      </span>
      <span aria-hidden className="relative block size-4 overflow-hidden">
        <ArrowUpRight className="absolute inset-0 size-4 transition-transform duration-500 ease-out-expo group-hover:-translate-y-full group-hover:translate-x-full" />
        <ArrowUpRight className="absolute inset-0 size-4 -translate-x-full translate-y-full transition-transform duration-500 ease-out-expo group-hover:translate-x-0 group-hover:translate-y-0" />
      </span>
    </>
  );
}

type ButtonLinkProps = Omit<ComponentProps<typeof Link>, "className"> & {
  variant?: Variant;
  className?: string;
};

/** Botón para rutas internas (con idioma). */
export function ButtonLink({ variant = "sun", className, children, ...props }: ButtonLinkProps) {
  return (
    <Link {...props} className={buttonClasses(variant, className)}>
      <ButtonInner variant={variant}>{children}</ButtonInner>
    </Link>
  );
}

type ExternalButtonProps = Omit<ComponentProps<"a">, "className"> & {
  href: string;
  variant?: Variant;
  className?: string;
};

/** Botón para enlaces externos (WhatsApp, redes sociales). Abre en otra pestaña. */
export function ExternalButton({ variant = "sun", className, children, ...props }: ExternalButtonProps) {
  return (
    <a target="_blank" rel="noopener noreferrer" {...props} className={buttonClasses(variant, className)}>
      <ButtonInner variant={variant}>{children}</ButtonInner>
    </a>
  );
}

/** Enlace de texto con subrayado que se dibuja de izquierda a derecha. */
export function UnderlineLink({ className, children, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link {...props} className={`group relative inline-flex items-center gap-2 font-semibold ${className ?? ""}`}>
      {children}
      <ArrowUpRight aria-hidden className="size-4 transition-transform duration-500 ease-out-expo group-hover:translate-x-1 group-hover:-translate-y-1" />
      <span
        aria-hidden
        className="absolute -bottom-1 left-0 h-px w-full origin-right scale-x-0 bg-current transition-transform duration-500 ease-out-expo group-hover:origin-left group-hover:scale-x-100"
      />
    </Link>
  );
}
