import "server-only";
import { cache } from "react";
import type { RequestStatus } from "@/generated/prisma/enums";
import { db } from "@/lib/db";

export const requestStatuses = ["NEW", "CONTACTED", "CLOSED"] as const satisfies readonly RequestStatus[];

export const requestStatusLabels: Record<RequestStatus, string> = {
  NEW: "Nueva",
  CONTACTED: "Contactada",
  CLOSED: "Cerrada",
};

/** Solicitudes del formulario, las más recientes primero. Sin `status`, todas. */
export async function listRequests(status?: RequestStatus) {
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
  const groups = await db.contactRequest.groupBy({ by: ["status"], _count: { _all: true } });
  const counts: Record<RequestStatus, number> = { NEW: 0, CONTACTED: 0, CLOSED: 0 };
  for (const group of groups) counts[group.status] = group._count._all;
  return counts;
}

export const getRequest = cache((id: string) => db.contactRequest.findUnique({ where: { id } }));
