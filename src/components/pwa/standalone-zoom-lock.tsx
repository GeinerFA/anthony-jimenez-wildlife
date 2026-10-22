"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const LOCK = "maximum-scale=1, user-scalable=no";

/** true si la página corre como app instalada (pantalla de inicio), no en una pestaña del navegador. */
function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

/**
 * Bloquea el zoom solo en la app instalada, para que se sienta como una app nativa. En el navegador
 * el zoom sigue disponible (accesibilidad: hay quien lo necesita para leer).
 * - viewport con maximum-scale=1: evita el zoom con dos dedos y el zoom automático de iOS al tocar un campo.
 * - gesturestart (Safari) y touchmove con 2+ dedos: el pellizco, donde el viewport no alcanza.
 * - touch-action: manipulation: el zoom con doble toque. Arrastrar con un dedo (galería) sigue funcionando.
 * Se reaplica al cambiar de página por si Next vuelve a escribir la etiqueta viewport.
 */
export function StandaloneZoomLock() {
  const pathname = usePathname();

  useEffect(() => {
    if (!isStandalone()) return;
    const meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
    if (meta && !meta.content.includes("user-scalable=no")) meta.content = `${meta.content}, ${LOCK}`;
  }, [pathname]);

  useEffect(() => {
    if (!isStandalone()) return;
    const root = document.documentElement;
    const previousTouchAction = root.style.touchAction;
    root.style.touchAction = "manipulation";

    const preventGesture = (event: Event) => event.preventDefault();
    const preventPinch = (event: TouchEvent) => {
      if (event.touches.length > 1) event.preventDefault();
    };
    document.addEventListener("gesturestart", preventGesture);
    document.addEventListener("gesturechange", preventGesture);
    document.addEventListener("touchmove", preventPinch, { passive: false });

    return () => {
      root.style.touchAction = previousTouchAction;
      document.removeEventListener("gesturestart", preventGesture);
      document.removeEventListener("gesturechange", preventGesture);
      document.removeEventListener("touchmove", preventPinch);
    };
  }, []);

  return null;
}
