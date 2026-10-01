import { notFound } from "next/navigation";
import { MediaManager } from "@/components/admin/media-manager";
import { isCloudinaryConfigured } from "@/lib/env";
import { getTourForAdmin } from "@/server/admin/tours";

export default async function MediaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tour = await getTourForAdmin(id);
  if (!tour) notFound();

  return (
    <>
      <p className="mb-6 max-w-3xl text-ink/70">
        La primera es la portada del tour (y, si el tour es el primer destacado y no hay una portada propia en Portadas, el fondo del inicio). Un video también puede ser portada.
        Los cambios se guardan al instante.
      </p>
      <MediaManager
        tourId={tour.id}
        uploadsEnabled={isCloudinaryConfigured()}
        items={tour.media.map((m) => ({
          id: m.id,
          type: m.type,
          url: m.url,
          bytes: m.bytes,
          width: m.width,
          height: m.height,
          altEs: m.altEs ?? "",
          altEn: m.altEn ?? "",
        }))}
      />
    </>
  );
}
