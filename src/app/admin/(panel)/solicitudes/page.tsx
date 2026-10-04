import { Inbox, Mail, Phone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Notice } from "@/components/admin/ui";
import { RequestStatusBadge } from "@/components/admin/request-status-badge";
import { Flag } from "@/components/site/country-select";
import type { RequestStatus } from "@/generated/prisma/enums";
import { countryName } from "@/lib/countries";
import { formatPhone } from "@/lib/phone";
import { isMailConfigured, isRecaptchaConfigured } from "@/lib/env";
import { countRequestsByStatus, listRequests, requestStatuses } from "@/server/admin/requests";

export const metadata: Metadata = { title: "Solicitudes" };

/** Pestañas por estado: ?estado=NEW|CONTACTED|CLOSED (sin parámetro, todas). */
const tabs: { status?: RequestStatus; label: string }[] = [
  { label: "Todas" },
  { status: "NEW", label: "Nuevas" },
  { status: "CONTACTED", label: "Contactadas" },
  { status: "CLOSED", label: "Cerradas" },
];

const dateFormat = new Intl.DateTimeFormat("es-CR", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Costa_Rica" });

type Props = { searchParams: Promise<{ estado?: string }> };

export default async function RequestsPage({ searchParams }: Props) {
  const { estado } = await searchParams;
  const status = requestStatuses.find((s) => s === estado);
  const [requests, counts] = await Promise.all([listRequests(status), countRequestsByStatus()]);
  const total = counts.NEW + counts.CONTACTED + counts.CLOSED;

  const missingConfig = [
    !isMailConfigured() && "Correo (SMTP_*): las solicitudes se guardan, pero no se envía la confirmación al cliente ni el aviso a info@.",
    !isRecaptchaConfigured() && "reCAPTCHA (NEXT_PUBLIC_RECAPTCHA_SITE_KEY y RECAPTCHA_SECRET_KEY): el formulario funciona sin verificación anti-bots.",
  ].filter(Boolean);

  return (
    <>
      <div>
        <h1 className="font-display text-4xl">Solicitudes</h1>
        <p className="mt-2 text-ink/60">Lo que envían los visitantes desde el formulario «Planifica tu viaje» del sitio.</p>
      </div>

      {missingConfig.length > 0 && (
        <Notice tone="amber" className="mt-6">
          <p className="font-semibold">Falta configurar en el servidor:</p>
          <ul className="mt-1 list-disc pl-5">
            {missingConfig.map((item) => (
              <li key={item as string}>{item}</li>
            ))}
          </ul>
        </Notice>
      )}

      <nav aria-label="Filtrar por estado" className="mt-8 flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const active = tab.status === status;
          const count = tab.status ? counts[tab.status] : total;
          return (
            <Link
              key={tab.label}
              href={tab.status ? `/admin/solicitudes?estado=${tab.status}` : "/admin/solicitudes"}
              aria-current={active ? "page" : undefined}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
                active ? "border-ink bg-ink text-bone" : "border-ink/15 text-ink/70 hover:border-ink/40 hover:text-ink"
              }`}
            >
              {tab.label}
              <span className={`rounded-full px-1.5 text-xs ${active ? "bg-bone/20" : "bg-ink/5"}`}>{count}</span>
            </Link>
          );
        })}
      </nav>

      {requests.length === 0 ? (
        <div className="mt-6 rounded-sm border border-dashed border-ink/20 bg-white p-10 text-center">
          <Inbox className="mx-auto size-8 text-ink/30" aria-hidden />
          <p className="mt-3 text-ink/70">{total === 0 ? "Todavía no llegó ninguna solicitud." : "No hay solicitudes en este estado."}</p>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-ink/10 rounded-sm border border-ink/10 bg-white">
          {requests.map((request) => (
            <li key={request.id}>
              <Link href={`/admin/solicitudes/${request.id}`} className="flex flex-col gap-3 p-4 transition-colors hover:bg-bone md:flex-row md:items-center md:gap-6">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {request.status === "NEW" && <span aria-hidden className="size-2 rounded-full bg-lime" />}
                    <span className={`font-display text-xl ${request.status === "NEW" ? "" : "text-ink/80"}`}>
                      {request.firstName} {request.lastName}
                    </span>
                    <RequestStatusBadge status={request.status} />
                  </div>
                  <p className="mt-1 line-clamp-1 text-sm text-ink/60">{request.message}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink/55">
                    <span className="inline-flex items-center gap-1.5">
                      <Flag code={request.nationality} className="!h-3 !w-[1.125rem]" />
                      {countryName(request.nationality, "es")}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Mail className="size-3.5" aria-hidden />
                      {request.email}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Phone className="size-3.5" aria-hidden />
                      {formatPhone(request.phone)}
                    </span>
                  </div>
                </div>
                <time dateTime={request.createdAt.toISOString()} className="shrink-0 text-sm text-ink/55">
                  {dateFormat.format(request.createdAt)}
                </time>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
