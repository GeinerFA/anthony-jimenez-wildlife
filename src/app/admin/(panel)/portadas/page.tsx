import type { Metadata } from "next";
import { HeroManager, type HeroSlot } from "@/components/admin/hero-manager";
import { Notice } from "@/components/admin/ui";
import { heroPages, type HeroPageKey } from "@/config/media";
import { isCloudinaryConfigured } from "@/lib/env";
import { listHeroMedia } from "@/server/heroes";

export const metadata: Metadata = { title: "Portadas" };

const pageInfo: Record<HeroPageKey, { label: string; fallback: string }> = {
  HOME: { label: "Inicio", fallback: "la portada del primer tour destacado" },
  TOURS: { label: "Tours", fallback: "fondo verde liso" },
  SERVICES: { label: "Otros servicios", fallback: "fondo verde liso" },
  PLAN_TRIP: { label: "Planifica tu viaje", fallback: "fondo verde liso" },
  CONTACT: { label: "Contacto", fallback: "fondo verde liso" },
  PRIVACY: { label: "Política de privacidad", fallback: "fondo verde liso" },
};

export default async function HeroesPage() {
  const heroes = await listHeroMedia();
  const uploadsEnabled = isCloudinaryConfigured();

  const slots: HeroSlot[] = heroPages.map((page) => {
    const hero = heroes.get(page);
    return {
      page,
      ...pageInfo[page],
      current: hero ? { type: hero.type, url: hero.url, bytes: hero.bytes } : null,
    };
  });

  return (
    <>
      <h1 className="font-display text-4xl">Portadas</h1>
      <p className="mt-3 max-w-3xl text-ink/70">
        El fondo del encabezado de cada página del sitio, aparte de las fotos de los tours. Puede ser una foto o un video (se
        reproduce sin sonido y en bucle). Usá imágenes horizontales; el texto se pone encima con un velo oscuro. Los cambios se
        ven en el sitio al instante.
      </p>

      {!uploadsEnabled && (
        <Notice tone="amber" className="mt-6">
          Para subir o quitar portadas faltan las credenciales de Cloudinary en el servidor (<code>CLOUDINARY_*</code>).
        </Notice>
      )}

      <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {slots.map((slot) => (
          <HeroManager key={slot.page} slot={slot} uploadsEnabled={uploadsEnabled} />
        ))}
      </ul>
    </>
  );
}
