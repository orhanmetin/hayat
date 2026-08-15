import React, { useEffect, useState } from "react";
import { apiClient } from "../../services/api";
import { cn } from "../../lib/utils";

interface AuthImageProps {
  /** Relative API path, e.g. `/hatira/photos/12` */
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
}

/** Loads private API images with the JWT and renders via blob URL. */
export const AuthImage: React.FC<AuthImageProps> = ({ src, alt, className, onClick }) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    const load = async () => {
      setFailed(false);
      setBlobUrl(null);
      try {
        const res = await apiClient.get(src, {
          responseType: "blob",
          timeout: 60_000,
        });
        if (cancelled) return;
        objectUrl = URL.createObjectURL(res.data);
        setBlobUrl(objectUrl);
      } catch {
        if (!cancelled) setFailed(true);
      }
    };

    void load();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  if (failed) {
    return (
      <div
        className={cn(
          "bg-slate-100 dark:bg-white/5 text-slate-400 text-xs flex items-center justify-center",
          className
        )}
      >
        Foto yok
      </div>
    );
  }

  if (!blobUrl) {
    return <div className={cn("bg-slate-100 dark:bg-white/5 animate-pulse", className)} />;
  }

  return (
    <img
      src={blobUrl}
      alt={alt}
      className={className}
      onClick={onClick}
      loading="lazy"
    />
  );
};
