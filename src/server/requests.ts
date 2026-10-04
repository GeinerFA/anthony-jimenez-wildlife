import "server-only";
import { parsePhoneNumberFromString } from "libphonenumber-js/min";
import type { CountryCode } from "libphonenumber-js/min";
import { z } from "zod";
import { countryCodes } from "@/config/countries";
import { db } from "@/lib/db";
import { isMailConfigured, mailEnv } from "@/lib/env";
import { confirmationEmail, notificationEmail, type RequestDetails } from "@/lib/mail/request-emails";
import { requestPdf } from "@/lib/mail/request-pdf";
import { sendMail } from "@/lib/mail/transport";

/** Códigos de error que el formulario traduce (messages: Request.errors). */
export type RequestErrorCode = "required" | "email" | "phone" | "country" | "tooLong" | "invalid" | "rateLimit" | "recaptcha" | "generic";

export type RequestFormState =
  | { status: "idle" }
  /** `detail`: motivo técnico, solo en desarrollo (en producción no se envía al navegador). */
  | { status: "error"; error: RequestErrorCode; fieldErrors?: Partial<Record<RequestField, RequestErrorCode>>; detail?: string }
  | { status: "sent"; name: string; email: string };

const text = (max: number) => z.string().trim().min(1, "required").max(max, "tooLong");
const country = z.string().refine((code) => countryCodes.has(code), "country");

const requestSchema = z.object({
  firstName: text(80),
  lastName: text(120),
  email: text(200).pipe(z.email("email")),
  phoneCountry: country,
  phone: text(30),
  nationality: country,
  message: text(5000),
});

export const requestFields = ["firstName", "lastName", "email", "phoneCountry", "phone", "nationality", "message"] as const;
export type RequestField = (typeof requestFields)[number];

/** El número se valida para el país del prefijo y se devuelve en formato internacional (+50688887777). */
function internationalPhone(phone: string, phoneCountry: string) {
  if (!countryCodes.has(phoneCountry)) return null;
  const parsed = parsePhoneNumberFromString(phone, phoneCountry as CountryCode);
  return parsed?.isValid() ? parsed.number : null;
}

export function parseRequest(formData: FormData) {
  const raw = Object.fromEntries(requestFields.map((key) => [key, String(formData.get(key) ?? "")])) as Record<RequestField, string>;
  const result = requestSchema.safeParse(raw);
  // El teléfono se revisa aparte para marcarlo junto con los demás errores, no solo cuando el resto ya está bien.
  const phone = internationalPhone(raw.phone.trim(), raw.phoneCountry);

  const fieldErrors: Partial<Record<RequestField, RequestErrorCode>> = {};
  for (const issue of result.success ? [] : result.error.issues) {
    const field = issue.path[0] as RequestField;
    fieldErrors[field] ??= (issue.message as RequestErrorCode) || "invalid";
  }
  if (!phone && !fieldErrors.phone && !fieldErrors.phoneCountry) fieldErrors.phone = "phone";

  if (result.success && phone) return { success: true, data: { ...result.data, phone } } as const;
  return { success: false, fieldErrors } as const;
}

/**
 * Envía la confirmación al cliente y el aviso (con PDF) a info@. Corre después de responder al formulario:
 * si el correo falla, la solicitud ya quedó guardada y se ve en el panel igual.
 */
export async function deliverRequestEmails(request: RequestDetails) {
  if (!isMailConfigured()) {
    console.warn(`Solicitud ${request.id} guardada sin correos: falta configurar SMTP_* en el servidor.`);
    return;
  }

  try {
    await sendMail({ to: request.email, ...confirmationEmail(request) });
    await db.contactRequest.update({ where: { id: request.id }, data: { confirmationSentAt: new Date() } });
  } catch (error) {
    console.error("No se pudo enviar la confirmación de la solicitud", request.id, error);
  }

  await sendNotification(request);
}

/** Aviso a info@ con la solicitud en PDF. También lo usa el panel para reenviarlo. */
export async function sendNotification(request: RequestDetails) {
  try {
    const pdf = await requestPdf(request);
    await sendMail({
      to: mailEnv().MAIL_NOTIFY_TO,
      // "Responder" en el buzón le escribe directamente al cliente.
      replyTo: { name: `${request.firstName} ${request.lastName}`, address: request.email },
      ...notificationEmail(request),
      attachments: [{ filename: pdfFilename(request), content: pdf, contentType: "application/pdf" }],
    });
    await db.contactRequest.update({ where: { id: request.id }, data: { notificationSentAt: new Date() } });
    return true;
  } catch (error) {
    console.error("No se pudo enviar el aviso de la solicitud", request.id, error);
    return false;
  }
}

/** "solicitud-ana-mora-2026-10-04.pdf" */
export function pdfFilename(request: Pick<RequestDetails, "firstName" | "lastName" | "createdAt">) {
  const slug = `${request.firstName}-${request.lastName}`
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `solicitud-${slug || "cliente"}-${request.createdAt.toISOString().slice(0, 10)}.pdf`;
}
