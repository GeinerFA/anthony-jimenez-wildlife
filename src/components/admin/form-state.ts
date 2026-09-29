/** Resultado de un formulario del panel (server action con useActionState). */
export type FormState = {
  status: "idle" | "saved" | "error";
  message?: string;
  /** Se guardó, pero algo secundario falló (p. ej. la traducción automática). */
  warning?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export const initialFormState: FormState = { status: "idle" };

/** Resultado de una acción puntual (botones: publicar, retraducir, borrar...). */
export type ActionResult = { ok: boolean; message?: string };
