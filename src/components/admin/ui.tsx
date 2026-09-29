import type { ComponentProps, ReactNode } from "react";

type ButtonVariant = "primary" | "lime" | "secondary" | "danger" | "ghost";

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-ink text-bone hover:bg-fern",
  lime: "bg-lime text-ink hover:bg-lime-deep hover:text-white",
  secondary: "border border-ink/20 bg-white text-ink hover:border-ink/50",
  danger: "bg-red-700 text-white hover:bg-red-800",
  ghost: "text-ink/70 hover:bg-ink/5 hover:text-ink",
};

export function buttonClass(variant: ButtonVariant = "primary", size: "sm" | "md" = "md", className = "") {
  return [
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors",
    "disabled:cursor-not-allowed disabled:opacity-50",
    size === "sm" ? "px-3 py-1.5 text-sm" : "px-5 py-2.5 text-sm",
    buttonVariants[variant],
    className,
  ].join(" ");
}

/** Botón cuadrado solo con ícono (el texto va en aria-label y title). */
export const iconButtonClass =
  "inline-grid size-9 place-items-center rounded-full text-ink/60 transition-colors hover:bg-ink/5 hover:text-ink disabled:cursor-not-allowed disabled:opacity-30";

const controlClass =
  "w-full rounded-sm border border-ink/15 bg-white px-3 py-2 text-ink placeholder:text-ink/35 focus:border-fern focus-visible:outline-offset-0 aria-invalid:border-red-600";

type FieldProps = {
  name: string;
  label: string;
  hint?: ReactNode;
  errors?: Record<string, string[] | undefined>;
  className?: string;
};

function FieldShell({ name, label, hint, errors, className, children }: FieldProps & { children: ReactNode }) {
  const error = errors?.[name]?.[0];
  return (
    <div className={className}>
      <label htmlFor={name} className="block text-sm font-semibold text-ink">
        {label}
      </label>
      {hint && (
        <p id={`${name}-hint`} className="mt-0.5 text-xs text-ink/55">
          {hint}
        </p>
      )}
      <div className="mt-1.5">{children}</div>
      {error && (
        <p id={`${name}-error`} className="mt-1 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

function describedBy({ name, hint, errors }: FieldProps) {
  return [hint && `${name}-hint`, errors?.[name]?.length && `${name}-error`].filter(Boolean).join(" ") || undefined;
}

export function TextField({ name, label, hint, errors, className, ...input }: FieldProps & ComponentProps<"input">) {
  return (
    <FieldShell {...{ name, label, hint, errors, className }}>
      <input
        id={name}
        name={name}
        aria-invalid={errors?.[name]?.length ? true : undefined}
        aria-describedby={describedBy({ name, label, hint, errors })}
        className={controlClass}
        {...input}
      />
    </FieldShell>
  );
}

export function TextAreaField({ name, label, hint, errors, className, ...textarea }: FieldProps & ComponentProps<"textarea">) {
  return (
    <FieldShell {...{ name, label, hint, errors, className }}>
      <textarea
        id={name}
        name={name}
        aria-invalid={errors?.[name]?.length ? true : undefined}
        aria-describedby={describedBy({ name, label, hint, errors })}
        className={`${controlClass} min-h-24 leading-relaxed`}
        {...textarea}
      />
    </FieldShell>
  );
}

export function SelectField({ name, label, hint, errors, className, children, ...select }: FieldProps & ComponentProps<"select">) {
  return (
    <FieldShell {...{ name, label, hint, errors, className }}>
      <select
        id={name}
        name={name}
        aria-invalid={errors?.[name]?.length ? true : undefined}
        aria-describedby={describedBy({ name, label, hint, errors })}
        className={controlClass}
        {...select}
      >
        {children}
      </select>
    </FieldShell>
  );
}

export function Card({ title, description, children, className = "" }: { title?: string; description?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-sm border border-ink/10 bg-white p-6 md:p-8 ${className}`}>
      {title && (
        <header className="mb-6">
          <h2 className="font-display text-2xl">{title}</h2>
          {description && <p className="mt-1 text-sm text-ink/60">{description}</p>}
        </header>
      )}
      {children}
    </section>
  );
}

export type Tone = "green" | "gray" | "amber" | "red";

const badgeTones: Record<Tone, string> = {
  green: "bg-fern/10 text-fern",
  gray: "bg-ink/5 text-ink/60",
  amber: "bg-amber-100 text-amber-900",
  red: "bg-red-100 text-red-800",
};

export function Badge({ tone = "gray", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeTones[tone]}`}>
      {children}
    </span>
  );
}

const noticeTones: Record<Tone, string> = {
  green: "border-fern/30 bg-fern/5",
  gray: "border-ink/10 bg-white",
  amber: "border-amber-300 bg-amber-50 text-amber-950",
  red: "border-red-300 bg-red-50 text-red-900",
};

export function Notice({ tone = "gray", children, className = "" }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <div role={tone === "red" || tone === "amber" ? "alert" : "status"} className={`rounded-sm border p-4 text-sm ${noticeTones[tone]} ${className}`}>
      {children}
    </div>
  );
}
