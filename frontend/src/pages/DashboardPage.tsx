import React, { useEffect, useMemo, useState } from "react";
import { Activity, MoonStar, Brain, Flower2 } from "lucide-react";
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

const CARD_ICONS = {
  sport: Activity,
  sleep: MoonStar,
  deepwork: Brain,
  meditation: Flower2,
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

export const DashboardPage: React.FC = () => {
  const [period, setPeriod] = useState<DashboardPeriod>("weekly");
  const [bucket, setBucket] = useState<DashboardBucket | null>(null);
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [activeCard, setActiveCard] = useState<DashboardCardKey>("sport");
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
  };

  const bucketOptions = useMemo(() => {
    if (!overview || overview.availableBuckets.length <= 1) return null;
    return overview.availableBuckets.map((id) => ({ id, label: BUCKET_LABELS[id] }));
  }, [overview]);

  const cards = overview?.cards;
  const series = overview?.series;
  const showTargets = overview?.showTargets ?? false;
  const primaryLabels = PERIOD_PRIMARY_LABEL[period];

  const renderActiveChart = () => {
    if (!overview || !series) return null;
    if (activeCard === "sport") return <StackedBarChart series={series.sport} />;
    if (activeCard === "deepwork") return <StackedBarChart series={series.deepWork} />;
    if (activeCard === "sleep") {
      return (
        <SimpleBarChart
          data={series.sleep}
          color={CARD_META.sleep.primaryColor}
          targetMinutes={
            showTargets ? cards?.sleep.targetAverageMinutesPerDay : null
          }
          targetLabel="Günlük hedef"
        />
      );
    }
    return (
      <SimpleBarChart
        data={series.meditation}
        color={CARD_META.meditation.primaryColor}
        targetMinutes={
          showTargets ? cards?.meditation.targetAverageMinutesPerDay : null
        }
        targetLabel="Günlük hedef"
      />
    );
  };

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
      ) : overview && cards ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
            <SummaryCard
              meta={CARD_META.sport}
              icon={CARD_ICONS.sport}
              isActive={activeCard === "sport"}
              onClick={() => setActiveCard("sport")}
              primaryMinutes={cards.sport.totalMinutes}
              primaryLabel={primaryLabels.total}
              targetMinutes={cards.sport.targetMinutes}
              showTarget={showTargets}
              breakdown={cards.sport.breakdown}
            />
            <SummaryCard
              meta={CARD_META.sleep}
              icon={CARD_ICONS.sleep}
              isActive={activeCard === "sleep"}
              onClick={() => setActiveCard("sleep")}
              primaryMinutes={cards.sleep.averageMinutesPerDay}
              primaryLabel={primaryLabels.averagePerDay}
              targetMinutes={cards.sleep.targetAverageMinutesPerDay}
              showTarget={showTargets}
            />
            <SummaryCard
              meta={CARD_META.deepwork}
              icon={CARD_ICONS.deepwork}
              isActive={activeCard === "deepwork"}
              onClick={() => setActiveCard("deepwork")}
              primaryMinutes={cards.deepWork.averageMinutesPerDay}
              primaryLabel={primaryLabels.averagePerDay}
              targetMinutes={cards.deepWork.targetAverageMinutesPerDay}
              showTarget={showTargets}
              breakdown={cards.deepWork.breakdown}
            />
            <SummaryCard
              meta={CARD_META.meditation}
              icon={CARD_ICONS.meditation}
              isActive={activeCard === "meditation"}
              onClick={() => setActiveCard("meditation")}
              primaryMinutes={cards.meditation.averageMinutesPerDay}
              primaryLabel={primaryLabels.averagePerDay}
              targetMinutes={cards.meditation.targetAverageMinutesPerDay}
              showTarget={showTargets}
            />
          </div>

          <div className="p-4 md:p-6 rounded-2xl bg-white dark:bg-black/20 border border-slate-200 dark:border-white/5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  {React.createElement(CARD_ICONS[activeCard], {
                    size: 16,
                    style: { color: CARD_META[activeCard].primaryColor },
                  })}
                  {CARD_META[activeCard].label} Trendi
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Kırılım:{" "}
                  <span className="font-medium text-slate-500">
                    {BUCKET_LABELS[overview.bucket]}
                  </span>
                </p>
              </div>
              {bucketOptions && (
                <SegmentedControl
                  size="sm"
                  options={bucketOptions}
                  value={overview.bucket}
                  onChange={(id) => setBucket(id)}
                  ariaLabel="Kırılım seçimi"
                />
              )}
            </div>

            {renderActiveChart()}
          </div>
        </>
      ) : null}
    </div>
  );
};
