import React, { useEffect, useState } from "react";
import { BarChart3, ChevronUp, Flame, Plus, Trash2, Trophy } from "lucide-react";
import { habitsApi } from "../services/modules";
import { HabitTrendPanel } from "../components/habits/HabitTrendPanel";
import type { Habit } from "../types/modules";
import { cn } from "../lib/utils";

export const HabitsPage: React.FC = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [expandedChartId, setExpandedChartId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await habitsApi.getAll();
      setHabits(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAddCheckIn = async (id: number) => {
    setAddingId(id);
    try {
      const res = await habitsApi.addCheckIn(id);
      setHabits((prev) => prev.map((h) => (h.id === id ? res.data : h)));
    } finally {
      setAddingId(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await habitsApi.create(newName.trim());
    setNewName("");
    load();
  };

  const handleDelete = async (id: number) => {
    await habitsApi.remove(id);
    if (expandedChartId === id) setExpandedChartId(null);
    load();
  };

  const toggleChart = (id: number) => {
    setExpandedChartId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Alışkanlıklar</h1>
        <p className="text-sm text-slate-500 mt-1">
          + ile her tekrarı kaydedin. Streak, günde en az 1 kez yapıldığında sayılır.
        </p>
      </div>

      <form onSubmit={handleCreate} className="flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Yeni alışkanlık (örn. Kitap Okuma)"
          className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/20 text-base"
        />
        <button
          type="submit"
          className="px-4 py-3 rounded-xl bg-primary text-white font-semibold flex items-center gap-2 hover-scale"
        >
          <Plus size={18} />
          Ekle
        </button>
      </form>

      {loading ? (
        <p className="text-center text-slate-400">Yükleniyor...</p>
      ) : habits.length === 0 ? (
        <p className="text-center text-slate-400 py-12">Henüz alışkanlık yok.</p>
      ) : (
        <div className="space-y-3">
          {habits.map((habit) => {
            const chartOpen = expandedChartId === habit.id;
            return (
              <div
                key={habit.id}
                className={cn(
                  "w-full p-5 rounded-2xl border transition-all",
                  habit.completedToday
                    ? "bg-primary/10 border-primary/30 dark:bg-primary-light/10"
                    : "bg-white dark:bg-black/20 border-slate-200 dark:border-white/5"
                )}
              >
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => handleAddCheckIn(habit.id)}
                    disabled={addingId === habit.id}
                    className={cn(
                      "w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 transition-colors",
                      habit.completedToday
                        ? "bg-primary text-white"
                        : "bg-slate-100 dark:bg-white/5 text-primary hover:bg-primary/10"
                    )}
                    aria-label={`${habit.name} için kayıt ekle`}
                  >
                    <Plus size={22} strokeWidth={2.5} />
                    {habit.todayCount > 0 && (
                      <span className="text-[10px] font-bold leading-none mt-0.5">
                        {habit.todayCount}
                      </span>
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-lg truncate">{habit.name}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Flame size={12} className="text-amber-500" />
                        {habit.currentStreak} gün
                      </span>
                      <span className="flex items-center gap-1">
                        <Trophy size={12} className="text-emerald-500" />
                        Rekor: {habit.recordStreak}
                      </span>
                      {habit.todayCount > 0 && (
                        <span>Bugün: {habit.todayCount} kez</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleChart(habit.id)}
                      className={cn(
                        "p-2 rounded-lg transition-colors",
                        chartOpen
                          ? "bg-primary/15 text-primary"
                          : "text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5"
                      )}
                      aria-label={chartOpen ? "Trendi gizle" : "Trendi göster"}
                    >
                      {chartOpen ? <ChevronUp size={18} /> : <BarChart3 size={18} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(habit.id)}
                      className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"
                      aria-label="Sil"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {chartOpen && <HabitTrendPanel habitId={habit.id} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
