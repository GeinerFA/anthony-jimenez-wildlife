"use client";

import { Check, ChevronDown, Search } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { flagSrc, type CountryOption } from "@/lib/countries";

type Props = {
  /** Nombre del campo oculto que viaja en el formulario (el código ISO del país). */
  name: string;
  value: string;
  onChange: (code: string) => void;
  options: CountryOption[];
  /** "dial": muestra solo bandera y prefijo (+506), para ir pegado al número. "name": bandera y nombre del país. */
  display: "dial" | "name";
  label: string;
  placeholder: string;
  searchPlaceholder: string;
  noResults: string;
  invalid?: boolean;
  describedBy?: string;
  className?: string;
};

export function Flag({ code, className = "" }: { code: string; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element -- SVG estático diminuto; next/image no aporta nada aquí.
  return <img src={flagSrc(code)} alt="" width={24} height={16} loading="lazy" className={`h-4 w-6 shrink-0 rounded-[2px] object-cover shadow-[0_0_0_1px_rgba(0,0,0,0.08)] ${className}`} />;
}

const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/** Lista desplegable de países con bandera y buscador (por nombre, código o prefijo). Accesible con teclado. */
export function CountrySelect({ name, value, onChange, options, display, label, placeholder, searchPlaceholder, noResults, invalid, describedBy, className = "" }: Props) {
  const id = useId();
  const listId = `${id}-list`;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  /** Primera letra escrita con el botón enfocado (al llegar con Tab): abre la lista y arranca la búsqueda con ella. */
  const typedRef = useRef("");

  const selected = options.find((option) => option.code === value) ?? null;

  const filtered = useMemo(() => {
    const q = normalize(query.trim()).replace(/^\+/, "");
    if (!q) return options;
    // Primero los que empiezan con lo escrito ("cos" → Costa Rica antes que Islas Cocos), luego una palabra que empiece así, luego el resto.
    const rank = (o: CountryOption) => {
      const name = normalize(o.name);
      if (name.startsWith(q) || o.code.toLowerCase() === q || o.dial.startsWith(q)) return 0;
      if (name.split(/[\s(-]+/).some((word) => word.startsWith(q))) return 1;
      return name.includes(q) ? 2 : 3;
    };
    return options
      .map((option) => ({ option, rank: rank(option) }))
      .filter(({ rank }) => rank < 3)
      .sort((a, b) => a.rank - b.rank)
      .map(({ option }) => option);
  }, [options, query]);

  // Al abrir: foco en el buscador. Si se abrió escribiendo, la búsqueda arranca con esa letra;
  // si no, el país elegido queda visible y activo.
  useEffect(() => {
    if (!open) return;
    const typed = typedRef.current;
    typedRef.current = "";
    searchRef.current?.focus();
    setQuery(typed);
    if (typed) {
      setActive(0);
      return;
    }
    const index = Math.max(0, options.findIndex((o) => o.code === value));
    setActive(index);
    requestAnimationFrame(() => listRef.current?.children[index]?.scrollIntoView({ block: "center" }));
  }, [open, options, value]);

  // Cierra al hacer clic fuera.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const choose = (code: string) => {
    onChange(code);
    setOpen(false);
    buttonRef.current?.focus();
  };

  const move = (delta: number) => {
    setActive((current) => {
      const next = Math.min(Math.max(current + delta, 0), filtered.length - 1);
      listRef.current?.children[next]?.scrollIntoView({ block: "nearest" });
      return next;
    });
  };

  const onSearchKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      move(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      move(-1);
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (filtered[active]) choose(filtered[active].code);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      buttonRef.current?.focus();
    } else if (event.key === "Tab") {
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <input type="hidden" name={name} value={value} />
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(event) => {
          if (open) return;
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
          } else if (event.key.length === 1 && event.key !== " " && !event.ctrlKey && !event.metaKey && !event.altKey) {
            // Escribir con el botón enfocado (p. ej. "c" o "+5") abre la lista ya filtrando, sin hacer clic.
            event.preventDefault();
            typedRef.current = event.key;
            setOpen(true);
          }
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={label}
        data-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className={`flex h-14 w-full items-center gap-2.5 rounded-sm border bg-white px-4 text-left text-ink transition-colors focus:outline-none focus-visible:border-fern focus-visible:ring-2 focus-visible:ring-lime/40 ${
          invalid ? "border-red-600" : "border-ink/15 hover:border-ink/30"
        }`}
      >
        {selected ? (
          <>
            <Flag code={selected.code} />
            <span className="min-w-0 flex-1 truncate">{display === "dial" ? `+${selected.dial}` : selected.name}</span>
          </>
        ) : (
          <span className="min-w-0 flex-1 truncate text-ink/45">{placeholder}</span>
        )}
        <ChevronDown className={`size-4 shrink-0 text-ink/50 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>

      {open && (
        <div
          className={`absolute left-0 top-full z-30 mt-2 overflow-hidden rounded-sm border border-ink/10 bg-white shadow-2xl ${display === "dial" ? "w-[min(20rem,calc(100vw-2.5rem))]" : "w-full min-w-64"}`}
          data-lenis-prevent
        >
          <div className="flex items-center gap-2 border-b border-ink/10 px-3">
            <Search className="size-4 shrink-0 text-ink/40" aria-hidden />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActive(0);
              }}
              onKeyDown={onSearchKeyDown}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              aria-controls={listId}
              aria-activedescendant={filtered[active] ? `${id}-${filtered[active].code}` : undefined}
              role="combobox"
              aria-expanded
              aria-autocomplete="list"
              autoComplete="off"
              className="h-12 w-full bg-transparent text-sm text-ink placeholder:text-ink/40 focus:outline-none"
            />
          </div>
          <ul ref={listRef} id={listId} role="listbox" aria-label={label} className="max-h-72 overflow-y-auto overscroll-contain py-1">
            {filtered.length === 0 && <li className="px-4 py-3 text-sm text-ink/50">{noResults}</li>}
            {filtered.map((option, index) => {
              const isSelected = option.code === value;
              return (
                <li
                  key={option.code}
                  id={`${id}-${option.code}`}
                  role="option"
                  aria-selected={isSelected}
                  onPointerMove={() => setActive(index)}
                  onClick={() => choose(option.code)}
                  className={`flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm ${index === active ? "bg-mist/60" : ""}`}
                >
                  <Flag code={option.code} />
                  <span className="min-w-0 flex-1 truncate text-ink">{option.name}</span>
                  {display === "dial" && <span className="shrink-0 tabular-nums text-ink/50">+{option.dial}</span>}
                  <Check className={`size-4 shrink-0 text-fern ${isSelected ? "" : "invisible"}`} aria-hidden />
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
