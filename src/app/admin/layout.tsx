import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { RegisterServiceWorker } from "@/components/pwa/register-service-worker";
import { StandaloneZoomLock } from "@/components/pwa/standalone-zoom-lock";
import { adminTouchIcon } from "@/config/touch-icons";
import { fraunces, interTight } from "../fonts";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin Anthony Jimenez Wildlife" },
  robots: { index: false, follow: false },
  // Manifiesto propio: el panel se instala como una app aparte del sitio público.
  manifest: "/admin/manifest.webmanifest",
  // Logo sobre fondo blanco (el del sitio va sobre negro), incrustado: ver scripts/pwa-icons.ts.
  icons: { apple: [{ url: adminTouchIcon, sizes: "180x180", type: "image/png" }] },
  // Barra de estado opaca: el fondo del panel es claro y la translúcida dejaría la hora ilegible.
  appleWebApp: { capable: true, title: "AJ Admin", statusBarStyle: "black" },
};

export const viewport: Viewport = {
  themeColor: "#06140c",
  viewportFit: "cover",
};

// El panel solo existe en español y queda fuera del ruteo de next-intl.
export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={`${fraunces.variable} ${interTight.variable}`}>
      <body className="min-h-screen bg-bone">
        {children}
        <RegisterServiceWorker />
        <StandaloneZoomLock />
      </body>
    </html>
  );
}
