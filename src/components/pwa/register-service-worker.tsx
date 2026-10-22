"use client";

import { useEffect } from "react";

/** Registra public/sw.js (instalación como app + página sin conexión). Solo en producción. */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  return null;
}
