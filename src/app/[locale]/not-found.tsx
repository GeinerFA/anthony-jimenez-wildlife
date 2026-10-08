import { getTranslations } from "next-intl/server";
import { HeroMedia } from "@/components/site/hero-media";
import { ButtonLink } from "@/components/ui/button";
import { getHeroMedia } from "@/server/heroes";

export default async function NotFound() {
  const t = await getTranslations("NotFound");
  // Foto o video de fondo configurado en el panel (Portadas); sin él, fondo verde liso.
  const hero = await getHeroMedia("NOT_FOUND");

  return (
    <section className="grain relative grid min-h-[80vh] place-items-center overflow-hidden bg-moss px-5 text-center text-bone">
      {hero && (
        <>
          <HeroMedia media={hero} zoom={false} />
          {/* Velo oscuro: el texto claro se lee sobre cualquier foto. */}
          <div aria-hidden className="absolute inset-0 bg-ink/60" />
        </>
      )}
      <div className="relative">
        <p className="font-display text-[28vw] leading-none text-bone/10 md:text-[16rem]">404</p>
        <h1 className="-mt-10 font-display text-4xl md:text-6xl">{t("title")}</h1>
        <p className="mt-4 text-bone/70">{t("text")}</p>
        <ButtonLink href="/" variant="light" className="mt-10">
          {t("back")}
        </ButtonLink>
      </div>
    </section>
  );
}
