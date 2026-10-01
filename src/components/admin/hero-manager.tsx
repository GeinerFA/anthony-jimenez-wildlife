"use client";

import { Film, Image as ImageIcon, LoaderCircle, Trash, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { registerHeroMedia, removeHeroMedia } from "@/app/admin/(panel)/portadas/actions";
import { CloudinaryImage } from "@/components/ui/cloudinary-image";
import { acceptedFileTypes, formatBytes, mediaRules, mediaTypeForFile, type HeroPageKey } from "@/config/media";
import { videoPoster } from "@/lib/media/cloudinary-url";
import { uploadToCloudinary, type SignedUpload } from "@/lib/media/upload-client";
import { buttonClass, Notice } from "./ui";

export type HeroSlot = {
  page: HeroPageKey;
  label: string;
  /** Qué se muestra en el sitio si no hay portada propia. */
  fallback: string;
  current: { type: "IMAGE" | "VIDEO"; url: string; bytes: number } | null;
};

type Upload = { status: "uploading" | "saving"; progress: number };

/** Una portada (hero) de una página pública: vista previa, subir/reemplazar y quitar. */
export function HeroManager({ slot, uploadsEnabled }: { slot: HeroSlot; uploadsEnabled: boolean }) {
  const router = useRouter();
  const [upload, setUpload] = useState<Upload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [removing, startRemove] = useTransition();
  const busy = upload !== null || removing;
  const { current } = slot;

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    const type = mediaTypeForFile(file.name);
    if (!type) return setError("Formato no permitido.");
    if (file.size > mediaRules[type].maxBytes) return setError(`Supera el máximo de ${mediaRules[type].maxLabel}.`);

    try {
      setUpload({ status: "uploading", progress: 0 });
      const response = await fetch("/api/admin/media/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ heroPage: slot.page, type }),
      });
      const signed = (await response.json().catch(() => ({}))) as SignedUpload & { error?: string };
      if (!response.ok) throw new Error(signed.error ?? "No se pudo autorizar la subida.");

      const result = await uploadToCloudinary(file, signed, (progress) => setUpload({ status: "uploading", progress }));
      setUpload({ status: "saving", progress: 1 });

      const saved = await registerHeroMedia({ page: slot.page, publicId: result.public_id, type });
      if (!saved.ok) throw new Error(saved.message);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setUpload(null);
    }
  }

  function remove() {
    setError(null);
    startRemove(async () => {
      const result = await removeHeroMedia(slot.page);
      if (!result.ok) setError(result.message ?? "No se pudo quitar.");
      setConfirming(false);
      router.refresh();
    });
  }

  return (
    <li className="overflow-hidden rounded-sm border border-ink/10 bg-white">
      <div className="relative aspect-video bg-mist">
        {current ? (
          <CloudinaryImage
            src={current.type === "VIDEO" ? videoPoster(current.url, 960) : current.url}
            alt=""
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-ink/50">
            <span>
              <ImageIcon className="mx-auto mb-2 size-6" aria-hidden />
              Sin portada propia
            </span>
          </div>
        )}
        {current?.type === "VIDEO" && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-ink/70 px-2.5 py-0.5 text-xs font-semibold text-bone">
            <Film className="size-3" aria-hidden /> Video
          </span>
        )}
        {upload && (
          <div className="absolute inset-0 grid place-items-center bg-white/80 text-sm font-semibold" aria-live="polite">
            <span className="flex items-center gap-2">
              <LoaderCircle className="size-4 animate-spin" aria-hidden />
              {upload.status === "uploading" ? `Subiendo ${Math.round(upload.progress * 100)} %` : "Verificando…"}
            </span>
          </div>
        )}
      </div>

      <div className="space-y-3 p-4">
        <div>
          <h2 className="font-display text-2xl">{slot.label}</h2>
          <p className="mt-1 text-sm text-ink/60">
            {current ? formatBytes(current.bytes) : `Sin portada propia se muestra: ${slot.fallback}.`}
          </p>
        </div>

        {error && <Notice tone="red">{error}</Notice>}

        <div className="flex flex-wrap items-center gap-2">
          <label className={`${buttonClass("primary", "sm")} ${busy || !uploadsEnabled ? "pointer-events-none opacity-50" : "cursor-pointer"}`}>
            <Upload className="size-4" aria-hidden />
            {current ? "Reemplazar" : "Subir foto o video"}
            <input
              type="file"
              accept={acceptedFileTypes}
              disabled={busy || !uploadsEnabled}
              className="sr-only"
              onChange={(event) => {
                void handleFile(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
          </label>

          {current &&
            (confirming ? (
              <span className="flex items-center gap-1">
                <button type="button" className={buttonClass("danger", "sm")} disabled={busy} onClick={remove}>
                  {removing && <LoaderCircle className="size-3.5 animate-spin" aria-hidden />}
                  Quitar
                </button>
                <button type="button" className={buttonClass("ghost", "sm")} disabled={busy} onClick={() => setConfirming(false)}>
                  No
                </button>
              </span>
            ) : (
              <button
                type="button"
                className={buttonClass("ghost", "sm")}
                disabled={busy || !uploadsEnabled}
                onClick={() => setConfirming(true)}
              >
                <Trash className="size-4" aria-hidden />
                Quitar
              </button>
            ))}
        </div>
      </div>
    </li>
  );
}
