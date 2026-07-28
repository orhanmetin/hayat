import React, { useCallback, useEffect, useState } from "react";
import {
  Route,
  CalendarRange,
  Medal,
  Mountain,
  Trophy,
  Repeat,
  Zap,
  Dumbbell,
  Moon,
  Eye,
  Plus,
  Flag,
  TrendingUp,
  TrendingDown,
  ChevronDown,
} from "lucide-react";
import { racePrepApi } from "../services/modules";
import type { RacePrepGoalKey, RacePrepOverview } from "../types/modules";
import { RacePrepGoalDetailPanel } from "../components/race/RacePrepGoalDetailPanel";
import { cn } from "../lib/utils";

const RACE_DATE_LABEL = "12 Aralık 2026";

const GOAL_ACCENT: Record<RacePrepGoalKey, string> = {
  totalVolume: "#10b981",
  weeklyVolume: "#0ea5e9",
  longRuns: "#f59e0b",
  longerRuns: "#f97316",
  marathonRuns: "#f43f5e",
  backToBack: "#8b5cf6",
  speed: "#eab308",
  strength: "#06b6d4",
  sleep: "#6366f1",
  visualization: "#d946ef",
};

function fmtKm(value: number): string {
  return value % 1 === 0 ? String(value) : value.toFixed(1);
}

