import React, { useCallback, useEffect, useState } from "react";
import { Copy, Check, RefreshCw, Trash2, Smartphone } from "lucide-react";
import { digitalApi } from "../../services/modules";
import type { ShortcutsTokenStatus } from "../../types/modules";
import { cn } from "../../lib/utils";

const PUBLIC_URL =
  typeof window !== "undefined" ? window.location.origin : "http://167.233.16.12";

export const ShortcutsPanel: React.FC = () => {
  const [status, setStatus] = useState<ShortcutsTokenStatus | null>(null);
  const [freshToken, setFreshToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await digitalApi.getTokenStatus();
      setStatus(res.data);
      setError(null);
    } catch {
      setError("Token durumu alınamadı.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const copyText = async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setError("Panoya kopyalanamadı.");
    }
  };

  const handleCreate = async () => {
    if (
      status?.hasToken &&
      !window.confirm("Mevcut token geçersiz olacak. Yenilemek istediğinize emin misiniz?")
    )
      return;
    setBusy(true);
    try {
      const res = await digitalApi.createToken();
      setFreshToken(res.data.token);
      setStatus({ hasToken: true, tokenPreview: res.data.tokenPreview, updatedAt: null });
      setError(null);
    } catch {
      setError("Token oluşturulamadı.");
    } finally {
      setBusy(false);
    }
  };

  const handleRevoke = async () => {
    if (!window.confirm("Shortcuts token'ı silinsin mi?")) return;
    setBusy(true);
    try {
      await digitalApi.revokeToken();
      setFreshToken(null);
      setStatus({ hasToken: false, tokenPreview: null, updatedAt: null });
    } catch {
      setError("Token silinemedi.");
    } finally {
      setBusy(false);
    }
  };

  const stepsUrl = `${PUBLIC_URL}/api/shortcuts/steps`;
  const screenUrl = `${PUBLIC_URL}/api/shortcuts/screen-time`;
  const pingUrl = `${PUBLIC_URL}/api/shortcuts/ping`;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-semibold flex items-center gap-2">
          <Smartphone size={16} />
          iOS Shortcuts
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Apple Health adımları ve Screen Time (Get App & Website Usage) verisini Hayat’a
          göndermek için token ve uç noktalar.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Yükleniyor…</p>
      ) : (
        <>
          <div className="rounded-xl border border-slate-200 dark:border-white/10 p-3 space-y-2">
            <p className="text-xs font-semibold text-slate-500">API Token</p>
            <p className="text-sm">
              {status?.hasToken ? (
                <>
                  Aktif: <code className="text-xs">{status.tokenPreview}</code>
                </>
              ) : (
                <span className="text-slate-400">Henüz token yok</span>
              )}
            </p>
            {freshToken && (
              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 space-y-2">
                <p className="text-[11px] text-amber-700 dark:text-amber-300">
                  Bu anahtarı bir kez gösteriyoruz — Shortcuts’a kaydedin.
                </p>
                <div className="flex gap-2">
                  <code className="flex-1 text-[11px] break-all">{freshToken}</code>
                  <button
                    type="button"
                    onClick={() => void copyText("token", freshToken)}
                    className="p-2 rounded-lg text-amber-700 dark:text-amber-300"
                    aria-label="Kopyala"
                  >
                    {copied === "token" ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            )}
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                disabled={busy}
                onClick={handleCreate}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-white text-xs font-semibold disabled:opacity-50"
              >
                <RefreshCw size={13} />
                {status?.hasToken ? "Token yenile" : "Token oluştur"}
              </button>
              {status?.hasToken && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleRevoke}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-500/30 text-red-500 text-xs font-semibold disabled:opacity-50"
                >
                  <Trash2 size={13} />
                  Sil
                </button>
              )}
            </div>
          </div>

          <EndpointRow
            label="Ping (test)"
            method="GET"
            url={pingUrl}
            copied={copied === "ping"}
            onCopy={() => void copyText("ping", pingUrl)}
          />
          <EndpointRow
            label="Adımlar (son 7 gün)"
            method="POST"
            url={stepsUrl}
            copied={copied === "steps"}
            onCopy={() => void copyText("steps", stepsUrl)}
          />
          <EndpointRow
            label="Ekran süresi"
            method="POST"
            url={screenUrl}
            copied={copied === "screen"}
            onCopy={() => void copyText("screen", screenUrl)}
          />

          <div className="text-xs text-slate-500 space-y-2 leading-relaxed">
            <p className="font-semibold text-slate-600 dark:text-slate-300">Kurulum özeti</p>
            <ol className="list-decimal pl-4 space-y-1.5">
              <li>Yukarıdan token oluşturup kopyalayın.</li>
              <li>
                iPhone Shortcuts’ta header:{" "}
                <code className="text-[10px]">X-Hayat-Shortcuts-Token: TOKEN</code>
              </li>
              <li>
                Adımlar: <em>Find Health Samples → Step Count</em> (son 7 gün), günlük toplamları
                JSON’a çevirip <code className="text-[10px]">POST /api/shortcuts/steps</code>
              </li>
              <li>
                Ekran: <em>Get App & Website Usage</em> (gün seç), dakikaya çevirip{" "}
                <code className="text-[10px]">POST /api/shortcuts/screen-time</code>
              </li>
              <li>Automation: her gün bir kez veya elle çalıştırın.</li>
            </ol>
            <p>
              Detaylı JSON örnekleri: sunucudaki{" "}
              <code className="text-[10px]">deploy/SHORTCUTS.md</code> dosyasında.
            </p>
          </div>
        </>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};

const EndpointRow: React.FC<{
  label: string;
  method: string;
  url: string;
  copied: boolean;
  onCopy: () => void;
}> = ({ label, method, url, copied, onCopy }) => (
  <div className="rounded-xl border border-slate-200 dark:border-white/10 p-3">
    <div className="flex items-center justify-between gap-2 mb-1">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <button
        type="button"
        onClick={onCopy}
        className={cn(
          "p-1.5 rounded-lg text-slate-400 hover:text-primary",
          copied && "text-emerald-500"
        )}
        aria-label="URL kopyala"
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </button>
    </div>
    <p className="text-[11px] font-mono break-all">
      <span className="text-emerald-600 dark:text-emerald-400 font-bold">{method}</span> {url}
    </p>
  </div>
);
