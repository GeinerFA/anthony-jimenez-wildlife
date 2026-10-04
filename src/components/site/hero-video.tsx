"use client";

import { useEffect, useRef, type ComponentProps } from "react";

/**
 * Video mudo en bucle que arranca apenas se monta. React no pone `muted` como atributo en el HTML del
 * servidor, y sin él el navegador bloquea el autoplay; por eso se fuerza aquí y se llama a play().
 */
export function HeroVideo(props: Omit<ComponentProps<"video">, "autoPlay" | "muted" | "loop" | "playsInline">) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    video.muted = true;
    video.play().catch(() => {});
  }, []);

  return <video ref={ref} {...props} autoPlay muted loop playsInline preload="auto" aria-hidden />;
}
