import { ArrowDown, ArrowUp, Eye, EyeOff, ExternalLink, Hash, Star } from "lucide-react";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AboutProfileForm, PartnerForm, StatForm } from "@/components/admin/about-forms";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { PendingButton } from "@/components/admin/form-hooks";
import { Badge, buttonClass, Card, iconButtonClass, Notice } from "@/components/admin/ui";
import { CloudinaryImage } from "@/components/ui/cloudinary-image";
import { SocialIcon, type SocialNetwork } from "@/components/ui/social-icon";
import { isCloudinaryConfigured } from "@/lib/env";
import { getTranslator } from "@/lib/translation";
import { getAboutForAdmin } from "@/server/admin/about";
import {
  deletePartner,
  deleteStat,
  movePartner,
  moveStat,
  removeAboutPhoto,
  togglePartnerActive,
  toggleStatFeatured,
} from "./actions";

export const metadata: Metadata = { title: "Acerca de mí" };

const dateFormat = new Intl.DateTimeFormat("es-CR", { day: "numeric", month: "long", year: "numeric" });

function EnglishState({ en, manual }: { en: string | null; manual: boolean }) {
  if (!en) return <Badge tone="amber">Sin inglés</Badge>;
  return <Badge tone="green">EN · {manual ? "Editada a mano" : "Traducida"}</Badge>;
}

/** Botones de orden de una fila (cifra o aliado), como en la lista de tours. */
function MoveButtons({ move, index, total }: { move: (direction: "up" | "down") => Promise<void>; index: number; total: number }) {
  return (
    <>
      <form action={move.bind(null, "up")}>
        <PendingButton className={iconButtonClass} disabled={index === 0} title="Subir" aria-label="Subir">
          <ArrowUp className="size-4" aria-hidden />
        </PendingButton>
      </form>
      <form action={move.bind(null, "down")}>
        <PendingButton className={iconButtonClass} disabled={index === total - 1} title="Bajar" aria-label="Bajar">
          <ArrowDown className="size-4" aria-hidden />
        </PendingButton>
      </form>
    </>
  );
}

/** Fila de una lista: resumen arriba y el formulario de edición desplegable. */
function Row({ summary, actions, children }: { summary: ReactNode; actions: ReactNode; children: ReactNode }) {
  return (
    <li className="p-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <div className="flex min-w-0 flex-1 items-center gap-4">{summary}</div>
        <div className="flex items-center">{actions}</div>
      </div>
      <details className="group mt-3">
        <summary className={buttonClass("secondary", "sm", "cursor-pointer list-none")}>
          <span className="group-open:hidden">Editar</span>
          <span className="hidden group-open:inline">Cerrar</span>
        </summary>
        <div className="mt-4 border-t border-ink/10 pt-4">{children}</div>
      </details>
    </li>
  );
}

