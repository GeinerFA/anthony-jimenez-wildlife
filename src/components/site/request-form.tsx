"use client";

import { CircleCheck, LoaderCircle, Send } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Script from "next/script";
import { startTransition, useActionState, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { submitRequest } from "@/app/[locale]/plan-your-trip/actions";
import { RECAPTCHA_ACTION } from "@/config/recaptcha";
import { Link } from "@/i18n/navigation";
import { countryOptions, dialCode } from "@/lib/countries";
import type { RequestErrorCode, RequestField, RequestFormState } from "@/server/requests";
import { CountrySelect } from "./country-select";

declare global {
  interface Window {
    grecaptcha?: { ready: (callback: () => void) => void; execute: (siteKey: string, options: { action: string }) => Promise<string> };
  }
}

const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

/** Token de reCAPTCHA v3 para este envío (cada token sirve una sola vez y vence a los 2 minutos). */
function recaptchaToken(key: string) {
  return new Promise<string>((resolve, reject) => {
    const grecaptcha = window.grecaptcha;
    if (!grecaptcha) return reject(new Error("reCAPTCHA no cargó"));
    grecaptcha.ready(() => grecaptcha.execute(key, { action: RECAPTCHA_ACTION }).then(resolve, reject));
  });
}

/** País probable del visitante según el idioma del navegador ("en-US" → US); Costa Rica si no se puede saber. */
function guessCountry() {
  for (const language of navigator.languages ?? [navigator.language]) {
    const region = language.split("-")[1]?.toUpperCase();
    if (region && dialCode(region)) return region;
  }
  return "CR";
}

const controlClass = (invalid: boolean) =>
  `w-full rounded-sm border bg-white px-4 text-ink transition-colors placeholder:text-ink/40 focus:outline-none focus-visible:border-fern focus-visible:ring-2 focus-visible:ring-lime/40 ${
    invalid ? "border-red-600" : "border-ink/15 hover:border-ink/30"
  }`;

/** Formulario "Planifica tu viaje". Tras enviarlo muestra la confirmación; "Enviar otra" lo vuelve a montar limpio. */
export function RequestForm() {
  const [round, setRound] = useState(0);
  return <RequestFormInner key={round} onReset={() => setRound((r) => r + 1)} />;
}

function RequestFormInner({ onReset }: { onReset: () => void }) {
  const t = useTranslations("Request");
  const locale = useLocale();
  const options = useMemo(() => countryOptions(locale), [locale]);
  const [state, formAction, pending] = useActionState<RequestFormState, FormData>(submitRequest, { status: "idle" });
  const [phoneCountry, setPhoneCountry] = useState("");
  const [nationality, setNationality] = useState("");
  const [preparing, setPreparing] = useState(false);
  const [clientError, setClientError] = useState<RequestErrorCode | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);

  // El prefijo se adivina en el navegador (no en el servidor) para no generar diferencias al hidratar.
  useEffect(() => setPhoneCountry((current) => current || guessCountry()), []);

  // Desde la página de un tour (?tour=Nombre), el mensaje ya menciona ese tour, si la persona no lo editó todavía.
  useEffect(() => {
    const tour = new URLSearchParams(window.location.search).get("tour")?.trim().slice(0, 150);
    const textarea = messageRef.current;
    if (tour && textarea && t.has("tourLine") && textarea.value === t("defaultMessage")) textarea.value = `${t("defaultMessage")}${t("tourLine", { tour })}\n`;
  }, [t]);

  const fieldErrors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  const formError = clientError ?? (state.status === "error" ? state.error : null);
  const busy = pending || preparing;

  // Tras un error: foco en el primer campo marcado. Tras enviar: la confirmación a la vista.
  useEffect(() => {
    if (state.status === "error") {
      const first = formRef.current?.querySelector<HTMLElement>("[aria-invalid='true'], [data-invalid='true']");
      first?.focus();
    } else if (state.status === "sent") {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [state]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setClientError(null);
    const formData = new FormData(event.currentTarget);
    if (siteKey) {
      setPreparing(true);
      try {
        formData.set("recaptchaToken", await recaptchaToken(siteKey));
      } catch (error) {
        // Casi siempre: una extensión o la protección contra rastreo del navegador bloqueó el script de Google.
        console.error("reCAPTCHA no pudo generar el token en este navegador:", error);
        setPreparing(false);
        setClientError("recaptcha");
        return;
      }
      setPreparing(false);
    }
    startTransition(() => formAction(formData));
  }

  if (state.status === "sent") {
    return (
      <div ref={resultRef} className="rounded-sm border border-ink/10 bg-white p-8 text-center md:p-12" role="status">
        <CircleCheck className="mx-auto size-14 text-fern" aria-hidden />
        <h2 className="mt-6 font-display text-3xl md:text-4xl">{t("successTitle")}</h2>
        <p className="mx-auto mt-4 max-w-md text-lg text-ink/75">{t("successText", { name: state.name, email: state.email })}</p>
        <button type="button" onClick={onReset} className="mt-8 text-sm font-semibold uppercase tracking-[0.16em] text-fern underline-offset-4 hover:underline">
          {t("sendAnother")}
        </button>
      </div>
    );
  }

  const error = (field: RequestField) => fieldErrors[field];
  const errorId = (field: RequestField) => (fieldErrors[field] ? `${field}-error` : undefined);

  return (
    <>
      {siteKey && <Script src={`https://www.google.com/recaptcha/api.js?render=${siteKey}`} strategy="afterInteractive" />}

      <form ref={formRef} onSubmit={onSubmit} noValidate className="rounded-sm border border-ink/10 bg-white p-6 md:p-10">
        <input type="hidden" name="locale" value={locale} />
        {/* Campo trampa para bots: oculto para personas y lectores de pantalla. El nombre y la etiqueta no deben
            parecer un dato real (antes era "website" y el autocompletado de Chrome lo llenaba). */}
        <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label>
            Dejar vacío
            <input type="text" name="nl_trap" tabIndex={-1} autoComplete="off" data-1p-ignore data-lpignore="true" data-form-type="other" defaultValue="" />
          </label>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field label={t("fields.firstName")} htmlFor="firstName" error={error("firstName")}>
            <input id="firstName" name="firstName" autoComplete="given-name" maxLength={80} required aria-invalid={!!error("firstName")} aria-describedby={errorId("firstName")} className={`h-14 ${controlClass(!!error("firstName"))}`} />
          </Field>
          <Field label={t("fields.lastName")} htmlFor="lastName" error={error("lastName")}>
            <input id="lastName" name="lastName" autoComplete="family-name" maxLength={120} required aria-invalid={!!error("lastName")} aria-describedby={errorId("lastName")} className={`h-14 ${controlClass(!!error("lastName"))}`} />
          </Field>

          <Field label={t("fields.email")} htmlFor="email" error={error("email")} className="sm:col-span-2">
            <input id="email" name="email" type="email" autoComplete="email" inputMode="email" maxLength={200} required aria-invalid={!!error("email")} aria-describedby={errorId("email")} className={`h-14 ${controlClass(!!error("email"))}`} />
          </Field>

          {/* Teléfono: prefijo con bandera + número. */}
          <Field label={t("fields.phone")} htmlFor="phone" error={error("phone") ?? error("phoneCountry")}>
            <div className="flex gap-2">
              <CountrySelect
                name="phoneCountry"
                value={phoneCountry}
                onChange={setPhoneCountry}
                options={options}
                display="dial"
                label={t("phonePrefix")}
                placeholder="+"
                searchPlaceholder={t("countrySearch")}
                noResults={t("noResults")}
                invalid={!!error("phoneCountry")}
                className="w-36 shrink-0"
              />
              <input id="phone" name="phone" type="tel" autoComplete="tel-national" inputMode="tel" maxLength={30} required aria-invalid={!!error("phone")} aria-describedby={errorId("phone")} className={`h-14 min-w-0 flex-1 ${controlClass(!!error("phone"))}`} />
            </div>
          </Field>

          <Field label={t("fields.nationality")} htmlFor="nationality" error={error("nationality")} labelAsText>
            <CountrySelect
              name="nationality"
              value={nationality}
              onChange={setNationality}
              options={options}
              display="name"
              label={t("fields.nationality")}
              placeholder={t("selectCountry")}
              searchPlaceholder={t("countrySearch")}
              noResults={t("noResults")}
              invalid={!!error("nationality")}
              describedBy={errorId("nationality")}
            />
          </Field>

          <Field label={t("fields.message")} htmlFor="message" error={error("message")} hint={t("messageHint")} className="sm:col-span-2">
            <textarea
              ref={messageRef}
              id="message"
              name="message"
              rows={7}
              maxLength={5000}
              required
              defaultValue={t("defaultMessage")}
              aria-invalid={!!error("message")}
              aria-describedby={[errorId("message"), "message-hint"].filter(Boolean).join(" ")}
              className={`resize-y py-3 leading-relaxed ${controlClass(!!error("message"))}`}
            />
          </Field>

          {/* Consentimiento (Ley 8968 / RGPD): obligatorio; el servidor lo vuelve a comprobar y guarda la fecha. */}
          <div className="sm:col-span-2">
            <label htmlFor="consent" className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-ink/80">
              <input
                id="consent"
                name="consent"
                type="checkbox"
                required
                aria-invalid={!!error("consent")}
                aria-describedby={errorId("consent")}
                className="mt-0.5 size-5 shrink-0 cursor-pointer accent-fern"
              />
              <span>
                {t.rich("consent", {
                  link: (chunks) => (
                    <Link href="/privacy" target="_blank" className="font-semibold text-fern underline hover:text-lime-deep">
                      {chunks}
                    </Link>
                  ),
                })}
              </span>
            </label>
            {error("consent") && (
              <p id="consent-error" className="mt-2 text-sm text-red-700">
                {t(`errors.${error("consent")}`)}
              </p>
            )}
          </div>
        </div>

        {formError && (
          <p role="alert" className="mt-6 rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {t(`errors.${formError}`)}
            {/* Solo en desarrollo: el motivo técnico (p. ej. el puntaje de reCAPTCHA). */}
            {state.status === "error" && state.detail && !clientError && (
              <span className="mt-1 block font-mono text-xs text-red-700/80">Detalle (solo en desarrollo): {state.detail}</span>
            )}
          </p>
        )}

        <div className="mt-8 flex flex-col-reverse gap-6 sm:flex-row sm:items-center sm:justify-between">
          {siteKey ? (
            <p className="max-w-sm text-xs leading-relaxed text-ink/50">
              {t.rich("recaptchaNotice", {
                privacy: (chunks) => <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline">{chunks}</a>,
                terms: (chunks) => <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="underline">{chunks}</a>,
              })}
            </p>
          ) : (
            <span />
          )}
          <button
            type="submit"
            disabled={busy}
            className="inline-flex h-14 shrink-0 items-center justify-center gap-2 rounded-full bg-lime px-8 text-sm font-semibold uppercase tracking-[0.16em] text-ink transition-colors hover:bg-moss hover:text-bone disabled:cursor-wait disabled:opacity-70"
          >
            {busy ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}
            {busy ? t("sending") : t("submit")}
          </button>
        </div>
      </form>
    </>
  );
}

function Field({
  label,
  htmlFor,
  error,
  hint,
  className = "",
  labelAsText = false,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: RequestErrorCode;
  hint?: string;
  className?: string;
  /** Para controles que no son <input> (el selector de país lleva su propia etiqueta accesible). */
  labelAsText?: boolean;
  children: ReactNode;
}) {
  const t = useTranslations("Request");
  const labelClass = "mb-2 block text-sm font-semibold text-ink";
  return (
    <div className={className}>
      {labelAsText ? <p className={labelClass}>{label}</p> : <label htmlFor={htmlFor} className={labelClass}>{label}</label>}
      {children}
      {hint && !error && (
        <p id={`${htmlFor}-hint`} className="mt-2 text-sm text-ink/55">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${htmlFor}-error`} className="mt-2 text-sm text-red-700">
          {t(`errors.${error}`)}
        </p>
      )}
    </div>
  );
}
