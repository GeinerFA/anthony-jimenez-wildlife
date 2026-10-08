import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { requireAdmin } from "@/auth/auth";
import type { RequestStatus } from "@/generated/prisma/enums";
import { db } from "@/lib/db";

/**
 * Las solicitudes tienen datos personales: cada lectura confirma que quien pide sigue siendo admin activo.
 * El layout del panel ya lo revisa, pero no se vuelve a ejecutar al navegar dentro del panel sin recargar.
 * cache(): una sola verificación por render aunque se llamen varias funciones.
 */
const assertAdmin = cache(async () => {
  if (!(await requireAdmin())) redirect("/admin/login?error=AccessDenied");
});

export const requestStatuses = ["NEW", "CONTACTED", "CLOSED"] as const satisfies readonly RequestStatus[];

export const requestStatusLabels: Record<RequestStatus, string> = {
  NEW: "Nueva",
  CONTACTED: "Contactada",
  CLOSED: "Cerrada",
};

/** Solicitudes del formulario, las más recientes primero. Sin `status`, todas. */
export async function listRequests(status?: RequestStatus) {
  await assertAdmin();
  return db.contactRequest.findMany({
    where: status ? { status } : {},
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      status: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      nationality: true,
      message: true,
      createdAt: true,
    },
  });
}

/** Cuántas hay en cada estado (para las pestañas y el aviso del menú). */
export async function countRequestsByStatus() {
  await assertAdmin();
  const groups = await db.contactRequest.groupBy({ by: ["status"], _count: { _all: true } });
  const counts: Record<RequestStatus, number> = { NEW: 0, CONTACTED: 0, CLOSED: 0 };
  for (const group of groups) counts[group.status] = group._count._all;
  return counts;
}

export const getRequest = cache(async (id: string) => {
  await assertAdmin();
  return db.contactRequest.findUnique({ where: { id } });
});
