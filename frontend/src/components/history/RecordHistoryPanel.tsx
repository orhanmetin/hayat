import React, { useCallback, useEffect, useState } from "react";
import { Pencil, Trash2, MoonStar, Activity, Flower2, Brain } from "lucide-react";
import { healthApi, deepWorkApi } from "../../services/modules";
import { EditRecordModal } from "./EditRecordModal";
import { formatDate, formatDateTime, formatMinutes, daysAgoIso } from "../../lib/format";
import type {
  DeepWorkSession,
  MeditationSession,
  RecordKind,
  SleepLog,
  SportActivity,
} from "../../types/modules";
import { cn } from "../../lib/utils";

type FilterTab = "all" | RecordKind;

interface HistoryItem {
  id: number;
  kind: RecordKind;
  sortKey: string;
  title: string;
  subtitle: string;
  meta: string;
  raw: SleepLog | SportActivity | MeditationSession | DeepWorkSession;
}

export const RecordHistoryPanel: React.FC = () => {
  const [filter, setFilter] = useState<FilterTab>("all");
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Parameters<typeof EditRecordModal>[0]["payload"]>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const from = daysAgoIso(90);
    try {
      const [sleep, sport, meditation, deepwork] = await Promise.all([
        healthApi.getSleep(from),
        healthApi.getSport(from),
        healthApi.getMeditation(from),
        deepWorkApi.getAll(from),
      ]);

      const merged: HistoryItem[] = [
        ...sleep.data.map((r) => ({
          id: r.id,
          kind: "sleep" as const,
          sortKey: r.wakeTime,
          title: "Uyku",
          subtitle: `${formatDateTime(r.bedTime)} → ${formatDateTime(r.wakeTime)}`,
          meta: `${formatMinutes(r.durationMinutes)} · Kalite ${r.quality}/5`,
          raw: r,
        })),
        ...sport.data.map((r) => ({
          id: r.id,
          kind: "sport" as const,
          sortKey: r.date,
          title: r.activityTypeName,
          subtitle: formatDate(r.date),
          meta: formatMinutes(r.durationMinutes),
          raw: r,
        })),
        ...meditation.data.map((r) => ({
          id: r.id,
          kind: "meditation" as const,
          sortKey: r.date,
          title: "Meditasyon",
          subtitle: formatDate(r.date),
          meta: formatMinutes(r.durationMinutes),
          raw: r,
        })),
        ...deepwork.data.map((r) => ({
          id: r.id,
          kind: "deepwork" as const,
          sortKey: r.date,
          title: r.typeName,
          subtitle: formatDate(r.date),
          meta: formatMinutes(r.durationMinutes),
          raw: r,
        })),
      ];

      merged.sort((a, b) => (a.sortKey < b.sortKey ? 1 : -1));
      setItems(merged);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = filter === "all" ? items : items.filter((i) => i.kind === filter);

  const handleDelete = async (item: HistoryItem) => {
    if (!confirm("Bu kaydı silmek istediğinize emin misiniz?")) return;
    if (item.kind === "sleep") await healthApi.deleteSleep(item.id);
    else if (item.kind === "sport") await healthApi.deleteSport(item.id);
    else if (item.kind === "meditation") await healthApi.deleteMeditation(item.id);
    else await deepWorkApi.delete(item.id);
    load();
  };

  const openEdit = (item: HistoryItem) => {
    if (item.kind === "sleep") setEditing({ kind: "sleep", record: item.raw as SleepLog });
    else if (item.kind === "sport") setEditing({ kind: "sport", record: item.raw as SportActivity });
    else if (item.kind === "meditation") setEditing({ kind: "meditation", record: item.raw as MeditationSession });
    else setEditing({ kind: "deepwork", record: item.raw as DeepWorkSession });
  };

  const iconMap = {
    sleep: MoonStar,
    sport: Activity,
    meditation: Flower2,
    deepwork: Brain,
  };

  const filterTabs: { id: FilterTab; label: string }[] = [
    { id: "all", label: "Tümü" },
    { id: "sleep", label: "Uyku" },
    { id: "sport", label: "Spor" },
    { id: "meditation", label: "Meditasyon" },
    { id: "deepwork", label: "Deep Work" },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">Son 90 gün · Tarihler gün.ay.yıl formatında</p>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {filterTabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setFilter(t.id)}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border",
              filter === t.id
                ? "bg-primary text-white border-primary"
                : "border-slate-200 dark:border-white/10"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-center text-slate-400 py-8">Yükleniyor...</p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-slate-400 py-12">Kayıt bulunamadı.</p>
      ) : (
        <ul className="space-y-3">
          {filtered.map((item) => {
            const Icon = iconMap[item.kind];
            return (
              <li
                key={`${item.kind}-${item.id}`}
                className="p-4 rounded-2xl bg-white dark:bg-black/20 border border-slate-200 dark:border-white/5"
              >
                <div className="flex gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0 h-fit">
                    <Icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{item.title}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{item.subtitle}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{item.meta}</p>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEdit(item)}
                      className="p-2 rounded-lg text-primary hover:bg-primary/10"
                      aria-label="Düzenle"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      className="p-2 rounded-lg text-red-400 hover:bg-red-500/10"
                      aria-label="Sil"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <EditRecordModal payload={editing} onClose={() => setEditing(null)} onSaved={load} />
    </div>
  );
};
