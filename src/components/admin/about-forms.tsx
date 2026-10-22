"use client";

import { Image as ImageIcon, LoaderCircle, Upload } from "lucide-react";
import Image from "next/image";
import { startTransition, useActionState, useEffect, useRef, useState, type ComponentProps, type FormEvent } from "react";
import { saveAboutProfile, savePartner, saveStat } from "@/app/admin/(panel)/acerca-de-mi/actions";
import { CloudinaryImage } from "@/components/ui/cloudinary-image";
import { acceptedImageTypes, mediaRules, mediaTypeForFile, type AboutAsset } from "@/config/media";
import { uploadToCloudinary, type SignedUpload } from "@/lib/media/upload-client";
import { initialFormState, type FormState } from "./form-state";
import { buttonClass, Notice, TextAreaField, TextField } from "./ui";

/** Sube una imagen de "Acerca de mí" directo del navegador a Cloudinary y devuelve su public_id. */
async function uploadAboutImage(file: File, asset: AboutAsset, onProgress: (fraction: number) => void) {
  if (mediaTypeForFile(file.name) !== "IMAGE") throw new Error("Formato no permitido: subí una imagen (JPG, PNG, WebP…).");
  if (file.size > mediaRules.IMAGE.maxBytes) throw new Error(`La imagen supera el máximo de ${mediaRules.IMAGE.maxLabel}.`);

  const response = await fetch("/api/admin/media/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ aboutAsset: asset, type: "IMAGE" }),
  });
  const signed = (await response.json().catch(() => ({}))) as SignedUpload & { error?: string };
  if (!response.ok) throw new Error(signed.error ?? "No se pudo autorizar la subida.");
  return (await uploadToCloudinary(file, signed, onProgress)).public_id;
}

/**
 * Como useFormAction, pero si el formulario trae una imagen nueva (campo "file") primero la sube a
 * Cloudinary y envía su public_id en `publicIdField`. Con `resetOnSave` vacía el formulario al guardar
 * (formularios para agregar).
 */
