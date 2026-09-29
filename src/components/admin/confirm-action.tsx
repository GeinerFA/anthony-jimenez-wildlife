"use client";

import { LoaderCircle } from "lucide-react";
import { useState, useTransition, type ReactNode } from "react";
import type { ActionResult } from "./form-state";
import { buttonClass } from "./ui";

type Props = {
  action: () => Promise<ActionResult | void>;
  children: ReactNode;
  /** Si se indica, se pide confirmación en un segundo paso antes de ejecutar. */
  question?: string;
  confirmLabel?: string;
  variant?: "danger" | "secondary" | "primary";
};

/** Botón para una acción del servidor, con confirmación en dos pasos y mensaje de resultado. */
export function ConfirmAction({ action, children, question, confirmLabel = "Sí, continuar", variant = "secondary" }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();

  function run() {
    setResult(null);
    startTransition(async () => {
      const outcome = await action();
      setConfirming(false);
      if (outcome) setResult(outcome);
    });
  }

  return (
    <div className="space-y-3">
      {confirming ? (
        <div className="flex flex-wrap items-center gap-3 rounded-sm border border-ink/10 bg-bone p-3">
          <p className="text-sm font-semibold">{question}</p>
          <button type="button" onClick={run} disabled={pending} className={buttonClass(variant === "danger" ? "danger" : "primary", "sm")}>
            {pending && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
            {confirmLabel}
          </button>
          <button type="button" onClick={() => setConfirming(false)} disabled={pending} className={buttonClass("ghost", "sm")}>
            Cancelar
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => (question ? setConfirming(true) : run())}
          disabled={pending}
          className={buttonClass(variant, "sm")}
        >
          {pending && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
          {children}
        </button>
      )}
      {result?.message && (
        <p role={result.ok ? "status" : "alert"} className={`text-sm font-semibold ${result.ok ? "text-fern" : "text-red-700"}`}>
          {result.message}
        </p>
      )}
    </div>
  );
}
