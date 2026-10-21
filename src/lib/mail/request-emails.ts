import "server-only";
import { createTranslator } from "use-intl/core";
import en from "../../../messages/en.json";
import es from "../../../messages/es.json";
import { siteConfig, whatsappUrl } from "@/config/site";
import type { Locale } from "@/i18n/routing";
import { countryName } from "@/lib/countries";
import { formatPhone } from "@/lib/phone";
import { LOGO_CID } from "./logo";

export type RequestDetails = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  phoneCountry: string;
  nationality: string;
  message: string;
  locale: Locale;
  createdAt: Date;
};

// Colores de la marca (globals.css). Los correos llevan estilos en línea: los clientes de correo ignoran <style>.
const c = { moss: "#014d27", fern: "#016533", lime: "#96c020", ink: "#06140c", bone: "#f4f7ef", mist: "#dde7d3", muted: "#5b6a60" };
const font = "font-family:Helvetica,Arial,sans-serif;";
const serif = "font-family:Georgia,'Times New Roman',serif;";

const escape = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const multiline = (text: string) => escape(text).replace(/\r?\n/g, "<br>");

function button(href: string, label: string, variant: "lime" | "outline" = "lime") {
  const style =
    variant === "lime"
      ? `background:${c.lime};color:${c.ink};border:1px solid ${c.lime};`
      : `background:#ffffff;color:${c.ink};border:1px solid #c9d3c4;`;
  return `<a href="${escape(href)}" style="${font}${style}display:inline-block;padding:12px 22px;border-radius:999px;font-size:13px;font-weight:bold;letter-spacing:.08em;text-transform:uppercase;text-decoration:none;margin:4px 6px 4px 0;">${escape(label)}</a>`;
}

/** Estructura común: banda verde con logo, tarjeta blanca y pie. `preheader` es el texto de vista previa del buzón. */
function layout({ preheader, eyebrow, title, body, footer }: { preheader: string; eyebrow: string; title: string; body: string; footer: string }) {
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)}</title></head>
<body style="margin:0;padding:0;background:${c.bone};">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">${escape(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${c.bone};"><tr><td align="center" style="padding:32px 12px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">
    <tr><td style="background:${c.moss};border-radius:14px 14px 0 0;padding:28px 32px;">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td style="padding-right:14px;"><img src="cid:${LOGO_CID}" width="48" height="48" alt="" style="display:block;"></td>
        <td style="${serif}color:#ffffff;font-size:22px;">${escape(siteConfig.name)}<br><span style="${font}color:${c.lime};font-size:10px;letter-spacing:.24em;font-weight:bold;">COSTA RICA</span></td>
      </tr></table>
    </td></tr>
    <tr><td style="background:${c.lime};height:4px;line-height:4px;font-size:0;">&nbsp;</td></tr>
    <tr><td style="background:#ffffff;padding:36px 32px;border-radius:0 0 14px 14px;">
      <p style="${font}margin:0 0 10px;color:${c.fern};font-size:11px;letter-spacing:.24em;font-weight:bold;text-transform:uppercase;">${escape(eyebrow)}</p>
      <h1 style="${serif}margin:0 0 20px;color:${c.ink};font-size:30px;line-height:1.15;font-weight:normal;">${escape(title)}</h1>
      ${body}
    </td></tr>
    <tr><td style="${font}padding:22px 32px;color:${c.muted};font-size:12px;line-height:1.6;text-align:center;">${footer}</td></tr>
  </table>
</td></tr></table>
</body></html>`;
}

/** Tabla de datos de la solicitud (etiqueta / valor). */
function detailsTable(rows: [string, string][]) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${c.mist};margin:0 0 24px;">
${rows
  .map(
    ([label, value]) => `<tr>
  <td style="${font}padding:11px 12px 11px 0;border-bottom:1px solid ${c.mist};color:${c.muted};font-size:11px;letter-spacing:.12em;text-transform:uppercase;font-weight:bold;width:38%;vertical-align:top;">${escape(label)}</td>
  <td style="${font}padding:11px 0;border-bottom:1px solid ${c.mist};color:${c.ink};font-size:15px;">${value}</td>
</tr>`,
  )
  .join("\n")}
</table>`;
}

function messageBox(text: string) {
  return `<div style="${font}background:${c.bone};border-left:3px solid ${c.lime};padding:16px 18px;color:${c.ink};font-size:15px;line-height:1.6;margin:0 0 28px;">${multiline(text)}</div>`;
}

/**
 * Correo al cliente, en el idioma en que llenó el formulario. No repite el mensaje libre: el correo
 * va a la dirección que se escribió en el formulario, y repetir texto ajeno permitiría usarlo para spam.
 */
