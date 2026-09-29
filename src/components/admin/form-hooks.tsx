"use client";

import { LoaderCircle } from "lucide-react";
import { startTransition, useActionState, type FormEvent, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { initialFormState, type FormState } from "./form-state";
import { buttonClass, Notice } from "./ui";

/**
 * useActionState con envío manual: con `<form action>` React vacía los campos al terminar la acción,
 * y si hubo errores de validación se perdería lo escrito.
 */
export function useFormAction(action: (prev: FormState, formData: FormData) => Promise<FormState>) {
  const [state, dispatch, pending] = useActionState(action, initialFormState);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => dispatch(formData));
  }

  return { state, pending, onSubmit };
}

/** Barra fija al pie del formulario con el resultado del último guardado. */
export function SaveBar({ state, pending, label = "Guardar cambios" }: { state: FormState; pending: boolean; label?: string }) {
  return (
    <div className="sticky bottom-0 z-10 -mx-5 border-t border-ink/10 bg-bone/95 px-5 py-4 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-2 text-sm" aria-live="polite">
          {!pending && state.status === "error" && <p className="font-semibold text-red-700">{state.message}</p>}
          {!pending && state.status === "saved" && <p className="font-semibold text-fern">{state.message}</p>}
          {!pending && state.warning && <Notice tone="amber">{state.warning}</Notice>}
        </div>
        <button type="submit" disabled={pending} className={buttonClass("primary")}>
          {pending && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
          {pending ? "Guardando…" : label}
        </button>
      </div>
    </div>
  );
}

/** Botón de envío para formularios pequeños con `<form action={serverAction}>`. */
export function PendingButton({
  children,
  className,
  disabled,
  ...rest
}: {
  children: ReactNode;
  className: string;
  disabled?: boolean;
  title?: string;
  "aria-label"?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={disabled || pending} className={className} {...rest}>
      {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : children}
    </button>
  );
}
