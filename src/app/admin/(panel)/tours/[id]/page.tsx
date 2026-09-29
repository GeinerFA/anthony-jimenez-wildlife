import { notFound } from "next/navigation";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { tourDataValues, translationValues } from "@/components/admin/tour-form-values";
import { TourForm } from "@/components/admin/tour-forms";
import { Card, Notice } from "@/components/admin/ui";
import { getTourForAdmin } from "@/server/admin/tours";
import { deleteTour, saveTour } from "../actions";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ nuevo?: string }> };

export default async function EditTourPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { nuevo } = await searchParams;
  const tour = await getTourForAdmin(id);
  if (!tour) notFound();

  return (
    <div className="space-y-6">
      {nuevo && (
        <Notice tone="green">
          Tour creado como borrador. Agregá fotos y videos en la pestaña <strong>Fotos y videos</strong>, revisá el inglés y publicalo cuando
          esté listo.
        </Notice>
      )}

      <TourForm action={saveTour.bind(null, tour.id)} content={translationValues(tour.es)} data={tourDataValues(tour)} />

      <Card title="Eliminar tour" description="Borra el tour en ambos idiomas y todas sus fotos y videos de Cloudinary. No se puede deshacer.">
        <ConfirmAction
          action={deleteTour.bind(null, tour.id)}
          question="¿Eliminar este tour y todos sus archivos?"
          confirmLabel="Sí, eliminar"
          variant="danger"
        >
          Eliminar tour
        </ConfirmAction>
      </Card>
    </div>
  );
}
