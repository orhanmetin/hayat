import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { healthApi, deepWorkApi, managementApi } from "../../services/modules";
import { DurationMinutesInput } from "../ui/DurationMinutesInput";
import { parseDistanceKm, normalizeStravaUrl } from "../../lib/sport";
import { TurkishDateInput } from "../ui/TurkishDateInput";
import { TurkishDateTimeInput } from "../ui/TurkishDateTimeInput";
import { formatDate, parseApiDateTime } from "../../lib/format";
import type {
  DeepWorkSession,
  LookupType,
  MeditationSession,
  RecordKind,
  SleepLog,
  SportActivity,
} from "../../types/modules";
import { cn } from "../../lib/utils";

type EditPayload =
  | { kind: "sleep"; record: SleepLog }
  | { kind: "sport"; record: SportActivity }
  | { kind: "meditation"; record: MeditationSession }
  | { kind: "deepwork"; record: DeepWorkSession };

interface EditRecordModalProps {
  payload: EditPayload | null;
  onClose: () => void;
  onSaved: () => void;
}

export const EditRecordModal: React.FC<EditRecordModalProps> = ({
  payload,
  onClose,
  onSaved,
}) => {
  const [sportTypes, setSportTypes] = useState<LookupType[]>([]);
  const [deepWorkTypes, setDeepWorkTypes] = useState<LookupType[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [bedDateTime, setBedDateTime] = useState(() => new Date());
  const [wakeDateTime, setWakeDateTime] = useState(() => new Date());
  const [hasWake, setHasWake] = useState(true);
  const [quality, setQuality] = useState(4);
  const [sleepNote, setSleepNote] = useState("");

  const [sportTypeId, setSportTypeId] = useState(0);
  const [sportDate, setSportDate] = useState("");
  const [sportMinutes, setSportMinutes] = useState(30);
  const [sportDistance, setSportDistance] = useState("");
  const [sportStravaLink, setSportStravaLink] = useState("");
  const [sportNote, setSportNote] = useState("");

  const [meditationDate, setMeditationDate] = useState("");
  const [meditationMinutes, setMeditationMinutes] = useState(15);

  const [deepWorkTypeId, setDeepWorkTypeId] = useState(0);
  const [deepWorkDate, setDeepWorkDate] = useState("");
  const [deepWorkMinutes, setDeepWorkMinutes] = useState(60);
  const [deepWorkDesc, setDeepWorkDesc] = useState("");

  useEffect(() => {
    managementApi.getSportTypes().then((r) => setSportTypes(r.data.filter((t) => t.isActive)));
    managementApi.getDeepWorkTypes().then((r) => setDeepWorkTypes(r.data.filter((t) => t.isActive)));
  }, []);

  useEffect(() => {
    if (!payload) return;
    setError(null);
    if (payload.kind === "sleep") {
      const r = payload.record;
      setBedDateTime(parseApiDateTime(r.bedTime));
      setHasWake(r.isComplete);
      if (r.wakeTime) setWakeDateTime(parseApiDateTime(r.wakeTime));
      else setWakeDateTime(new Date());
      setQuality(r.quality > 0 ? r.quality : 4);
      setSleepNote(r.note ?? "");
    }
    if (payload.kind === "sport") {
      const r = payload.record;
      setSportTypeId(r.sportActivityTypeId);
      setSportDate(typeof r.date === "string" ? r.date.slice(0, 10) : r.date);
      setSportMinutes(r.durationMinutes);
      setSportDistance(r.distanceKm != null ? String(r.distanceKm) : "");
      setSportStravaLink(r.stravaLink ?? "");
      setSportNote(r.note ?? "");
    }
    if (payload.kind === "meditation") {
      const r = payload.record;
      setMeditationDate(typeof r.date === "string" ? r.date.slice(0, 10) : r.date);
      setMeditationMinutes(r.durationMinutes);
    }
    if (payload.kind === "deepwork") {
      const r = payload.record;
      setDeepWorkTypeId(r.deepWorkTypeId);
      setDeepWorkDate(typeof r.date === "string" ? r.date.slice(0, 10) : r.date);
      setDeepWorkMinutes(r.durationMinutes);
      setDeepWorkDesc(r.description ?? "");
    }
  }, [payload]);

  if (!payload) return null;

  const titleMap: Record<RecordKind, string> = {
    sleep: "Uyku Kaydını Düzenle",
    sport: "Spor Kaydını Düzenle",
    meditation: "Meditasyon Kaydını Düzenle",
    deepwork: "Deep Work Kaydını Düzenle",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (payload.kind === "sleep") {
        if (hasWake && wakeDateTime <= bedDateTime) {
          setError("Kalkış zamanı yatıştan sonra olmalıdır.");
          setSaving(false);
          return;
        }
        await healthApi.updateSleep(payload.record.id, {
          bedTime: bedDateTime.toISOString(),
          wakeTime: hasWake ? wakeDateTime.toISOString() : null,
          quality: hasWake ? quality : null,
          note: sleepNote || undefined,
        });
      } else if (payload.kind === "sport") {
        if (sportMinutes <= 0) {
          setError("Geçerli bir süre girin (dakika).");
          setSaving(false);
          return;
        }
        const distanceKm = parseDistanceKm(sportDistance);
        if (sportDistance.trim() && distanceKm === null) {
          setError("Mesafe geçersiz. Örn: 13.5 (en fazla bir ondalık).");
          setSaving(false);
          return;
        }
        await healthApi.updateSport(payload.record.id, {
          sportActivityTypeId: sportTypeId,
          date: sportDate,
          durationMinutes: sportMinutes,
          distanceKm: distanceKm ?? null,
          stravaLink: normalizeStravaUrl(sportStravaLink) ?? null,
          note: sportNote || undefined,
        });
      } else if (payload.kind === "meditation") {
        await healthApi.updateMeditation(payload.record.id, {
          date: meditationDate,
          durationMinutes: meditationMinutes,
        });
      } else {
        await deepWorkApi.update(payload.record.id, {
          deepWorkTypeId: deepWorkTypeId,
          date: deepWorkDate,
          durationMinutes: deepWorkMinutes,
          description: deepWorkDesc || undefined,
        });
      }
      onSaved();
      onClose();
    } catch {
      setError("Kayıt güncellenemedi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Kapat"
      />
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl md:rounded-2xl bg-white dark:bg-bg-dark border border-slate-200 dark:border-white/10 shadow-xl">
        <div className="sticky top-0 flex items-center justify-between p-4 border-b border-slate-200 dark:border-white/10 bg-white dark:bg-bg-dark">
          <h2 className="font-semibold">{titleMap[payload.kind]}</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/5">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {payload.kind === "sleep" && (
            <>
              <p className="text-xs text-slate-500">
                Liste tarihi: <strong>{formatDate(payload.record.listDate)}</strong>
              </p>
              <TurkishDateTimeInput
                label="Yatış"
                value={bedDateTime}
                onChange={setBedDateTime}
              />
              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-white/10 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasWake}
                  onChange={(e) => setHasWake(e.target.checked)}
                  className="mt-1"
                />
                <span className="text-sm">Kalkış zamanı girildi</span>
              </label>
              {hasWake && (
                <>
                  <TurkishDateTimeInput
                    label="Kalkış"
                    value={wakeDateTime}
                    onChange={setWakeDateTime}
                  />
                  <label className="block text-sm font-medium">Kalite (1-5)</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => setQuality(q)}
                        className={cn(
                          "flex-1 py-2 rounded-xl font-bold border",
                          quality === q ? "bg-primary text-white border-primary" : "border-slate-200 dark:border-white/10"
                        )}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </>
              )}
              <textarea
                value={sleepNote}
                onChange={(e) => setSleepNote(e.target.value)}
                rows={2}
                placeholder="Not (opsiyonel)"
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent resize-none"
              />
            </>
          )}

          {payload.kind === "sport" && (
            <>
              <label className="block text-sm font-medium">Aktivite</label>
              <select
                value={sportTypeId}
                onChange={(e) => setSportTypeId(Number(e.target.value))}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent"
              >
                {sportTypes.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <TurkishDateInput label="Tarih" value={sportDate} onChange={setSportDate} />
              <DurationMinutesInput value={sportMinutes} onChange={setSportMinutes} />
              <div className="space-y-2">
                <label className="block text-sm font-medium">Mesafe (km, opsiyonel)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={sportDistance}
                  onChange={(e) => setSportDistance(e.target.value)}
                  placeholder="örn. 13.5"
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium">Strava linki (opsiyonel)</label>
                <input
                  type="url"
                  value={sportStravaLink}
                  onChange={(e) => setSportStravaLink(e.target.value)}
                  placeholder="https://www.strava.com/activities/..."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent"
                />
              </div>
              <input
                value={sportNote}
                onChange={(e) => setSportNote(e.target.value)}
                placeholder="Not (opsiyonel)"
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent"
              />
            </>
          )}

          {payload.kind === "meditation" && (
            <>
              <TurkishDateInput label="Tarih" value={meditationDate} onChange={setMeditationDate} />
              <DurationMinutesInput value={meditationMinutes} onChange={setMeditationMinutes} />
            </>
          )}

          {payload.kind === "deepwork" && (
            <>
              <label className="block text-sm font-medium">Tür</label>
              <select
                value={deepWorkTypeId}
                onChange={(e) => setDeepWorkTypeId(Number(e.target.value))}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent"
              >
                {deepWorkTypes.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <TurkishDateInput label="Tarih" value={deepWorkDate} onChange={setDeepWorkDate} />
              <DurationMinutesInput value={deepWorkMinutes} onChange={setDeepWorkMinutes} />
              <input
                value={deepWorkDesc}
                onChange={(e) => setDeepWorkDesc(e.target.value)}
                placeholder="Açıklama"
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent"
              />
            </>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-xl bg-primary text-white font-semibold disabled:opacity-60"
          >
            {saving ? "Kaydediliyor..." : "Güncelle"}
          </button>
        </form>
      </div>
    </div>
  );
};
