import { CloudinaryImage } from "@/components/ui/cloudinary-image";
import { videoPoster, videoStream } from "@/lib/media/cloudinary-url";
import type { HeroBackground } from "@/server/heroes";

/** Acercamiento lento de ida y vuelta; sin animación si el sistema pide reducir movimiento. */
const zoom = "animate-slow-zoom motion-reduce:animate-none";

/**
 * Video (mudo, en bucle) o foto que llena un hero. Decorativo: el texto del hero lleva el contenido.
 */
export function HeroMedia({ media }: { media: HeroBackground }) {
  if (media.type === "VIDEO") {
    return (
      <video
        className={`absolute inset-0 size-full object-cover ${zoom}`}
        src={videoStream(media.url)}
        poster={videoPoster(media.url)}
        autoPlay
        muted
        loop
        playsInline
        aria-hidden
      />
    );
  }

  return (
    <CloudinaryImage src={media.url} alt="" fill priority sizes="100vw" className={`object-cover ${zoom}`} />
  );
}
