import Link from "next/link";
import { interTight } from "./fonts";

// 404 para rutas fuera de /[locale] (p. ej. /foo sin prefijo de idioma que no llegó a redirigirse).
export default function GlobalNotFound() {
  return (
    <html lang="es" className={interTight.variable}>
      <body className="grid min-h-screen place-items-center bg-ink font-sans text-bone">
        <div className="text-center">
          <p className="text-6xl font-bold">404</p>
          <Link href="/" className="mt-6 inline-block underline">
            Anthony Jimenez Wildlife
          </Link>
        </div>
      </body>
    </html>
  );
}
