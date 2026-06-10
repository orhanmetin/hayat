import { useCallback, useEffect, useMemo, useState } from "react";
import { activeTimerApi } from "../services/modules";
import {
  elapsedMinutes,
  readStoredActiveTimer,
  writeStoredActiveTimer,
} from "../lib/activeTimerStorage";

function useMinuteRefresh() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const bump = () => setTick((t) => t + 1);
    bump();
    window.addEventListener("focus", bump);
    document.addEventListener("visibilitychange", bump);
    const id = window.setInterval(bump, 60_000);
    return () => {
      window.removeEventListener("focus", bump);
      document.removeEventListener("visibilitychange", bump);
      window.clearInterval(id);
    };
  }, []);
  return tick;
}

export function useActiveTimer() {
  const [startTime, setStartTime] = useState<string | null>(null);
  const [finishAt, setFinishAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const minuteTick = useMinuteRefresh();

  const syncFromServer = useCallback(async () => {
    try {
      const res = await activeTimerApi.get();
      const server = res.data;
      const stored = readStoredActiveTimer();

      if (server?.startTime) {
        const finish =
          stored?.startTime === server.startTime ? stored.finishAt ?? null : null;
        setStartTime(server.startTime);
        setFinishAt(finish);
        writeStoredActiveTimer({ startTime: server.startTime, finishAt: finish });
      } else {
        setStartTime(null);
        setFinishAt(null);
        writeStoredActiveTimer(null);
      }
    } catch {
      const stored = readStoredActiveTimer();
      if (stored?.startTime) {
        setStartTime(stored.startTime);
        setFinishAt(stored.finishAt ?? null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    syncFromServer();
  }, [syncFromServer]);

  const start = useCallback(async () => {
    setActionLoading(true);
    try {
      const res = await activeTimerApi.start();
      setStartTime(res.data.startTime);
      setFinishAt(null);
      writeStoredActiveTimer({ startTime: res.data.startTime, finishAt: null });
    } finally {
      setActionLoading(false);
    }
  }, []);

  const finish = useCallback(() => {
    if (!startTime) return;
    const end = new Date().toISOString();
    setFinishAt(end);
    writeStoredActiveTimer({ startTime, finishAt: end });
  }, [startTime]);

  const resume = useCallback(() => {
    if (!startTime) return;
    setFinishAt(null);
    writeStoredActiveTimer({ startTime, finishAt: null });
  }, [startTime]);

  const clear = useCallback(async () => {
    setActionLoading(true);
    try {
      await activeTimerApi.clear();
    } catch {
      // local state still cleared
    } finally {
      setStartTime(null);
      setFinishAt(null);
      writeStoredActiveTimer(null);
      setActionLoading(false);
    }
  }, []);

  const isRunning = Boolean(startTime && !finishAt);
  const isFinished = Boolean(startTime && finishAt);
  const displayMinutes = useMemo(
    () => (startTime != null ? elapsedMinutes(startTime, finishAt) : 0),
    [startTime, finishAt, minuteTick]
  );

  return {
    startTime,
    finishAt,
    loading,
    actionLoading,
    isRunning,
    isFinished,
    displayMinutes,
    start,
    finish,
    resume,
    clear,
    syncFromServer,
  };
}
