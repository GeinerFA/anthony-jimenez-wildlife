import { db } from "@/lib/db";

export default async function AdminDashboard() {
  const [published, drafts, media] = await Promise.all([
    db.tour.count({ where: { status: "PUBLISHED" } }),
    db.tour.count({ where: { status: "DRAFT" } }),
    db.media.count(),
  ]);

  const stats = [
    { label: "Tours publicados", value: published },
    { label: "Borradores", value: drafts },
    { label: "Imágenes y videos", value: media },
  ];

  return (
    <>
      <h1 className="font-display text-4xl">Tours</h1>
      <dl className="mt-8 grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-sm border border-ink/10 bg-white p-6">
            <dt className="text-sm text-ink/60">{stat.label}</dt>
            <dd className="mt-2 font-display text-4xl">{stat.value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-10 text-ink/60">La edición de tours y la galería de medios se agregan en la siguiente etapa.</p>
    </>
  );
}
