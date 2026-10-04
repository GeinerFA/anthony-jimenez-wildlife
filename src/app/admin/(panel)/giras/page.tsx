import type { Metadata } from "next";
import { TourListPage } from "@/components/admin/tour-list-page";

export const metadata: Metadata = { title: "Giras" };

export default function GirasAdminPage() {
  return <TourListPage category="GIRA" />;
}