function useImageFormAction(
  action: (prev: FormState, formData: FormData) => Promise<FormState>,
  { asset, publicIdField, resetOnSave = false }: { asset: AboutAsset; publicIdField: string; resetOnSave?: boolean },
) {
  const [state, dispatch, saving] = useActionState(action, initialFormState);
  const [progress, setProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Al guardar: el formulario para agregar se vacía; en los de edición solo se suelta la imagen ya subida
  // (si no, el siguiente guardado la subiría otra vez).
  useEffect(() => {
    if (state.status !== "saved" || !formRef.current) return;
    if (resetOnSave) formRef.current.reset();
    else formRef.current.querySelectorAll<HTMLInputElement>('input[type="file"]').forEach((input) => (input.value = ""));
    setPreview(null);
  }, [state, resetOnSave]);

  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  function onFileChange(file: File | undefined) {
    setUploadError(null);
    setPreview(file ? URL.createObjectURL(file) : null);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const file = formData.get("file");
    formData.delete("file");
    setUploadError(null);

    if (file instanceof File && file.size > 0) {
      try {
        setProgress(0);
        formData.set(publicIdField, await uploadAboutImage(file, asset, setProgress));
      } catch (error) {
        setUploadError(error instanceof Error ? error.message : "No se pudo subir la imagen.");
        return;
      } finally {
        setProgress(null);
      }
    }
    startTransition(() => dispatch(formData));
  }

  return { state, pending: saving || progress !== null, progress, uploadError, preview, formRef, onSubmit, onFileChange };
}

/** Resultado del guardado y botón, al pie de cada formulario. */
function FormFooter({ state, pending, progress, uploadError, label }: { state: FormState; pending: boolean; progress: number | null; uploadError: string | null; label: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 pt-4">
      <div className="min-w-0 flex-1 space-y-2 text-sm" aria-live="polite">
        {uploadError && <p className="font-semibold text-red-700">{uploadError}</p>}
        {!pending && state.status === "error" && <p className="font-semibold text-red-700">{state.message}</p>}
        {!pending && state.status === "saved" && <p className="font-semibold text-fern">{state.message}</p>}
        {!pending && state.warning && <Notice tone="amber">{state.warning}</Notice>}
      </div>
      <button type="submit" disabled={pending} className={buttonClass("primary", "sm")}>
        {pending && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
        {progress !== null ? `Subiendo ${Math.round(progress * 100)} %` : pending ? "Guardando…" : label}
      </button>
    </div>
  );
}

/** Vista previa de la imagen (la guardada o la recién elegida) con el botón para elegir otra. */
function ImagePicker({
  current,
  preview,
  aspect,
  label,
  error,
  disabled,
  onChange,
}: {
  current: string | null;
  preview: string | null;
  aspect: string;
  label: string;
  error?: string;
  disabled: boolean;
  onChange: (file: File | undefined) => void;
}) {
  return (
    <div>
      <div className={`relative overflow-hidden rounded-sm border border-ink/10 bg-mist ${aspect}`}>
        {preview ? (
          // Archivo local recién elegido (blob:), todavía sin subir.
          <Image src={preview} alt="" fill unoptimized className="object-contain" />
        ) : current ? (
          <CloudinaryImage src={current} alt="" fill sizes="240px" className="object-contain" />
        ) : (
          <ImageIcon className="absolute inset-0 m-auto size-6 text-ink/30" aria-hidden />
        )}
      </div>
      <label className={`${buttonClass("secondary", "sm", "mt-3 w-full")} ${disabled ? "pointer-events-none opacity-50" : "cursor-pointer"}`}>
        <Upload className="size-4" aria-hidden />
        {current || preview ? `Cambiar ${label}` : `Subir ${label}`}
        <input type="file" name="file" accept={acceptedImageTypes} disabled={disabled} className="sr-only" onChange={(event) => onChange(event.target.files?.[0])} />
      </label>
      {error && <p className="mt-1 text-sm text-red-700">{error}</p>}
    </div>
  );
}

const englishHint = "Se traduce solo al guardar. Si lo corregís a mano, ya no se sobrescribe.";

// ── Biografía ────────────────────────────────────────────────────────────────

export type ProfileValues = { bioEs: string; quoteEs: string; bioEn: string; quoteEn: string; photoUrl: string | null };

export function AboutProfileForm({ values, uploadsEnabled }: { values: ProfileValues; uploadsEnabled: boolean }) {
  const form = useImageFormAction(saveAboutProfile, { asset: "photo", publicIdField: "photoPublicId" });
  const errors = form.state.fieldErrors;

  return (
    <form ref={form.formRef} onSubmit={form.onSubmit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-[14rem_minmax(0,1fr)]">
        <ImagePicker
          current={values.photoUrl}
          preview={form.preview}
          aspect="aspect-[4/5]"
          label="foto"
          disabled={form.pending || !uploadsEnabled}
          onChange={form.onFileChange}
        />
        <div className="grid content-start gap-6">
          <TextAreaField
            name="bioEs"
            label="Biografía"
            hint="Separá los párrafos con una línea en blanco."
            defaultValue={values.bioEs}
            errors={errors}
            maxLength={5000}
            rows={8}
            required
          />
          <TextField name="quoteEs" label="Frase destacada" hint="Opcional. Se muestra grande junto a la biografía." defaultValue={values.quoteEs} errors={errors} maxLength={200} />
        </div>
      </div>

      <details className="rounded-sm border border-ink/10 p-4">
        <summary className="cursor-pointer text-sm font-semibold">Versión en inglés</summary>
        <p className="mt-1 text-xs text-ink/55">{englishHint}</p>
        <div className="mt-4 grid gap-6">
          <TextAreaField name="bioEn" label="Biography" defaultValue={values.bioEn} errors={errors} maxLength={5000} rows={8} />
          <TextField name="quoteEn" label="Quote" defaultValue={values.quoteEn} errors={errors} maxLength={200} />
        </div>
      </details>

      <FormFooter state={form.state} pending={form.pending} progress={form.progress} uploadError={form.uploadError} label="Guardar biografía" />
    </form>
  );
}

// ── Cifras ───────────────────────────────────────────────────────────────────

export type StatValues = { id: string; value: number; suffix: string; network: string; labelEs: string; labelEn: string; featured: boolean };

export function StatForm({ stat }: { stat?: StatValues }) {
  const [state, dispatch, pending] = useActionState(saveStat.bind(null, stat?.id ?? null), initialFormState);
  const formRef = useRef<HTMLFormElement>(null);
  const errors = state.fieldErrors;
  const prefix = stat?.id ?? "new-stat";

  useEffect(() => {
    if (!stat && state.status === "saved") formRef.current?.reset();
  }, [state, stat]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => dispatch(formData));
  }

  // Los id de los campos llevan el id de la cifra: hay un formulario por fila en la misma página.
  const field = (name: string) => ({ id: `${prefix}-${name}`, name });

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_6rem_minmax(0,1fr)]">
        <IdField {...field("value")} label="Número" hint="Sin puntos ni comas: 12500." defaultValue={stat?.value ?? ""} errors={errors} inputMode="numeric" required />
        <IdField {...field("suffix")} label="Sufijo" hint="Opcional: +, %" defaultValue={stat?.suffix ?? ""} errors={errors} maxLength={3} />
        <div>
          <label htmlFor={`${prefix}-network`} className="block text-sm font-semibold">Red social</label>
          <p className="mt-0.5 text-xs text-ink/55">Enlaza al perfil y muestra su ícono.</p>
          <select id={`${prefix}-network`} name="network" defaultValue={stat?.network ?? ""} className="mt-1.5 w-full rounded-sm border border-ink/15 bg-white px-3 py-2">
            <option value="">Ninguna (cifra propia)</option>
            <option value="INSTAGRAM">Instagram</option>
            <option value="FACEBOOK">Facebook</option>
            <option value="TIKTOK">TikTok</option>
          </select>
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <IdField {...field("labelEs")} label="Qué mide" hint="P. ej. «Seguidores en Instagram», «Años de experiencia»." defaultValue={stat?.labelEs ?? ""} errors={errors} maxLength={60} required />
        <IdField {...field("labelEn")} label="En inglés" hint={englishHint} defaultValue={stat?.labelEn ?? ""} errors={errors} maxLength={60} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="featured" defaultChecked={stat?.featured ?? false} className="size-4 accent-fern" />
        Destacar en el inicio
      </label>
      <FormFooter state={state} pending={pending} progress={null} uploadError={null} label={stat ? "Guardar cifra" : "Agregar cifra"} />
    </form>
  );
}

