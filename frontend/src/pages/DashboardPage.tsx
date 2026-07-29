import React, { useEffect, useMemo, useState } from "react";
import { Activity, MoonStar, Brain, Flower2, Footprints, Smartphone } from "lucide-react";
import { dashboardApi } from "../services/modules";
import { formatDate } from "../lib/format";
import {
  DASHBOARD_PERIODS,
  BUCKET_LABELS,
  CARD_META,
  type DashboardCardKey,
} from "../config/dashboard";
import { DashboardAnecdoteBanner } from "../components/dashboard/DashboardAnecdoteBanner";
import { SegmentedControl } from "../components/dashboard/SegmentedControl";
import { SummaryCard } from "../components/dashboard/SummaryCard";
import { SimpleBarChart } from "../components/dashboard/SimpleBarChart";
import { StackedBarChart } from "../components/dashboard/StackedBarChart";
import type {
  DashboardBucket,
  DashboardOverview,
  DashboardPeriod,
} from "../types/modules";

const CARD_KEYS: DashboardCardKey[] = [
  "sport",
  "sleep",
  "deepwork",
  "meditation",
  "steps",
  "screen",
];

const CARD_ICONS = {
  sport: Activity,
  sleep: MoonStar,
  deepwork: Brain,
  meditation: Flower2,
  steps: Footprints,
  screen: Smartphone,
} as const;

const PERIOD_PRIMARY_LABEL: Record<DashboardPeriod, Record<"total" | "averagePerDay", string>> = {
  weekly: {
    total: "Bu hafta toplam",
    averagePerDay: "Günlük ortalama",
  },
  monthly: {
    total: "Bu ay toplam",
    averagePerDay: "Günlük ortalama",
  },
  yearly: {
    total: "Bu yıl toplam",
    averagePerDay: "Günlük ortalama",
  },
};

function cardPrimary(overview: DashboardOverview, key: DashboardCardKey): number {
  const { cards } = overview;
  switch (key) {
    case "sport":
      return cards.sport.totalMinutes;
    case "sleep":
      return cards.sleep.averageMinutesPerDay;
    case "deepwork":
      return cards.deepWork.averageMinutesPerDay;
    case "meditation":
      return cards.meditation.averageMinutesPerDay;
    case "steps":
      return cards.steps.averageStepsPerDay;
    case "screen":
      return cards.screenTime.averageMinutesPerDay;
  }
}

function cardTarget(overview: DashboardOverview, key: DashboardCardKey): number | null {
  const { cards } = overview;
  switch (key) {
    case "sport":
      return cards.sport.targetMinutes;
    case "sleep":
      return cards.sleep.targetAverageMinutesPerDay;
    case "deepwork":
      return cards.deepWork.targetAverageMinutesPerDay;
    case "meditation":
      return cards.meditation.targetAverageMinutesPerDay;
    case "steps":
      return cards.steps.targetAverageStepsPerDay;
    case "screen":
      return cards.screenTime.targetAverageMinutesPerDay;
  }
}

function cardBreakdown(overview: DashboardOverview, key: DashboardCardKey) {
  if (key === "sport") return overview.cards.sport.breakdown;
  if (key === "deepwork") return overview.cards.deepWork.breakdown;
  if (key === "screen") return overview.cards.screenTime.breakdown;
  return undefined;
}

