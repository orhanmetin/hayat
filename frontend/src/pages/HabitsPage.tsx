import React, { useEffect, useState } from "react";
import { Check, Flame, Plus, Trash2, Trophy } from "lucide-react";
import { habitsApi } from "../services/modules";
import type { Habit } from "../types/modules";
import { cn } from "../lib/utils";

export const HabitsPage: React.FC = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);

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

  const handleToggle = async (id: number) => {
    const res = await habitsApi.toggle(id);
    setHabits((prev) => prev.map((h) => (h.id === id ? res.data : h)));
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
    load();
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Alışkanlıklar</h1>
        <p className="text-sm text-slate-500 mt-1">
          Günlük tek dokunuşla check-in yapın. Streak dinamik hesaplanır.
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
          {habits.map((habit) => (
            <button
              key={habit.id}
              type="button"
              onClick={() => handleToggle(habit.id)}
              className={cn(
                "w-full p-5 rounded-2xl border text-left transition-all hover-lift flex items-center gap-4",
                habit.completedToday
                  ? "bg-primary/10 border-primary/30 dark:bg-primary-light/10"
                  : "bg-white dark:bg-black/20 border-slate-200 dark:border-white/5"
              )}
            >
              <div
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                  habit.completedToday ? "bg-primary text-white" : "bg-slate-100 dark:bg-white/5"
                )}
              >
                {habit.completedToday ? <Check size={24} /> : <span className="text-xl">○</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-lg truncate">{habit.name}</p>
                <div className="flex gap-4 mt-1 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Flame size={12} className="text-amber-500" />
                    {habit.currentStreak} gün
                  </span>
                  <span className="flex items-center gap-1">
                    <Trophy size={12} className="text-emerald-500" />
                    Rekor: {habit.recordStreak}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(habit.id);
                }}
                className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"
              >
                <Trash2 size={18} />
              </button>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
