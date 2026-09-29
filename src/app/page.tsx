import { redirect } from "next/navigation";
import { routing } from "@/i18n/routing";

// El middleware ya redirige "/" según el idioma del navegador; esto es solo un respaldo.
export default function RootPage() {
  redirect(`/${routing.defaultLocale}`);
}
