import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { healthApi, deepWorkApi, managementApi } from "../../services/modules";
import { QuickDurationButtons } from "../ui/QuickDurationButtons";
import { TurkishDateInput } from "../ui/TurkishDateInput";
import { TurkishDateTimeInput } from "../ui/TurkishDateTimeInput";
import { formatDate } from "../../lib/format";
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
  const [quality, setQuality] = useState(4);
  const [sleepNote, setSleepNote] = useState("");

  const [sportTypeId, setSportTypeId] = useState(0);
  const [sportDate, setSportDate] = useState("");
  const [sportMinutes, setSportMinutes] = useState(30);
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
      setBedDateTime(new Date(r.bedTime));
      setWakeDateTime(new Date(r.wakeTime));
      setQuality(r.quality);
      setSleepNote(r.note ?? "");
    }
    if (payload.kind === "sport") {
      const r = payload.record;
      setSportTypeId(r.sportActivityTypeId);
      setSportDate(typeof r.date === "string" ? r.date.slice(0, 10) : r.date);
      setSportMinutes(r.durationMinutes);
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
        await healthApi.updateSleep(payload.record.id, {
          bedTime: bedDateTime.toISOString(),
          wakeTime: wakeDateTime.toISOString(),
          quality,
          note: sleepNote || undefined,
        });
      } else if (payload.kind === "sport") {
        await healthApi.updateSport(payload.record.id, {
          sportActivityTypeId: sportTypeId,
          date: sportDate,
          durationMinutes: sportMinutes,
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
                Kalkış tarihi: <strong>{formatDate(payload.record.wakeDate)}</strong>
              </p>
              <TurkishDateTimeInput
                label="Yatış"
                value={bedDateTime}
                onChange={setBedDateTime}
              />
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
              <input
                value={sleepNote}
                onChange={(e) => setSleepNote(e.target.value)}
                placeholder="Not (opsiyonel)"
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent"
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
              <QuickDurationButtons value={sportMinutes} onChange={setSportMinutes} />
              <input
                value={sportNote}
                onChange={(e) => setSportNote(e.target.value)}
                placeholder="Not"
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent"
              />
            </>
          )}

          {payload.kind === "meditation" && (
            <>
              <TurkishDateInput label="Tarih" value={meditationDate} onChange={setMeditationDate} />
              <QuickDurationButtons
                value={meditationMinutes}
                onChange={setMeditationMinutes}
                options={[5, 10, 15, 20, 30, 45]}
              />
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
              <QuickDurationButtons value={deepWorkMinutes} onChange={setDeepWorkMinutes} />
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
