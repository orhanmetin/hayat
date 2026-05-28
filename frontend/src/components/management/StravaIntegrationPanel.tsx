import React, { useCallback, useEffect, useState } from "react";
import { Activity, Link2, Loader2, RefreshCw, Unlink } from "lucide-react";
import { stravaApi } from "../../services/modules";
import type {
  StravaConnectionStatus,
  StravaImportedActivity,
  StravaSyncResult,
} from "../../types/modules";
import { cn } from "../../lib/utils";

export const StravaIntegrationPanel: React.FC = () => {
  const [status, setStatus] = useState<StravaConnectionStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<StravaSyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    setLoadingStatus(true);
    try {
      const res = await stravaApi.getStatus();
      setStatus(res.data);
    } catch {
      setStatus(null);
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const strava = params.get("strava");
    if (!strava) return;

    if (strava === "connected") {
      setToast("Strava hesabı başarıyla bağlandı.");
      loadStatus();
    } else if (strava === "error") {
      setError("Strava bağlantısı tamamlanamadı. Lütfen tekrar deneyin.");
    }

    params.delete("strava");
    const qs = params.toString();
    const next = `${window.location.pathname}${qs ? `?${qs}` : ""}`;
    window.history.replaceState({}, "", next);
  }, [loadStatus]);

  const handleConnect = async () => {
    setConnecting(true);
    setError(null);
    try {
      const res = await stravaApi.getConnectUrl();
      window.location.href = res.data.url;
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Strava bağlantı URL'si alınamadı.";
      setError(msg);
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setError(null);
    await stravaApi.disconnect();
    await loadStatus();
    setToast("Strava bağlantısı kaldırıldı.");
  };

  const handleSync = async () => {
    setSyncing(true);
    setError(null);
    setSyncResult(null);
    try {
      const res = await stravaApi.syncActivities();
      setSyncResult(res.data);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Strava senkronizasyonu başarısız.";
      setError(msg);
    } finally {
      setSyncing(false);
    }
  };

  const connected = status?.isConnected ?? false;

  return (
    <>
      <div className="p-5 rounded-2xl bg-white dark:bg-black/20 border border-slate-200 dark:border-white/5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              <Activity size={18} className="text-orange-500" />
              Strava Entegrasyonu
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Son 31 gündeki yeni aktiviteleri içeri alır (mükerrer kayıt engellenir).
            </p>
          </div>
          {loadingStatus ? (
            <span className="text-sm text-slate-400 flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              Durum kontrol ediliyor…
            </span>
          ) : connected ? (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              Bağlı
            </span>
          ) : (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-500/10 text-slate-500">
              Bağlı değil
            </span>
          )}
        </div>

        {connected && status?.lastSyncAtUtc && (
          <p className="text-xs text-slate-500">
            Son senkron:{" "}
            {new Date(status.lastSyncAtUtc).toLocaleString("tr-TR")}
          </p>
        )}

        {error && (
          <p className="text-sm text-red-500 bg-red-500/10 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {toast && (
          <p className="text-sm text-emerald-600 bg-emerald-500/10 rounded-lg px-3 py-2">
            {toast}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {!connected ? (
            <button
              type="button"
              onClick={handleConnect}
              disabled={connecting}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 disabled:opacity-60"
            >
              {connecting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Link2 size={16} />
              )}
              Strava ile Bağlan
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleSync}
                disabled={syncing}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:opacity-90 disabled:opacity-60"
              >
                {syncing ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <RefreshCw size={16} />
                )}
                Strava Sync
              </button>
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={syncing}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-60"
              >
                <Unlink size={16} />
                Bağlantıyı Kaldır
              </button>
            </>
          )}
        </div>
      </div>

      {syncResult && (
        <StravaSyncResultModal
          result={syncResult}
          onClose={() => setSyncResult(null)}
        />
      )}
    </>
  );
};

const StravaSyncResultModal: React.FC<{
  result: StravaSyncResult;
  onClose: () => void;
}> = ({ result, onClose }) => {
  const imported = result.imported ?? [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h4 className="text-lg font-semibold">Strava Senkron Sonucu</h4>
        <p className="text-sm text-slate-500 mt-1">
          {result.importedCount} yeni aktivite eklendi
          {result.skippedCount > 0
            ? `, ${result.skippedCount} atlandı (zaten kayıtlı veya geçersiz).`
            : "."}
        </p>

        {imported.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">Yeni aktivite bulunamadı.</p>
        ) : (
          <ul className="mt-4 max-h-64 overflow-y-auto space-y-2">
            {imported.map((item: StravaImportedActivity) => (
              <li
                key={item.stravaActivityId}
                className="text-sm rounded-lg px-3 py-2 bg-slate-50 dark:bg-white/5"
              >
                <span className="font-medium">{item.activityTypeName}</span>
                <span className="text-slate-400 mx-2">·</span>
                <span>{item.title}</span>
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          onClick={onClose}
          className={cn(
            "mt-5 w-full py-2.5 rounded-xl text-sm font-medium",
            "bg-primary text-white hover:opacity-90"
          )}
        >
          Tamam
        </button>
      </div>
    </div>
  );
};
