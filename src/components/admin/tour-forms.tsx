"use client";

import type { ReactNode } from "react";
import type { FormState } from "./form-state";
import { SaveBar, useFormAction } from "./form-hooks";
import type { TourDataValues, TranslationValues } from "./tour-form-values";
import { Card, SelectField, TextAreaField, TextField } from "./ui";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;
type Errors = FormState["fieldErrors"];

const copy = {
  es: {
    content: "Contenido en español",
    contentHelp: "Se escribe en español; el inglés se genera automáticamente al guardar.",
  },
  en: {
    content: "Contenido en inglés",
    contentHelp: "Al guardar aquí, esta versión queda marcada como editada a mano.",
  },
} as const;

/** Campos de contenido que existen en cada idioma. `details` se inserta después del bloque principal. */
function TranslationFields({ locale, values, errors, details }: { locale: "es" | "en"; values: TranslationValues; errors: Errors; details?: ReactNode }) {
  const t = copy[locale];
  return (
    <>
      <Card title={t.content} description={t.contentHelp}>
        <div className="grid gap-6">
          <TextField name="title" label="Título" defaultValue={values.title} errors={errors} required maxLength={120} />
          <TextAreaField
            name="summary"
            label="Resumen"
            hint="Una o dos frases. Aparece en las tarjetas del listado y en la portada del tour."
            defaultValue={values.summary}
            errors={errors}
            required
            maxLength={300}
            rows={2}
          />
          <TextAreaField
            name="description"
            label="Descripción"
            hint="Separá los párrafos con una línea en blanco. El primer párrafo se muestra destacado."
            defaultValue={values.description}
            errors={errors}
            required
            rows={10}
          />
          <TextAreaField
            name="itinerary"
            label="Itinerario (opcional)"
            hint="Un paso por párrafo, p. ej. «7:00 a. m. — Salida desde La Fortuna»."
            defaultValue={values.itinerary}
            errors={errors}
            rows={6}
          />
          <TextField name="meetingPoint" label="Punto de encuentro (opcional)" defaultValue={values.meetingPoint} errors={errors} maxLength={300} />
        </div>
      </Card>

      {details}

      <Card title="Listas" description="Un elemento por línea.">
        <div className="grid gap-6 md:grid-cols-3">
          <TextAreaField name="includes" label="Incluye" defaultValue={values.includes} errors={errors} rows={6} />
          <TextAreaField name="excludes" label="No incluye" defaultValue={values.excludes} errors={errors} rows={6} />
          <TextAreaField name="whatToBring" label="Qué llevar" defaultValue={values.whatToBring} errors={errors} rows={6} />
        </div>
      </Card>

      <Card title="SEO (opcional)" description="Si se dejan vacíos, Google usa el título y el resumen.">
        <div className="grid gap-6">
          <TextField name="seoTitle" label="Título para buscadores" hint="Hasta 70 caracteres." defaultValue={values.seoTitle} errors={errors} maxLength={70} />
          <TextAreaField
            name="seoDescription"
            label="Descripción para buscadores"
            hint="Hasta 160 caracteres."
            defaultValue={values.seoDescription}
            errors={errors}
            maxLength={160}
            rows={2}
          />
        </div>
      </Card>
    </>
  );
}

function TourDetails({ values, errors }: { values: TourDataValues; errors: Errors }) {
  return (
    <Card title="Detalles del tour" description="Datos que no dependen del idioma.">
      <div className="grid gap-6 sm:grid-cols-2">
        <fieldset>
          <legend className="text-sm font-semibold">Duración</legend>
          <div className="mt-1.5 grid grid-cols-2 gap-3">
            <TextField name="durationHours" label="Horas" type="number" min={0} max={240} defaultValue={values.durationHours} errors={errors} />
            <TextField name="durationMins" label="Minutos" type="number" min={0} max={59} defaultValue={values.durationMins} errors={errors} />
          </div>
        </fieldset>
        <SelectField name="difficulty" label="Dificultad" defaultValue={values.difficulty} errors={errors} className="self-end">
          <option value="">Sin indicar</option>
          <option value="EASY">Fácil</option>
          <option value="MODERATE">Moderado</option>
          <option value="CHALLENGING">Exigente</option>
        </SelectField>
        <TextField
          name="location"
          label="Ubicación"
          hint="Nombre del lugar; no se traduce. P. ej. «La Fortuna, Alajuela»."
          defaultValue={values.location}
          errors={errors}
          maxLength={120}
          className="sm:col-span-2"
        />
      </div>
    </Card>
  );
}

/** Formulario principal: contenido en español + datos del tour. Sirve para crear y para editar. */
export function TourForm({ action, content, data, submitLabel }: { action: Action; content: TranslationValues; data: TourDataValues; submitLabel?: string }) {
  const { state, pending, onSubmit } = useFormAction(action);
  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <TranslationFields locale="es" values={content} errors={state.fieldErrors} details={<TourDetails values={data} errors={state.fieldErrors} />} />
      <SaveBar state={state} pending={pending} label={submitLabel} />
    </form>
  );
}

export function EnglishForm({ action, content }: { action: Action; content: TranslationValues }) {
  const { state, pending, onSubmit } = useFormAction(action);
  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <TranslationFields locale="en" values={content} errors={state.fieldErrors} />
      <SaveBar state={state} pending={pending} label="Guardar inglés" />
    </form>
  );
}
