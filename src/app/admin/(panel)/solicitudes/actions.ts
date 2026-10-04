"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/auth/auth";
import type { ActionResult } from "@/components/admin/form-state";
import type { RequestStatus } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { isMailConfigured } from "@/lib/env";
import { sendNotification } from "@/server/requests";

async function adminOrThrow() {
  if (!(await requireAdmin())) throw new Error("No autorizado");
}

export async function setRequestStatus(id: string, status: RequestStatus) {
  await adminOrThrow();
  await db.contactRequest.updateMany({ where: { id }, data: { status } });
  revalidatePath("/admin", "layout");
}

/** Vuelve a mandar el aviso con el PDF a info@ (p. ej. si el correo no estaba configurado cuando llegó). */
export async function resendNotification(id: string): Promise<ActionResult> {
  await adminOrThrow();
  if (!isMailConfigured()) return { ok: false, message: "El correo no está configurado en el servidor (faltan las variables SMTP_*)." };
  const request = await db.contactRequest.findUnique({ where: { id } });
  if (!request) return { ok: false, message: "Esta solicitud ya no existe." };
  const sent = await sendNotification(request);
  revalidatePath(`/admin/solicitudes/${id}`);
  return sent ? { ok: true, message: "Aviso reenviado a info@." } : { ok: false, message: "No se pudo enviar el correo. Revisá la configuración SMTP." };
}

export async function deleteRequest(id: string): Promise<ActionResult> {
  await adminOrThrow();
  await db.contactRequest.deleteMany({ where: { id } });
  revalidatePath("/admin", "layout");
  redirect("/admin/solicitudes");
}