export function confirmationEmail(request: RequestDetails) {
  const t = createTranslator({ locale: request.locale, messages: request.locale === "en" ? en : es, namespace: "RequestEmail" });
  const name = request.firstName;

  const html = layout({
    preheader: t("preheader"),
    eyebrow: t("eyebrow"),
    title: t("title", { name }),
    body: `
      <p style="${font}margin:0 0 16px;color:${c.ink};font-size:16px;line-height:1.65;">${escape(t("intro"))}</p>
      <p style="${font}margin:0 0 28px;color:${c.ink};font-size:16px;line-height:1.65;">${escape(t("soon"))}</p>
      <p style="${font}margin:0 0 10px;color:${c.fern};font-size:11px;letter-spacing:.24em;font-weight:bold;text-transform:uppercase;">${escape(t("summary"))}</p>
      ${detailsTable([
        [t("fields.name"), escape(`${request.firstName} ${request.lastName}`)],
        [t("fields.phone"), escape(formatPhone(request.phone))],
        [t("fields.nationality"), escape(countryName(request.nationality, request.locale))],
      ])}
      <p style="${font}margin:0 0 14px;color:${c.ink};font-size:15px;line-height:1.6;">${escape(t("urgent"))}</p>
      ${button(whatsappUrl(t("whatsappMessage", { name: `${request.firstName} ${request.lastName}` })), "WhatsApp")}
      <p style="${serif}margin:32px 0 0;color:${c.fern};font-size:17px;font-style:italic;">${escape(t("signature"))}</p>`,
    footer: `${escape(t("footer"))}<br><a href="${siteConfig.url}" style="color:${c.fern};">${siteConfig.url.replace(/^https?:\/\//, "")}</a> · <a href="mailto:${siteConfig.email}" style="color:${c.fern};">${siteConfig.email}</a>`,
  });

  const text = [
    t("title", { name }),
    "",
    t("intro"),
    t("soon"),
    "",
    `${t("fields.name")}: ${request.firstName} ${request.lastName}`,
    `${t("fields.phone")}: ${formatPhone(request.phone)}`,
    `${t("fields.nationality")}: ${countryName(request.nationality, request.locale)}`,
    "",
    t("signature"),
    siteConfig.url,
  ].join("\n");

  return { subject: t("subject"), html, text };
}

/** Aviso interno a info@ (siempre en español), con botones para responder y el PDF adjunto aparte. */
export function notificationEmail(request: RequestDetails) {
  const fullName = `${request.firstName} ${request.lastName}`;
  const phoneDigits = request.phone.replace(/\D/g, "");
  const panelUrl = `${siteConfig.url}/admin/solicitudes/${request.id}`;
  const date = new Intl.DateTimeFormat("es-CR", { dateStyle: "long", timeStyle: "short", timeZone: "America/Costa_Rica" }).format(request.createdAt);

  const html = layout({
    preheader: `${fullName} (${countryName(request.nationality, "es")}) quiere planificar su viaje.`,
    eyebrow: "Nueva solicitud · Planifica tu viaje",
    title: fullName,
    body: `
      <p style="${font}margin:0 0 24px;color:${c.muted};font-size:14px;">${escape(date)} (hora de Costa Rica)</p>
      ${detailsTable([
        ["Correo", `<a href="mailto:${escape(request.email)}" style="color:${c.fern};">${escape(request.email)}</a>`],
        ["Teléfono", `<a href="tel:${escape(request.phone)}" style="color:${c.fern};">${escape(formatPhone(request.phone))}</a> <span style="color:${c.muted};font-size:13px;">(${escape(countryName(request.phoneCountry, "es"))})</span>`],
        ["Nacionalidad", escape(countryName(request.nationality, "es"))],
        ["Idioma", request.locale === "en" ? "Inglés" : "Español"],
      ])}
      <p style="${font}margin:0 0 10px;color:${c.fern};font-size:11px;letter-spacing:.24em;font-weight:bold;text-transform:uppercase;">Mensaje</p>
      ${messageBox(request.message)}
      ${button(`https://wa.me/${phoneDigits}`, "WhatsApp")}
      ${button(`mailto:${request.email}`, "Responder por correo", "outline")}
      ${button(panelUrl, "Ver en el panel", "outline")}`,
    footer: "La solicitud completa va adjunta en PDF. Respondé a este correo para escribirle directamente al cliente.",
  });

  const text = [
    `Nueva solicitud: ${fullName}`,
    date,
    "",
    `Correo: ${request.email}`,
    `Teléfono: ${formatPhone(request.phone)} (${countryName(request.phoneCountry, "es")})`,
    `Nacionalidad: ${countryName(request.nationality, "es")}`,
    "",
    request.message,
    "",
    panelUrl,
  ].join("\n");

  return { subject: `Nueva solicitud: ${fullName} (${countryName(request.nationality, "es")})`, html, text };
}
