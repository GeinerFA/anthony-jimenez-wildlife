import { ExternalLink, Languages } from "lucide-react";
import { notFound } from "next/navigation";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { translationValues } from "@/components/admin/tour-form-values";
import { EnglishForm } from "@/components/admin/tour-forms";
import { buttonClass, Card } from "@/components/admin/ui";
import { getTranslator } from "@/lib/translation";
import { getTourForAdmin } from "@/server/admin/tours";
import type { EnglishStatus } from "@/server/admin/translation";
import { retranslateTour, saveEnglish } from "../../actions";

const explanations: Record<EnglishStatus, string> = {
  missing: "Todavía no hay versión en inglés. Se genera sola al guardar el español (si la traducción automática está configurada), o podés escribirla abajo.",
  machine: "Traducida automáticamente del español actual. Se vuelve a traducir sola cada vez que cambia el español.",
  "machine-stale": "El español cambió desde la última traducción. Se actualiza al guardar el español, o podés retraducir ahora.",
  manual: "Editada a mano. La traducción automática no la sobrescribe, salvo que uses «Retraducir».",
  "manual-stale": "Editada a mano, pero el español cambió después. Revisala y guardala, o retraducí (se pierden las correcciones).",
};

export default async function EnglishPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tour = await getTourForAdmin(id);
  if (!tour) notFound();

  const translator = getTranslator();
  const manual = tour.english === "manual" || tour.english === "manual-stale";

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-2xl">
            <p className="flex items-center gap-2 font-semibold">
              <Languages className="size-4 text-fern" aria-hidden />
              Estado de la traducción
            </p>
            <p className="mt-2 text-ink/70">{explanations[tour.english]}</p>
            {tour.en?.translatedAt && (
              <p className="mt-2 text-xs text-ink/50">
                Última traducción automática: {tour.en.translatedAt.toLocaleString("es-CR", { dateStyle: "medium", timeStyle: "short" })}
              </p>
            )}
            {!translator && <p className="mt-2 text-sm text-amber-700">La traducción automática no está configurada (DEEPL_API_KEY).</p>}
          </div>
          <div className="flex flex-col items-end gap-3">
            {translator && tour.es && (
              <ConfirmAction
                action={retranslateTour.bind(null, tour.id)}
                question={manual ? "Se reemplazarán tus correcciones en inglés. ¿Continuar?" : undefined}
                confirmLabel="Sí, retraducir"
              >
                {tour.english === "missing" ? "Traducir ahora" : "Retraducir desde el español"}
              </ConfirmAction>
            )}
            {tour.status === "PUBLISHED" && tour.en && (
              <a href={`/en/tours/${tour.en.slug}`} target="_blank" rel="noopener noreferrer" className={buttonClass("ghost", "sm")}>
                <ExternalLink className="size-4" aria-hidden />
                Ver en inglés
              </a>
            )}
          </div>
        </div>
      </Card>

      {/* key: al retraducir, el formulario se vuelve a montar con el texto nuevo (guardar a mano no cambia translatedAt). */}
      <EnglishForm
        key={tour.en?.translatedAt?.toISOString() ?? "manual"}
        action={saveEnglish.bind(null, tour.id)}
        content={translationValues(tour.en)}
      />
    </div>
  );
}