export const DashboardPage: React.FC = () => {
  const [period, setPeriod] = useState<DashboardPeriod>("weekly");
  const [bucket, setBucket] = useState<DashboardBucket | null>(null);
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [activeCard, setActiveCard] = useState<DashboardCardKey | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await dashboardApi.getOverview(period, bucket ?? undefined);
        if (cancelled) return;
        setOverview(res.data);
        if (bucket && !res.data.availableBuckets.includes(bucket)) {
          setBucket(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [period, bucket]);

  const handlePeriodChange = (next: DashboardPeriod) => {
    setPeriod(next);
    setBucket(null);
    setActiveCard(null);
  };

  const bucketOptions = useMemo(() => {
    if (!overview || overview.availableBuckets.length <= 1) return null;
    return overview.availableBuckets.map((id) => ({ id, label: BUCKET_LABELS[id] }));
  }, [overview]);

  const showTargets = overview?.showTargets ?? false;
  const primaryLabels = PERIOD_PRIMARY_LABEL[period];

  const renderChart = (key: DashboardCardKey) => {
    if (!overview) return null;
    const { series, cards } = overview;
    if (key === "sport") return <StackedBarChart series={series.sport} />;
    if (key === "deepwork") return <StackedBarChart series={series.deepWork} />;
    if (key === "sleep") {
      return (
        <SimpleBarChart
          data={series.sleep}
          color={CARD_META.sleep.primaryColor}
          targetValue={showTargets ? cards.sleep.targetAverageMinutesPerDay : null}
          targetLabel="Günlük hedef"
        />
      );
    }
    if (key === "meditation") {
      return (
        <SimpleBarChart
          data={series.meditation}
          color={CARD_META.meditation.primaryColor}
          targetValue={showTargets ? cards.meditation.targetAverageMinutesPerDay : null}
          targetLabel="Günlük hedef"
        />
      );
    }
    if (key === "steps") {
      return (
        <SimpleBarChart
          data={series.steps}
          color={CARD_META.steps.primaryColor}
          targetValue={showTargets ? cards.steps.targetAverageStepsPerDay : null}
          targetLabel="Günlük hedef"
          unit="steps"
        />
      );
    }
    // screen: total + by-app
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold text-slate-500 mb-2">Günlük toplam</p>
          <SimpleBarChart
            data={series.screenTime}
            color={CARD_META.screen.primaryColor}
            targetValue={showTargets ? cards.screenTime.targetAverageMinutesPerDay : null}
            targetLabel="Günlük hedef"
          />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500 mb-2">Uygulama bazında</p>
          <StackedBarChart series={series.screenTimeByApp} />
        </div>
      </div>
    );
  };

  const renderTrendPanel = (key: DashboardCardKey) => (
    <div className="p-4 md:p-6 rounded-2xl bg-white dark:bg-black/20 border border-slate-200 dark:border-white/5 space-y-4 col-span-full sm:col-span-2 lg:col-span-3 lg:col-start-1">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2">
            {React.createElement(CARD_ICONS[key], {
              size: 16,
              style: { color: CARD_META[key].primaryColor },
            })}
            {CARD_META[key].label} Trendi
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Kırılım:{" "}
            <span className="font-medium text-slate-500">
              {BUCKET_LABELS[overview!.bucket]}
            </span>
          </p>
        </div>
        {bucketOptions && (
          <SegmentedControl
            size="sm"
            options={bucketOptions}
            value={overview!.bucket}
            onChange={(id) => setBucket(id)}
            ariaLabel="Kırılım seçimi"
          />
        )}
      </div>

      {renderChart(key)}
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in-up">
      <DashboardAnecdoteBanner />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <SegmentedControl
          options={DASHBOARD_PERIODS}
          value={period}
          onChange={handlePeriodChange}
          ariaLabel="Dönem seçimi"
        />
        {overview && (
          <p className="text-xs text-slate-500">
            {formatDate(overview.rangeStart)} – {formatDate(overview.rangeEnd)}
            <span className="ml-2 text-slate-400">
              ({overview.daysElapsed} gün)
            </span>
          </p>
        )}
      </div>

      {loading && !overview ? (
        <p className="text-center text-slate-400 py-8">Yükleniyor...</p>
      ) : overview ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
          {CARD_KEYS.map((key) => (
            <React.Fragment key={key}>
              <div className="min-h-0">
                <SummaryCard
                  meta={CARD_META[key]}
                  icon={CARD_ICONS[key]}
                  isActive={activeCard === key}
                  onClick={() =>
                    setActiveCard((prev) => (prev === key ? null : key))
                  }
                  primaryValue={cardPrimary(overview, key)}
                  primaryLabel={
                    CARD_META[key].metric === "total"
                      ? primaryLabels.total
                      : primaryLabels.averagePerDay
                  }
                  targetValue={cardTarget(overview, key)}
                  showTarget={showTargets}
                  breakdown={cardBreakdown(overview, key)}
                />
              </div>
              {activeCard === key && renderTrendPanel(key)}
            </React.Fragment>
          ))}
        </div>
      ) : null}
    </div>
  );
};