/** Como TextField, pero con id propio: varios formularios de cifras y aliados conviven en la página. */
function IdField({ id, name, label, hint, errors, ...input }: { id: string; name: string; label: string; hint?: string; errors?: FormState["fieldErrors"] } & ComponentProps<"input">) {
  const error = errors?.[name]?.[0];
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold">{label}</label>
      {hint && <p className="mt-0.5 text-xs text-ink/55">{hint}</p>}
      <input
        id={id}
        name={name}
        aria-invalid={error ? true : undefined}
        className="mt-1.5 w-full rounded-sm border border-ink/15 bg-white px-3 py-2 placeholder:text-ink/35 focus:border-fern aria-invalid:border-red-600"
        {...input}
      />
      {error && <p className="mt-1 text-sm text-red-700">{error}</p>}
    </div>
  );
}

// ── Aliados ──────────────────────────────────────────────────────────────────

export type PartnerValues = { id: string; name: string; url: string; descEs: string; descEn: string; active: boolean; logoUrl: string };

export function PartnerForm({ partner, uploadsEnabled }: { partner?: PartnerValues; uploadsEnabled: boolean }) {
  const form = useImageFormAction(savePartner.bind(null, partner?.id ?? null), { asset: "partner", publicIdField: "logoPublicId", resetOnSave: !partner });
  const errors = form.state.fieldErrors;
  const prefix = partner?.id ?? "new-partner";
  const field = (name: string) => ({ id: `${prefix}-${name}`, name });

  return (
    <form ref={form.formRef} onSubmit={form.onSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-[10rem_minmax(0,1fr)]">
        <ImagePicker
          current={partner?.logoUrl ?? null}
          preview={form.preview}
          aspect="aspect-[3/2]"
          label="logo"
          error={errors?.logo?.[0]}
          disabled={form.pending || !uploadsEnabled}
          onChange={form.onFileChange}
        />
        <div className="grid content-start gap-5">
          <IdField {...field("name")} label="Nombre" defaultValue={partner?.name ?? ""} errors={errors} maxLength={80} required />
          <IdField {...field("url")} label="Enlace" hint="Opcional: sitio web o red del aliado." defaultValue={partner?.url ?? ""} errors={errors} maxLength={300} placeholder="hotel.com" />
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <PartnerText {...field("descEs")} label="Descripción corta" hint="Opcional. Qué hacen juntos." defaultValue={partner?.descEs ?? ""} errors={errors} />
        <PartnerText {...field("descEn")} label="En inglés" hint={englishHint} defaultValue={partner?.descEn ?? ""} errors={errors} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="active" defaultChecked={partner?.active ?? true} className="size-4 accent-fern" />
        Visible en el sitio
      </label>
      <FormFooter state={form.state} pending={form.pending} progress={form.progress} uploadError={form.uploadError} label={partner ? "Guardar aliado" : "Agregar aliado"} />
    </form>
  );
}

/** Textarea con id propio, como IdField. */
function PartnerText({ id, name, label, hint, errors, defaultValue }: { id: string; name: string; label: string; hint: string; errors?: FormState["fieldErrors"]; defaultValue: string }) {
  const error = errors?.[name]?.[0];
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold">{label}</label>
      <p className="mt-0.5 text-xs text-ink/55">{hint}</p>
      <textarea
        id={id}
        name={name}
        defaultValue={defaultValue}
        maxLength={200}
        rows={3}
        aria-invalid={error ? true : undefined}
        className="mt-1.5 w-full rounded-sm border border-ink/15 bg-white px-3 py-2 leading-relaxed focus:border-fern aria-invalid:border-red-600"
      />
      {error && <p className="mt-1 text-sm text-red-700">{error}</p>}
    </div>
  );
}