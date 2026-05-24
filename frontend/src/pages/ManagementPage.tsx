import React, { useEffect, useState } from "react";
import { Plus, Trash2, Settings2 } from "lucide-react";
import { managementApi, weeklyGoalsApi } from "../services/modules";
import { ProgressBar } from "../components/ui/ProgressBar";
import type { LookupType, WeeklyGoal } from "../types/modules";
import { cn } from "../lib/utils";

export const ManagementPage: React.FC = () => {
  const [sportTypes, setSportTypes] = useState<LookupType[]>([]);
  const [deepWorkTypes, setDeepWorkTypes] = useState<LookupType[]>([]);
  const [newSport, setNewSport] = useState("");
  const [newDeepWork, setNewDeepWork] = useState("");
  const [weeklyGoal, setWeeklyGoal] = useState<WeeklyGoal | null>(null);
  const [weekInfo, setWeekInfo] = useState({ year: 0, weekNumber: 0 });

  const load = async () => {
    const [sport, deep, week] = await Promise.all([
      managementApi.getSportTypes(),
      managementApi.getDeepWorkTypes(),
      weeklyGoalsApi.getCurrentWeek(),
    ]);
    setSportTypes(sport.data);
    setDeepWorkTypes(deep.data);
    setWeekInfo({ year: week.data.year, weekNumber: week.data.weekNumber });
    try {
      const goal = await weeklyGoalsApi.get(week.data.year, week.data.weekNumber);
      setWeeklyGoal(goal.data);
    } catch {
      setWeeklyGoal(null);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const addSport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSport.trim()) return;
    await managementApi.createSportType(newSport.trim());
    setNewSport("");
    load();
  };

  const addDeepWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeepWork.trim()) return;
    await managementApi.createDeepWorkType(newDeepWork.trim());
    setNewDeepWork("");
    load();
  };

  const saveGoals = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await weeklyGoalsApi.upsert({
      year: weekInfo.year,
      weekNumber: weekInfo.weekNumber,
      targetAvgSleepMinutesPerDay: Number(fd.get("sleep")) || undefined,
      targetTotalSportMinutes: Number(fd.get("sport")) || undefined,
      targetAvgDeepWorkMinutesPerDay: Number(fd.get("deepwork")) || undefined,
      targetAvgMeditationMinutesPerDay: Number(fd.get("meditation")) || undefined,
    });
    load();
  };

  const TypeList = ({
    title,
    items,
    onDelete,
    newValue,
    setNewValue,
    onAdd,
  }: {
    title: string;
    items: LookupType[];
    onDelete: (id: number) => void;
    newValue: string;
    setNewValue: (v: string) => void;
    onAdd: (e: React.FormEvent) => void;
  }) => (
    <div className="space-y-3">
      <h3 className="font-semibold flex items-center gap-2">
        <Settings2 size={18} className="text-primary" />
        {title}
      </h3>
      <form onSubmit={onAdd} className="flex gap-2">
        <input
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          placeholder="Yeni ekle..."
          className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent"
        />
        <button type="submit" className="px-3 py-2.5 rounded-xl bg-primary text-white">
          <Plus size={18} />
        </button>
      </form>
      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className={cn(
              "flex items-center justify-between p-3 rounded-xl border",
              item.isActive
                ? "border-slate-200 dark:border-white/10"
                : "opacity-50 border-dashed"
            )}
          >
            <span>{item.name}</span>
            <button
              type="button"
              onClick={() => onDelete(item.id)}
              className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg"
            >
              <Trash2 size={16} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="space-y-8 max-w-xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Yönetim</h1>
        <p className="text-sm text-slate-500 mt-1">
          Dinamik listeler ve haftalık hedefler (ISO hafta {weekInfo.weekNumber}, {weekInfo.year})
        </p>
      </div>

      <div className="p-5 rounded-2xl bg-white dark:bg-black/20 border border-slate-200 dark:border-white/5 space-y-4">
        <h3 className="font-semibold">Haftalık Hedefler</h3>
        <form onSubmit={saveGoals} className="space-y-3">
          <input
            name="sleep"
            type="number"
            placeholder="Günlük ort. uyku (dk)"
            defaultValue={weeklyGoal?.targetAvgSleepMinutesPerDay ?? ""}
            className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent"
          />
          <input
            name="sport"
            type="number"
            placeholder="Haftalık toplam spor (dk)"
            defaultValue={weeklyGoal?.targetTotalSportMinutes ?? ""}
            className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent"
          />
          <input
            name="deepwork"
            type="number"
            placeholder="Günlük ort. deep work (dk)"
            defaultValue={weeklyGoal?.targetAvgDeepWorkMinutesPerDay ?? ""}
            className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent"
          />
          <input
            name="meditation"
            type="number"
            placeholder="Günlük ort. meditasyon (dk)"
            defaultValue={weeklyGoal?.targetAvgMeditationMinutesPerDay ?? ""}
            className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent"
          />
          <button type="submit" className="w-full py-3 rounded-xl bg-primary text-white font-semibold">
            Hedefleri Kaydet
          </button>
        </form>

        {weeklyGoal && (
          <div className="pt-4 space-y-3 border-t border-slate-200 dark:border-white/5">
            <ProgressBar
              label="Uyku"
              current={weeklyGoal.progress.currentAvgSleepMinutes}
              target={weeklyGoal.targetAvgSleepMinutesPerDay}
              unit=" dk"
            />
            <ProgressBar
              label="Spor"
              current={weeklyGoal.progress.currentTotalSportMinutes}
              target={weeklyGoal.targetTotalSportMinutes}
              unit=" dk"
              colorClass="bg-amber-500"
            />
            <ProgressBar
              label="Deep Work"
              current={weeklyGoal.progress.currentAvgDeepWorkMinutes}
              target={weeklyGoal.targetAvgDeepWorkMinutesPerDay}
              unit=" dk"
              colorClass="bg-violet-500"
            />
            <ProgressBar
              label="Meditasyon"
              current={weeklyGoal.progress.currentAvgMeditationMinutes}
              target={weeklyGoal.targetAvgMeditationMinutesPerDay}
              unit=" dk"
              colorClass="bg-emerald-500"
            />
          </div>
        )}
      </div>

      <div className="p-5 rounded-2xl bg-white dark:bg-black/20 border border-slate-200 dark:border-white/5">
        <TypeList
          title="Spor Aktivite Tipleri"
          items={sportTypes}
          newValue={newSport}
          setNewValue={setNewSport}
          onAdd={addSport}
          onDelete={async (id) => {
            await managementApi.deleteSportType(id);
            load();
          }}
        />
      </div>

      <div className="p-5 rounded-2xl bg-white dark:bg-black/20 border border-slate-200 dark:border-white/5">
        <TypeList
          title="Deep Work Türleri"
          items={deepWorkTypes}
          newValue={newDeepWork}
          setNewValue={setNewDeepWork}
          onAdd={addDeepWork}
          onDelete={async (id) => {
            await managementApi.deleteDeepWorkType(id);
            load();
          }}
        />
      </div>
    </div>
  );
};
