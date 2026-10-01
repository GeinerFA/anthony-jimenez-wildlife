import "server-only";
import { cache } from "react";
import type { HeroPageKey } from "@/config/media";
import { db } from "@/lib/db";

export type HeroBackground = { type: "IMAGE" | "VIDEO"; url: string };

/**
 * Fondo propio del hero de una página, si se configuró en el panel. Un fallo aquí no debe tumbar
 * la página: se registra y se usa el fondo por defecto.
 */
export const getHeroMedia = cache(async (page: HeroPageKey): Promise<HeroBackground | null> => {
  try {
    return await db.heroMedia.findUnique({ where: { page }, select: { type: true, url: true } });
  } catch (error) {
    console.error(`No se pudo leer el hero de ${page}`, error);
    return null;
  }
});

/** Todos los heroes configurados, para el panel. */
export async function listHeroMedia() {
  const rows = await db.heroMedia.findMany();
  return new Map(rows.map((row) => [row.page as HeroPageKey, row]));
}
