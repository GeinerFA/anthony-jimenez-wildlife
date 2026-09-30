"use client";

import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { AnimatePresence, motion, type PanInfo } from "motion/react";
import { useLenis } from "lenis/react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState, type ComponentProps } from "react";
import { EASE_OUT_EXPO, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { CloudinaryImage } from "@/components/ui/cloudinary-image";
import { videoPoster, videoStream, withTransform } from "@/lib/media/cloudinary-url";

export type GalleryMedia = {
  id: string;
  type: "IMAGE" | "VIDEO";
  url: string;
  width: number;
  height: number;
  alt: string;
};

type Props = {
  /** Todo el material del tour, en orden; el carrusel lo recorre completo. */
  media: GalleryMedia[];
  /** Cuántos elementos iniciales omitir en la cuadrícula (la portada ya se ve en el encabezado). */
  skip?: number;
};

export function TourGallery({ media, skip = 1 }: Props) {
  const t = useTranslations("Tours");
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const grid = media.slice(skip);
  if (grid.length === 0) return null;

  return (
    <section className="mx-auto max-w-screen-2xl px-5 pb-28 md:px-10">
      <RevealGroup className="columns-1 gap-6 sm:columns-2 lg:columns-3 [&>*]:mb-6">
        {grid.map((item, i) => (
          <RevealItem key={item.id} className="break-inside-avoid overflow-hidden rounded-sm bg-mist">
            <button
              type="button"
              onClick={() => setOpenIndex(i + skip)}
              aria-label={`${t("galleryOpen")}: ${item.alt}`}
              className="group relative block w-full cursor-zoom-in focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime"
            >
              {item.type === "IMAGE" ? (
                <CloudinaryImage
                  src={item.url}
                  alt={item.alt}
                  width={item.width}
                  height={item.height}
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="h-auto w-full transition-transform duration-[1.4s] ease-out-expo group-hover:scale-105"
                />
              ) : (
                <AutoplayVideo
                  src={videoStream(item.url, 1280)}
                  poster={videoPoster(item.url, 1280)}
                  width={item.width}
                  height={item.height}
                  className="h-auto w-full transition-transform duration-[1.4s] ease-out-expo group-hover:scale-105"
                />
              )}
              <span
                aria-hidden
                className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-ink/60 text-bone opacity-0 backdrop-blur transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
              >
                <Expand className="size-4" />
              </span>
            </button>
          </RevealItem>
        ))}
      </RevealGroup>

      <AnimatePresence>
        {openIndex !== null && (
          <Lightbox media={media} index={openIndex} onIndexChange={setOpenIndex} onClose={() => setOpenIndex(null)} />
        )}
      </AnimatePresence>
    </section>
  );
}

/**
 * Video mudo en bucle que solo se reproduce mientras está en pantalla: con varios videos en la
 * galería, reproducirlos todos a la vez gastaría datos y batería sin que nadie los vea.
 */
function AutoplayVideo(props: Omit<ComponentProps<"video">, "autoPlay" | "muted" | "loop" | "playsInline">) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // play() rechaza si el navegador bloquea el autoplay; el poster queda visible.
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.25 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return <video ref={ref} {...props} muted loop playsInline preload="metadata" aria-hidden />;
}

const SWIPE_THRESHOLD = 80;

function Lightbox({
  media,
  index,
  onIndexChange,
  onClose,
}: {
  media: GalleryMedia[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}) {
  const t = useTranslations("Tours");
  const lenis = useLenis();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [direction, setDirection] = useState(0);
  const item = media[index];
  const total = media.length;

  const go = useCallback(
    (step: number) => {
      setDirection(step);
      onIndexChange((index + step + total) % total);
    },
    [index, total, onIndexChange],
  );

  // Bloquea el scroll de la página (Lenis y nativo) y devuelve el foco al cerrar.
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    lenis?.stop();
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      lenis?.start();
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [lenis]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, onClose]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -SWIPE_THRESHOLD) go(1);
    else if (info.offset.x > SWIPE_THRESHOLD) go(-1);
  };

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={t("galleryTitle")}
      data-lenis-prevent
      className="fixed inset-0 z-[100] flex flex-col bg-ink/95 text-bone backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between px-5 pb-3 pt-[max(1.25rem,env(safe-area-inset-top))] md:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-bone/70" aria-live="polite">
          {t("galleryCounter", { current: index + 1, total })}
        </p>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label={t("galleryClose")}
          className="grid size-11 place-items-center rounded-full bg-bone/10 transition-colors hover:bg-bone/20 focus-visible:outline-2 focus-visible:outline-lime"
        >
          <X className="size-5" aria-hidden />
        </button>
      </div>

      {/* Clic en el fondo (fuera del elemento) cierra. */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden" onClick={onClose}>
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={item.id}
            custom={direction}
            variants={{
              enter: (d: number) => ({ x: d >= 0 ? "40%" : "-40%", opacity: 0 }),
              center: { x: 0, opacity: 1 },
              exit: (d: number) => ({ x: d >= 0 ? "-40%" : "40%", opacity: 0 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
            drag={total > 1 ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.6}
            onDragEnd={onDragEnd}
            onClick={(e) => e.stopPropagation()}
            className="relative flex size-full max-h-full max-w-6xl items-center justify-center px-4 md:px-20"
          >
            {item.type === "IMAGE" ? (
              <div className="relative size-full">
                <CloudinaryImage
                  src={item.url}
                  alt={item.alt}
                  fill
                  sizes="100vw"
                  draggable={false}
                  className="pointer-events-none select-none object-contain"
                />
              </div>
            ) : (
              <video
                src={videoStream(item.url)}
                poster={videoPoster(item.url)}
                autoPlay
                muted
                loop
                playsInline
                controls
                aria-label={item.alt}
                className="max-h-full max-w-full"
              />
            )}
          </motion.div>
        </AnimatePresence>

        {total > 1 && (
          <>
            <NavButton side="left" label={t("galleryPrev")} onClick={() => go(-1)} />
            <NavButton side="right" label={t("galleryNext")} onClick={() => go(1)} />
          </>
        )}
      </div>

      {total > 1 && (
        <div className="flex justify-center gap-2 overflow-x-auto px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
          {media.map((m, i) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                setDirection(i > index ? 1 : -1);
                onIndexChange(i);
              }}
              aria-label={t("galleryCounter", { current: i + 1, total })}
              aria-current={i === index}
              className={`relative size-14 shrink-0 overflow-hidden rounded-sm transition-opacity focus-visible:outline-2 focus-visible:outline-lime md:size-16 ${
                i === index ? "opacity-100 ring-2 ring-lime" : "opacity-50 hover:opacity-80"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- miniaturas ya recortadas por Cloudinary */}
              <img
                src={m.type === "VIDEO" ? videoPoster(m.url, 160) : withTransform(m.url, "f_auto,q_auto,w_160,h_160,c_fill")}
                alt=""
                className="size-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function NavButton({ side, label, onClick }: { side: "left" | "right"; label: string; onClick: () => void }) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label={label}
      className={`absolute top-1/2 hidden size-12 -translate-y-1/2 place-items-center rounded-full bg-bone/10 backdrop-blur transition-colors hover:bg-lime hover:text-ink focus-visible:outline-2 focus-visible:outline-lime md:grid ${
        side === "left" ? "left-4" : "right-4"
      }`}
    >
      <Icon className="size-6" aria-hidden />
    </button>
  );
}
