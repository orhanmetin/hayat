import React, { useCallback, useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { hatiraApi } from "../services/modules";
import type {
  HatiraFilterOptions,
  HatiraListParams,
  HatiraMemory,
} from "../types/modules";
import { HatiraComposer } from "../components/hatira/HatiraComposer";
import { HatiraFilters } from "../components/hatira/HatiraFilters";
import { HatiraTimeline } from "../components/hatira/HatiraTimeline";

export const HatiraPage: React.FC = () => {
  const [items, setItems] = useState<HatiraMemory[]>([]);
  const [options, setOptions] = useState<HatiraFilterOptions>({
    companions: [],
    locations: [],
  });
  const [filters, setFilters] = useState<HatiraListParams>({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<HatiraMemory | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, optRes] = await Promise.all([
        hatiraApi.list(filters),
        hatiraApi.filterOptions(),
      ]);
      setItems(listRes.data);
      setOptions(optRes.data);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDelete = async (id: number) => {
    if (!confirm("Bu anıyı silmek istediğine emin misin?")) return;
    try {
      await hatiraApi.delete(id);
      if (editing?.id === id) setEditing(null);
      await load();
    } catch {
      alert("Silinemedi.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles size={24} className="text-primary" />
          Hatıra
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Anlık deneyimler, mekanlar ve hisler — sadece yazıp kaydet, isterse detay ekle.
        </p>
      </div>

      <HatiraComposer
        editing={editing}
        onCancelEdit={() => setEditing(null)}
        onSaved={load}
      />

      <HatiraFilters value={filters} options={options} onChange={setFilters} />

      <HatiraTimeline
        items={items}
        loading={loading}
        onEdit={setEditing}
        onDelete={handleDelete}
      />
    </div>
  );
};
