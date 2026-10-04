import type { RequestStatus } from "@/generated/prisma/enums";
import { requestStatusLabels } from "@/server/admin/requests";
import { Badge, type Tone } from "./ui";

const tones: Record<RequestStatus, Tone> = { NEW: "amber", CONTACTED: "green", CLOSED: "gray" };

export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  return <Badge tone={tones[status]}>{requestStatusLabels[status]}</Badge>;
}
