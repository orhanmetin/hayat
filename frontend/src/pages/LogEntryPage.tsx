import React, { useEffect, useState } from "react";
import {
  MoonStar,
  Activity,
  Flower2,
  Brain,
  CheckCircle2,
} from "lucide-react";
import { healthApi, deepWorkApi, managementApi } from "../services/modules";
import { DurationMinutesInput } from "../components/ui/DurationMinutesInput";
import { parseDistanceKm, normalizeStravaUrl } from "../lib/sport";
import { TurkishDateInput } from "../components/ui/TurkishDateInput";
import { RecordHistoryPanel } from "../components/history/RecordHistoryPanel";
import { SleepEntryForm } from "../components/sleep/SleepEntryForm";
import { todayIso } from "../lib/format";
import type { LookupType } from "../types/modules";
import { cn } from "../lib/utils";

type PageView = "add" | "history";

type Tab = "sleep" | "sport" | "meditation" | "deepwork";

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "sleep", label: "Uyku", icon: MoonStar },
  { id: "sport", label: "Spor", icon: Activity },
  { id: "meditation", label: "Meditasyon", icon: Flower2 },
  { id: "deepwork", label: "Deep Work", icon: Brain },
];

export const LogEntryPage: React.FC = () => {
  const [pageView, setPageView] = useState<PageView>("add");
  const [tab, setTab] = useState<Tab>("sleep");
  const [sportTypes, setSportTypes] = useState<LookupType[]>([]);
  const [deepWorkTypes, setDeepWorkTypes] = useState<LookupType[]>([]);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [sportTypeId, setSportTypeId] = useState<number>(0);
  const [sportDate, setSportDate] = useState(todayIso());
  const [sportMinutes, setSportMinutes] = useState(30);
  const [sportDistance, setSportDistance] = useState("");
  const [sportStravaLink, setSportStravaLink] = useState("");
  const [sportNote, setSportNote] = useState("");

  const [meditationDate, setMeditationDate] = useState(todayIso());
  const [meditationMinutes, setMeditationMinutes] = useState(15);

  const [deepWorkTypeId, setDeepWorkTypeId] = useState<number>(0);
  const [deepWorkDate, setDeepWorkDate] = useState(todayIso());
  const [deepWorkMinutes, setDeepWorkMinutes] = useState(60);
  const [deepWorkDesc, setDeepWorkDesc] = useState("");

  useEffect(() => {
    managementApi.getSportTypes().then((r) => {
      setSportTypes(r.data.filter((t) => t.isActive));
      if (r.data[0]) setSportTypeId(r.data[0].id);
    });
    managementApi.getDeepWorkTypes().then((r) => {
      setDeepWorkTypes(r.data.filter((t) => t.isActive));
      if (r.data[0]) setDeepWorkTypeId(r.data[0].id);
    });
  }, []);

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setError(null);
    setTimeout(() => setSuccess(null), 3000);
  };

  const submitSport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sportMinutes <= 0) {
      setError("Geçerli bir süre girin (dakika).");
      return;
    }
    const distanceKm = parseDistanceKm(sportDistance);
    if (sportDistance.trim() && distanceKm === null) {
      setError("Mesafe geçersiz. Örn: 13.5 (en fazla bir ondalık).");
      return;
    }
    try {
      await healthApi.createSport({
        sportActivityTypeId: sportTypeId,
        date: sportDate,
        durationMinutes: sportMinutes,
        distanceKm: distanceKm ?? undefined,
        stravaLink: normalizeStravaUrl(sportStravaLink) ?? undefined,
        note: sportNote.trim() || undefined,
      });
      setSportDistance("");
      setSportStravaLink("");
      setSportNote("");
      showSuccess("Spor kaydı eklendi.");
    } catch {
      setError("Spor kaydı eklenemedi.");
    }
  };

  const submitMeditation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (meditationMinutes <= 0) {
      setError("Geçerli bir süre girin (dakika).");
      return;
    }
    try {
      await healthApi.createMeditation({ date: meditationDate, durationMinutes: meditationMinutes });
      showSuccess("Meditasyon kaydı eklendi.");
    } catch {
      setError("Meditasyon kaydı eklenemedi.");
    }
  };

  const submitDeepWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deepWorkMinutes <= 0) {
      setError("Geçerli bir süre girin (dakika).");
      return;
    }
    try {
      await deepWorkApi.create({
        deepWorkTypeId: deepWorkTypeId,
        date: deepWorkDate,
        durationMinutes: deepWorkMinutes,
        description: deepWorkDesc || undefined,
      });
      showSuccess("Deep Work kaydı eklendi.");
    } catch {
      setError("Deep Work kaydı eklenemedi.");
    }
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Olaylar</h1>
        <p className="text-sm text-slate-500 mt-1">Yeni olay ekle veya geçmişi düzenle</p>
      </div>

      <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-white/5">
        <button
          type="button"
          onClick={() => setPageView("add")}
          className={cn(
            "py-2.5 rounded-lg text-sm font-semibold transition-all",
            pageView === "add" ? "bg-white dark:bg-black/40 shadow-sm text-primary" : "text-slate-500"
          )}
        >
          Yeni Kayıt
        </button>
        <button
          type="button"
          onClick={() => setPageView("history")}
          className={cn(
            "py-2.5 rounded-lg text-sm font-semibold transition-all",
            pageView === "history" ? "bg-white dark:bg-black/40 shadow-sm text-primary" : "text-slate-500"
          )}
        >
          Geçmiş
        </button>
      </div>

      {pageView === "history" ? (
        <RecordHistoryPanel />
      ) : (
        <>
      {success && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 text-emerald-600 text-sm">
          <CheckCircle2 size={18} />
          {success}
        </div>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="grid grid-cols-2 gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "py-3 px-2 rounded-xl text-sm font-medium flex flex-col items-center gap-1 border transition-all",
              tab === t.id
                ? "bg-primary text-white border-primary"
                : "border-slate-200 dark:border-white/10"
            )}
          >
            <t.icon size={20} />
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-5 rounded-2xl bg-white dark:bg-black/20 border border-slate-200 dark:border-white/5">
        {tab === "sleep" && (
          <SleepEntryForm onSuccess={showSuccess} onError={setError} />
        )}

        {tab === "sport" && (
          <form onSubmit={submitSport} className="space-y-4">
            <label className="block text-sm font-medium">Aktivite Tipi</label>
            <select
              value={sportTypeId}
              onChange={(e) => setSportTypeId(Number(e.target.value))}
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent text-base"
            >
              {sportTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
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
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent text-base"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium">Strava linki (opsiyonel)</label>
              <input
                type="url"
                value={sportStravaLink}
                onChange={(e) => setSportStravaLink(e.target.value)}
                placeholder="https://www.strava.com/activities/..."
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent text-base"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium">Not (opsiyonel)</label>
              <input
                value={sportNote}
                onChange={(e) => setSportNote(e.target.value)}
                placeholder="Not..."
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent text-base"
              />
            </div>
            <button type="submit" className="w-full py-3 rounded-xl bg-primary text-white font-semibold hover-scale">
              Kaydet
            </button>
          </form>
        )}

        {tab === "meditation" && (
          <form onSubmit={submitMeditation} className="space-y-4">
            <TurkishDateInput label="Tarih" value={meditationDate} onChange={setMeditationDate} />
            <DurationMinutesInput value={meditationMinutes} onChange={setMeditationMinutes} />
            <button type="submit" className="w-full py-3 rounded-xl bg-primary text-white font-semibold hover-scale">
              Kaydet
            </button>
          </form>
        )}

        {tab === "deepwork" && (
          <form onSubmit={submitDeepWork} className="space-y-4">
            <label className="block text-sm font-medium">Tür</label>
            <select
              value={deepWorkTypeId}
              onChange={(e) => setDeepWorkTypeId(Number(e.target.value))}
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent text-base"
            >
              {deepWorkTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <TurkishDateInput label="Tarih" value={deepWorkDate} onChange={setDeepWorkDate} />
            <DurationMinutesInput value={deepWorkMinutes} onChange={setDeepWorkMinutes} />
            <label className="block text-sm font-medium">Açıklama (opsiyonel)</label>
            <input
              value={deepWorkDesc}
              onChange={(e) => setDeepWorkDesc(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent"
              placeholder="Not..."
            />
            <button type="submit" className="w-full py-3 rounded-xl bg-violet-600 text-white font-semibold hover-scale">
              Kaydet
            </button>
          </form>
        )}
      </div>
        </>
      )}
    </div>
  );
};
