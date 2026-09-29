import { englishStatusLabels, type EnglishStatus } from "@/server/admin/translation";
import { Badge, type Tone } from "./ui";

const englishTones: Record<EnglishStatus, Tone> = {
  missing: "red",
  machine: "green",
  "machine-stale": "amber",
  manual: "green",
  "manual-stale": "amber",
};

export function EnglishBadge({ status }: { status: EnglishStatus }) {
  return <Badge tone={englishTones[status]}>EN · {englishStatusLabels[status]}</Badge>;
}

export function StatusBadge({ status }: { status: "DRAFT" | "PUBLISHED" }) {
  return status === "PUBLISHED" ? <Badge tone="green">Publicado</Badge> : <Badge tone="gray">Borrador</Badge>;
}
