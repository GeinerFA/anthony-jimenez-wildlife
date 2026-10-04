import { requireAdmin } from "@/auth/auth";
import { db } from "@/lib/db";
import { requestPdf } from "@/lib/mail/request-pdf";
import { pdfFilename } from "@/server/requests";

/** PDF de una solicitud para descargar desde el panel (el mismo que se adjunta al aviso de info@). */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return Response.json({ error: "No autorizado" }, { status: 401 });

  const request = await db.contactRequest.findUnique({ where: { id: (await params).id } });
  if (!request) return Response.json({ error: "No existe" }, { status: 404 });

  const pdf = await requestPdf(request);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `inline; filename="${pdfFilename(request)}"`,
      "cache-control": "no-store",
    },
  });
}
