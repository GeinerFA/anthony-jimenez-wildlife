"use client";

import { ArrowLeft, ArrowRight, Film, LoaderCircle, Star, Trash, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition, type DragEvent } from "react";
import { deleteMedia, registerMedia, reorderMedia, updateMediaAlt } from "@/app/admin/(panel)/tours/media-actions";
import { CloudinaryImage } from "@/components/ui/cloudinary-image";
import { acceptedFileTypes, formatBytes, mediaRules, mediaTypeForFile } from "@/config/media";
import { videoPoster } from "@/lib/media/cloudinary-url";
import { uploadToCloudinary, type SignedUpload } from "@/lib/media/upload-client";
import { buttonClass, iconButtonClass, Notice } from "./ui";

export type MediaItem = {
  id: string;
  type: "IMAGE" | "VIDEO";
  url: string;
  bytes: number;
  width: number;
  height: number;
  altEs: string;
  altEn: string;
};

type UploadRow = {
  key: string;
  name: string;
  progress: number;
  status: "waiting" | "uploading" | "saving" | "done" | "error";
  message?: string;
};

export function MediaManager({ tourId, items: serverItems, uploadsEnabled }: { tourId: string; items: MediaItem[]; uploadsEnabled: boolean }) {
  const router = useRouter();
  const [items, setItems] = useState(serverItems);
  const [syncedFrom, setSyncedFrom] = useState(serverItems);
  const [uploads, setUploads] = useState<UploadRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, startTransition] = useTransition();

  // Cuando el servidor manda datos nuevos (router.refresh), reemplazan al estado optimista.
  if (serverItems !== syncedFrom) {
    setSyncedFrom(serverItems);
    setItems(serverItems);
  }

  const uploading = uploads.some((u) => u.status === "waiting" || u.status === "uploading" || u.status === "saving");

  useEffect(() => {
    if (!uploading) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [uploading]);

  function updateRow(key: string, patch: Partial<UploadRow>) {
    setUploads((rows) => rows.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  async function uploadOne(row: UploadRow, file: File) {
    const type = mediaTypeForFile(file.name);
    if (!type) return updateRow(row.key, { status: "error", message: "Formato no permitido." });
    if (file.size === 0) return updateRow(row.key, { status: "error", message: "El archivo está vacío." });
    if (file.size > mediaRules[type].maxBytes) {
      return updateRow(row.key, { status: "error", message: `Supera el máximo de ${mediaRules[type].maxLabel}.` });
    }

    try {
      updateRow(row.key, { status: "uploading" });
      const response = await fetch("/api/admin/media/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tourId, type }),
      });
      const signed = (await response.json().catch(() => ({}))) as SignedUpload & { error?: string };
      if (!response.ok) throw new Error(signed.error ?? "No se pudo autorizar la subida.");

      const result = await uploadToCloudinary(file, signed, (progress) => updateRow(row.key, { progress }));
      updateRow(row.key, { status: "saving", progress: 1 });

      const saved = await registerMedia({ tourId, publicId: result.public_id, type });
      if (!saved.ok) throw new Error(saved.message);
      updateRow(row.key, { status: "done" });
      router.refresh();
    } catch (err) {
      updateRow(row.key, { status: "error", message: err instanceof Error ? err.message : "Error inesperado." });
    }
  }

  async function handleFiles(fileList: FileList | null) {
    const files = Array.from(fileList ?? []);
    if (files.length === 0) return;
    const rows: UploadRow[] = files.map((file) => ({ key: crypto.randomUUID(), name: file.name, progress: 0, status: "waiting" }));
    setUploads((current) => [...current.filter((u) => u.status !== "done"), ...rows]);
    // Una por una: evita saturar la conexión y el rate limit con muchos archivos a la vez.
    for (const [i, file] of files.entries()) await uploadOne(rows[i], file);
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    if (uploadsEnabled) void handleFiles(event.dataTransfer.files);
  }

  function saveOrder(next: MediaItem[]) {
    const previous = items;
    setItems(next);
    setError(null);
    startTransition(async () => {
      const result = await reorderMedia(tourId, next.map((item) => item.id));
      if (!result.ok) {
        setItems(previous);
        setError(result.message ?? "No se pudo guardar el orden.");
      }
      router.refresh();
    });
  }

  function move(index: number, to: number) {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [item] = next.splice(index, 1);
    next.splice(to, 0, item);
    saveOrder(next);
  }

  function remove(id: string) {
    setError(null);
    startTransition(async () => {
      const result = await deleteMedia(id);
      if (!result.ok) setError(result.message ?? "No se pudo eliminar.");
      else setItems((current) => current.filter((item) => item.id !== id));
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      {!uploadsEnabled && (
        <Notice tone="amber">
          Para subir o borrar archivos faltan las credenciales de Cloudinary en el servidor (<code>CLOUDINARY_*</code> en <code>.env</code>).
        </Notice>
      )}

      <label
        onDragOver={(event) => {
          event.preventDefault();
          if (uploadsEnabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`flex flex-col items-center justify-center gap-3 rounded-sm border-2 border-dashed px-6 py-12 text-center transition-colors ${
          uploadsEnabled ? "cursor-pointer hover:border-fern" : "cursor-not-allowed opacity-50"
        } ${dragging ? "border-fern bg-fern/5" : "border-ink/20 bg-white"}`}
      >
        <Upload className="size-8 text-fern" aria-hidden />
        <span className="font-semibold">Arrastrá fotos y videos aquí o hacé clic para elegirlos</span>
        <span className="text-sm text-ink/60">
          Fotos: JPG, PNG, WebP, AVIF o HEIC hasta {mediaRules.IMAGE.maxLabel}. Videos: MP4, MOV o WebM hasta {mediaRules.VIDEO.maxLabel}.
        </span>
        <input
          type="file"
          multiple
          accept={acceptedFileTypes}
          disabled={!uploadsEnabled}
          className="sr-only"
          onChange={(event) => {
            void handleFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </label>

      {uploads.length > 0 && (
        <ul className="space-y-2" aria-live="polite">
          {uploads.map((row) => (
            <li key={row.key} className="rounded-sm border border-ink/10 bg-white px-4 py-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="min-w-0 truncate font-semibold">{row.name}</span>
                <span className={`shrink-0 ${row.status === "error" ? "text-red-700" : row.status === "done" ? "text-fern" : "text-ink/60"}`}>
                  {row.status === "waiting" && "En cola"}
                  {row.status === "uploading" && `${Math.round(row.progress * 100)} %`}
                  {row.status === "saving" && "Verificando…"}
                  {row.status === "done" && "Listo"}
                  {row.status === "error" && "Error"}
                </span>
              </div>
              {(row.status === "uploading" || row.status === "saving") && (
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-ink/10">
                  <div className="h-full bg-fern transition-[width]" style={{ width: `${row.progress * 100}%` }} />
                </div>
              )}
              {row.message && <p className="mt-1 text-red-700">{row.message}</p>}
            </li>
          ))}
        </ul>
      )}

      {error && <Notice tone="red">{error}</Notice>}

      {items.length === 0 ? (
        <p className="text-ink/60">Este tour todavía no tiene fotos ni videos. El primero que subas será la portada.</p>
      ) : (
        <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <MediaCard
              key={item.id}
              item={item}
              index={index}
              count={items.length}
              busy={busy}
              canDelete={uploadsEnabled}
              onMove={(to) => move(index, to)}
              onDelete={() => remove(item.id)}
            />
          ))}
        </ol>
      )}
    </div>
  );
}

function MediaCard({
  item,
  index,
  count,
  busy,
  canDelete,
  onMove,
  onDelete,
}: {
  item: MediaItem;
  index: number;
  count: number;
  busy: boolean;
  canDelete: boolean;
  onMove: (to: number) => void;
  onDelete: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const thumb = item.type === "VIDEO" ? videoPoster(item.url, 800) : item.url;

  return (
    <li className="overflow-hidden rounded-sm border border-ink/10 bg-white">
      <div className="relative aspect-[4/3] bg-mist">
        <CloudinaryImage src={thumb} alt={item.altEs} fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover" />
        <div className="absolute left-3 top-3 flex gap-2">
          {index === 0 ? (
            <span className="rounded-full bg-lime px-2.5 py-0.5 text-xs font-semibold text-ink">Portada</span>
          ) : (
            <span className="rounded-full bg-ink/70 px-2.5 py-0.5 text-xs font-semibold text-bone">{index + 1}</span>
          )}
          {item.type === "VIDEO" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-ink/70 px-2.5 py-0.5 text-xs font-semibold text-bone">
              <Film className="size-3" aria-hidden /> Video
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 border-b border-ink/10 px-2 py-1">
        <div className="flex items-center">
          <button type="button" className={iconButtonClass} disabled={busy || index === 0} onClick={() => onMove(index - 1)} aria-label="Mover antes" title="Mover antes">
            <ArrowLeft className="size-4" aria-hidden />
          </button>
          <button type="button" className={iconButtonClass} disabled={busy || index === count - 1} onClick={() => onMove(index + 1)} aria-label="Mover después" title="Mover después">
            <ArrowRight className="size-4" aria-hidden />
          </button>
          {index > 0 && (
            <button type="button" className={iconButtonClass} disabled={busy} onClick={() => onMove(0)} aria-label="Usar como portada" title="Usar como portada">
              <Star className="size-4" aria-hidden />
            </button>
          )}
        </div>
        <span className="text-xs text-ink/50">{formatBytes(item.bytes)}</span>
        {confirming ? (
          <span className="flex items-center gap-1">
            <button type="button" className={buttonClass("danger", "sm")} disabled={busy} onClick={onDelete}>
              {busy && <LoaderCircle className="size-3.5 animate-spin" aria-hidden />}
              Eliminar
            </button>
            <button type="button" className={buttonClass("ghost", "sm")} onClick={() => setConfirming(false)}>
              No
            </button>
          </span>
        ) : (
          <button
            type="button"
            className={iconButtonClass}
            disabled={busy || !canDelete}
            onClick={() => setConfirming(true)}
            aria-label="Eliminar archivo"
            title="Eliminar archivo"
          >
            <Trash className="size-4" aria-hidden />
          </button>
        )}
      </div>

      <AltEditor item={item} />
    </li>
  );
}

/** Texto alternativo por idioma (accesibilidad y SEO de imágenes). */
function AltEditor({ item }: { item: MediaItem }) {
  const [altEs, setAltEs] = useState(item.altEs);
  const [altEn, setAltEn] = useState(item.altEn);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const dirty = altEs !== item.altEs || altEn !== item.altEn;

  function save() {
    setMessage(null);
    startTransition(async () => {
      const result = await updateMediaAlt(item.id, { altEs, altEn });
      if (result.altEn !== undefined) setAltEn(result.altEn);
      setMessage({ ok: result.ok, text: result.message ?? "Guardado." });
    });
  }

  return (
    <details className="group px-4 py-3 text-sm">
      <summary className="cursor-pointer select-none font-semibold text-ink/70 hover:text-ink">
        Texto alternativo {item.altEs ? "" : <span className="font-normal text-ink/45">(vacío)</span>}
      </summary>
      <div className="mt-3 space-y-3">
        <label className="block">
          <span className="text-xs font-semibold text-ink/60">Español</span>
          <input
            value={altEs}
            onChange={(e) => setAltEs(e.target.value)}
            maxLength={200}
            placeholder="Qué se ve en la imagen"
            className="mt-1 w-full rounded-sm border border-ink/15 px-3 py-1.5 focus-visible:outline-offset-0"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-ink/60">Inglés</span>
          <input
            value={altEn}
            onChange={(e) => setAltEn(e.target.value)}
            maxLength={200}
            placeholder="Vacío = se traduce del español"
            className="mt-1 w-full rounded-sm border border-ink/15 px-3 py-1.5 focus-visible:outline-offset-0"
          />
        </label>
        <div className="flex items-center gap-3">
          <button type="button" onClick={save} disabled={pending || !dirty} className={buttonClass("primary", "sm")}>
            {pending && <LoaderCircle className="size-3.5 animate-spin" aria-hidden />}
            Guardar
          </button>
          {message && <span className={message.ok ? "text-fern" : "text-red-700"}>{message.text}</span>}
        </div>
      </div>
    </details>
  );
}
