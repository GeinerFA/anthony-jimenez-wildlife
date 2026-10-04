import "server-only";
import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";
import { siteConfig } from "@/config/site";
import { countryName } from "@/lib/countries";
import { formatPhone } from "@/lib/phone";
import { logoPngBase64 } from "./logo";
import type { RequestDetails } from "./request-emails";

// Colores de la marca (globals.css).
const moss = rgb(1 / 255, 77 / 255, 39 / 255);
const lime = rgb(150 / 255, 192 / 255, 32 / 255);
const ink = rgb(6 / 255, 20 / 255, 12 / 255);
const muted = rgb(0.4, 0.45, 0.42);
const bone = rgb(244 / 255, 247 / 255, 239 / 255);
const white = rgb(1, 1, 1);

const A4 = { width: 595.28, height: 841.89 };
const margin = 48;

/**
 * Las fuentes estándar de PDF solo codifican Latin-1 (WinAnsi): tildes y ñ sí, emojis u otros alfabetos no.
 * Lo que no se puede dibujar (emojis, caracteres de control) se quita para que el PDF nunca falle.
 */
const winAnsiExtras = new Set("€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ");
function safe(text: string) {
  return Array.from(text.normalize("NFC"))
    .map((char) => (char === "\t" ? "  " : (char.codePointAt(0)! <= 0xff && char >= " ") || winAnsiExtras.has(char) ? char : ""))
    .join("");
}

/** Parte un texto en líneas que caben en `width`, respetando los saltos de línea originales. */
function wrap(text: string, font: PDFFont, size: number, width: number) {
  const lines: string[] = [];
  for (const paragraph of text.split(/\r?\n/).map(safe)) {
    let line = "";
    for (const word of paragraph.split(" ")) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= width) {
        line = candidate;
        continue;
      }
      if (line) lines.push(line);
      // Palabra más larga que la línea (p. ej. un enlace): se corta por caracteres.
      line = word;
      while (font.widthOfTextAtSize(line, size) > width) {
        let cut = line.length - 1;
        while (cut > 1 && font.widthOfTextAtSize(line.slice(0, cut), size) > width) cut--;
        lines.push(line.slice(0, cut));
        line = line.slice(cut);
      }
    }
    lines.push(line);
  }
  return lines;
}

async function loadLogo(pdf: PDFDocument): Promise<PDFImage | null> {
  try {
    return await pdf.embedPng(Buffer.from(logoPngBase64, "base64"));
  } catch {
    return null; // Si la imagen fallara, el PDF sale igual, sin logo.
  }
}

/** PDF de una solicitud, para adjuntar al aviso interno y descargar desde el panel. */
export async function requestPdf(request: RequestDetails) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Solicitud de ${request.firstName} ${request.lastName}`);
  pdf.setAuthor(siteConfig.name);

  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const serif = await pdf.embedFont(StandardFonts.TimesRoman);
  const logo = await loadLogo(pdf);

  let page = pdf.addPage([A4.width, A4.height]);
  const contentWidth = A4.width - margin * 2;

  // Encabezado: banda verde con logo, título y fecha.
  const headerHeight = 132;
  page.drawRectangle({ x: 0, y: A4.height - headerHeight, width: A4.width, height: headerHeight, color: moss });
  page.drawRectangle({ x: 0, y: A4.height - headerHeight - 4, width: A4.width, height: 4, color: lime });
  let titleX = margin;
  if (logo) {
    page.drawImage(logo, { x: margin, y: A4.height - 98, width: 56, height: 56 });
    titleX = margin + 72;
  }
  page.drawText(safe("NUEVA SOLICITUD · PLANIFICA TU VIAJE"), { x: titleX, y: A4.height - 56, size: 8.5, font: bold, color: lime });
  page.drawText(safe(`${request.firstName} ${request.lastName}`), { x: titleX, y: A4.height - 86, size: 26, font: serif, color: white });
  const date = new Intl.DateTimeFormat("es-CR", { dateStyle: "long", timeStyle: "short", timeZone: "America/Costa_Rica" }).format(request.createdAt);
  page.drawText(safe(`${date} (hora de Costa Rica)`), { x: titleX, y: A4.height - 106, size: 9.5, font: regular, color: rgb(0.85, 0.9, 0.85) });

  // Datos en dos columnas.
  const fields: [string, string][] = [
    ["Nombre", request.firstName],
    ["Apellidos", request.lastName],
    ["Correo electrónico", request.email],
    ["Teléfono", `${formatPhone(request.phone)}  (${countryName(request.phoneCountry, "es")})`],
    ["Nacionalidad", countryName(request.nationality, "es")],
    ["Idioma del formulario", request.locale === "en" ? "Inglés" : "Español"],
  ];
  const columnWidth = (contentWidth - 24) / 2;
  let y = A4.height - headerHeight - 44;
  fields.forEach(([label, value], index) => {
    const x = margin + (index % 2) * (columnWidth + 24);
    if (index % 2 === 0 && index > 0) y -= 50;
    page.drawText(safe(label.toUpperCase()), { x, y, size: 7.5, font: bold, color: muted });
    const [first] = wrap(value, regular, 12, columnWidth);
    page.drawText(first ?? "", { x, y: y - 17, size: 12, font: regular, color: ink });
    page.drawLine({ start: { x, y: y - 27 }, end: { x: x + columnWidth, y: y - 27 }, thickness: 0.5, color: rgb(0.85, 0.87, 0.84) });
  });
  y -= 70;

  // Mensaje en un recuadro claro; si no cabe, sigue en páginas nuevas.
  page.drawText("MENSAJE", { x: margin, y, size: 7.5, font: bold, color: muted });
  y -= 14;
  const size = 11.5;
  const lineHeight = 17;
  const padding = 18;
  const lines = wrap(request.message, regular, size, contentWidth - padding * 2);
  const footerSpace = 70;

  let index = 0;
  while (index < lines.length) {
    const available = Math.floor((y - footerSpace - padding * 2) / lineHeight);
    const chunk = lines.slice(index, index + Math.max(available, 1));
    const boxHeight = chunk.length * lineHeight + padding * 2 - (lineHeight - size);
    page.drawRectangle({ x: margin, y: y - boxHeight, width: contentWidth, height: boxHeight, color: bone });
    page.drawRectangle({ x: margin, y: y - boxHeight, width: 3, height: boxHeight, color: lime });
    chunk.forEach((line, i) => {
      page.drawText(line, { x: margin + padding, y: y - padding - size + 2 - i * lineHeight, size, font: regular, color: ink });
    });
    index += chunk.length;
    if (index < lines.length) {
      drawFooter(page, regular, request.id);
      page = pdf.addPage([A4.width, A4.height]);
      y = A4.height - margin;
    }
  }
  drawFooter(page, regular, request.id);

  return Buffer.from(await pdf.save());
}

function drawFooter(page: PDFPage, font: PDFFont, id: string) {
  page.drawLine({ start: { x: margin, y: 52 }, end: { x: A4.width - margin, y: 52 }, thickness: 0.5, color: rgb(0.85, 0.87, 0.84) });
  page.drawText(safe(`${siteConfig.name} · ${siteConfig.url.replace(/^https?:\/\//, "")} · ${siteConfig.email}`), {
    x: margin,
    y: 36,
    size: 8,
    font,
    color: muted,
  });
  const ref = `Ref. ${id}`;
  page.drawText(ref, { x: A4.width - margin - font.widthOfTextAtSize(ref, 8), y: 36, size: 8, font, color: muted });
}
