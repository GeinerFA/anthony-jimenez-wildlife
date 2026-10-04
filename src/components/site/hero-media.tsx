import { CloudinaryImage } from "@/components/ui/cloudinary-image";
import { videoPoster, videoStream } from "@/lib/media/cloudinary-url";
import type { HeroBackground } from "@/server/heroes";
import { HeroVideo } from "./hero-video";

/** Acercamiento lento de ida y vuelta; sin animación si el sistema pide reducir movimiento. */
const zoomClass = "animate-slow-zoom motion-reduce:animate-none";

type Props = {
  media: HeroBackground;
  /** Acercamiento lento; las páginas internas lo apagan para que el video se vea quieto. */
  zoom?: boolean;
  /** Qué parte del video/foto queda visible al recortar (clase `object-*` de Tailwind). */
  position?: string;
};

/**
 * Video (mudo, en bucle) o foto que llena un hero. Decorativo: el texto del hero lleva el contenido.
 */
export function HeroMedia({ media, zoom = true, position = "object-center" }: Props) {
  const className = `object-cover ${position} ${zoom ? zoomClass : ""}`;

  if (media.type === "VIDEO") {
    return (
      <HeroVideo
        className={`absolute inset-0 size-full ${className}`}
        src={videoStream(media.url)}
        poster={videoPoster(media.url)}
      />
    );
  }

  return <CloudinaryImage src={media.url} alt="" fill priority sizes="100vw" className={className} />;
}