export default async function AboutAdminPage() {
  const { profile, stats, partners } = await getAboutForAdmin();
  const uploadsEnabled = isCloudinaryConfigured();
  const statsUpdatedAt = stats.reduce<Date | null>((latest, stat) => (!latest || stat.updatedAt > latest ? stat.updatedAt : latest), null);

  const missingConfig = [
    !uploadsEnabled && "Cloudinary (CLOUDINARY_*): no se pueden subir la foto ni los logos.",
    !getTranslator() && "Traducción automática (DEEPL_API_KEY): el inglés hay que escribirlo a mano.",
  ].filter(Boolean);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-4xl">Acerca de mí</h1>
        <a href="/es/acerca-de-mi" target="_blank" rel="noopener noreferrer" className={buttonClass("ghost", "sm")}>
          <ExternalLink className="size-4" aria-hidden />
          Ver en el sitio
        </a>
      </div>
      <p className="mt-3 max-w-3xl text-ink/70">
        La página «Acerca de mí» del sitio: tu historia, las cifras de tus redes y tus aliados. Lo que escribas en español se
        traduce solo al inglés al guardar. Las cifras destacadas (★) y los aliados visibles también aparecen en el inicio.
      </p>

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

      <div className="mt-8 space-y-8">
        <Card title="Biografía" description="Tu foto y tu historia. La foto se ve mejor vertical (retrato).">
          <AboutProfileForm
            uploadsEnabled={uploadsEnabled}
            values={{
              bioEs: profile?.bioEs ?? "",
              quoteEs: profile?.quoteEs ?? "",
              bioEn: profile?.bioEn ?? "",
              quoteEn: profile?.quoteEn ?? "",
              photoUrl: profile?.photoUrl ?? null,
            }}
          />
          {profile?.photoUrl && (
            <div className="mt-4">
              <ConfirmAction action={removeAboutPhoto} question="¿Quitar la foto de la biografía?" confirmLabel="Sí, quitar" variant="danger">
                Quitar foto
              </ConfirmAction>
            </div>
          )}
        </Card>

        <Card
          title="Cifras"
          description={
            statsUpdatedAt
              ? `Seguidores y otros números, escritos a mano. Última actualización: ${dateFormat.format(statsUpdatedAt)}.`
              : "Seguidores y otros números (años de experiencia, especies, tours guiados). Se escriben a mano."
          }
        >
          {stats.length > 0 && (
            <ul className="mb-6 divide-y divide-ink/10 rounded-sm border border-ink/10">
              {stats.map((stat, index) => (
                <Row
                  key={stat.id}
                  summary={
                    <>
                      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-mist text-fern">
                        {stat.network ? <SocialIcon network={stat.network.toLowerCase() as SocialNetwork} className="size-4" /> : <Hash className="size-4" aria-hidden />}
                      </span>
                      <div className="min-w-0">
                        <p className="font-display text-2xl leading-none">
                          {stat.value.toLocaleString("es-CR")}
                          {stat.suffix}
                        </p>
                        <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink/60">
                          {stat.labelEs}
                          <EnglishState en={stat.labelEn} manual={stat.enManual} />
                        </p>
                      </div>
                    </>
                  }
                  actions={
                    <>
                      <form action={toggleStatFeatured.bind(null, stat.id)}>
                        <PendingButton
                          className={`${iconButtonClass} ${stat.featured ? "text-lime-deep" : ""}`}
                          title={stat.featured ? "Quitar del inicio" : "Destacar en el inicio"}
                          aria-label={stat.featured ? "Quitar del inicio" : "Destacar en el inicio"}
                        >
                          <Star className="size-4" fill={stat.featured ? "currentColor" : "none"} aria-hidden />
                        </PendingButton>
                      </form>
                      <MoveButtons move={moveStat.bind(null, stat.id)} index={index} total={stats.length} />
                    </>
                  }
                >
                  <StatForm
                    stat={{
                      id: stat.id,
                      value: stat.value,
                      suffix: stat.suffix ?? "",
                      network: stat.network ?? "",
                      labelEs: stat.labelEs,
                      labelEn: stat.labelEn ?? "",
                      featured: stat.featured,
                    }}
                  />
                  <div className="mt-4">
                    <ConfirmAction action={deleteStat.bind(null, stat.id)} question="¿Borrar esta cifra?" confirmLabel="Sí, borrar" variant="danger">
                      Borrar cifra
                    </ConfirmAction>
                  </div>
                </Row>
              ))}
            </ul>
          )}
          <details open={stats.length === 0} className="rounded-sm border border-dashed border-ink/20 p-4">
            <summary className="cursor-pointer text-sm font-semibold">Agregar cifra</summary>
            <div className="mt-4">
              <StatForm />
            </div>
          </details>
        </Card>

        <Card title="Aliados" description="Marcas, hoteles y organizaciones con las que trabajás. Usá logos en PNG con fondo transparente o blanco.">
          {partners.length > 0 && (
            <ul className="mb-6 divide-y divide-ink/10 rounded-sm border border-ink/10">
              {partners.map((partner, index) => (
                <Row
                  key={partner.id}
                  summary={
                    <>
                      <span className="relative h-12 w-20 shrink-0 overflow-hidden rounded-sm border border-ink/10 bg-white">
                        <CloudinaryImage src={partner.logoUrl} alt="" fill sizes="80px" className="object-contain p-1" />
                      </span>
                      <div className="min-w-0">
                        <p className={`font-display text-xl ${partner.active ? "" : "text-ink/40"}`}>{partner.name}</p>
                        <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink/55">
                          {!partner.active && <Badge>Oculto</Badge>}
                          {partner.descEs && <EnglishState en={partner.descEn} manual={partner.enManual} />}
                          {partner.url && <span className="truncate">{partner.url.replace(/^https?:\/\//, "")}</span>}
                        </p>
                      </div>
                    </>
                  }
                  actions={
                    <>
                      <form action={togglePartnerActive.bind(null, partner.id)}>
                        <PendingButton
                          className={iconButtonClass}
                          title={partner.active ? "Ocultar del sitio" : "Mostrar en el sitio"}
                          aria-label={partner.active ? "Ocultar del sitio" : "Mostrar en el sitio"}
                        >
                          {partner.active ? <Eye className="size-4" aria-hidden /> : <EyeOff className="size-4" aria-hidden />}
                        </PendingButton>
                      </form>
                      <MoveButtons move={movePartner.bind(null, partner.id)} index={index} total={partners.length} />
                    </>
                  }
                >
                  <PartnerForm
                    uploadsEnabled={uploadsEnabled}
                    partner={{
                      id: partner.id,
                      name: partner.name,
                      url: partner.url ?? "",
                      descEs: partner.descEs ?? "",
                      descEn: partner.descEn ?? "",
                      active: partner.active,
                      logoUrl: partner.logoUrl,
                    }}
                  />
                  <div className="mt-4">
                    <ConfirmAction action={deletePartner.bind(null, partner.id)} question="¿Borrar este aliado y su logo?" confirmLabel="Sí, borrar" variant="danger">
                      Borrar aliado
                    </ConfirmAction>
                  </div>
                </Row>
              ))}
            </ul>
          )}
          <details open={partners.length === 0} className="rounded-sm border border-dashed border-ink/20 p-4">
            <summary className="cursor-pointer text-sm font-semibold">Agregar aliado</summary>
            <div className="mt-4">
              <PartnerForm uploadsEnabled={uploadsEnabled} />
            </div>
          </details>
        </Card>
      </div>
    </>
  );
}
