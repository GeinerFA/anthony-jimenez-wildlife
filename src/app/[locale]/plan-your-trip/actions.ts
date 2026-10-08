"use server";

import { headers } from "next/headers";
import { after } from "next/server";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { db } from "@/lib/db";
import { verifyRecaptcha } from "@/lib/recaptcha";
import { hashIp, withinRequestLimits } from "@/server/request-limits";
import { deliverRequestEmails, parseRequest, type RequestFormState } from "@/server/requests";

async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
}

/** Envío del formulario "Planifica tu viaje": valida, verifica reCAPTCHA, guarda y manda los correos. */
export async function submitRequest(_prev: RequestFormState, formData: FormData): Promise<RequestFormState> {
  const localeValue = String(formData.get("locale") ?? "");
  const locale = hasLocale(routing.locales, localeValue) ? localeValue : routing.defaultLocale;

  // Campo trampa invisible: una persona no lo ve ni lo llena; un bot sí. Se le responde "enviado" sin guardar nada.
  if (String(formData.get("nl_trap") ?? "") !== "") {
    console.warn("Solicitud descartada: el campo trampa vino lleno (posible bot).");
    return { status: "sent", name: String(formData.get("firstName") ?? ""), email: String(formData.get("email") ?? "") };
  }

  const parsed = parseRequest(formData);
  if (!parsed.success) return { status: "error", error: "invalid", fieldErrors: parsed.fieldErrors };

  const ip = await clientIp();
  const recaptcha = await verifyRecaptcha(String(formData.get("recaptchaToken") ?? "") || null, ip);
  if (!recaptcha.ok) {
    return { status: "error", error: "recaptcha", ...(process.env.NODE_ENV === "development" ? { detail: recaptcha.detail } : {}) };
  }

  try {
    // El límite cuenta solo envíos guardados: corregir un campo mal escrito no gasta intentos.
    const ipHash = hashIp(ip);
    if (!(await withinRequestLimits(ipHash, parsed.data.email))) return { status: "error", error: "rateLimit" };

    const request = await db.contactRequest.create({
      data: { ...parsed.data, locale, recaptchaScore: recaptcha.score, ipHash, consentAt: new Date() },
    });
    // Los correos salen después de responder: el visitante no espera al servidor SMTP.
    after(() => deliverRequestEmails(request));
    return { status: "sent", name: request.firstName, email: request.email };
  } catch (error) {
    // Solo el tipo de error: el objeto completo de Prisma puede traer los datos enviados (nombre, correo...).
    const { name, code } = error as { name?: string; code?: string };
    console.error("No se pudo guardar la solicitud", name ?? "Error", code ?? "");
    return { status: "error", error: "generic" };
  }
}
