import type { ReactNode } from "react";
import "./globals.css";

// El <html> lo renderizan app/[locale]/layout.tsx (sitio, con lang dinámico) y app/admin/layout.tsx.
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
