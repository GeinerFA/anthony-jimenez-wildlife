import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import type Mail from "nodemailer/lib/mailer";
import { mailEnv } from "@/lib/env";
import { LOGO_CID, logoAttachment } from "./logo";

let transporter: Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    const env = mailEnv();
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      // 465 usa SSL directo; 587 (y otros) arrancan en texto plano y suben a TLS con STARTTLS.
      secure: env.SMTP_PORT === 465,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
    });
  }
  return transporter;
}

/**
 * Envía un correo desde MAIL_FROM (el buzón info@). Lanza si el SMTP falla.
 * Si el HTML usa el logo (cid:), lo adjunta en línea: así se ve aunque el sitio no sea accesible (p. ej. localhost).
 */
export async function sendMail(message: Omit<Mail.Options, "from">) {
  const { MAIL_FROM } = mailEnv();
  const usesLogo = typeof message.html === "string" && message.html.includes(`cid:${LOGO_CID}`);
  const attachments = [...(usesLogo ? [logoAttachment] : []), ...(message.attachments ?? [])];
  await getTransporter().sendMail({ from: MAIL_FROM, ...message, attachments });
}
