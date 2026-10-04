import type { Metadata } from "next";
import { TourListPage } from "@/components/admin/tour-list-page";

export const metadata: Metadata = { title: "Tours de un día" };

export default function DayToursAdminPage() {
  return <TourListPage category="DAY_TOUR" />;
}
