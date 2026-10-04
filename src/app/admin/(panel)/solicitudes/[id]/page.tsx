import { ChevronLeft, FileText, Mail, MessageCircle, Phone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { PendingButton } from "@/components/admin/form-hooks";
import { RequestStatusBadge } from "@/components/admin/request-status-badge";
import { buttonClass, Card } from "@/components/admin/ui";
import { Flag } from "@/components/site/country-select";
import { countryName } from "@/lib/countries";
import { formatPhone } from "@/lib/phone";
import { getRequest, requestStatuses, requestStatusLabels } from "@/server/admin/requests";
import { deleteRequest, resendNotification, setRequestStatus } from "../actions";

type Props = { params: Promise<{ id: string }> };

const dateFormat = new Intl.DateTimeFormat("es-CR", { dateStyle: "long", timeStyle: "short", timeZone: "America/Costa_Rica" });

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const request = await getRequest((await params).id);
  return { title: request ? `${request.firstName} ${request.lastName}` : "Solicitud" };
}

export default async function RequestDetailPage({ params }: Props) {
  const request = await getRequest((await params).id);
  if (!request) notFound();

  const fullName = `${request.firstName} ${request.lastName}`;
  const replySubject = request.locale === "en" ? "Your trip to Costa Rica · Natural Land CR" : "Tu viaje a Costa Rica · Natural Land CR";

  const details: [string, React.ReactNode][] = [
    ["Correo", <a key="email" href={`mailto:${request.email}`} className="text-fern hover:underline">{request.email}</a>],
    [
      "Teléfono",
      <span key="phone" className="inline-flex items-center gap-2">
        <Flag code={request.phoneCountry} />
        <a href={`tel:${request.phone}`} className="text-fern hover:underline">{formatPhone(request.phone)}</a>
      </span>,
    ],
    [
      "Nacionalidad",
      <span key="nationality" className="inline-flex items-center gap-2">
        <Flag code={request.nationality} />
        {countryName(request.nationality, "es")}
      </span>,
    ],
    ["Idioma del formulario", request.locale === "en" ? "Inglés" : "Español"],
    ["Recibida", dateFormat.format(request.createdAt)],
  ];

  const sentAt = (date: Date | null) => (date ? `Enviado el ${dateFormat.format(date)}` : "No se envió");

  return (
    <>
      <Link href="/admin/solicitudes" className="inline-flex items-center gap-1 text-sm font-semibold text-ink/60 hover:text-ink">
        <ChevronLeft className="size-4" aria-hidden />
        Solicitudes
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-6">
        <div>
          <h1 className="font-display text-4xl">{fullName}</h1>
          <div className="mt-3">
            <RequestStatusBadge status={request.status} />
          </div>
        </div>

        {/* Cambiar estado */}
        <div className="flex flex-wrap gap-2" role="group" aria-label="Estado de la solicitud">
          {requestStatuses.map((status) => (
            <form key={status} action={setRequestStatus.bind(null, request.id, status)}>
              <PendingButton className={buttonClass(request.status === status ? "primary" : "secondary", "sm")} disabled={request.status === status}>
                {requestStatusLabels[status]}
              </PendingButton>
            </form>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card title="Mensaje">
            <p className="whitespace-pre-line border-l-2 border-lime pl-5 text-lg leading-relaxed text-ink/85">{request.message}</p>
          </Card>

          <Card title="Datos">
            <dl className="divide-y divide-ink/10">
              {details.map(([label, value]) => (
                <div key={label} className="grid gap-1 py-3 sm:grid-cols-[180px_1fr]">
                  <dt className="text-sm font-semibold text-ink/55">{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Responder">
            <div className="flex flex-col gap-2">
              <a href={`https://wa.me/${request.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className={buttonClass("lime", "sm", "justify-center")}>
                <MessageCircle className="size-4" aria-hidden />
                WhatsApp
              </a>
              <a href={`mailto:${request.email}?subject=${encodeURIComponent(replySubject)}`} className={buttonClass("secondary", "sm", "justify-center")}>
                <Mail className="size-4" aria-hidden />
                Correo
              </a>
              <a href={`tel:${request.phone}`} className={buttonClass("secondary", "sm", "justify-center")}>
                <Phone className="size-4" aria-hidden />
                Llamar
              </a>
              <a href={`/api/admin/requests/${request.id}/pdf`} target="_blank" rel="noopener" className={buttonClass("ghost", "sm", "justify-center")}>
                <FileText className="size-4" aria-hidden />
                Ver PDF
              </a>
            </div>
          </Card>

          <Card title="Correos">
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="font-semibold">Confirmación al cliente</dt>
                <dd className={request.confirmationSentAt ? "text-ink/60" : "text-red-700"}>{sentAt(request.confirmationSentAt)}</dd>
              </div>
              <div>
                <dt className="font-semibold">Aviso a info@ (con PDF)</dt>
                <dd className={request.notificationSentAt ? "text-ink/60" : "text-red-700"}>{sentAt(request.notificationSentAt)}</dd>
              </div>
              {request.recaptchaScore != null && (
                <div>
                  <dt className="font-semibold">Puntaje reCAPTCHA</dt>
                  <dd className="text-ink/60">{request.recaptchaScore.toFixed(1)} de 1 (más alto = más probable que sea una persona)</dd>
                </div>
              )}
            </dl>
            <div className="mt-5">
              <ConfirmAction action={resendNotification.bind(null, request.id)}>Reenviar aviso a info@</ConfirmAction>
            </div>
          </Card>

          <Card title="Eliminar">
            <ConfirmAction action={deleteRequest.bind(null, request.id)} question="¿Eliminar esta solicitud?" confirmLabel="Sí, eliminar" variant="danger">
              Eliminar solicitud
            </ConfirmAction>
          </Card>
        </div>
      </div>
    </>
  );
}
