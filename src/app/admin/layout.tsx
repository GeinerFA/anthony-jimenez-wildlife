import type { Metadata } from "next";
import type { ReactNode } from "react";
import { fraunces, interTight } from "../fonts";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin Anthony Jimenez Wildlife" },
  robots: { index: false, follow: false },
};

// El panel solo existe en español y queda fuera del ruteo de next-intl.
export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={`${fraunces.variable} ${interTight.variable}`}>
      <body className="min-h-screen bg-bone">{children}</body>
    </html>
  );
}
