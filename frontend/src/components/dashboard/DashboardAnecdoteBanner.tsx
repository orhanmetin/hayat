import React, { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Quote } from "lucide-react";
import { anecdotesApi } from "../../services/modules";
import type { Anecdote } from "../../types/modules";
import { cn } from "../../lib/utils";

const COLLAPSED_KEY = "hayat-anecdote-collapsed";

const pickRandomIndex = (count: number) =>
  count > 0 ? Math.floor(Math.random() * count) : 0;

export const DashboardAnecdoteBanner: React.FC = () => {
  const [anecdotes, setAnecdotes] = useState<Anecdote[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSED_KEY) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    let cancelled = false;
    anecdotesApi
      .getAll()
      .then((res) => {
        if (cancelled) return;
        const list = res.data;
        setAnecdotes(list);
        setIndex(pickRandomIndex(list.length));
      })
      .catch(() => {
        if (!cancelled) setAnecdotes([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const current = useMemo(() => {
    if (anecdotes.length === 0) return null;
    const safe = ((index % anecdotes.length) + anecdotes.length) % anecdotes.length;
    return anecdotes[safe];
  }, [anecdotes, index]);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const goPrev = () => {
    if (anecdotes.length === 0) return;
    setIndex((i) => (i - 1 + anecdotes.length) % anecdotes.length);
  };

  const goNext = () => {
    if (anecdotes.length === 0) return;
    setIndex((i) => (i + 1) % anecdotes.length);
  };

  if (loading) return null;
  if (anecdotes.length === 0) return null;

  return (
    <section className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/5 via-transparent to-emerald-500/5 dark:border-white/10">
      <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-primary/10 dark:border-white/5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary dark:text-primary-light">
          <Quote size={14} />
          Anektod
        </div>
        <div className="flex items-center gap-1">
          {!collapsed && anecdotes.length > 1 && (
            <>
              <button
                type="button"
                onClick={goPrev}
                className="p-1.5 rounded-lg hover:bg-primary/10 text-slate-500"
                aria-label="Önceki anektod"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-[10px] text-slate-400 tabular-nums min-w-[3rem] text-center">
                {(index % anecdotes.length) + 1} / {anecdotes.length}
              </span>
              <button
                type="button"
                onClick={goNext}
                className="p-1.5 rounded-lg hover:bg-primary/10 text-slate-500"
                aria-label="Sonraki anektod"
              >
                <ChevronRight size={18} />
              </button>
            </>
          )}
          <button
            type="button"
            onClick={toggleCollapsed}
            className="p-1.5 rounded-lg hover:bg-primary/10 text-slate-500"
            aria-label={collapsed ? "Anektodu genişlet" : "Anektodu daralt"}
          >
            {collapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </button>
        </div>
      </div>

      {!collapsed && current && (
        <blockquote className="px-4 py-4 md:px-6 md:py-5">
          <p
            className={cn(
              "font-quote text-xl md:text-2xl leading-relaxed text-slate-700 dark:text-slate-200",
              "whitespace-pre-wrap"
            )}
          >
            “{current.text}”
          </p>
          {current.author && (
            <footer className="mt-3 text-sm text-slate-500 dark:text-slate-400 font-quote italic">
              — {current.author}
            </footer>
          )}
        </blockquote>
      )}
    </section>
  );
};
