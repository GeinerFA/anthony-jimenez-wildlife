import { getTranslations } from "next-intl/server";
import { ButtonLink } from "@/components/ui/button";

export default async function NotFound() {
  const t = await getTranslations("NotFound");

  return (
    <section className="grain relative grid min-h-[80vh] place-items-center overflow-hidden bg-moss px-5 text-center text-bone">
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
