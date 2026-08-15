import React, { useEffect, useMemo, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Camera,
  MapPin,
  Tag,
  Link2,
  Users,
  Star,
  CalendarClock,
  X,
  Save,
  Pencil,
} from "lucide-react";
import type { HatiraExperienceType, HatiraMemory, HatiraWritePayload } from "../../types/modules";
import { TurkishDateTimeInput } from "../ui/TurkishDateTimeInput";
import { AuthImage } from "./AuthImage";
import { hatiraApi } from "../../services/modules";
import { parseApiDateTime } from "../../lib/format";
import { cn } from "../../lib/utils";

const EXPERIENCE_TYPES: HatiraExperienceType[] = ["Günce", "Yemek", "Konaklama"];

type OptionalField = "photos" | "location" | "type" | "maps" | "companions" | "rating" | "date";

interface HatiraComposerProps {
  editing: HatiraMemory | null;
  onCancelEdit: () => void;
  onSaved: () => void;
}

export const HatiraComposer: React.FC<HatiraComposerProps> = ({
  editing,
  onCancelEdit,
  onSaved,
}) => {
  const [text, setText] = useState("");
  const [open, setOpen] = useState<Partial<Record<OptionalField, boolean>>>({});
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [keepPhotoIds, setKeepPhotoIds] = useState<number[]>([]);
  const [locationName, setLocationName] = useState("");
  const [experienceType, setExperienceType] = useState<HatiraExperienceType>("Günce");
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");
  const [companions, setCompanions] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [useCustomDate, setUseCustomDate] = useState(false);
  const [occurredAt, setOccurredAt] = useState(() => new Date());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) {
      resetForm();
      return;
    }
    setText(editing.text);
    setLocationName(editing.locationName ?? "");
    setExperienceType((editing.experienceType as HatiraExperienceType) || "Günce");
    setGoogleMapsUrl(editing.googleMapsUrl ?? "");
    setCompanions(editing.companions ?? "");
    setRating(editing.rating);
    setOccurredAt(parseApiDateTime(editing.occurredAt));
    setUseCustomDate(true);
    setKeepPhotoIds(editing.photos.map((p) => p.id));
    setPhotos([]);
    setPhotoPreviews([]);
    setOpen({
      photos: editing.photos.length > 0,
      location: !!editing.locationName,
      type: editing.experienceType !== "Günce",
      maps: !!editing.googleMapsUrl,
      companions: !!editing.companions,
      rating: editing.rating != null,
      date: true,
    });
    setError(null);
  }, [editing]);

  useEffect(() => {
    const urls = photos.map((f) => URL.createObjectURL(f));
    setPhotoPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [photos]);

  const resetForm = () => {
    setText("");
    setOpen({});
    setPhotos([]);
    setPhotoPreviews([]);
    setKeepPhotoIds([]);
    setLocationName("");
    setExperienceType("Günce");
    setGoogleMapsUrl("");
    setCompanions("");
    setRating(null);
    setUseCustomDate(false);
    setOccurredAt(new Date());
    setError(null);
  };

  const toggle = (key: OptionalField) => {
    setOpen((prev) => {
      const next = !prev[key];
      if (key === "date" && next) {
        setUseCustomDate(true);
        setOccurredAt(new Date());
      }
      if (key === "date" && !next) {
        setUseCustomDate(false);
      }
      if (key === "type" && !next) setExperienceType("Günce");
      if (key === "rating" && !next) setRating(null);
      if (key === "photos" && !next) {
        setPhotos([]);
        if (!editing) setKeepPhotoIds([]);
      }
      return { ...prev, [key]: next };
    });
  };

  const existingPhotos = useMemo(() => {
    if (!editing) return [];
    return editing.photos.filter((p) => keepPhotoIds.includes(p.id));
  }, [editing, keepPhotoIds]);

  const handleFiles = (list: FileList | null) => {
    if (!list) return;
    const next = [...photos, ...Array.from(list)].slice(0, 12 - existingPhotos.length);
    setPhotos(next);
    setOpen((o) => ({ ...o, photos: true }));
  };

  const buildPayload = (): HatiraWritePayload => ({
    text: text.trim(),
    occurredAt: useCustomDate ? occurredAt.toISOString() : null,
    experienceType,
    locationName: open.location ? locationName.trim() || null : null,
    googleMapsUrl: open.maps ? googleMapsUrl.trim() || null : null,
    companions: open.companions ? companions.trim() || null : null,
    rating: open.rating ? rating : null,
    photos,
    keepPhotoIds: editing ? keepPhotoIds : undefined,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      setError("Birkaç kelime yazman yeterli.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = buildPayload();
      if (editing) {
        await hatiraApi.update(editing.id, payload);
        onCancelEdit();
      } else {
        await hatiraApi.create(payload);
      }
      resetForm();
      onSaved();
    } catch {
      setError("Kayıt başarısız. Alanları ve fotoğrafları kontrol et.");
    } finally {
      setSaving(false);
    }
  };

  const iconBtn = (
    key: OptionalField,
    label: string,
    Icon: LucideIcon,
    activeHint?: boolean
  ) => {
    const active = !!open[key] || !!activeHint;
    return (
      <button
        type="button"
        onClick={() => toggle(key)}
        title={label}
        aria-label={label}
        aria-pressed={active}
        className={cn(
          "p-2.5 rounded-xl border transition-colors",
          active
            ? "border-primary/40 bg-primary/10 text-primary dark:text-primary-light"
            : "border-slate-200 dark:border-white/10 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5"
        )}
      >
        <Icon size={18} />
      </button>
    );
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/20"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300">
          {editing ? "Anıyı düzenle" : "Yeni anı"}
        </h2>
        {editing && (
          <button
            type="button"
            onClick={() => {
              onCancelEdit();
              resetForm();
            }}
            className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
          >
            <X size={14} />
            İptal
          </button>
        )}
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        maxLength={8000}
        placeholder="Ne hissettin, ne yaşadın? Sadece yazıp kaydedebilirsin…"
        className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent text-base resize-y min-h-[5.5rem] leading-relaxed"
      />

      <div className="flex flex-wrap items-center gap-2">
        {iconBtn("photos", "Fotoğraf", Camera, photos.length > 0 || existingPhotos.length > 0)}
        {iconBtn("location", "Konum adı", MapPin, !!locationName)}
        {iconBtn("type", "Deneyim tipi", Tag, experienceType !== "Günce")}
        {iconBtn("maps", "Google Maps", Link2, !!googleMapsUrl)}
        {iconBtn("companions", "Kiminle", Users, !!companions)}
        {iconBtn("rating", "Puan", Star, rating != null)}
        {iconBtn("date", "Tarih", CalendarClock, useCustomDate)}
        <button
          type="submit"
          disabled={saving}
          className="ml-auto px-4 py-2.5 rounded-xl bg-primary text-white font-semibold flex items-center gap-2 disabled:opacity-60"
        >
          {editing ? <Pencil size={16} /> : <Save size={16} />}
          {saving ? "Kaydediliyor…" : editing ? "Güncelle" : "Kaydet"}
        </button>
      </div>

      {open.photos && (
        <div className="space-y-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="text-sm px-3 py-2 rounded-xl border border-dashed border-slate-300 dark:border-white/20 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
          >
            Fotoğraf ekle (çoklu)
          </button>
          {(existingPhotos.length > 0 || photoPreviews.length > 0) && (
            <div className="flex flex-wrap gap-2">
              {existingPhotos.map((p) => (
                <div key={p.id} className="relative w-20 h-20 rounded-lg overflow-hidden">
                  <AuthImage
                    src={hatiraApi.photoUrl(p.id)}
                    alt={p.fileName}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setKeepPhotoIds((ids) => ids.filter((id) => id !== p.id))}
                    className="absolute top-1 right-1 p-0.5 rounded-full bg-black/60 text-white"
                    aria-label="Fotoğrafı kaldır"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              {photoPreviews.map((url, i) => (
                <div key={url} className="relative w-20 h-20 rounded-lg overflow-hidden">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                    className="absolute top-1 right-1 p-0.5 rounded-full bg-black/60 text-white"
                    aria-label="Yeni fotoğrafı kaldır"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {open.location && (
        <input
          value={locationName}
          onChange={(e) => setLocationName(e.target.value)}
          maxLength={200}
          placeholder="Konum / mekan adı"
          className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent"
        />
      )}

      {open.type && (
        <div className="flex flex-wrap gap-2">
          {EXPERIENCE_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setExperienceType(t)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-sm font-medium border",
                experienceType === t
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-slate-200 dark:border-white/10 text-slate-500"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {open.maps && (
        <input
          value={googleMapsUrl}
          onChange={(e) => setGoogleMapsUrl(e.target.value)}
          maxLength={1000}
          placeholder="https://maps.google.com/…"
          className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent"
        />
      )}

      {open.companions && (
        <input
          value={companions}
          onChange={(e) => setCompanions(e.target.value)}
          maxLength={500}
          placeholder="Kiminle? örn. Ayşe, Defne, Anne"
          className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent"
        />
      )}

      {open.rating && (
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              className="p-1"
              aria-label={`${n} yıldız`}
            >
              <Star
                size={22}
                className={cn(
                  n <= (rating ?? 0)
                    ? "fill-amber-400 text-amber-400"
                    : "text-slate-300 dark:text-slate-600"
                )}
              />
            </button>
          ))}
          {rating != null && (
            <button
              type="button"
              onClick={() => setRating(null)}
              className="ml-2 text-xs text-slate-500"
            >
              Temizle
            </button>
          )}
        </div>
      )}

      {open.date && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <button
              type="button"
              onClick={() => {
                setUseCustomDate(false);
                setOccurredAt(new Date());
              }}
              className={cn(
                "px-3 py-1.5 rounded-lg border",
                !useCustomDate
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-slate-200 dark:border-white/10"
              )}
            >
              Şu an
            </button>
            <button
              type="button"
              onClick={() => setUseCustomDate(true)}
              className={cn(
                "px-3 py-1.5 rounded-lg border",
                useCustomDate
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-slate-200 dark:border-white/10"
              )}
            >
              Geçmiş tarih
            </button>
          </div>
          {useCustomDate && (
            <TurkishDateTimeInput
              label="Deneyim zamanı"
              value={occurredAt}
              onChange={setOccurredAt}
            />
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
    </form>
  );
};
