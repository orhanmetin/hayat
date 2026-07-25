import React, { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Check, X, CornerDownRight } from "lucide-react";
import { pusulaApi } from "../../services/pusula";
import type { PusulaCategory } from "../../types/pusula";
import { cn } from "../../lib/utils";

export const PusulaCategoriesPanel: React.FC = () => {
  const [categories, setCategories] = useState<PusulaCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newParentId, setNewParentId] = useState<number | null>(null);
  const [editing, setEditing] = useState<{ id: number; name: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await pusulaApi.getCategories();
      setCategories(res.data);
      setError(null);
    } catch {
      setError("Kategoriler yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const roots = categories.filter((c) => c.parentId === null);
  const childrenOf = (id: number) => categories.filter((c) => c.parentId === id);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    try {
      await pusulaApi.createCategory({ name, parentId: newParentId });
      setNewName("");
      await load();
    } catch {
      setError("Kategori eklenemedi.");
    }
  };

  const handleRename = async () => {
    if (!editing || !editing.name.trim()) return;
    try {
      await pusulaApi.updateCategory(editing.id, { name: editing.name.trim() });
      setEditing(null);
      await load();
    } catch {
      setError("Kategori güncellenemedi.");
    }
  };

  const handleDelete = async (category: PusulaCategory) => {
    if (
      !window.confirm(
        `"${category.name}" kategorisini kalıcı olarak silmek istediğinize emin misiniz? Bağlı görevlerin kategorisi kaldırılır.`
      )
    )
      return;
    try {
      await pusulaApi.deleteCategory(category.id);
      await load();
    } catch {
      setError("Kategori silinemedi.");
    }
  };

  const renderRow = (category: PusulaCategory, isChild: boolean) => (
    <div
      key={category.id}
      className={cn(
        "flex items-center gap-2 py-2 px-3 rounded-xl",
        isChild ? "ml-6 bg-slate-50 dark:bg-white/5" : "bg-slate-100 dark:bg-white/10",
        !category.isActive && "opacity-50"
      )}
    >
      {isChild && <CornerDownRight size={14} className="text-slate-400 shrink-0" />}
      {editing?.id === category.id ? (
        <>
          <input
            value={editing.name}
            onChange={(e) => setEditing({ id: category.id, name: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void handleRename();
              }
            }}
            className="flex-1 px-2 py-1 rounded-lg border border-slate-200 dark:border-white/10 bg-transparent text-sm"
            autoFocus
          />
          <button
            type="button"
            onClick={handleRename}
            className="p-1.5 text-emerald-500"
            aria-label="Kaydet"
          >
            <Check size={15} />
          </button>
          <button
            type="button"
            onClick={() => setEditing(null)}
            className="p-1.5 text-slate-400"
            aria-label="Vazgeç"
          >
            <X size={15} />
          </button>
        </>
      ) : (
        <>
          <span className={cn("flex-1 text-sm", !isChild && "font-semibold")}>
            {category.name}
            {!category.isActive && <span className="ml-2 text-xs text-slate-400">(pasif)</span>}
          </span>
          <button
            type="button"
            onClick={() => setEditing({ id: category.id, name: category.name })}
            className="p-1.5 text-slate-400 hover:text-primary"
            aria-label="Yeniden adlandır"
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            onClick={() => handleDelete(category)}
            className="p-1.5 text-slate-400 hover:text-red-500"
            aria-label="Sil"
          >
            <Trash2 size={14} />
          </button>
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-semibold">Pusula Kategorileri</h2>
        <p className="text-xs text-slate-400 mt-1">
          Görevler için ana kategoriler ve alt kategoriler. Silinen kategoriler kalıcı olarak
          kaldırılır; bağlı görevlerin kategorisi boşaltılır.
        </p>
      </div>

      <form onSubmit={handleCreate} className="flex flex-wrap gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Yeni kategori adı..."
          className="flex-1 min-w-[160px] p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent text-sm"
        />
        <select
          value={newParentId ?? ""}
          onChange={(e) => setNewParentId(e.target.value ? Number(e.target.value) : null)}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent text-sm"
        >
          <option value="">Ana kategori</option>
          {roots
            .filter((r) => r.isActive)
            .map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} altına
              </option>
            ))}
        </select>
        <button
          type="submit"
          disabled={!newName.trim()}
          className="px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-40 flex items-center gap-1.5"
        >
          <Plus size={15} />
          Ekle
        </button>
      </form>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {loading ? (
        <p className="text-center py-8 text-sm text-slate-400">Yükleniyor…</p>
      ) : (
        <div className="space-y-1.5">
          {roots.map((root) => (
            <React.Fragment key={root.id}>
              {renderRow(root, false)}
              {childrenOf(root.id).map((child) => renderRow(child, true))}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};