function fmtHhMm(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function fmtPct(value: number): string {
  return `%${value % 1 === 0 ? value : value.toFixed(1)}`;
}

const Bar: React.FC<{ percent: number; colorClass: string }> = ({ percent, colorClass }) => (
  <div className="h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
    <div
      className={cn("h-full rounded-full transition-all duration-700", colorClass)}
      style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
    />
  </div>
);

interface GoalCardProps {
  code: string;
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  accentText: string;
  accentBg: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const GoalCard: React.FC<GoalCardProps> = ({
  code,
  title,
  subtitle,
  icon: Icon,
  accentText,
  accentBg,
  expanded,
  onToggle,
  children,
}) => (
  <button
    type="button"
    onClick={onToggle}
    aria-expanded={expanded}
    className={cn(
      "w-full text-left rounded-2xl bg-white dark:bg-black/20 border p-5 flex flex-col gap-4 shadow-sm transition-all",
      expanded
        ? "border-primary/40 ring-2 ring-primary/20"
        : "border-slate-200 dark:border-white/5 hover:border-primary/30"
    )}
  >
    <div className="flex items-start gap-3">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", accentBg, accentText)}>
        <Icon size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-[10px] font-bold px-1.5 py-0.5 rounded-md tracking-wide",
              accentBg,
              accentText
            )}
          >
            {code}
          </span>
          <h3 className="font-semibold text-sm truncate">{title}</h3>
          <ChevronDown
            size={16}
            className={cn(
              "ml-auto shrink-0 text-slate-400 transition-transform",
              expanded && "rotate-180"
            )}
          />
        </div>
        {subtitle && (
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
    <div className="flex-1 flex flex-col justify-end gap-3">{children}</div>
  </button>
);

const FractionRow: React.FC<{
  label?: string;
  current: string;
  target: string;
  percent: number;
  colorClass: string;
}> = ({ label, current, target, percent, colorClass }) => (
  <div className="space-y-1.5">
    <div className="flex items-end justify-between gap-2">
      <div className="min-w-0">
        {label && (
          <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight">{label}</p>
        )}
        <p className="text-lg font-bold leading-tight">
          {current}
          <span className="text-sm font-medium text-slate-400 dark:text-slate-500"> / {target}</span>
        </p>
      </div>
      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">
        {fmtPct(percent)}
      </span>
    </div>
    <Bar percent={percent} colorClass={colorClass} />
  </div>
);

export const RacePrepPage: React.FC = () => {
  const [data, setData] = useState<RacePrepOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [incrementing, setIncrementing] = useState(false);
  const [expandedGoal, setExpandedGoal] = useState<RacePrepGoalKey | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await racePrepApi.getOverview();
      setData(res.data);
      setError(null);
    } catch {
      setError("Veriler yüklenemedi. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleGoal = (key: RacePrepGoalKey) => {
    setExpandedGoal((prev) => (prev === key ? null : key));
  };

  const handleIncrementVisualization = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!data || incrementing) return;
    setIncrementing(true);
    try {
      const res = await racePrepApi.incrementVisualization();
      setData({ ...data, visualization: res.data });
    } catch {
      setError("Görselleştirme sayacı güncellenemedi.");
    } finally {
      setIncrementing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">Yükleniyor…</div>
    );
  }

  if (error && !data) {
    return <div className="text-center py-24 text-red-500 text-sm">{error}</div>;
  }

  if (!data) return null;

  const weekBadge = data.started ? `${data.currentWeek}/${data.totalWeeks}` : `0/${data.totalWeeks}`;
  const isRaceWeek = data.started && data.currentWeek === data.totalWeeks;

  const renderExpandable = (
    key: RacePrepGoalKey,
    card: React.ReactNode
  ) => {
    const expanded = expandedGoal === key;
    return (
      <div
        key={key}
        className={cn(
          "flex flex-col gap-2 transition-all",
          expanded && "sm:col-span-2 xl:col-span-3"
        )}
      >
        {card}
        {expanded && (
          <div className="rounded-2xl bg-white dark:bg-black/20 border border-slate-200 dark:border-white/5 p-4 md:p-5 animate-fade-in-up">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-3">
              {["longRuns", "longerRuns", "marathonRuns", "backToBack", "visualization"].includes(
                key
              )
                ? "İlgili kayıtlar"
                : "Trend"}
            </p>
            <RacePrepGoalDetailPanel goalKey={key} accentColor={GOAL_ACCENT[key]} />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Hero */}
      <div className="rounded-3xl bg-gradient-to-br from-primary via-primary-dark to-slate-900 text-white p-6 md:p-8 relative overflow-hidden">
        <div className="absolute -right-8 -top-8 opacity-10">
          <Trophy size={180} />
        </div>
        <div className="relative space-y-4">
          <div className="flex items-center gap-2 text-emerald-200 text-xs font-semibold uppercase tracking-widest">
            <Flag size={14} />
            Barcelona 24 Saat Koşusu — {RACE_DATE_LABEL}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Road to Barcelona 24h</h1>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <div>
              <span className="text-emerald-200/80">Hafta </span>
              <span className="text-xl font-bold">{weekBadge}</span>
              <span className="ml-2 text-emerald-200/80">({fmtPct(data.weekPercent)})</span>
            </div>
            <div>
              <span className="text-emerald-200/80">Yarışa </span>
              <span className="text-xl font-bold">{data.daysToRace}</span>
              <span className="text-emerald-200/80"> gün</span>
            </div>
            {isRaceWeek && (
              <span className="px-2 py-1 rounded-lg bg-amber-400/20 text-amber-200 text-xs font-bold">
                YARIŞ HAFTASI
              </span>
            )}
            {!data.started && (
              <span className="px-2 py-1 rounded-lg bg-white/10 text-emerald-100 text-xs font-semibold">
                Hazırlık 20 Temmuz'da başlıyor
              </span>
            )}
          </div>

          <div className="h-2.5 rounded-full bg-white/15 overflow-hidden max-w-xl">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-300 to-amber-300 transition-all duration-700"
              style={{ width: `${Math.min(100, data.weekPercent)}%` }}
            />
          </div>
          <p className="text-xs text-emerald-100/70">
            Bir hedefe dokunarak trend veya ilgili aktiviteleri açabilirsiniz.
          </p>
        </div>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {renderExpandable(
          "totalVolume",
          <GoalCard
            code="G1"
            title="Toplam Hacim"
            subtitle="Hazırlık boyunca en az 1500 km koşu"
            icon={Route}
            accentText="text-emerald-600 dark:text-emerald-400"
            accentBg="bg-emerald-500/10"
            expanded={expandedGoal === "totalVolume"}
            onToggle={() => toggleGoal("totalVolume")}
          >
            <FractionRow
              current={fmtKm(data.totalVolume.totalKm)}
              target={`${data.totalVolume.targetKm} km`}
              percent={data.totalVolume.percent}
              colorClass="bg-emerald-500"
            />
            <div
              className={cn(
                "flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium",
                data.totalVolume.onTrack
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-red-500/10 text-red-500"
              )}
            >
              {data.totalVolume.onTrack ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span>
                Projeksiyon: <strong>{fmtKm(data.totalVolume.projectedKm)} km</strong>{" "}
                {data.totalVolume.onTrack ? "— hedefe ulaşıyor" : "— hedef altı"}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Günlük ortalama {data.totalVolume.avgDailyKm.toFixed(2)} km × 147 gün
            </p>
          </GoalCard>
        )}

        {renderExpandable(
          "weeklyVolume",
          <GoalCard
            code="G2"
            title="Haftalık Hacim"
            subtitle="Haftada en az 70 km koşu"
            icon={CalendarRange}
            accentText="text-sky-600 dark:text-sky-400"
            accentBg="bg-sky-500/10"
            expanded={expandedGoal === "weeklyVolume"}
            onToggle={() => toggleGoal("weeklyVolume")}
          >
            <FractionRow
              label="Bu hafta"
              current={fmtKm(data.weeklyVolume.currentWeekKm)}
              target={`${data.weeklyVolume.weekTargetKm} km`}
              percent={data.weeklyVolume.currentWeekPercent}
              colorClass="bg-sky-500"
            />
            <FractionRow
              label={`Başarılan haftalar (hedef ${data.weeklyVolume.targetWeeks}/${data.weeklyVolume.coreWeeks})`}
              current={String(data.weeklyVolume.achievedWeeks)}
              target={String(data.weeklyVolume.coreWeeks)}
              percent={data.weeklyVolume.achievedPercent}
              colorClass="bg-sky-400"
            />
          </GoalCard>
        )}

        {renderExpandable(
          "longRuns",
          <GoalCard
            code="G3"
            title="Uzun Koşu"
            subtitle="21 km ve üzeri, en az 20 adet"
            icon={Medal}
            accentText="text-amber-600 dark:text-amber-400"
            accentBg="bg-amber-500/10"
            expanded={expandedGoal === "longRuns"}
            onToggle={() => toggleGoal("longRuns")}
          >
            <FractionRow
              current={String(data.longRuns.count)}
              target={String(data.longRuns.target)}
              percent={data.longRuns.percent}
              colorClass="bg-amber-500"
            />
          </GoalCard>
        )}

        {renderExpandable(
          "longerRuns",
          <GoalCard
            code="G4"
            title="Çok Uzun Koşu"
            subtitle="30 km ve üzeri, en az 8 adet"
            icon={Mountain}
            accentText="text-orange-600 dark:text-orange-400"
            accentBg="bg-orange-500/10"
            expanded={expandedGoal === "longerRuns"}
            onToggle={() => toggleGoal("longerRuns")}
          >
            <FractionRow
              current={String(data.longerRuns.count)}
              target={String(data.longerRuns.target)}
              percent={data.longerRuns.percent}
              colorClass="bg-orange-500"
            />
          </GoalCard>
        )}

        {renderExpandable(
          "marathonRuns",
          <GoalCard
            code="G5"
            title="Maraton Mesafesi"
            subtitle="42 km ve üzeri, en az 2 adet"
            icon={Trophy}
            accentText="text-rose-600 dark:text-rose-400"
            accentBg="bg-rose-500/10"
            expanded={expandedGoal === "marathonRuns"}
            onToggle={() => toggleGoal("marathonRuns")}
          >
            <FractionRow
              current={String(data.marathonRuns.count)}
              target={String(data.marathonRuns.target)}
              percent={data.marathonRuns.percent}
              colorClass="bg-rose-500"
            />
          </GoalCard>
        )}

        {renderExpandable(
          "backToBack",
          <GoalCard
            code="G6"
            title="Back to Back"
            subtitle="Ardışık günlerde 30+ km, en az 1 kez"
            icon={Repeat}
            accentText="text-violet-600 dark:text-violet-400"
            accentBg="bg-violet-500/10"
            expanded={expandedGoal === "backToBack"}
            onToggle={() => toggleGoal("backToBack")}
          >
            <div className="flex items-center justify-between gap-3">
              <span
                className={cn(
                  "px-3 py-1.5 rounded-xl text-sm font-bold",
                  data.backToBack.achieved
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-slate-100 dark:bg-white/10 text-slate-400"
                )}
              >
                {data.backToBack.achieved ? "Başarıldı ✓" : "Henüz yok"}
              </span>
              <span className="text-xs text-slate-400">
                {data.backToBack.occurrences} kez gerçekleşti
              </span>
            </div>
            <Bar
              percent={data.backToBack.achieved ? 100 : 0}
              colorClass="bg-violet-500"
            />
          </GoalCard>
        )}

        {renderExpandable(
          "speed",
          <GoalCard
            code="G7"
            title="Hız Çalışması"
            subtitle="Haftada 1 Interval / Tempo"
            icon={Zap}
            accentText="text-yellow-600 dark:text-yellow-400"
            accentBg="bg-yellow-500/10"
            expanded={expandedGoal === "speed"}
            onToggle={() => toggleGoal("speed")}
          >
            <p className="text-[11px] text-slate-400">
              Bu hafta: <strong>{data.speed.currentWeekCount}</strong> hız çalışması
            </p>
            <FractionRow
              label={`Başarılan haftalar (hedef ${data.speed.targetWeeks}/${data.speed.coreWeeks})`}
              current={String(data.speed.achievedWeeks)}
              target={String(data.speed.coreWeeks)}
              percent={data.speed.percent}
              colorClass="bg-yellow-500"
            />
          </GoalCard>
        )}

        {renderExpandable(
          "strength",
          <GoalCard
            code="G8"
            title="Güç Çalışması"
            subtitle="Haftada en az 2 workout"
            icon={Dumbbell}
            accentText="text-cyan-600 dark:text-cyan-400"
            accentBg="bg-cyan-500/10"
            expanded={expandedGoal === "strength"}
            onToggle={() => toggleGoal("strength")}
          >
            <FractionRow
              label="Bu hafta"
              current={String(data.strength.currentWeekCount)}
              target={String(data.strength.weekTarget)}
              percent={data.strength.currentWeekPercent}
              colorClass="bg-cyan-500"
            />
            <FractionRow
              label={`Başarılan haftalar (hedef ${data.strength.targetWeeks}/${data.strength.totalWeeks})`}
              current={String(data.strength.achievedWeeks)}
              target={String(data.strength.totalWeeks)}
              percent={data.strength.percent}
              colorClass="bg-cyan-400"
            />
          </GoalCard>
        )}

        {renderExpandable(
          "sleep",
          <GoalCard
            code="G9"
            title="Uyku"
            subtitle="Günlük ortalama 7:30 (Olaylar'daki uyku kayıtları, plan başlangıcından)"
            icon={Moon}
            accentText="text-indigo-600 dark:text-indigo-400"
            accentBg="bg-indigo-500/10"
            expanded={expandedGoal === "sleep"}
            onToggle={() => toggleGoal("sleep")}
          >
            <FractionRow
              current={fmtHhMm(data.sleep.avgMinutes)}
              target={fmtHhMm(data.sleep.targetMinutes)}
              percent={data.sleep.percent}
              colorClass="bg-indigo-500"
            />
            <p className="text-[11px] text-slate-400">
              {data.sleep.daysWithData > 0
                ? `${data.sleep.daysWithData} günün ortalaması`
                : "Henüz uyku kaydı yok"}
            </p>
          </GoalCard>
        )}

        {renderExpandable(
          "visualization",
          <GoalCard
            code="G10"
            title="Görselleştirme"
            subtitle="Yarışı zihinde koşmak, en az 20 kez"
            icon={Eye}
            accentText="text-fuchsia-600 dark:text-fuchsia-400"
            accentBg="bg-fuchsia-500/10"
            expanded={expandedGoal === "visualization"}
            onToggle={() => toggleGoal("visualization")}
          >
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <FractionRow
                  current={String(data.visualization.count)}
                  target={String(data.visualization.target)}
                  percent={data.visualization.percent}
                  colorClass="bg-fuchsia-500"
                />
              </div>
              <span
                role="button"
                tabIndex={0}
                onClick={handleIncrementVisualization}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    void handleIncrementVisualization(e as unknown as React.MouseEvent);
                  }
                }}
                aria-disabled={incrementing}
                className={cn(
                  "w-11 h-11 rounded-2xl bg-fuchsia-500 hover:bg-fuchsia-600 text-white flex items-center justify-center shrink-0 transition-colors shadow-sm",
                  incrementing && "opacity-50 pointer-events-none"
                )}
                aria-label="Görselleştirme çalışması ekle"
              >
                <Plus size={22} />
              </span>
            </div>
          </GoalCard>
        )}
      </div>
    </div>
  );
};
