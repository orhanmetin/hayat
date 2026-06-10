import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { healthApi, deepWorkApi, managementApi } from "../../services/modules";
import { DurationMinutesInput } from "../ui/DurationMinutesInput";
import { parseDistanceKm, normalizeStravaUrl } from "../../lib/sport";
import { TurkishDateInput } from "../ui/TurkishDateInput";
import { TurkishDateTimeInput } from "../ui/TurkishDateTimeInput";
import {
  formatDate,
  parseApiDateTime,
  roundDateToMinuteStep,
  SLEEP_TIME_MINUTE_STEP,
} from "../../lib/format";
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
  const [meditationTypes, setMeditationTypes] = useState<LookupType[]>([]);
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

  const [meditationTypeId, setMeditationTypeId] = useState(0);
  const [meditationDate, setMeditationDate] = useState("");
  const [meditationMinutes, setMeditationMinutes] = useState(15);

  const [deepWorkTypeId, setDeepWorkTypeId] = useState(0);
  const [deepWorkDate, setDeepWorkDate] = useState("");
  const [deepWorkMinutes, setDeepWorkMinutes] = useState(60);
  const [deepWorkDesc, setDeepWorkDesc] = useState("");

  useEffect(() => {
    managementApi.getSportTypes().then((r) => setSportTypes(r.data.filter((t) => t.isActive)));
    managementApi.getMeditationTypes().then((r) => setMeditationTypes(r.data.filter((t) => t.isActive)));
    managementApi.getDeepWorkTypes().then((r) => setDeepWorkTypes(r.data.filter((t) => t.isActive)));
  }, []);

  useEffect(() => {
    if (!payload) return;
    setError(null);
    if (payload.kind === "sleep") {
      const r = payload.record;
      setBedDateTime(roundDateToMinuteStep(parseApiDateTime(r.bedTime), SLEEP_TIME_MINUTE_STEP));
      setHasWake(r.isComplete);
      if (r.wakeTime) {
        setWakeDateTime(roundDateToMinuteStep(parseApiDateTime(r.wakeTime), SLEEP_TIME_MINUTE_STEP));
      } else {
        setWakeDateTime(roundDateToMinuteStep(new Date(), SLEEP_TIME_MINUTE_STEP));
      }
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
      setMeditationTypeId(r.meditationTypeId);
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

  useEffect(() => {
    if (!payload) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
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
          meditationTypeId,
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

  const modal = (
    <div
      className="fixed inset-0 z-[100] flex items-end md:items-center justify-center md:p-4"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Kapat"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-record-title"
        className="relative z-10 flex w-full max-w-lg flex-col max-h-[min(92dvh,calc(100dvh-5rem))] md:max-h-[90dvh] rounded-t-3xl md:rounded-2xl bg-white dark:bg-bg-dark border border-slate-200 dark:border-white/10 shadow-xl"
      >
        <div className="shrink-0 flex items-center justify-between p-4 border-b border-slate-200 dark:border-white/10">
          <h2 id="edit-record-title" className="font-semibold pr-2">
            {titleMap[payload.kind]}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 shrink-0"
            aria-label="Kapat"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain touch-pan-y p-4 space-y-4 [-webkit-overflow-scrolling:touch]">
          {payload.kind === "sleep" && (
            <>
              <p className="text-xs text-slate-500">
                Liste tarihi: <strong>{formatDate(payload.record.listDate)}</strong>
              </p>
              <TurkishDateTimeInput
                label="Yatış"
                value={bedDateTime}
                onChange={setBedDateTime}
                minuteStep={SLEEP_TIME_MINUTE_STEP}
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
                    minuteStep={SLEEP_TIME_MINUTE_STEP}
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
              <label className="block text-sm font-medium">Tür</label>
              <select
                value={meditationTypeId}
                onChange={(e) => setMeditationTypeId(Number(e.target.value))}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent"
              >
                {meditationTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
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

          </div>

          <div className="shrink-0 border-t border-slate-200 dark:border-white/10 bg-white dark:bg-bg-dark p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:pb-4 space-y-3">
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3.5 rounded-xl bg-primary text-white font-semibold disabled:opacity-60"
            >
              {saving ? "Kaydediliyor..." : "Güncelle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};
