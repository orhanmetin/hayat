import React, { useState } from "react";
import {
  MapPin,
  ExternalLink,
  Pencil,
  Trash2,
  Star,
  Users,
  Tag,
  X,
} from "lucide-react";
import type { HatiraMemory } from "../../types/modules";
import { AuthImage } from "./AuthImage";
import { hatiraApi } from "../../services/modules";
import { formatDateTime } from "../../lib/format";
import { cn } from "../../lib/utils";

interface HatiraTimelineProps {
  items: HatiraMemory[];
  loading: boolean;
  onEdit: (item: HatiraMemory) => void;
  onDelete: (id: number) => void;
}

export const HatiraTimeline: React.FC<HatiraTimelineProps> = ({
  items,
  loading,
  onEdit,
  onDelete,
}) => {
  const [lightbox, setLightbox] = useState<{ urls: string[]; index: number } | null>(
    null
  );

  if (loading) {
    return <p className="text-center text-slate-400 py-10">Yükleniyor…</p>;
  }

  if (items.length === 0) {
    return (
      <p className="text-center text-slate-400 py-10">
        Henüz anı yok. Yukarıdan hızlıca bir not bırakabilirsin.
      </p>
    );
  }

  return (
    <>
      <ol className="relative space-y-0 border-l border-slate-200 dark:border-white/10 ml-3">
        {items.map((item) => (
          <li key={item.id} className="relative pl-6 pb-8 last:pb-0">
            <span className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-primary ring-4 ring-bg-light dark:ring-bg-dark" />
            <article className="space-y-3">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                <time dateTime={item.occurredAt}>{formatDateTime(item.occurredAt)}</time>
                <span className="inline-flex items-center gap-1">
                  <Tag size={12} />
                  {item.experienceType}
                </span>
                {item.rating != null && (
                  <span className="inline-flex items-center gap-0.5 text-amber-500">
                    {Array.from({ length: item.rating }).map((_, i) => (
                      <Star key={i} size={12} className="fill-amber-400 text-amber-400" />
                    ))}
                  </span>
                )}
              </div>

              <p className="text-base leading-relaxed whitespace-pre-wrap">{item.text}</p>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                {item.locationName && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={14} />
                    {item.locationName}
                  </span>
                )}
                {item.companions && (
                  <span className="inline-flex items-center gap-1">
                    <Users size={14} />
                    {item.companions}
                  </span>
                )}
                {item.googleMapsUrl && (
                  <a
                    href={item.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    <ExternalLink size={14} />
                    Haritada aç
                  </a>
                )}
              </div>

              {item.photos.length > 0 && (
                <div
                  className={cn(
                    "grid gap-2",
                    item.photos.length === 1
                      ? "grid-cols-1 max-w-md"
                      : "grid-cols-2 sm:grid-cols-3"
                  )}
                >
                  {item.photos.map((photo, index) => (
                    <button
                      key={photo.id}
                      type="button"
                      onClick={() =>
                        setLightbox({
                          urls: item.photos.map((p) => hatiraApi.photoUrl(p.id)),
                          index,
                        })
                      }
                      className="aspect-[4/3] rounded-xl overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      <AuthImage
                        src={hatiraApi.photoUrl(photo.id)}
                        alt={photo.fileName}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onEdit(item)}
                  className="px-3 py-1.5 rounded-lg text-sm text-primary hover:bg-primary/10 inline-flex items-center gap-1"
                >
                  <Pencil size={14} />
                  Düzenle
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(item.id)}
                  className="px-3 py-1.5 rounded-lg text-sm text-red-500 hover:bg-red-500/10 inline-flex items-center gap-1"
                >
                  <Trash2 size={14} />
                  Sil
                </button>
              </div>
            </article>
          </li>
        ))}
      </ol>

      {lightbox && (
        <div
          className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white"
            onClick={() => setLightbox(null)}
            aria-label="Kapat"
          >
            <X size={20} />
          </button>
          <div
            className="max-w-3xl w-full max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <AuthImage
              src={lightbox.urls[lightbox.index]}
              alt="Anı fotoğrafı"
              className="w-full h-full max-h-[85vh] object-contain rounded-xl"
            />
            {lightbox.urls.length > 1 && (
              <div className="flex justify-center gap-2 mt-3">
                {lightbox.urls.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setLightbox({ ...lightbox, index: i })}
                    className={cn(
                      "w-2.5 h-2.5 rounded-full",
                      i === lightbox.index ? "bg-white" : "bg-white/40"
                    )}
                    aria-label={`Fotoğraf ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
